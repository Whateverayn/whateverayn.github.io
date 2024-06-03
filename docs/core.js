function generateGlobalComponents() {
    fadeID.forEach(element => {
        if (document.getElementById(element)) {
            document.getElementById(element).dataset.processing = 'true';
        }
    });
    const mainroot = document.getElementById('root');
    if (!pageInfo.title) {
        pageInfo.title = document.title;
    }
    if (!pageInfo.description) {
        pageInfo.description = document.querySelector("meta[name='description']").content;
    }

    if (pageInfo.createdAt) {
        // formatDate(pageInfo.createdAt, 'YYYYMMDD-HHmmss')
        pageCreate = `${formatDate(new Date(pageInfo.createdAt), 'YYYY年M月D日H時m分')}作成`;
        if (pageInfo.updatedAt) {
            pageCreate += `, ${formatDate(new Date(pageInfo.updatedAt), 'YYYY年M月D日H時m分')}更新`;
        }
    } else {
        pageCreate = '';
    }

    mainroot.insertAdjacentHTML('beforebegin', `
        <header>
            <div id="headerTitle">
                <a href="/">
                    <h1 id="pageInfoTitle">${pageInfo.title}</h1>
                </a>
            </div>
        </header>
        <nav>${showPath().outerHTML}</nav>
        `);
    mainroot.insertAdjacentHTML('afterend', `
        <footer>
            <div>
                <p id="pageInfoDescription">${pageInfo.description}</p>
                <p id="pageUpdateInfo">${pageCreate}</p>
            </div>
        </footer>
        <div id="stateInfoOut"><div id="stateInfo"></div></div>
        `);
    fadeID.forEach(element => {
        document.getElementById(element).dataset.processing = 'false';
    });
    addState('ようこそ&excl;', 4960);
}

function updateGlobalComponents() {
    fadeID.forEach(element => {
        document.getElementById(element).dataset.processing = 'true';
    });
    const updateGlobalComponentsId = addState('コンポーネントを更新しています...', 0);
    removeScriptElements(jsFilesToRemove);
    if (!pageInfo.title) {
        pageInfo.title = document.title;
    } else {
    }
    if (!pageInfo.description) {
        pageInfo.description = document.querySelector("meta[name='description']").content;
    } else {
    }
    if (pageInfo.createdAt) {
        pageCreate = `${formatDate(new Date(pageInfo.createdAt), 'YYYY年M月D日H時mm分')}作成`;
        if (pageInfo.updatedAt) {
            pageCreate += `, ${formatDate(new Date(pageInfo.updatedAt), 'YYYY年M月D日H時mm分')}更新`;
        }
    } else {
        pageCreate = '';
    }
    document.getElementById("pageInfoTitle").innerHTML = pageInfo.title;
    document.getElementById("pageInfoDescription").innerHTML = pageInfo.description;
    document.getElementById("pageUpdateInfo").innerHTML = pageCreate;
    document.getElementById('pagePath').replaceWith(showPath('pagePath'));
    insertScript(pageInfo);
    removeStateAndChange(updateGlobalComponentsId, null);
    fadeID.forEach(element => {
        document.getElementById(element).dataset.processing = 'false';
    });
}

// ページ遷移処理の関数
function navigateTo(url) {
    document.getElementById('root').dataset.processing = 'processing';
    const navigateToId = addState(exURL(url) + ' へ移動しています...', 0);
    // Ajaxを使ってHTMLファイルの内容を取得
    fetch(url)
        .then(response => response.text())
        .then(html => {
            // 取得したHTMLの中から<div id="root">の中身を抽出
            const parseId = addState(exURL(url) + 'inidex.html をパースしています...', 0);
            var parser = new DOMParser();
            var newDocument = parser.parseFromString(html, "text/html");
            removeStateAndChange(parseId, null);
            // ページ辞書の初期化
            const pageInfoUpDateId = addState('ページ情報を更新しています...', 1024);
            pageInfo = {};
            pageInfo = JSON.parse(newDocument.getElementById('pageInfo').textContent);
            removeStateAndChange(pageInfoUpDateId, null);
            if (pageInfo.alwaysRefresh === true) {
                addState(exURL(url) + ' を再読み込みしています... 再読み込みされない場合はブラウザの再読み込みボタンを押してください', 0);
                pageRefresh(url);
            } else {
                // 現在のページの<head>の中身を新しい内容で差し替え
                const pageUpdateId = addState('処理した情報でページを更新しています...', 0);
                document.title = newDocument.title;
                document.querySelector("meta[name='description']").content = newDocument.querySelector("meta[name='description']").content;
                // 現在のページの<div id="root">の中身を新しい内容で差し替え
                var newRootContent = newDocument.getElementById("root").innerHTML;
                document.getElementById("root").innerHTML = newRootContent;
                removeStateAndChange(pageUpdateId, null);
                updateGlobalComponents();
                removeStateAndChange(navigateToId, { message: `${exURL(url)} へ移動しました`, duration: 2048 });
                pastPageURL.unshift(exURL(url));
            }
        })
        .catch(error => {
            console.error("ページの取得エラー:", error);
        });
}

