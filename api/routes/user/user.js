require('dotenv').config();
const express = require('express');
const router = express.Router();
const Alerts = require('../../../alerts');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const User = require('../../models/User');
const VerificationCode = require('../../models/VerificationCode');

const userMiddleware = require('./user-middleware');

router.post('/signup', userMiddleware.email_format, userMiddleware.email_exists,
    async (req,res,next)=>{
        try
        {
            const verification_doc = await VerificationCode.findOne({email: req.body.email}).exec();
            if(verification_doc)
            {
                const message = 'Verification code already sent to '+req.body.email+'. Repeat this request in '
                    + (Math.floor((Date.now()-verification_doc.createdAt)/60000)+1) + ' mins to re-send a new verification code.';
                console.log(message);
                return res.status(409).json({ message });
            }
            let random_verification_code, existing_verification_code;
            while( (random_verification_code = crypto.randomBytes(64).toString('hex'))
                && (existing_verification_code = await VerificationCode.findOne({code: random_verification_code}).exec()));
            next({ email: req.body.email , code: random_verification_code });
        }
        catch(error)
        {
            console.log(error.message);
            return res.status(409).json({ message: error.message });
        }
    },
    async (verification_info,req,res,next)=>{
        try
        {
            await Alerts.sendEmail({
                from: `Uptime Monitor <${process.env.EMAIL}>`,
                to: verification_info.email,
                subject: 'Uptime Monitor Signup Verification',
                text: "Verification Code="+verification_info.code,
                html: "<h1>Verification Code</h1><span>"+verification_info.code+"</span>" });
            next(verification_info);
        }
        catch(error)
        {
            console.log(error.response);
            return res.status(500).json({ message: error.response });
        }
    },
    async (verification_info,req,res,next)=>{
        const verification_entry = new VerificationCode(verification_info);
        try
        {
            await verification_entry.save();
            console.log("Verification email sent. Email: "+verification_info.email);
            return res.status(201).json({ message: "Verification email sent." });
        }
        catch(error)
        {
            console.log(error.message);
            return res.status(409).json({ message: error.message });
        }
    }
);

router.post('/verify', userMiddleware.email_format, userMiddleware.email_exists, userMiddleware.password_format, async (req,res,next)=>{
    try
    {
        const verification_doc = await VerificationCode.findOne({email: req.body.email, code: req.body.verification_code}).exec();
        if(verification_doc)
        {
            await VerificationCode.deleteOne({_id: verification_doc._id}).exec();
            const user_entry = new User({
                email: req.body.email,
                password: req.body.password
            });
            await user_entry.save();
            console.log('Signup successful. Email: '+req.body.email);
            return res.status(201).json({ message: 'Signup successful.' });
        }
        else
        {
            console.log('Invalid attempt, try signing up again. Email: '+req.body.email);
            return res.status(409).json({ message: 'Invalid attempt, try signing up again.' });
        }
    }
    catch(error)
    {
        console.log(error.message);
        return res.status(409).json({ message: error.message });
    }
});

router.post('/login', userMiddleware.email_format, userMiddleware.password_format, async (req,res,next)=>{
    try
    {
        const user_doc = await User.findOne({ email: req.body.email }).exec();
        if(!user_doc)
        {
            console.log('Credentials are not correct.');
            return res.status(401).json({ message: 'Credentials are not correct.' });
        }
        const valid = await user_doc.isValidPassword(req.body.password);
        if(valid)
        {
            const token = jwt.sign({
                _id: user_doc._id,
                email: user_doc.email
            },process.env.JWT_SECRET,
            { expiresIn:"1h" });
            console.log('Login successful. Email: '+req.body.email);
            return res.status(200).json({ message: 'Login successful.', token });
        }
        else
        {
            console.log('Credentials are not correct.');
            return res.status(401).json({ message: 'Credentials are not correct.' });
        }
    }
    catch(error)
    {
        console.log(error.message);
        return res.status(401).json({ message: error.message });
    }
});

module.exports = router;
