function formSubmit() {
    const formIDdataV = ['name', 'email', 'username', 'feedText'];
    const formIDdataC = ['page', 'userAgent', 'screenSize'];
    let formInputData = {};
    formIDdataV.forEach(element => {
        formInputData[element] = document.getElementById(element).value;
        console.log(formInputData[element]);
    });
    formIDdataC.forEach(element => {
        formInputData[element] = document.getElementById(element).checked;
        console.log(formInputData[element]);
    });
    formInputData['page'] = (formInputData['page'] === true) ? pastPageURL[1] : '';
    formInputData['userAgent'] = (formInputData['userAgent'] === true) ? navigator.userAgent : '';
    formInputData['screenSize'] = (formInputData['screenSize'] === true) ? `${window.innerWidth}x${window.innerHeight}` : '';
    const fromURL = encodeURI(`https://docs.google.com/forms/d/e/1FAIpQLSdaBOx_wVLnIetxlQSq-2csT531YgIWuJrtJH5VwnylRrnsNQ/viewform?usp=pp_url&entry.275937609=${formInputData['name']}&entry.156190288=${formInputData['email']}&entry.1148981499=${formInputData['username']}&entry.840543628=${formInputData['page']}&entry.2087315042=${formInputData['userAgent']}&entry.1296741037=${formInputData['screenSize']}&entry.1633709877=${formInputData['feedText']}`);
    window.open(fromURL);
}