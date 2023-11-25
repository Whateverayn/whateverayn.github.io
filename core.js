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
        </footer>`);
}

function updateGlobalComponents() {
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
}

// ページ遷移処理の関数
function navigateTo(url) {
    // Ajaxを使ってHTMLファイルの内容を取得
    fetch(url)
        .then(response => response.text())
        .then(html => {
            // 取得したHTMLの中から<div id="root">の中身を抽出
            var parser = new DOMParser();
            var newDocument = parser.parseFromString(html, "text/html");
            // ページ辞書の初期化
            pageInfo = {};
            pageInfo = JSON.parse(newDocument.getElementById('pageInfo').textContent);
            if (pageInfo.alwaysRefresh === true) {
                pageRefresh(url);
            } else {
                // 現在のページの<head>の中身を新しい内容で差し替え
                document.title = newDocument.title;
                document.querySelector("meta[name='description']").content = newDocument.querySelector("meta[name='description']").content;
                // 現在のページの<div id="root">の中身を新しい内容で差し替え
                var newRootContent = newDocument.getElementById("root").innerHTML;
                document.getElementById("root").innerHTML = newRootContent;
                updateGlobalComponents();
            }
        })
        .catch(error => {
            console.error("ページの取得エラー:", error);
        });
}

// イベントリスナーを設定する関数
function setClickListener() {
    var allLinks = document.querySelectorAll("a");
    allLinks.forEach(function (link) {
        link.addEventListener("click", linkClickHandler);
    });
}

// ページ遷移前に既存のイベントリスナーを解除
function removeClickListener() {
    var allLinks = document.querySelectorAll("a");
    allLinks.forEach(function (link) {
        link.removeEventListener("click", linkClickHandler);
    });
}

function pageRefresh(url) {
    alert(url);
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
        alert("外部サイトに移動します" + url);
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
            const scriptElement = document.createElement('script');
            scriptElement.src = jsFile;
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
    }else{
        navigator.clipboard
            .writeText(text)
            .then(
                (success) => console.log('テキストのコピーに成功'+text+success),
                (error) => console.log('テキストのコピーに失敗'+error)
            );
    }
}

// ページタイトルを取得
async function getPageTitleFromURL(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
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
        const pageTitle = await getPageTitleFromURL(this.getAttribute('href'));
        // <a> タグに直接置き換え
        const linkElement = document.createElement('a');
        linkElement.href = this.getAttribute('href');
        linkElement.textContent = pageTitle;
        // 元の <auto-link> を <a> タグに置き換え
        this.replaceWith(linkElement);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // 初回設定
    pageInfo = JSON.parse(document.getElementById('pageInfo').textContent);
    insertScript(pageInfo);
    customElements.define('auto-link', AutoLink);
    generateGlobalComponents();
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