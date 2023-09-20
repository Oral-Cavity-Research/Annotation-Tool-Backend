const express = require('express')
const router = express.Router()
const Image = require('../models/Image');
const { authenticateToken, checkPermissions } = require("../middleware/auth");
const AnnotationHistory = require('../models/AnnotationHistory');

router.post('/update/:_id', authenticateToken, async(req, res)=>{
    try{
       
        const images = await Image.findByIdAndUpdate(req.params._id, {
            category: req.body.category
        });

        try{
            const newComment = new AnnotationHistory({
                annotator: req._id,
                image: req.params._id,
                action: "Commented",
                title: "Category is updated",
                comment: `Category is changed from "${req.body.prevCategory}" to "${req.body.category}"`,
    
            });
    
            const comment =  await newComment.save();
            const updatedimage = await Image.findByIdAndUpdate(req.params._id, {last_comment:comment._id});

        }catch(e){
            console.log("error in adding a comment: ",e)
        }

        return res.status(200).json({message:"Image data updated successfully"});

    }catch(err){
        return res.status(500).json(err)
    }
})

router.post('/availability/:_id', authenticateToken, async(req, res)=>{
    try{
       
        const images = await Image.findByIdAndUpdate(req.params._id, {
            is_public: req.body.is_public
        });

        try{
            const newComment = new AnnotationHistory({
                annotator: req._id,
                image: req.params._id,
                action: "Commented",
                title: "Public availability is updated",
                comment: `Availability is changed to "${req.body.is_public}"`,
    
            });
    
            const comment =  await newComment.save();
            const updatedimage = await Image.findByIdAndUpdate(req.params._id, {last_comment:comment._id});

        }catch(e){
            console.log("error in adding a comment: ",e)
        }

        return res.status(200).json({message:"Image data uploaded successfully"});

    }catch(err){
        return res.status(500).json(err)
    }
})

router.post('/annotate/:id', authenticateToken, async(req, res)=>{

    if(!checkPermissions(req.permissions, [210])){
        return res.status(401).json({ message: "Unauthorized access"});
    }

    try{
        const image = await Image.findById(req.params.id);
     
        if(!image){
            return res.status(404).json({message:"Image not found"});
        }
     
        const isValid = isValidAction(image.status, req.body.status);

        if(!isValid){
            return res.status(401).json({message:"Unauthorized action"});
        }

        if(!image.annotators || !image.annotators.includes(req._id)){
            image.annotators.push(req._id);
            image.save();
        }
        
        const nextStatus = getNextStatus(req.body.status);

        const newComment = new AnnotationHistory({
            annotator: req._id,
            image: req.params.id,
            action: nextStatus,
            title: req.body.title? req.body.title: nextStatus,
            comment: req.body.comment? req.body.comment: "",

        });

        const comment =  await newComment.save();

        var data = {};
        if(nextStatus === "Edited" || nextStatus === "Reviewed"){
            data = {
                location: req.body.location,
                clinical_diagnosis: req.body.clinical_diagnosis,
                annotation: req.body.annotation,
                status : nextStatus,
                last_comment: comment._id
            }
        }else if(nextStatus === "Commented"){
            data = {last_comment: comment._id} // comments doesn't change the status
        }else{
            data = {status: nextStatus, last_comment: comment._id}
        }

        const updatedimage = await Image.findByIdAndUpdate(req.params.id, data, { new: true, returnDocument: "after" });
        
        return res.status(200).json({...updatedimage._doc});
       
    }catch(err){
        console.log(err)
        return res.status(500).json({ error: err, message: "Internal Server Error!" })
    }
})

// get all images
router.get("/all", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [210])){
        return res.status(401).json({ message: "Unauthorized access"});
    }

    const pageSize = 18;
    const page = req.query.page? req.query.page: 1;
    const search = req.query.search;

    var condition = {}
    
    if(search && search !== ""){
        condition = {image_name : { $regex: search, $options: 'i' }}
    }else if(req.query.filter && req.query.filter === "Unannotated"){
        condition = {
            $or: [
              { annotation: { $exists: true, $size: 0 } }, // Empty array if "annotation" exists
              { annotation: { $exists: false } } // "annotation" does not exist
            ]
          }
    }else if(req.query.filter && req.query.filter === "Edited"){
        condition = {status : {$in : ["Edited", "Marked As Resolved","Reopened"]}}
    }else if(req.query.filter && req.query.filter === "Changes Requested"){
        condition = {status: "Changes Requested"}
    }else if(req.query.filter && req.query.filter === "New"){
        condition = {status: "New"}
    }else if(req.query.filter && req.query.filter === "Reviewed"){
        condition = {status: "Reviewed"}
    }else{
        condition = {status : {$in : ["Edited", "New","Marked As Resolved","Reopened","Reviewed", "Changes Requested"]}}
    }

    try {
        const images = await Image.find(condition,{}
        ).sort({updatedAt: -1}).skip((page-1)*pageSize).limit(pageSize);

        return res.status(200).json(images);
            
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
});

