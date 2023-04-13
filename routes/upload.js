const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const Report = require("../models/Report");
const Image = require("../models/Image");
const path = require("path");
const TeleConEntry = require("../models/TeleConEntry");
const multer = require("multer");
const fs = require("fs");
const { authenticateToken, checkPermissions } = require("../middleware/auth");

let imageStorage = multer.diskStorage({
destination: function (req, file, cb) {
    let dest = path.join(__dirname, "../Storage/images");
    let stat = null;
    try {
    stat = fs.statSync(dest);
    } catch (err) {
    fs.mkdirSync(dest);
    }
    if (stat && !stat.isDirectory()) {
    throw new Error("Directory cannot be created");
    }
    cb(null, dest);
},
filename: (req, file, cb) => {
    cb(null, file.originalname);
},
});

let reportStorage = multer.diskStorage({
destination: function (req, file, cb) {
    let dest = path.join(__dirname, "../Storage/reports");
    let stat = null;
    try {
    stat = fs.statSync(dest);
    } catch (err) {
    fs.mkdirSync(dest);
    }
    if (stat && !stat.isDirectory()) {
    throw new Error("Directory cannot be created");
    }
    cb(null, dest);
},
filename: (req, file, cb) => {
    cb(null, file.originalname);
},
});

let consentFormStorage = multer.diskStorage({
destination: function (req, file, cb) {
    let dest = path.join(__dirname, "../Storage/consentform");
    let stat = null;
    try {
    stat = fs.statSync(dest);
    } catch (err) {
    fs.mkdirSync(dest);
    }
    if (stat && !stat.isDirectory()) {
    throw new Error("Directory cannot be created");
    }
    cb(null, dest);
},
filename: (req, file, cb) => {
    cb(null, file.originalname);
},
});


const uploadImages = multer({ storage: imageStorage }).array("files", 12);
const uploadDocuments = multer({ storage: reportStorage }).array("files", 3);
const uploadConsentForm = multer({ storage: consentFormStorage }).single("files");

// image routes
router.post("/images/:id", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [300])){
        return res.status(401).json({ message: "Unauthorized access"});
    }
    
    try {
        // check for the existence of the entry
        const teleConEntry = await TeleConEntry.findOne({ _id: req.params.id});
        if (teleConEntry && teleConEntry.clinician_id !== req._id) {
            // upload images
            uploadImages(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(500).json({ error: err, message: "Internal Server Error!" });
            } else if (err) {
                return res.status(500).json({ error: err, message: "Internal Server Error!" });
            } else {
                // extract form data from the request body
                const { files, ...others } = req.body;

                const data = JSON.parse(others.data)
                // images are created in bulk below
                Image.insertMany(data, function (error, docs) {
                if (error) {
                    return res.status(500).json({ error: error, message: "Internal Server Error!" });
                } else {
                    docs.forEach((doc) => {
                        teleConEntry.images.push(doc._id);
                    });
                    teleConEntry.save();
                    return res.status(200).json({ docs, message: "Images Uploaded Successfully" });
                }
                });
            }
            });
        } else {
            return res.status(404).json({ message: "Entry Not Found" });
        }
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
}
);

// document routes
router.post("/reports/:id", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [300])){
        return res.status(401).json({ message: "Unauthorized access"});
    }
    
    try {
        // check for the existence of the entry
        const teleConEntry = await TeleConEntry.findOne({ _id: req.params.id});
        if (teleConEntry && teleConEntry.clinician_id !== req._id) {
            // upload images
            uploadDocuments(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(500).json({ error: err, message: "Internal Server Error!" });
            } else if (err) {
                return res.status(500).json({ error: err, message: "Internal Server Error!" });
            } else {
                
                // extract form data from the request body
                const { files, ...others } = req.body;
                const data = JSON.parse(others.data)
                // reports are created in bulk below
                Report.insertMany(data, function (error, docs) {
                if (error) {
                    return res.status(500).json({ error: error, message: "Internal Server Error!" });
                } else {
                    docs.forEach((doc) => {
                        teleConEntry.reports.push(doc._id);
                    });
                    teleConEntry.save();
                    return res.status(200).json({ docs, message: "reports Uploaded Successfully" });
                }
                });
            }
            });
        } else {
            return res.status(404).json({ message: "No Entry found" });
        }
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
}
);

// add new user with consent form
router.post("/patient", authenticateToken, async (req, res) => {

    if(!checkPermissions(req.permissions, [300])){
        return res.status(401).json({ message: "Unauthorized access"});
    }
    
    try {
        // check for the existence of the entry
        const patient = await Patient.findOne({
            patient_id: req.body.patient_id,
            clinician_id: req._id,
        });
    
        if (patient) {
            return res.status(401).json({message:"Patient ID already exists"});
        }
        // upload images
        uploadConsentForm(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ error: err, message: "Internal Server Error!" });
        } else if (err) {
            return res.status(500).json({ error: err, message: "Internal Server Error!" });
        } else {
            
            // extract form data from the request body
            const { files, ...others } = req.body;
            const data = JSON.parse(others.data)
            data.clinician_id = req._id

            try{
                const newEntry = new Patient(data);
    
                const savedPatient = await newEntry.save();
                return res.status(200).json(savedPatient);

            }catch(err){
                return res.status(500).json({ error: err, message: "Internal Server Error!" });
            }
  
        }
        });
    
    } catch (err) {
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
    }
}
);

module.exports = router;