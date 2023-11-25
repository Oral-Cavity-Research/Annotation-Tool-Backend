const express = require("express");
const router = express.Router();
const Image = require("../models/Image");
const jwt = require("jsonwebtoken");
const { authenticateDatasetViewToken } = require("../middleware/auth");
const DBUser = require("../models/DBUser");
const bcrypt = require("bcrypt");

router.get("/filterimages", authenticateDatasetViewToken, async (req, res) => {
  try {
    // get the category and the page number , and the limit
    const { category, page, limit } = req.query;

    //store the filteredImages here
    let filteredImages;

    //calculate the skip value
    const skip = page && page * 1 > 0 ? (page - 1) * limit : 0;
    // const skip = (page - 1) * limit;

    if (category.toLowerCase() !== "all") {
      filteredImages = await Image.find({
        category: { $regex: `^${category}$`, $options: "i" },
        is_public: true
      })
        .skip(skip)
        .limit(limit)
        .populate('patient');
    } else {
      filteredImages = await Image.find({is_public: true}).skip(skip).limit(limit).populate('patient');
    }

    // console.log(req.query);
    return res.status(200).json(filteredImages);
  } catch (err) {
    return res.status(404).json({ error: err, message: "Unknown category!" });
  }
});

router.get("/count", authenticateDatasetViewToken, async (req, res) => {
  try {
    //get the category
    const { category } = req.query;

    //store the image count here
    let imageCount;

    // Create a case-insensitive regular expression for the category
    const regex = new RegExp(category, "i");

    if (category.toLowerCase() !== "all") {
      // Count the total number of matching images
      imageCount = await Image.countDocuments({ category: regex, is_public: true});
    } else {
      // Count the total number of matching images
      imageCount = await Image.countDocuments({is_public: true});
    }

    //return the image count
    return res.status(200).json(imageCount);
  } catch (err) {
    return res.status(404).json({ error: err, message: "Unknown category!" });
  }
});

router.post("/view/access", async (req, res) => {
  try {
    const user = await DBUser.findOne({email:req.body.email})
    if (!user) {
      return res.status(400).json({ message: "Credentials mismatched" });

    }

    const validate = await bcrypt.compare(req.body.passkey, user.passkey);
    if (!validate)
    return res.status(400).json({ message: "Credentials mismatched" });

    const accessToken = jwt.sign(
      { sub: user.email},
      process.env.ACCESS_SECRET,
      { expiresIn: process.env.REFRESH_TIME }
    );

    res.status(200).json({accessToken:accessToken})

  }catch(err){
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

module.exports = router;
