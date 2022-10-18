const bcrypt = require("bcrypt");
const db = require('../config/db');
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const AzureStrategy = require('passport-azure-ad-oauth2').Strategy;
const TwitterStrategy = require('../config/Twitter');
const GithubStrategy = require('passport-github');
const { authenticateSession } = require("../middlewares/middle");
const SpotifyStrategy = require('passport-spotify').Strategy;
const LocalStrategy = require('passport-local').Strategy;

function registerOrUpdate(profile, aT, rT)
{
    db.query(`SELECT * FROM users WHERE email = '${profile.emails[0].value}' and provider = '${profile.provider}'`).then(data => {
        if (data.rowCount)
            db.query(`UPDATE users SET session = '${JSON.stringify({aT: aT, rT: rT})}', display_name = '${profile.displayName}' WHERE email = '${profile.emails[0].value}' AND provider = '${profile.provider}'`).catch(err => console.log(err));
        else
            db.query(`INSERT INTO users (email, display_name, session, provider) values ('${profile.emails[0].value}', '${profile.displayName}', '${JSON.stringify({aT: aT, rT: rT})}', '${profile.provider}')`).catch(err => console.log(err));
    });
}

function addSessionsOrUpdate(sProvider, aT, rT, id, email, provider)
{
    db.query(`SELECT sessions FROM users WHERE email = '${email}' AND provider = '${provider}'`).then(data => {
        if (data.rowCount) {
            if (!data.rows[0].sessions) data.rows[0].sessions = {};
            data.rows[0].sessions[sProvider] = {aT: aT, rT: rT, id};
            db.query(`UPDATE users SET sessions = '${JSON.stringify(data.rows[0].sessions)}' WHERE email = '${email}' AND provider = '${provider}'`).catch(err => console.log(err));
        }
    });
}

router.post("/register", (req, res) => {
    if (!req.body.email || !req.body.password || !req.body.name)
        return (res.status(400).json({ msg: "Bad body formating" }));
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(req.body.password, salt);
    db.query(`INSERT INTO users (email, password, display_name, provider) values ('${req.body.email}', '${hash}', '${req.body.name}', 'local')`).then(data => {
        let jwtT = jwt.sign({email: req.body.email, password: req.body.password}, process.env.SECRET, { expiresIn: '1h' });
        res.status(201).json({ msg: "User created", token: jwtT });
    }).catch(err => {
        console.log(err);
        res.status(409).json({ msg: "User already exist" });
    });
});

passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password"
 }, function(email, password, done) {
        db.query(`SELECT password FROM users WHERE email = '${email}'`).then(data => {
            if (data.rows[0]?.password && bcrypt.compare(password, data.rows[0]?.password)) {
                user = {
                    provider: 'local',
                    emails: [
                        { value: email }
                    ]
                }
                return (done(null, user));
            } else
                return (done(null, false)); 
        }).catch(err => {
            console.log(err)
            return(done(null, false));
        });
    }
));

router.post("/login", passport.authenticate('local'), (req, res) => {
    return(res.status(200).json({ msg: "Connected" }));
});

router.get("/logout", (req, res) => {
    req.logOut(err => {
        if (err) console.log(err);
    });
    return(res.redirect(req.session.origin));
})

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user)
});

passport.use(new GoogleStrategy({
    clientID: "1014039655445-eaqqk7inuu5e891s8ccl6d1kd473i1of.apps.googleusercontent.com",
    clientSecret: "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",
    passReqToCallback: true,
    callbackURL: "/callback/auth/google" }, (req, aT, rT, profile, done) => {
        profile.origin = req.session.origin;
        registerOrUpdate(profile, aT, rT);
        done(null, profile, aT);
}));
    
router.get("/google_login", passport.authenticate('google', { scope: ["profile", "email"] }));

router.get("/callback/auth/google", passport.authenticate('google'), (req, res)  => {
    return (res.redirect(req.session.passport.user.origin));
});

passport.use(new FacebookStrategy({
    clientID: "784211742840413",
    clientSecret: "b851fad03e3b892ce293c06610b1f7eb",
    profileFields: ['emails', 'displayName'],
    passReqToCallback: true,
    name: "facebook2",
    callbackURL: "/callback/auth/facebook"}, (req, aT, rT, params, profile, done) => {
        profile.origin = req.session.origin;
        addSessionsOrUpdate(profile.provider, aT, rT, null, req.session.passport.user.emails[0].value, req.session.passport.user.provider);
        done(null, profile, aT);
}));

