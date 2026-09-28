const jwt = require('jsonwebtoken');
const { secret } = require('../config');

module.exports = function (roles) {
    return function (req, res, next) {
        if (req.method === 'OPTIONS') {
            return next();
        }

        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(403).json({ message: 'User not authorized' });
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(403).json({ message: 'User not authorized' });
            }

            const { roles: userRoles } = jwt.verify(token, secret);
            let hasRole = false;
            userRoles.forEach(role => {
                if (roles.includes(role)) hasRole = true;
            });
            
            if (!hasRole) {
                return res.status(403).json({ message: 'Access denied' });
            }
            next();
        } catch (e) {
            console.log(e);
            return res.status(403).json({ message: 'User not authorized or token expired' });
        }
    }
}