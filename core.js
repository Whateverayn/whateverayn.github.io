function generateGlobalComponents() {
    const mainroot = document.getElementById('root');

    if (pageInfo.title === undefined) {
        pageInfo.title = document.title;
    }
    if (pageInfo.description === undefined) {
        pageInfo.description = document.querySelector("meta[name='description']").content;
    }
    mainroot.insertAdjacentHTML('beforebegin',`
        <header>
            <div id="headerTitle">
                <a href="/">
                    <h1>${pageInfo.title}</h1>
                </a>
            </div>
        </header>`);
    mainroot.insertAdjacentHTML('afterend',`
        <footer>
            <h2>共通フッタ</h2>
            <p>${pageInfo.description}</p>
        </footer>`);
}

generateGlobalComponents();