const express = require('express');
const router = express.Router();
const jwtAuth = require('./jwt-auth-middleware');
const Check = require('../models/Check');
const Report = require('../models/Report');
const Monitor = require('../../monitor');

/*    /check    */

router.get('/',jwtAuth,async (decoded,req,res,next)=>{
    try
    {
        if(!req.body.check || (!req.body.check.name && !req.body.check.tags))
        {
            const docs = await Check.find({owner_email: decoded.email}).exec();
            console.log('Getting all',docs.length,'check documents.');
            return res.status(200).json(docs);
        }
        else if(req.body.check.name)
        {
            const doc = await Check.findOne({owner_email: decoded.email, name: req.body.check.name}).exec();
            console.log('Getting one check document by name:',doc?'found.':'not found.');
            return res.status(200).json(doc);
        }
        else if(req.body.check.tags)
        {
            const docs = await Check.find({owner_email: decoded.email, tags: { "$all" : req.body.check.tags } }).exec();
            console.log('Getting grouped check document by tags ('+req.body.check.tags.join(',')+')',docs.length,'found.');
            return res.status(200).json(docs);
        }
    }
    catch(error)
    {
        console.log(error.message);
        return res.status(500).json({message: error.message});
    }
});

router.put('/',jwtAuth,
(decoded,req,res,next)=>{
    if(!req.body.check)
    {
        console.log('check property required.');
        return res.status(409).json({message:'check property required.'});
    }
    req.body.check.owner_email = decoded.email;
    next();
},
async (req,res,next)=>{
    try
    {
        const existing_check = await Check.findOne({owner_email: req.body.check.owner_email, name: req.body.check.name}).exec();
        if(existing_check)
        {
            for(const key of Object.keys(req.body.check))
            {
                existing_check[key]=req.body.check[key];
            }
            const doc = await existing_check.save();
            await Report.deleteOne({owner_email: req.body.check.owner_email, name: req.body.check.name}).exec();
            const new_report = new Report({
                owner_email: req.body.check.owner_email,
                name: req.body.check.name,
                tags: req.body.check.tags?req.body.check.tags:[]
            });
            await new_report.save();
            console.log("Check updated successfully.");
            Monitor.update_check(doc);
            return res.status(201).json({message: "Check updated successfully."});
        }
        else
        {
            const new_check = new Check(req.body.check);
            const doc = await new_check.save();
            const new_report = new Report({
                owner_email: req.body.check.owner_email,
                name: req.body.check.name,
                tags: req.body.check.tags?req.body.check.tags:[]
            });
            await new_report.save();
            console.log("New check (and corresponding report) created successfully.");
            Monitor.create_check(doc);
            return res.status(201).json({message: "New check created successfully."});
        }
    }
    catch(error)
    {
        console.log(error.message);
        return res.status(409).json({message:error.message});
    }
});

router.delete('/',jwtAuth,async (decoded,req,res,next)=>{
    try
    {
        const doc = await Check.findOne({owner_email: decoded.email, name: req.body.check.name}).exec();
        if(doc)
        {
            await Check.deleteOne({_id: doc._id}).exec();
            await Report.deleteOne({owner_email: decoded.email, name: req.body.check.name}).exec();
            console.log('Check (and corresponding Report) deleted successfully.');
            Monitor.delete_check(doc._id);
            return res.status(200).json({message: 'Check deleted successfully.'});
        }
        else
        {
            console.log('No check with this name exists.');
            return res.status(200).json({message: 'No check with this name exists.'});
        }
    }
    catch(error)
    {
       console.log(error.message);
       return res.status(500).json({message: error.message});
    }
});

module.exports = router;