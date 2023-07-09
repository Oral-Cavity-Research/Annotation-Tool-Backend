const router = require("express").Router();
const request = require('request');

require("dotenv").config();

router.post('/classify', function(req, res) {  
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
