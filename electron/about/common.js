function getParam () {
    var a = location.search.replace(/^\?/, '').split('&');
    var param = {};

    a.forEach((s) => {
        var kv = s.split('=');
        param[kv[0]] = kv[1];
    });
    return param;
};

var param = getParam();

document.getElementById('html').className = param.theme;