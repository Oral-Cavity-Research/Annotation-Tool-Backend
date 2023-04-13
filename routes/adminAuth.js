const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcrypt");

// only to add initial admin
// admin sign up
router.post("/signup", async (req, res) => {
  try {
    const username = await User.findOne({ username: req.body.username });
    const useremail = await User.findOne({ email: req.body.email });

    if (username) {
      res.status(401).json({ message: "User name is taken" });
    } else if (useremail) {
      res.status(401).json({ message: "The email address is already in use" });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      const newUser = new User({
        reg_no: req.body.reg_no,
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        hospital: req.body.hospital,
        role: "System Admin",
      });
      const user = await newUser.save();
      const { password, ...others } = user._doc;
      others["message"] = "Successfully signed in";
      res.status(200).json(others);
    }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

module.exports = router;
