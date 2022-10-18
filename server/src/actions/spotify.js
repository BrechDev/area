const db = require('../config/db');

function spotifyPlayMusic(email, provider, id) {
    db.query(`SELECT sessions FROM users WHERE email = '${email}' and provider = '${provider}'`).then(data => {
        let aT = data.rows[0].sessions['spotify']?.aT;

        if (aT) {
            fetch("https://api.spotify.com/v1/me/player/devices", { method: "GET", headers: { 'Authorization': "Bearer " + aT}}).then(response => response.json().then(json => {
                fetch("https://api.spotify.com/v1/me/player/play?device_id=" + json.devices[0]?.id, { method: "PUT", body: JSON.stringify({ uris: ["spotify:track:" + id] }), headers: { 'Authorization': "Bearer " + aT
            }}).then(json => {
                    return (true);
                });
            }));
        } else {
            return (false);
        };
    });
};

module.exports.spotifyPlayMusic = spotifyPlayMusic;
