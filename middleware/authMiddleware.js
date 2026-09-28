const jwt = require('jsonwebtoken');
const { secret } = require('../config')

module.exports = function (req, res, next) {
    if (req.method === 'OPTIONS') {
        return next();
    }
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(403).json({ message: 'User not authorized (no header)'});
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(403).json({ message: 'User not authorized (no token)'});
        }

        const decodedData = jwt.verify(token, secret);
        req.user = decodedData;
        next();
    } catch (e) {
        console.log(e);
        return res.status(403).json({ message: 'User not authorized or token expired'});
    }
}