exports.browsers = (req,res,next) => {
    res.header("Access-Control-Allow-Origin","*");
    if(req.method==="OPTIONS")
    {
        res.header("Access-Control-Allow-Methods","GET,POST,PUT,DELETE");
        res.header("Access-Control-Allow-Headers","Content-Type");
        return res.status(200).json({});
    }
    next();
};

exports.notFound = (req,res,next) => {
    console.log('Invalid endpoint');
    return res.status(404).json({
        success: false,
        message: 'Invalid endpoint.'
    });
};