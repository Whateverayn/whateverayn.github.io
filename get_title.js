import Ora from "ora";
import { launch } from "puppeteer";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

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

    spinner.succeed(`${Object.keys(files).length}件のページを検出`);
    spinner.text = '準備しています...';
    spinner.start();

    let count = 0;

    for (const file of files) {
        count++;
        spinner.text = `${count}`;
        const filePath = file.dir.replace("docs\\", '');
        await page.goto(`http://localhost:3000/${filePath}`);

        // const autoLinks = await page.$$('a[href^="auto-"]');
        // for (const autoLink of autoLinks) {
        //   const href = await autoLink.evaluate(el => el.getAttribute('href'));
        //   hrefs.push(href);
        // }
    }

    child.kill();


    await browser.close();


    spinner.succeed('完了');

    process.exit(1);
})();

