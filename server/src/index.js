const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');;
const db = require('./config/db');
const cors = require('cors');
const auth = require('./routes/auth').router;
const services = require('./routes/Services');
const notfound = require('./middlewares/middle').notfound;
const passport = require('passport');
const session = require('express-session');
const facebook = require('./routes/webhooks/facebook');
const github = require("./routes/webhooks/github_web");

const sessionMiddleware = session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SECRET,
    cookie: {
        sameSite: 'none',
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 30
    }
});
    
app.use(express.json());
app.use(express.urlencoded());
app.use(cors({
    'credentials': true,
    'origin': function(origin, callback) {
        return (callback(null, true));
    }
}));

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

app.use('*', (req, res, next) => {
    sessionMiddleware(req, res, next => {
        if (req.headers.origin && (req.headers.origin != "http://zarea.fr" || !req.session.origin))
            req.session.origin = req.headers.origin;
        else if (!req.session.origin)
            req.session.origin = "http://zarea.fr";
        req.session.save();
    });
    return (next());
});
        
app.use("/", auth);
app.use("/", services);
app.use("/callback/webhook", facebook);
app.use("/callback/webhook", github);

app.get("/is_auth", (req, res) => {
    return (res.status(200).json(req.isAuthenticated()));
});

app.use("*", notfound);

https.createServer({key: fs.readFileSync("privkey.pem"), cert: fs.readFileSync("fullchain.pem")}, app).listen(process.env.PORT, () => {
    console.log(Date(), "Server started on port", process.env.PORT);
    db.connect().then(client => console.log("Successfuly connected to postgres database.")).catch(err => console.log("Can't connect to postgres database:", err));
});
