const router = require("express").Router();
const DBUser = require("../models/DBUser");
const emailService = require("../utils/emailService");
const bcrypt = require("bcrypt");

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

router.post("/download",async(req,res)=>{
  const user = await DBUser.findOne({email:req.body.email})
  if (!user) {
    return res.status(400).json({ message: "Credentials mismatched" });

  }

  const validate = await bcrypt.compare(req.body.passkey, user.passkey);
  if (!validate)
  return res.status(400).json({ message: "Credentials mismatched" });

  switch(req.body.type){
    case "Healthy.zip":
      return res.download('Storage/dataset/Healthy.zip');
    case "Benign.zip":
      return res.download('Storage/dataset/Benign.zip');
    case "OPMD.zip":
      return res.download('Storage/dataset/OPMD.zip');
    case "OCA.zip":
      return res.download('Storage/dataset/OCA.zip');
    case "Annotation.json":
      return res.download('Storage/dataset/annotationToolDB.images.json');
    case "Patientwise_data.csv":
      return res.download('Storage/dataset/Patientwise_Data.xlsx');
    case "Imagewise_data.csv":
      return res.download('Storage/dataset/Imagewise_Data.xlsx');
    default:
      return res.status(404).json({ message: "File not found" });
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
