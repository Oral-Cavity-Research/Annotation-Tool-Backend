const express = require('express')
const router = express.Router()
const Image = require('../models/Image');
const { authenticateToken, checkPermissions } = require("../middleware/auth");

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

// get all images
router.get("/all", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [210])){
        return res.status(401).json({ message: "Unauthorized access"});
    }

    const pageSize = 20;
    const page = req.query.page? req.query.page: 1;

    var condition = {}
    
    if(req.query.filter && req.query.filter === "Edited"){
        condition = {status: "Edited"}
    }else if(req.query.filter && req.query.filter === "New"){
        condition = {status: "New"}
    }else{
        condition = {status : {$in : ["Edited", "New"]}}
    }

    try {
        const images = await Image.find(condition,{}
        ).sort({createdAt: -1}).skip((page-1)*pageSize).limit(pageSize);

        return res.status(200).json(images);
            
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
});

// get one image
router.get("/:id", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [210])){
        return res.status(401).json({ message: "Unauthorized access"});
    }

    try {
        const images = await Image.findById(req.params.id,{})

        return res.status(200).json(images);
            
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
});

module.exports = router ;