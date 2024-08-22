const passport = require('passport');

const authMiddleware = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
        if (err || !user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        req.user = user;
        console.log('Authenticated user:', req.user);
        next();
    })(req, res, next);
};

module.exports = authMiddleware;