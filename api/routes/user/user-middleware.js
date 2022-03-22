const User = require('../../models/User');

exports.email_format = (req,res,next) => {
    let email;
    if(!req.body.email || !(email = req.body.email.trim()))
    {
        console.log('Email is required.');
        return res.status(409).json({message:'Email is required.'});
    }
    if(!email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
    {
        console.log('Invalid email. Email: '+req.body.email);
        return res.status(409).json({message:'Invalid email.'});
    }
    req.body.email = email;
    next();
};

exports.email_exists = async (req,res,next) => {
    const user_doc = await User.findOne({ email: req.body.email }).exec();
    if(user_doc)
    {
        console.log('Email belongs to an existing user. Email: '+req.body.email);
        return res.status(409).json({message:'Email belongs to an existing user.'});
    }
    next();
};

exports.password_format = (req,res,next) => {
    let password;
    if(!req.body.password || !(password = req.body.password.trim()))
    {
        console.log('Password is required.');
        return res.status(409).json({message:'Password is required.'});
    }
    req.body.password = password;
    next();
};