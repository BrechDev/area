function getAccessToken(aT, rT, cb) {
    fetch("https://api.github.com/applications/cf5abc0414f7f9466b38/token", { method: "POST", headers: { "Accept": "application/vnd.github.v3+json", "Authorization": "Basic " + Buffer.from('cf5abc0414f7f9466b38:5dd1eb9ff924080ace119eeba5a5c56047c6f79b').toString('base64') }, body: JSON.stringify({'access_token': aT}) }).then(response => {
        return (cb(response.status === 200 ? aT : null));
    }).catch(err => { console.log(err); cb(null) });
};

module.exports.getAT = getAccessToken;
