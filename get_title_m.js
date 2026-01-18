// 必要なモジュールのインポート
import Ora from "ora"; // 進捗表示用のスピナー
import { launch } from "puppeteer"; // ウェブスクレイピング用のPuppeteer
import fs from "fs"; // ファイルシステム操作
import path from "path"; // パス操作
import { exec } from "child_process"; // 外部プロセスの実行
import { parse } from 'url'; // URLの解析
import csvWriter from 'csv-writer'; // CSVファイルの書き込み
import csv from 'csv-parser'; // CSVファイルの読み込み

// 設定値
const dirPath = './docs'; // ローカルHTMLファイルが置かれているディレクトリ
const CACHE_FILE = './cache.csv'; // キャッシュファイル名
const INITIAL_CACHE_DURATION_HOURS = 24; // 初期のキャッシュ期間 (時間)
const EXTEND_CACHE_FACTOR = 2; // 変更がない場合にキャッシュ期間を延長する倍率
const MAX_CACHE_DURATION_DAYS = 365; // キャッシュ期間の最大値 (日)
const PUPPETEER_TIMEOUT_MS = 30000; // Puppeteerのページ遷移タイムアウト (ミリ秒)
const RETRY_ATTEMPTS = 3; // 外部リンク取得時の最大リトライ回数
const RETRY_DELAY_MS = 2000; // リトライ時の待機時間 (ミリ秒)

// ヘルパー関数: 指定したミリ秒待機する
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * ヘルパー関数: CSVファイルからデータを読み込む
 * @param {string} filePath - 読み込むCSVファイルのパス
 * @returns {Promise<Array<Object>>} - CSVデータを含むPromise
 */
const readCsv = async (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        // ファイルが存在しない場合は空の配列を返す
        if (!fs.existsSync(filePath)) {
            resolve([]);
            return;
        }
        // CSVファイルを読み込み、パースして結果を配列に格納
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                console.error(`CSVファイルの読み込みエラー: ${filePath}`, error);
                reject(error);
            });
    });
};

/**
 * ヘルパー関数: CSVファイルにデータを書き込む
 * @param {string} filePath - 書き込むCSVファイルのパス
 * @param {Array<Object>} records - 書き込むデータオブジェクトの配列
 * @param {Array<Object>} header - CSVヘッダーの定義
 * @returns {Promise<void>}
 */
const writeCsv = async (filePath, records, header) => {
    const writer = csvWriter.createObjectCsvWriter({
        path: filePath,
        header: header,
        alwaysQuote: true // 全ての値を常にクォートで囲む
    });
    await writer.writeRecords(records);
};

/**
 * ローカルHTMLファイルを再帰的に検索する関数
 * @param {string} currentDirPath - 検索を開始するディレクトリパス
 * @returns {Array<Object>} - 検出されたHTMLファイルのリスト
 */
const searchFiles = (currentDirPath) => {
    const allDirents = fs.readdirSync(currentDirPath, { withFileTypes: true });
    const files = [];
    for (const dirent of allDirents) {
        const fullPath = path.join(currentDirPath, dirent.name);
        if (dirent.isDirectory()) {
            // ディレクトリの場合は再帰的に検索
            files.push(searchFiles(fullPath));
        } else if (dirent.isFile() && ['.html'].includes(path.extname(dirent.name))) {
            // HTMLファイルの場合はリストに追加
            files.push({
                dir: fullPath,
                name: dirent.name,
            });
        }
    }
    return files.flat(); // フラットな配列にする
};

