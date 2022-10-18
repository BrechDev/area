function getAccessToken(aT, rT, cb) {
    let body = {
        'grant_type': 'refresh_token',
        'refresh_token': rT,
        'client_id': 'b73da2b02558493d92cf3be7eeb577d0',
    };
    let formBody = [];
    for (let property in body)
        formBody.push(encodeURIComponent(property) + "=" + encodeURIComponent(body[property]));
    formBody = formBody.join("&");
    fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' +  Buffer.from('b73da2b02558493d92cf3be7eeb577d0:f5dcf3af3ec9491ea01636f44be075a2').toString('base64')}, body: formBody }).then(response => {
        response.json().then(json => cb(json.access_token)).catch(err => { console.log(err); cb(null) });
    }).catch(err => { console.log(err); cb(null) });
}

module.exports.getAT = getAccessToken;
