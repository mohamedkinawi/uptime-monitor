//middleware used for check.js and report.js routes

const jwt = require('jsonwebtoken');

module.exports = (req,res,next) => {
    const token = req.body.token;
    try
    {
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        next(decoded);
    }
    catch
    {
        console.log('Authorization failed.');
        return res.status(401).json({message: 'Authorization failed.'});
    }
};