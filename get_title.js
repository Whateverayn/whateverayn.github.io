import Ora from "ora";
import { launch } from "puppeteer";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { parse } from 'url';
import csvWriter from 'csv-writer';

const dirPath = './docs';


(async () => {
    const child = exec('npx serve docs/', () => { });

    const spinner = Ora('ブラウザを起動しています...').start();
    const browser = await launch({ headless: false });
    const page = await browser.newPage();
    spinner.succeed('起動完了');
    spinner.text = '準備しています...';
    spinner.start();

    const searchFiles = (dirPath) => {
        const allDirents = fs.readdirSync(dirPath, { withFileTypes: true });

        const files = [];
        for (const dirent of allDirents) {
            if (dirent.isDirectory()) {
                const fp = path.join(dirPath, dirent.name);
                files.push(searchFiles(fp));
            } else if (dirent.isFile() && ['.html'].includes(path.extname(dirent.name))) {
                files.push({
                    dir: path.join(dirPath, dirent.name),
                    name: dirent.name,
                });
            }
        }
        return files.flat();
    };

    const hrefs = [];
    const visitedLinks = new Set(); // 既にアクセスしたURLを保存するセット
    const files = await searchFiles(dirPath);

    spinner.succeed(`${files.length}件のページを検出`);
    spinner.text = '準備しています...';
    spinner.start();

    let count = 0;

    for (const file of files) {
        count++;
        spinner.text = `${count}`;
        const filePath = file.dir.replace("docs\\", '').replace(/\\/g, '/');
        const response = await page.goto(`http://localhost:3000/${filePath}`);

        // ページのコンテンツタイプを取得
        let contentType = response.headers()['content-type'];
        if (contentType) {
            contentType = contentType.split(';')[0].trim();
        } else {
            contentType = 'unknown';
        }

        // ページタイトルを取得
        const title = await page.title();
        // 外部リンクを取得
        // const links = await page.$$eval('a', as => as.map(a => ({ href: a.href, text: a.innerText })));
        const links = await page.$$eval('a, auto-link', elements =>
            elements.map(el => ({
                href: el.tagName.toLowerCase() === 'a' ? el.href : el.getAttribute('href'),
                text: el.innerText
            }))
        );

        for (const link of links) {
            if (!link.href) {
                console.warn(`Skipping a link with undefined href`);
                continue;
            }

            const parsedUrl = parse(link.href);
            // 外部リンクであり、まだアクセスしていない場合のみ処理する
            if (parsedUrl.host && !parsedUrl.host.includes('localhost') && !visitedLinks.has(link.href)) {
                visitedLinks.add(link.href); // URLをセットに追加

                let linkTitle = link.text.replace(/"/g, '""');
                let linkContentType = 'unknown';
                let retries = 10; // 最大リトライ回数

                while (retries > 0) {
                    try {
                        const externalResponse = await page.goto(link.href);
                        const externalTitle = await page.title();
                        linkContentType = externalResponse.headers()['content-type'];
                        if (externalTitle && externalTitle.trim()) {
                            linkTitle = externalTitle.replace(/"/g, '""');
                        }
                        break; // 成功したらループを抜ける
                    } catch (error) {
                        console.error(`Failed to retrieve title for ${link.href} (attempt ${4 - retries}): ${error.message}`);
                        retries--; // リトライ回数を減らす
                        if (retries === 0) {
                            console.error(`Giving up on ${link.href}`);
                        }
                    }
                }

                hrefs.push({
                    url: link.href,
                    title: linkTitle,
                    contentType: linkContentType
                });
                console.log(`  ${link.href}: ${linkTitle} (${linkContentType})`);
            }
        }

        hrefs.push({
            url: `https://whateverayn.github.io/${filePath}`,
            title: title.replace(/"/g, '""'),
            contentType: contentType
        });
        console.log(` ${filePath}: ${title} (${contentType})`);

    }

    child.kill();


    await browser.close();


    spinner.succeed('完了');

    // 重複を削除
    const uniqueHrefs = Array.from(new Set(hrefs.map(href => href.url)))
        .map(url => {
            return hrefs.find(href => href.url === url);
        });

    // 名前順にソート
    uniqueHrefs.sort((a, b) => a.title.localeCompare(b.title));

    // CSVに書き出し
    const writer = csvWriter.createObjectCsvWriter({
        path: './docs/output.csv',
        header: [
            { id: 'url', title: 'URL' },
            { id: 'title', title: 'タイトル' },
            { id: 'contentType', title: 'コンテンツタイプ' }
        ],
        alwaysQuote: true
    });

    await writer.writeRecords(uniqueHrefs);

    process.exit(0);
})();

