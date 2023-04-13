const express = require('express')
const router = express.Router()
const Image = require('../models/Image');
const Patient = require('../models/Patient');
const User = require('../models/User');
const {authenticateToken} = require('../middleware/auth')

/*
 * 
 * 
 * need to modify
 * 
 * 
 */

// id is entry _id
router.post('/update', authenticateToken, async(req, res)=>{
    try{
       
        const images = await Image.findByIdAndUpdate(req.body._id, {
            location: req.body.location,
            clinical_diagnosis: req.body.clinical_diagnosis,
            lesions_appear: req.body.lesions_appear,
            annotation: req.body.annotation
        });

        return res.status(200).json({message:"Image data uploaded successfully"});

    }catch(err){
        return res.status(500).json(err)
    }
})

module.exports = router ;