// get notifications
router.get("/notification", authenticateToken, async (req, res) => {

    var condition1 = {status: "Changes Requested", annotators: { $in: [req._id] }}
    var condition2 = {status: "Review Requested"}

    try {
        const count1 = await Image.where(condition1).count();
        const count2 = await Image.where(condition2).count();

        return res.status(200).json({changes:count1, reviews:count2});
            
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
});

// get all images
router.get("/mywork", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [210])){
        return res.status(401).json({ message: "Unauthorized access"});
    }

    const pageSize = 18;
    const page = req.query.page? req.query.page: 1;

    var condition = {}
    
    if(req.query.filter && req.query.filter === "Edited"){
        condition = {status : {$in : ["Edited", "Marked As Resolved","Reopened"]}, annotators: { $in: [req._id] }}
    }else if(req.query.filter && req.query.filter === "Changes Requested"){
        condition = {status: "Changes Requested", annotators: { $in: [req._id] }}
    }else if(req.query.filter && req.query.filter === "Reviewed"){
        condition = {status: "Reviewed", annotators: { $in: [req._id] }}
    }else{
        condition = {status : {$in : ["Edited", "New","Marked As Resolved","Reopened","Reviewed","Changes Requested"]}, annotators: { $in: [req._id] }}
    }

    try {
        const images = await Image.find(condition,{}
        ).sort({updatedAt: -1}).skip((page-1)*pageSize).limit(pageSize);

        return res.status(200).json(images);
            
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
});

// get image count
router.get("/all/count", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [210])){
        return res.status(401).json({ message: "Unauthorized access"});
    }

    const search = req.query.search;

    var condition = {}
    
    if(search && search !== ""){
        condition = {image_name : { $regex: search, $options: 'i' }}
    }else if(req.query.filter && req.query.filter === "Unannotated"){
        condition = {
            $or: [
              { annotation: { $exists: true, $size: 0 } }, // Empty array if "annotation" exists
              { annotation: { $exists: false } } // "annotation" does not exist
            ]
          }
    }else if(req.query.filter && req.query.filter === "Edited"){
        condition = {status : {$in : ["Edited", "Marked As Resolved","Reopened"]}}
    }else if(req.query.filter && req.query.filter === "Changes Requested"){
        condition = {status: "Changes Requested"}
    }else if(req.query.filter && req.query.filter === "New"){
        condition = {status: "New"}
    }else if(req.query.filter && req.query.filter === "Reviewed"){
        condition = {status: "Reviewed"}
    }else if(req.query.filter && req.query.filter === "Review Requested"){
        condition = {status: "Review Requested"}
    }else if(req.query.filter && req.query.filter === "Approved"){
        condition = {status: "Approved"}
    }else{
        condition = {status : {$in : ["Edited", "New","Marked As Resolved","Reopened","Reviewed","Changes Requested"]}}
    }

    try {
        const count = await Image.where(condition).count();

        return res.status(200).json({count});
            
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
});
// get mywork image count
router.get("/mywork/count", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [210])){
        return res.status(401).json({ message: "Unauthorized access"});
    }

    var condition = {}
    
    if(req.query.filter && req.query.filter === "Edited"){
        condition = {status : {$in : ["Edited", "Marked As Resolved","Reopened"]}, annotators: { $in: [req._id] }}
    }else if(req.query.filter && req.query.filter === "Changes Requested"){
        condition = {status: "Changes Requested", annotators: { $in: [req._id] }}
    }else if(req.query.filter && req.query.filter === "Reviewed"){
        condition = {status: "Reviewed", annotators: { $in: [req._id] }}
    }else if(req.query.filter && req.query.filter === "Review Requested"){
        condition = {status: "Review Requested", annotators: { $in: [req._id] }}
    }else if(req.query.filter && req.query.filter === "Approved"){
        condition = {status: "Approved", annotators: { $in: [req._id] }}
    }else{
        condition = {status : {$in : ["Edited", "New","Marked As Resolved","Reopened","Reviewed", "Changes Requested"]}, annotators: { $in: [req._id] }}
    }

    try {
        const count = await Image.where(condition).count();

        return res.status(200).json({count});
            
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
});

// get one image
router.get("/data/:id", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [210])){
        return res.status(401).json({ message: "Unauthorized access"});
    }

    try {
        const image = await Image.findById(req.params.id,{})
        .populate("last_comment", "action")

        const prevDocuments = await Image.find({ status: image.status, _id: { $lt: image._id } },"_id")
        .sort({ updatedAt : -1 })
        .limit(1); 

        const nextDocuments = await Image.find({ status: image.status, _id: { $gt: image._id } },"_id")
        .sort({ updatedAt: 1 })
        .limit(1);

        const prevDocument = prevDocuments.length > 0? prevDocuments[0]._id: null
        const nextDocument = nextDocuments.length > 0? nextDocuments[0]._id: null
        return res.status(200).json({...image._doc, prevImage: prevDocument, nextImage: nextDocument});
            
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
});

