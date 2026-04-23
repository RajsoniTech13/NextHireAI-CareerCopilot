const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }
    
    try {
        const secret = process.env.JWT_SECRET || 'secret123';
        const decoded = jwt.verify(token, secret);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        res.status(401).json({ error: 'Token is not valid' });
    }
};