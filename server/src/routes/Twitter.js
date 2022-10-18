function getAccessToken(aT, rT, cb) {
    let body = {
        'grant_type': 'refresh_token',
        'refresh_token': rT,
        'client_id': 'ajFCcEh0U2RyeXU1RWloMGEtdnU6MTpjaQ',
    };
    let formBody = [];
    for (let property in body)
        formBody.push(encodeURIComponent(property) + "=" + encodeURIComponent(body[property]));
    formBody = formBody.join("&");
    fetch("https://api.twitter.com/2/oauth2/token", { method: "POST", headers: { "Accept": "application/vnd.github.v3+json", "Content-Type": "application/x-www-form-urlencoded", "Authorization": "Basic " + Buffer.from('ajFCcEh0U2RyeXU1RWloMGEtdnU6MTpjaQ:xgxFS6FhHBJKT4Xs1i00CAWSwGPrhHVKSL1nHWUGmQ-ldUCwej').toString('base64') }, body: formBody }).then(response => {
        response.json().then(json => cb(json.access_token, json.refresh_token)).catch(err => { console.log(err); cb(null) });
    }).catch(err => { console.log(err); cb(null) });
};

module.exports.getAT = getAccessToken;