function addState(message, duration) {
    const messageId = `msg${messageCount}`;
    if (document.getElementById('stateInfo')) {
        document.getElementById('stateInfo').insertAdjacentHTML('afterbegin', `<div id="${messageId}">${messageCount}: ${message}</div>`)
    } else {
        console.info(message);
    }
    if (duration != 0) {
        setTimeout(() => {
            if (document.getElementById(messageId)) {
                document.getElementById(messageId).remove();
                stateSizeOptimize();
            }
        }, duration);
    }
    messageCount += 1;
    stateSizeOptimize();
    return messageId;
}

function removeStateAndChange(messageId, newMessage) {
    if (document.getElementById(messageId)) {
        document.getElementById(messageId).remove();
        stateSizeOptimize();
    }
    if (newMessage) {
        const newMessageId = addState(newMessage.message, newMessage.duration);
        return newMessageId;
    }
}

function stateSizeOptimize() {
    if (document.getElementById('stateInfo')) {
        if (document.getElementById('stateInfo').hasChildNodes()) {
            document.getElementById('stateInfoOut').dataset.state = 'show';
            const oldValue = document.documentElement.style.getPropertyValue('--stateHeight');
            const newValue = document.getElementById('stateInfo').clientHeight + 24 + 'px';
            if (oldValue != newValue) {
                document.documentElement.style.setProperty('--stateHeight', newValue);
            }
        } else {
            document.getElementById('stateInfoOut').dataset.state = 'hide';
            document.documentElement.style.setProperty('--stateHeight', '0');
        }

    }
}

function pageRefresh(url) {
    location.href = url;
}

// ドメイン内のリンクかどうかを判定する関数
function isInternalLink(url) {
    return url.startsWith(window.location.origin);
}

// クリックイベントハンドラ
function linkClickHandler(event, url) {
    if (isInternalLink(url)) {
        event.preventDefault();
        history.pushState({}, "", url);
        navigateTo(url);
    } else {
        alert("外部サイトに移動します: " + url);
    }
}

function showPath() {
    let pathSegments = window.location.pathname.split('/').filter(segment => segment !== ''); // パスを / で分割して空のセグメントを削除
    pathSegments.unshift('');
    const output = document.createElement('ul');
    output.id = 'pagePath';
    let currentPath = '';
    let currentSpace = '';
    pathSegments.forEach(segment => {
        currentPath += segment + '/';
        let linkli = document.createElement('li');
        let space = document.createElement('span');
        space.innerHTML = currentSpace;
        let link = document.createElement('auto-link');
        link.setAttribute("href", currentPath);
        link.textContent = currentPath;
        linkli.appendChild(space);
        linkli.appendChild(link);
        output.appendChild(linkli);
        currentSpace += '&thinsp;';
    });
    return output;
}

function formatDate(date, format) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const month_short = String(date.getMonth() + 1);
    const day = String(date.getDate()).padStart(2, '0');
    const day_short = String(date.getDate());
    const hours = String(date.getHours()).padStart(2, '0');
    const hours_short = String(date.getHours());
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const minutes_short = String(date.getMinutes());
    const seconds = String(date.getSeconds()).padStart(2, '0');

    format = format.replace('YYYY', year);
    format = format.replace('MM', month);
    format = format.replace('M', month_short);
    format = format.replace('DD', day);
    format = format.replace('D', day_short);
    format = format.replace('HH', hours);
    format = format.replace('H', hours_short);
    format = format.replace('mm', minutes);
    format = format.replace('m', minutes_short);
    format = format.replace('ss', seconds);

    return format;
}