// メイン処理
(async () => {
    let serveProcess = null; // ローカルサーバーのプロセスを保持する変数
    let browser = null; // Puppeteerブラウザインスタンスを保持する変数
    let spinner = null; // Oraスピナーインスタンスを保持する変数

    try {
        spinner = Ora('ローカルサーバーを起動しています...').start();
        // npx serve docs/ をバックグラウンドで起動
        serveProcess = exec('npx serve docs/');
        spinner.succeed('ローカルサーバー起動完了');

        spinner.text = 'ブラウザを起動しています...';
        spinner.start();
        // Puppeteerをヘッドレスモードで起動 (GUIなし)
        browser = await launch({ headless: false });
        const page = await browser.newPage();
        spinner.succeed('ブラウザ起動完了');

        spinner.text = '既存のキャッシュを読み込んでいます...';
        spinner.start();
        const existingCache = await readCsv(CACHE_FILE);
        // URLをキーとしたMapにキャッシュデータを変換
        const cacheMap = new Map(existingCache.map(item => [item.url, item]));
        spinner.succeed(`既存のキャッシュ ${existingCache.length} 件を読み込みました`);

        spinner.text = 'ローカルHTMLファイルを検索しています...';
        spinner.start();

        const localFiles = searchFiles(dirPath); // ローカルHTMLファイルを検索
        spinner.succeed(`${localFiles.length} 件のローカルページを検出しました`);

        const allHrefs = []; // 最終的なCSV出力用のデータ (重複なし)
        const visitedExternalLinks = new Set(); // 既にアクセスした外部URLを保存するセット

        let currentFileIndex = 0;

        // ローカルファイルの処理ループ
        for (const file of localFiles) {
            currentFileIndex++;
            spinner.text = `ローカルページ処理中: ${currentFileIndex}/${localFiles.length} (${file.name})`;

            // macOS対応: パス区切り文字を正規化し、相対パスを取得
            const relativeFilePath = path.relative(dirPath, file.dir).replace(/\\/g, '/');
            const localUrl = `http://localhost:3000/${relativeFilePath}`;
            // GitHub Pagesでの公開URLを想定
            const githubPagesUrl = `https://whateverayn.github.io/${relativeFilePath}`;

            let pageTitle = '';
            let pageContentType = 'unknown';

            try {
                // ローカルページにアクセス
                const response = await page.goto(localUrl, { waitUntil: 'domcontentloaded', timeout: PUPPETEER_TIMEOUT_MS });
                pageTitle = await page.title(); // ページのタイトルを取得
                const contentTypeHeader = response.headers()['content-type'];
                if (contentTypeHeader) {
                    pageContentType = contentTypeHeader.split(';')[0].trim(); // コンテンツタイプを取得
                }

                // ローカルページ自身の情報のキャッシュ管理
                const cachedLocal = cacheMap.get(githubPagesUrl);
                const now = new Date();
                let cacheDuration = INITIAL_CACHE_DURATION_HOURS;
                let lastStatus = 'success';

                if (cachedLocal) {
                    const lastFetchedDate = new Date(cachedLocal.lastFetched);
                    // タイトルまたはコンテンツタイプに変更があったかチェック
                    const titleChanged = cachedLocal.title !== pageTitle;
                    const contentTypeChanged = cachedLocal.contentType !== pageContentType;

                    if (!titleChanged && !contentTypeChanged) {
                        // 変更がない場合、キャッシュ期間を延長
                        cacheDuration = Math.min(
                            parseFloat(cachedLocal.cacheDurationHours || INITIAL_CACHE_DURATION_HOURS) * EXTEND_CACHE_FACTOR,
                            MAX_CACHE_DURATION_DAYS * 24
                        );
                    } else {
                        // 変更があった場合、キャッシュ期間をリセット
                        cacheDuration = INITIAL_CACHE_DURATION_HOURS;
                    }
                }

                // ローカルページの情報を最終的なリストに追加
                allHrefs.push({
                    url: githubPagesUrl,
                    title: pageTitle.replace(/"/g, '""'), // CSV出力用にダブルクォーテーションをエスケープ
                    contentType: pageContentType,
                    lastFetched: now.toISOString(),
                    cacheDurationHours: cacheDuration,
                    lastStatus: lastStatus
                });

                // ページ内の外部リンクを取得
                const links = await page.$$eval('a, auto-link', elements =>
                    elements.map(el => ({
                        href: el.tagName.toLowerCase() === 'a' ? el.href : el.getAttribute('href'),
                        text: el.innerText
                    }))
                );

                // 外部リンクの処理ループ
                for (const link of links) {
                    if (!link.href) {
                        continue; // href属性がないリンクはスキップ
                    }

                    let parsedUrl;
                    try {
                        parsedUrl = new URL(link.href); // URLの解析
                    } catch (error) {
                        continue;
                    }
                    // 外部リンクであり、まだアクセスしていない、かつローカルホストではない場合のみ処理
                    if (parsedUrl.host && !parsedUrl.host.includes('localhost') && !visitedExternalLinks.has(link.href)) {
                        visitedExternalLinks.add(link.href); // 既に訪問したURLとしてマーク

                        const cachedExternal = cacheMap.get(link.href);
                        const now = new Date();
                        let linkTitle = link.text ? link.text.replace(/"/g, '""') : '';
                        let linkContentType = 'unknown';
                        let linkCacheDuration = INITIAL_CACHE_DURATION_HOURS;
                        let linkLastStatus = 'success';
                        let shouldFetch = true; // 新しく取得する必要があるかどうかのフラグ

                        if (cachedExternal) {
                            const lastFetchedDate = new Date(cachedExternal.lastFetched);
                            // キャッシュの有効期限が切れているかチェック
                            const cacheExpired = (now.getTime() - lastFetchedDate.getTime()) / (1000 * 60 * 60) > parseFloat(cachedExternal.cacheDurationHours || INITIAL_CACHE_DURATION_HOURS);

                            // キャッシュが有効期限内で、前回の取得が成功していれば再利用
                            if (!cacheExpired && cachedExternal.lastStatus === 'success') {
                                linkTitle = cachedExternal.title;
                                linkContentType = cachedExternal.contentType;
                                linkCacheDuration = parseFloat(cachedExternal.cacheDurationHours || INITIAL_CACHE_DURATION_HOURS);
                                linkLastStatus = cachedExternal.lastStatus;
                                shouldFetch = false; // 新しく取得しない
                            }
                        }

                        if (shouldFetch) {
                            let retries = RETRY_ATTEMPTS; // リトライ回数
                            while (retries > 0) {
                                try {
                                    spinner.text = `外部リンク処理中: ${link.href} (残り${retries}回リトライ)`;
                                    // 外部リンクにアクセス
                                    const externalResponse = await page.goto(link.href, { waitUntil: ['domcontentloaded', 'load'], timeout: PUPPETEER_TIMEOUT_MS });
                                    const externalTitle = await page.title(); // 外部ページのタイトルを取得
                                    const externalContentTypeHeader = externalResponse.headers()['content-type'];

                                    if (externalContentTypeHeader) {
                                        linkContentType = externalContentTypeHeader.split(';')[0].trim();
                                    }
                                    if (externalTitle && externalTitle.trim()) {
                                        linkTitle = externalTitle.replace(/"/g, '""');
                                    }

                                    // 取得に成功した場合、キャッシュ期間を更新
                                    if (cachedExternal && cachedExternal.title === linkTitle && cachedExternal.contentType === linkContentType) {
                                        // 変更がない場合、キャッシュ期間を延長
                                        linkCacheDuration = Math.min(
                                            parseFloat(cachedExternal.cacheDurationHours || INITIAL_CACHE_DURATION_HOURS) * EXTEND_CACHE_FACTOR,
                                            MAX_CACHE_DURATION_DAYS * 24
                                        );
                                    } else {
                                        // 変更があった場合、キャッシュ期間をリセット
                                        linkCacheDuration = INITIAL_CACHE_DURATION_HOURS;
                                    }
                                    linkLastStatus = 'success';
                                    break; // 成功したらリトライループを抜ける
                                } catch (error) {
                                    console.error(`  外部リンク取得失敗 ${link.href} (試行回数 ${RETRY_ATTEMPTS + 1 - retries} 回): ${error.message}`);
                                    retries--;
                                    linkLastStatus = `failed: ${error.message}`;
                                    if (retries === 0) {
                                        console.error(`  ${link.href} の取得を諦めました`);
                                    } else {
                                        await delay(RETRY_DELAY_MS); // 待機
                                    }
                                }
                            }
                        }

                        // 外部リンクの情報を最終的なリストに追加
                        allHrefs.push({
                            url: link.href,
                            title: linkTitle,
                            contentType: linkContentType,
                            lastFetched: now.toISOString(),
                            cacheDurationHours: linkCacheDuration,
                            lastStatus: linkLastStatus
                        });
                    }
                }
            } catch (error) {
                console.error(`  ローカルファイルの処理エラー ${localUrl}: ${error.message}`);
                // ローカルファイルの処理失敗時も情報追加（エラーとして記録）
                allHrefs.push({
                    url: githubPagesUrl,
                    title: `Error: ${error.message.replace(/"/g, '""')}`,
                    contentType: 'error',
                    lastFetched: new Date().toISOString(),
                    cacheDurationHours: INITIAL_CACHE_DURATION_HOURS,
                    lastStatus: `failed: ${error.message}`
                });
            }
        }

        spinner.succeed('全ページの処理が完了しました');

        // 重複を削除し、最新の情報を保持 (後から追加された情報が優先されるように)
        const uniqueHrefsMap = new Map();
        for (const href of allHrefs) {
            uniqueHrefsMap.set(href.url, href); // 同じURLがあれば上書きされる
        }

        let finalHrefs = Array.from(uniqueHrefsMap.values());

        // 特定のURLのcontentTypeを強制的に上書き (既存機能の維持)
        finalHrefs.forEach(href => {
            if (href.url === "https://whateverayn.github.io/index.html") {
                href.contentType = "text/html";
            }
        });

        // 名前順にソート (タイトルが空の場合はURLでソート)
        finalHrefs.sort((a, b) => {
            const titleA = a.title || a.url;
            const titleB = b.title || b.url;
            return titleA.localeCompare(titleB);
        });

        spinner.text = 'CSVファイルを書き出しています...';
        spinner.start();

        // output.csv用のヘッダー定義 (ミニマルな内容)
        const outputHeader = [
            { id: 'url', title: 'URL' },
            { id: 'title', title: 'タイトル' },
            { id: 'contentType', title: 'コンテンツタイプ' }
        ];
        await writeCsv('./docs/output.csv', finalHrefs, outputHeader); // output.csvに書き出し

        // cache.csv用のヘッダー定義 (全ての情報を含む)
        const cacheHeader = [
            { id: 'url', title: 'URL' },
            { id: 'title', title: 'タイトル' },
            { id: 'contentType', title: 'コンテンツタイプ' },
            { id: 'lastFetched', title: '最終取得日時' },
            { id: 'cacheDurationHours', title: 'キャッシュ期間(時間)' },
            { id: 'lastStatus', title: '最終取得ステータス' }
        ];
        await writeCsv(CACHE_FILE, finalHrefs, cacheHeader); // キャッシュファイルも更新

        spinner.succeed('CSVファイルとキャッシュファイルの書き出しが完了しました');

    } catch (error) {
        // スクリプト全体の実行中にエラーが発生した場合
        console.error('\nスクリプトの実行中に致命的なエラーが発生しました:', error);
    } finally {
        // 終了処理 (エラーの有無に関わらず実行)
        if (serveProcess) {
            spinner = spinner || Ora('ローカルサーバーを終了しています...').start(); // spinnerが未定義の場合に初期化
            spinner.text = 'ローカルサーバーを終了しています...';
            spinner.start();
            // macOSで確実に終了させるためにSIGTERMシグナルを送る
            serveProcess.kill('SIGTERM');
            await delay(1000); // プロセスが終了するのを少し待機
            spinner.succeed('ローカルサーバー終了');
        }
        if (browser) {
            spinner = spinner || Ora('ブラウザを終了しています...').start(); // spinnerが未定義の場合に初期化
            spinner.text = 'ブラウザを終了しています...';
            spinner.start();
            await browser.close(); // ブラウザを閉じる
            spinner.succeed('ブラウザ終了');
        }
        process.exit(0); // プロセスを終了
    }
})();
