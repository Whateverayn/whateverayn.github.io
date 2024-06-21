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
        const links = await page.$$eval('a', as => as.map(a => ({ href: a.href, text: a.innerText })));

        for (const link of links) {
            const parsedUrl = parse(link.href);
            if (parsedUrl.host && !parsedUrl.host.includes('localhost')) {
                let linkTitle = link.text.replace(/"/g, '""');
                let linkContentType = 'unknown';
                try {
                    await page.goto(link.href);
                    const externalTitle = await page.title();
                    linkContentType = response.headers()['content-type'];
                    if (externalTitle && externalTitle.trim()) {
                        linkTitle = externalTitle.replace(/"/g, '""');
                    }
                } catch (error) {
                    console.error(`Failed to retrieve title for ${link.href}`);
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

