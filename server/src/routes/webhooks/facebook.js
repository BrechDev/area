const router = require('express').Router();

router.get("/facebook", (req, res) => {
    console.log(req.query);
    return (res.status(200).send(req.query["hub.challenge"]));
});

router.post("/facebook", (req, res) => {
    console.log(req.query, req.body);
    console.log(req.body.entry[0].changes[0]);
    return (res.status(200).send(req.query["hub.challenge"]));
});
    
module.exports = router;