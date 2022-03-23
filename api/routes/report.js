const express = require('express');
const router = express.Router();
const jwtAuth = require('./jwt-auth-middleware');
const Report = require('../models/Report');

/*    /report    */

router.get('/',jwtAuth,async (decoded,req,res,next)=>{
    try
    {
        if(!req.body.check || (!req.body.check.name && !req.body.check.tags))
        {
            const docs = await Report.find({owner_email: decoded.email},'-owner_email -count -consecutive_outages').exec();
            console.log('Getting all',docs.length,'report documents.');
            return res.status(200).json(docs);
        }
        else if(req.body.check.name)
        {
            const doc = await Report.findOne({owner_email: decoded.email, name: req.body.check.name},'-owner_email -count -consecutive_outages').exec();
            console.log('Getting one report document by name:',doc?'found.':'not found.');
            return res.status(200).json(doc);
        }
        else if(req.body.check.tags)
        {
            const docs = await Report.find({owner_email: decoded.email, tags: { "$all" : req.body.check.tags } },'-owner_email -count -consecutive_outages').exec();
            console.log('Getting grouped report document by tags ('+req.body.check.tags.join(',')+')',docs.length,'found.');
            return res.status(200).json(docs);
        }
    }
    catch(error)
    {
        console.log(error.message);
        return res.status(500).json({message: error.message});
    }
});

module.exports = router;