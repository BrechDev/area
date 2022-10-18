const router = require('express').Router();
const { spotifyPlayMusic } = require('../../actions/spotify');
const db = require('../../config/db');
const auth = require('../../middlewares/middle').authenticateSession;

router.post("/github", (req, res) => {
    db.query("SELECT sessions, email, provider FROM users").then(data => {
        let user = data.rows.find(row => +row.sessions["github"]?.id === JSON.parse(req.body.payload).sender.id);
        spotifyPlayMusic(user.email, user.provider, '6DPrYPPGYK218iVIZDix3i');
    });
});

router.post("/create_webhooks", auth, (req, res) => {
    if (!req.body.repo || !req.body.owner)
        return (res.status(400).json({ msg: "Bad body formating" }));
        let body = {
        'hub.mode': 'subscribe',
        'hub.topic': `https://github.com/${req.body.owner}/${req.body.repo}/events/push`,
        'hub.callback': 'https://zarea.fr/callback/webhook/github',
        'hub.secret': 'secretdefou'
        };    
            let formBody = [];  
            for (let property in body)
                formBody.push(encodeURIComponent(property) + "=" + encodeURIComponent(body[property]));
            formBody = formBody.join("&");
    db.query(`SELECT sessions FROM users WHERE email = '${req.session.passport.user.emails[0].value}' and provider = '${req.session.passport.user.provider}'`).then(data => {
        if (data.rows[0].sessions["github"]?.aT) {
            fetch("https://api.github.com/hub", { method: "POST", headers: { 'Content-Type': 'application/x-www-form-urlencoded', "Authorization": "Bearer " + data.rows[0].sessions["github"]?.aT}, body: formBody}).then(response => {
                return (res.status(201).json({ msg: "Weebhook created" }));
            })
        }
    })
});

module.exports = router;