passport.use(new FacebookStrategy({
    clientID: "784211742840413",
    clientSecret: "b851fad03e3b892ce293c06610b1f7eb",
    profileFields: ['emails', 'displayName'],
    passReqToCallback: true,
    callbackURL: "/callback/auth/facebook"}, (req, aT, rT, params, profile, done) => {
        profile.origin = req.session.origin;
        registerOrUpdate(profile, aT, rT);
        done(null, profile, aT);
}));

router.get("/facebook_login", passport.authenticate('facebook'));

router.get("/facebook_login_session", passport.authenticate('facebook2'));

router.get("/callback/auth/facebook", passport.authenticate('facebook'), (req, res) => {
    return (res.redirect(req.session.passport.user.origin));
});

router.get("/callback/auth/facebook", passport.authenticate('facebook'), (req, res) => {
    return (res.redirect(req.session.passport.user.origin));
});

passport.use(new AzureStrategy({
    clientID: "da20c9f1-aed6-4f5f-8038-d2bc93fa1c3a",
    clientSecret: "kYb8Q~.fHx14hKnP5_esmcXcfL8OCzrmpumlAdhQ",
    profileFields: [ "email" ],
    passReqToCallback: true,
    callbackURL: "/callback/auth/azure"}, (req, aT, rT, params, profile, done) => {
        profile = {...profile, displayName: jwt.decode(params.id_token).name, emails: [{value: jwt.decode(params.id_token).unique_name}], origin: req.session.origin};
        registerOrUpdate(profile, aT, rT);
        done(null, profile, aT);
}));
    
router.get("/azure_login", passport.authenticate('azure_ad_oauth2'));
    
router.get("/callback/auth/azure", passport.authenticate('azure_ad_oauth2'), (req, res) => {
    return (res.redirect(req.session.passport.user.origin));
});

passport.use(new TwitterStrategy({
    clientID: "ajFCcEh0U2RyeXU1RWloMGEtdnU6MTpjaQ",
    clientSecret: "xgxFS6FhHBJKT4Xs1i00CAWSwGPrhHVKSL1nHWUGmQ-ldUCwej",
    passReqToCallback: true,
    callbackURL: "/callback/auth/twitter" }, (req, aT, rT, params, profile, done) => {
        console.log(req.session);
        profile.origin = req.session.origin;
        addSessionsOrUpdate(profile.provider, aT, rT, null, req.session.passport.user.emails[0].value, req.session.passport.user.provider);
        done(null, profile, aT);
}));

router.get("/twitter_login", passport.authenticate('twitter', { scope: ["tweet.read", "users.read", "follows.read", "follows.write", "offline.access"]}));

router.get("/callback/auth/twitter", passport.authenticate('twitter', { session: false }), (req, res) => {
    return (res.redirect(req.session.passport.user.origin));
})

passport.use(new GithubStrategy({
    clientID: "cf5abc0414f7f9466b38",
    clientSecret: "5dd1eb9ff924080ace119eeba5a5c56047c6f79b",
    passReqToCallback: true,
    callbackURL: "/callback/auth/github" }, (req, aT, rT, profile, done) => {
        profile = {...profile, displayName: profile.login, origin: req.session.origin};
        console.log(profile);
        addSessionsOrUpdate(profile.provider, aT, rT, profile.id, req.session.passport.user.emails[0].value, req.session.passport.user.provider);
        done(null, profile, aT);
}));

router.get("/github_login", passport.authenticate('github', { scope: ["user:email", "repo"] }));

router.get("/callback/auth/github", passport.authenticate('github', { session: false }), (req, res) => {
    return(res.redirect(req.session.passport.user.origin));
});

passport.use(new SpotifyStrategy({
    clientID: "b73da2b02558493d92cf3be7eeb577d0",
    clientSecret: "f5dcf3af3ec9491ea01636f44be075a2",
    passReqToCallback: true,
    callbackURL: "/callback/auth/spotify" }, (req, aT, rT, profile, done) => {
        profile.origin = req.session.origin;
        addSessionsOrUpdate(profile.provider, aT, rT, null, req.session.passport.user.emails[0].value, req.session.passport.user.provider);
        done(null, profile, aT);
}));

router.get("/spotify_login", passport.authenticate('spotify', { scope: ["user-read-playback-state", "user-modify-playback-state", "user-read-currently-playing", "user-read-email", "streaming"]}));

router.get("/callback/auth/spotify", passport.authenticate('spotify', { session: false }), (req, res) => {
    return(res.redirect(req.session.passport.user.origin));
});

router.get("/profile", authenticateSession, (req, res) => {
    return (res.status(200).json(req.session.passport.user.displayName));
});

module.exports.router = router;
module.exports.addSessionsOrUpdate = addSessionsOrUpdate;
