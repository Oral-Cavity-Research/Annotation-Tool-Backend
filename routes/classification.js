const router = require("express").Router();
const request = require('request');
const { authenticateToken, checkPermissions } = require("../middleware/auth");

require("dotenv").config();

router.post('/classify', authenticateToken, function(req, res) {

  if(!checkPermissions(req.permissions, [100])){
    return res.status(401).json({ message: "Unauthorized access"});
  }

  request({
      url: process.env.ML_BACKEND + "classify",
      method: "POST",
      json: true,   // <--Very important!!!
      body: req.body
  }, function (error, response, body){
    if(error){
      res.status(500).json({message:"ML Server Error"});
    }else{
      res.status(200).json(body);
    }
  });    
});

module.exports = router;
