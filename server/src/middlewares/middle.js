const jwt = require('jsonwebtoken')

module.exports.notfound = function(req, res, next) {
    res.status(404).json({ msg: "Not Found" });  
};

module.exports.authenticateToken = function(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    
    if (token == null || authHeader.split(' ')[0] != 'Bearer') return (res.status(401).json({ msg: "Unauthorized" }));
  
    jwt.verify(token, process.env.SECRET, (err) => {
        if (err) {
            return (res.status(401).json({ msg: "Unauthorized" }));
        }
        next();
    });
}

module.exports.authenticateSession = function(req, res, next) {
    if (req.isAuthenticated())
        next()
    else
        return (res.status(401).json({ msg: "Unauthorized" }));
}