function insertScript(pageInfo) {
    if (pageInfo.loadJs && Array.isArray(pageInfo.loadJs)) {
        // loadJsが存在し、かつその値が配列の場合
        pageInfo.loadJs.forEach(jsFile => {
            const loasJsStateId = addState(jsFile + 'を読み込んでいます...', 0);
            const scriptElement = document.createElement('script');
            scriptElement.src = jsFile;
            scriptElement.onload = removeStateAndChange(loasJsStateId, { message: `${jsFile} を読み込みました`, duration: 2048 });
            document.head.appendChild(scriptElement);
        });
        jsFilesToRemove = pageInfo.loadJs;
    }
}

function removeScriptElements(filesToRemove) {
    filesToRemove.forEach(jsFile => {
        const scriptElement = document.querySelector(`script[src="${jsFile}"]`);
        if (scriptElement) {
            scriptElement.remove();
        }
    });
}

function copyFromInputText(id) {
    copy2clipboard(document.getElementById(id).value);
}

function copy2clipboard(text) {
    if (!navigator.clipboard) {
        alert("お使いのブラウザは対応していません");
    } else {
        navigator.clipboard
            .writeText(text)
            .then(
                (success) => addState(success ? success : text + ' をコピーしました', 2048),
                (error) => console.log('テキストのコピーに失敗' + error)
            );
    }
}

function exURL(url) {
    return new URL(url, location.href).href;
}

// CSVからデータを読み込む関数
async function fetchCSV() {
    const response = await fetch('/output.csv');
    const data = await response.text();
    return data.split('\n').map(row => row.split(','));
}

// CSVデータをオブジェクトに変換
async function getCSVData() {
    if (csvDataCache) {
        return csvDataCache;
    }
    const csvArray = await fetchCSV();
    csvDataCache = {};
    for (let i = 0; i < csvArray.length; i++) {
        let [url, title] = csvArray[i].map(item => item.replace(/^"|"$/g, ''));
        csvDataCache[url] = title;
    }
    return csvDataCache;
}
    
// ページタイトルを取得
async function getPageTitleFromURL(url) {
    const fullUrl = exURL(url);

    if (fullUrl in pageTitle) {
        addState('キャッシュヒット: ' + fullUrl, 1000);
        return pageTitle[fullUrl];
    }

    const csvData = await getCSVData();

    if (fullUrl in csvData) {
        addState('データヒット: ' + fullUrl, 1000);
        pageTitle[fullUrl] = csvData[fullUrl];
        return csvData[fullUrl];
    } else {
        const pageGetId = addState(exURL(url) + ' の情報を取得しています...', 0);
        try {
            const response = await fetch(url);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            removeStateAndChange(pageGetId, { message: exURL(url) + ' の情報を取得しました', duration: 2048 });
            pageTitle[url] = doc.title;
            return doc.title;
        } catch (error) {
            console.error("ページの取得エラー:", error);
            return 'Error';
        }
    }
}

class AutoLink extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        // 非同期でページタイトルを取得
        const autoLinkId = addState(this.getAttribute('href') + ' を広げています...', 0);
        const pageTitle = await getPageTitleFromURL(this.getAttribute('href'));
        // <a> タグに直接置き換え
        const linkElement = document.createElement('a');
        linkElement.href = this.getAttribute('href');
        linkElement.textContent = pageTitle;
        linkElement.title = pageTitle + " (" + this.getAttribute('href') + ")";
        // 元の <auto-link> を <a> タグに置き換え
        this.replaceWith(linkElement);
        removeStateAndChange(autoLinkId, null);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // 初回設定
    pageInfo = JSON.parse(document.getElementById('pageInfo').textContent);
    insertScript(pageInfo);
    generateGlobalComponents();
    customElements.define('auto-link', AutoLink);
    pastPageURL.unshift(location.href);
});

// イベントデリゲーションを使用したクリックハンドラ
document.body.addEventListener('click', function (event) {
    // クリックが <a> 要素内で発生したかを確認
    const linkElement = event.target.closest('a');
    if (linkElement) {
        linkClickHandler(event, linkElement.href);
    }
});

window.onpopstate = (event) => {
    navigateTo(document.location);
};

(function () {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-F3GN58W5S1';
    document.head.appendChild(script);

    script.onload = function () {
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-F3GN58W5S1');
    };
    console.log('読み込まれています.');
    setTimeout(() => {
        addState('読み込み', 3072);
    }, 2000);
})();

let pageInfo = {};
let pageTitle = {};
let csvDataCache = null;
let jsFilesToRemove = [];
let messageCount = 0;
let pageCreate = '';
let pastPageURL = [];
const fadeID = ['root', 'headerTitle', 'pageInfoDescription', 'pageUpdateInfo'];