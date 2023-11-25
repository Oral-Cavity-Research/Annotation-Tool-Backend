const router = require("express").Router();
const DBUser = require("../models/DBUser");
const DownloadSession = require("../models/DownloadSession");
const emailService = require("../utils/emailService");
const bcrypt = require("bcrypt");
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

require("dotenv").config();

function generateRandomPassword(length) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

router.post("/session", async (req, res) => {
  try {
    // check creds
    const user = await DBUser.findOne({email:req.body.email})
    if (!user) {
      console.log("User not found");
      return res.status(400).json({ message: "Credentials mismatched" });

    }

    const validate = await bcrypt.compare(req.body.passkey, user.passkey);
    if (!validate){
      console.log("Passkey mismatched");
      return res.status(400).json({ message: "Credentials mismatched" });
    }


    // creds okay
    // Generate a random UUID
    const sessionId = uuidv4();

    // Set expiration time to 24 hours from now
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 24);

    // Create a new DownloadSession document
    const downloadSession = new DownloadSession({
      email: req.body.email,
      sessionId,
      expirationTime,
    });

    // Save the document to the database
    await downloadSession.save();

    // Return the generated UUID to the user
    res.status(201).json({ sessionId });
  } catch (error) {
    console.error("Error creating download session:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/download",async(req,res)=>{
  const sessionID = req.query.sessionID;
  console.log(sessionID);
  // Check if sessionID is provided
  if (!sessionID) {
    return res.status(400).json({ error: "Session ID is required" });
  }
  
  // Find the session in the database
  const downloadSession = await DownloadSession.findOne({ sessionId: sessionID });
  
  // Check if the session exists
  if (!downloadSession) {
    return res.status(404).json({ error: "Session not found" });
  }
  
  // Check if the session has expired
  const currentTime = new Date();
  if (currentTime > downloadSession.expirationTime) {
    return res.status(401).json({ error: "Session has expired" });
  }

  // Increment the numDownloads field
  await DownloadSession.findOneAndUpdate(
    { sessionId: sessionID },
    { $inc: { numDownloads: 1 } },
    { new: true } 
  );
  
  
  const fileName = req.query.fileName;
  let filePath;
  switch(fileName){
    case "Healthy.zip":
      filePath = 'Storage/dataset/Healthy.zip';
      break;
    case "Benign.zip":
      filePath = 'Storage/dataset/Benign.zip';
      break;
    case "OPMD.zip":
      filePath = 'Storage/dataset/OPMD.zip';
      break;
    case "OCA.zip":
      filePath = 'Storage/dataset/OCA.zip';
      break;
    case "Annotation.json":
      filePath = 'Storage/dataset/annotationToolDB.images.json';
      break;
    case "Patientwise_data.csv":
      filePath = 'Storage/dataset/Patientwise_Data.xlsx';
      break;
    case "Imagewise_data.csv":
      filePath = 'Storage/dataset/Imagewise_Data.xlsx';
      break;
    default:
      return res.status(404).json({ message: "File not found" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'application/zip', // Set the appropriate content type
      'Content-Disposition': `attachment; filename="${fileName}"`,
    };

    res.writeHead(206, headers);
    file.pipe(res);
  } else {
    const headers = {
      'Content-Length': fileSize,
      'Content-Type': 'application/zip', // Set the appropriate content type
      'Content-Disposition': `attachment; filename="${fileName}"`,
    };

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  }
})

// accept a requests
router.post("/agreement", async (req, res) => {

  try {

      const user = await DBUser.findOne({email:req.body.email})

      if (user) {
        return res.status(200).json({ message: "User exists" });
      }

      const passkey = generateRandomPassword(12);
      const salt = await bcrypt.genSalt(10);
      const hashedPasskey = await bcrypt.hash(passkey, salt);

      const newUser = new DBUser({
        full_name: req.body.fullName,
        email: req.body.email,
        affiliation: req.body.affiliation,
        purpose: req.body.purpose,
        passkey: hashedPasskey
      });

      const adduser = await newUser.save();

      emailService
        .sendPasskey(req.body.email, req.body.fullName, passkey)
        .then(async (response) => {
          return res.status(200).json({message: "User registered"});
        })
        .catch((error) => {
          console.log(error)
          return res.status(500).json({ message: "User registration failed" });
        });
  
    } catch (error) {
      console.log(error)
      return res.status(500).json({ message: "User registration failed" });
    }
});

module.exports = router;
