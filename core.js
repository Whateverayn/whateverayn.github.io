function generateGlobalComponents() {
    const mainroot = document.getElementById('root');
    mainroot.insertAdjacentHTML('beforebegin',`<header><h1>${pageInfo.title}</h1><p>共通ヘッダ</p></header>`);
    mainroot.insertAdjacentHTML('afterend',`<footer><h2>共通フッタ</h2><p>${pageInfo.description}</p></footer>`);
}

generateGlobalComponents();