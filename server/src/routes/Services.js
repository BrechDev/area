const { authenticateSession } = require("../middlewares/middle");
const router = require('express').Router();
const db = require('../config/db');
const addSessionsOrUpdate = require('./auth').addSessionsOrUpdate;

let functions = { "spotify": require('./Spotify'), "github": require("./Github"), "twitter": require("./Twitter") };

router.get("/services", authenticateSession, (req, res) => {
    let services = { discord: false, facebook: false, twitch: false, twitter: false, spotify: false, github: false };
    db.query(`SELECT sessions FROM users WHERE email = '${req.session.passport.user.emails[0].value}' and provider = '${req.session.passport.user.provider}'`).then(data => {
        if (data.rows[0]?.sessions)
            Object.keys(data.rows[0].sessions).forEach(key => {
                delete services[key];
                functions[key].getAT(data.rows[0].sessions[key].aT, data.rows[0].sessions[key].rT, (aT, rT) => {
                    services[key] = aT ? true : false;
                    if (aT) addSessionsOrUpdate(key, aT, rT ? rT : data.rows[0].sessions[key].rT, data.rows[0].sessions[key].id, req.session.passport.user.emails[0].value, req.session.passport.user.provider);
                });
            });
        let ret = () => {
            if (Object.keys(services).length === 6) 
            return (res.status(200).json(services));
            else setTimeout(ret, 200); 
        }
        ret();
    }).catch(err => {
        console.log(err);
        return (res.status(500).json({ msg: "Internal Server Erorr" }));
    });
});

module.exports = router;
