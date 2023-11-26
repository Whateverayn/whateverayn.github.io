function generateGlobalComponents() {
    const mainroot = document.getElementById('root');
    if (!pageInfo.title) {
        pageInfo.title = document.title;
    }
    if (!pageInfo.description) {
        pageInfo.description = document.querySelector("meta[name='description']").content;
    }

    mainroot.insertAdjacentHTML('beforebegin', `
        <header>
            <div id="headerTitle">
                <a href="/">
                    <h1 id="pageInfoTitle">${pageInfo.title}</h1>
                </a>
            </div>
            <hr>
        </header>`);
    mainroot.insertAdjacentHTML('afterend', `
        <footer>
            <hr>
            ${showPath().outerHTML}
            <p id="pageInfoDescription">${pageInfo.description}</p>
        </footer>
        <div id="stateInfoOut"><div id="stateInfo"></div></div>
        `);
    addState('ようこそ&excl;', 4960);
}

function updateGlobalComponents() {
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
    document.getElementById("pageInfoTitle").innerHTML = pageInfo.title;
    document.getElementById("pageInfoDescription").innerHTML = pageInfo.description;
    document.getElementById('pagePath').replaceWith(showPath('pagePath'));
    insertScript(pageInfo);
    removeStateAndChange(updateGlobalComponentsId, { message: `コンポーネントを更新しました`, duration: 2048 })
}

// ページ遷移処理の関数
function navigateTo(url) {
    const navigateToId = addState(exURL(url) + ' へ移動しています...', 0);
    // Ajaxを使ってHTMLファイルの内容を取得
    fetch(url)
        .then(response => response.text())
        .then(html => {
            // 取得したHTMLの中から<div id="root">の中身を抽出
            const parseId = addState(exURL(url) + 'inidex.html をパースしています...', 0);
            var parser = new DOMParser();
            var newDocument = parser.parseFromString(html, "text/html");
            removeStateAndChange(parseId, { message: `${exURL(url)}index.html をパースしました`, duration: 2048 });
            // ページ辞書の初期化
            const pageInfoUpDateId = addState('ページ情報を更新しています...', 1024);
            pageInfo = {};
            pageInfo = JSON.parse(newDocument.getElementById('pageInfo').textContent);
            removeStateAndChange(pageInfoUpDateId, { message: `ページ情報を更新しました`, duration: 2048 });
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
                removeStateAndChange(pageUpdateId, { message: `ページを更新しました`, duration: 2048 })
                updateGlobalComponents();
                removeStateAndChange(navigateToId, { message: `${exURL(url)} へ移動しました`, duration: 2048 })
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
    const output = document.createElement('div');
    output.id = 'pagePath';
    let currentPath = '';
    pathSegments.forEach(segment => {
        if (segment != '') {
            const separator = document.createElement('span');
            separator.textContent = ' > ';
            output.appendChild(separator);
        }
        currentPath += segment + '/';
        let link = document.createElement('auto-link');
        link.setAttribute("href", currentPath)
        link.textContent = currentPath;
        output.appendChild(link);
    });
    return output;
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

// ページタイトルを取得
async function getPageTitleFromURL(url) {
    const pageGetId = addState(exURL(url) + ' の情報を取得しています...', 0);
    try {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        removeStateAndChange(pageGetId, { message: exURL(url) + ' の情報を取得しました', duration: 2048 });
        return doc.title;
    } catch (error) {
        console.error("ページの取得エラー:", error);
        return 'Error';
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
        // 元の <auto-link> を <a> タグに置き換え
        this.replaceWith(linkElement);
        removeStateAndChange(autoLinkId, { message: this.getAttribute('href') + ' を広げました', duration: 2048 });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // 初回設定
    pageInfo = JSON.parse(document.getElementById('pageInfo').textContent);
    insertScript(pageInfo);
    generateGlobalComponents();
    customElements.define('auto-link', AutoLink);
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

let pageInfo = {};
let jsFilesToRemove = [];
let messageCount = 0;