// get prev and next images
router.get("/navigation/:id/:status", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [210])){
        return res.status(401).json({ message: "Unauthorized access"});
    }

    try {
        const image = await Image.findById(req.params.id,{})

        const prevDocuments = await Image.find({ status: req.params.status, _id: { $lt: image._id } },"_id")
        .sort({ updatedAt : -1 })
        .limit(1); 

        const nextDocuments = await Image.find({ status: req.params.status, _id: { $gt: image._id } },"_id")
        .sort({ updatedAt: 1 })
        .limit(1);

        const prevDocument = prevDocuments.length > 0? prevDocuments[0]._id: null
        const nextDocument = nextDocuments.length > 0? nextDocuments[0]._id: null
        return res.status(200).json({prev: prevDocument, next: nextDocument});
            
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
});

// get all action history
router.get("/action/:id", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [210])){
        return res.status(401).json({ message: "Unauthorized access"});
    }

    try {
        const history = await AnnotationHistory.find({image: req.params.id},{}).sort({createdAt: -1})
        .populate("annotator", "username picture");

        return res.status(200).json(history);
            
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
});

// get all approved images
router.get("/approved", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [210])){
        return res.status(401).json({ message: "Unauthorized access"});
    }

    const pageSize = 18;
    const page = req.query.page? req.query.page: 1;

    var condition = {status: "Approved"}
    
    try {
        const images = await Image.find(condition,{}
        ).sort({updatedAt: -1}).skip((page-1)*pageSize).limit(pageSize)
        .populate({
            path: "last_comment",
            populate: [
                {
                    path: "annotator",
                    select: "username picture"
                }
            ]
        })

        return res.status(200).json(images);
            
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
});
// get mywork approved images
router.get("/mywork/approved", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [210])){
        return res.status(401).json({ message: "Unauthorized access"});
    }

    const pageSize = 18;
    const page = req.query.page? req.query.page: 1;

    var condition = {
        status: "Approved",
        annotators: { $in: [req._id] }
    }
    
    try {
        const images = await Image.find(condition,{}
        ).sort({updatedAt: -1}).skip((page-1)*pageSize).limit(pageSize)
        .populate({
            path: "last_comment",
            populate: [
                {
                    path: "annotator",
                    select: "username picture"
                }
            ]
        })

        return res.status(200).json(images);
            
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
});

// get all review requests
router.get("/requests", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [210])){
        return res.status(401).json({ message: "Unauthorized access"});
    }

    const pageSize = 18;
    const page = req.query.page? req.query.page: 1;

    var condition = {status: "Review Requested"}
    
    try {
        const images = await Image.find(condition,{}
        ).sort({updatedAt: -1}).skip((page-1)*pageSize).limit(pageSize)
        .populate({
            path: "last_comment",
            populate: [
                {
                    path: "annotator",
                    select: "username picture"
                }
            ]
        })

        return res.status(200).json(images);
            
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
});

// get mywork review requests
router.get("/mywork/requests", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [210])){
        return res.status(401).json({ message: "Unauthorized access"});
    }

    const pageSize = 18;
    const page = req.query.page? req.query.page: 1;

    var condition = {
        status: "Review Requested",
        annotators: { $in: [req._id] }
    }
   
    try {
        const images = await Image.find(condition,{}
        ).sort({updatedAt: -1}).skip((page-1)*pageSize).limit(pageSize)
        .populate({
            path: "last_comment",
            populate: [
                {
                    path: "annotator",
                    select: "username picture"
                }
            ]
        })

        return res.status(200).json(images);
            
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
});

const isValidAction = (currentState,nextAction)=>{

    var allowedAction = [];

    if(currentState === "New"){
        allowedAction = ["Comment","Save", "Approve"]
    }else if(currentState === "Edited" ||
        currentState === "Reviewed" ||
        currentState === "Marked As Resolved" || 
        currentState === "Reopened"
    ){
        allowedAction = ["Comment","Save", "Request Review","Approve"]
    }else if(currentState === "Changes Requested"){
        allowedAction = ["Comment","Save","Mark As Resolved"]
    }else if(currentState === "Review Requested"){
        allowedAction = ["Review","Request Changes","Approve"]
    }else if(currentState === "Approved"){
        allowedAction = ["Reopen"]
    }
    
    return allowedAction.includes(nextAction);
    
}

const getNextStatus = (action)=>{
    var nextStatus = "Commented";
    if(action === "Save"){
        nextStatus = "Edited"
    }else if(action === "Review"){
        nextStatus = "Reviewed"
    }else if(action === "Request Review"){
        nextStatus = "Review Requested"
    }else if(action === "Request Changes"){
        nextStatus = "Changes Requested"
    }else if(action === "Mark As Resolved"){
        nextStatus = "Marked As Resolved"
    }else if(action === "Approve"){
        nextStatus = "Approved"
    }else if(action === "Reopen"){
        nextStatus = "Reopened"
    }

    return nextStatus;
}

module.exports = router ;