import Ora from "ora";
import { launch } from "puppeteer";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { parse } from 'url';
import csvWriter from 'csv-writer';
import { timeEnd } from "console";

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
        await page.goto(`http://localhost:3000/${filePath}`);

        // ページタイトルを取得
        const title = await page.title();
        // 外部リンクを取得
        const links = await page.$$eval('a', as => as.map(a => ({ href: a.href, text: a.innerText })));

        links.forEach(link => {
            const parsedUrl = parse(link.href);
            if (parsedUrl.host && !parsedUrl.host.includes('localhost')) {
                hrefs.push({
                    url: link.href,
                    title: link.text.replace(/"/g, '""')
                });
                console.log(` ${link.href}: ${link.text}`);
            }
        });

        hrefs.push({
            url: `https://whateverayn.github.io/${filePath}`,
            title: title.replace(/"/g, '""')
        }); 
        console.log(` ${filePath}: ${title}`);

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
            { id: 'title', title: 'タイトル' }
        ],
        alwaysQuote: true
    });

    await writer.writeRecords(uniqueHrefs);

    process.exit(0);
})();

