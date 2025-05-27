const router = require("express").Router();
const Option = require("../models/Option");
const { authenticateToken, checkPermissions} = require("../middleware/auth");

require("dotenv").config();

// get options (labels and values)
router.get("/:name", authenticateToken, async (req, res) => {  
  try {
      const options = await Option.findOne({name: {$regex: `^${req.params.name}$`, $options: "i"}});
      if(!options){
        return res.status(404).json({ message: `${req.params.name} not found`});
      }else{
        return res.status(200).json(options);
      }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// get list of options
router.post("/get", authenticateToken, async (req, res) => {  
  try {
      const options = await Option.find();
      return res.status(200).json(options);
      
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// add new options
router.post("/add/:name", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [100])){
    return res.status(401).json({ message: "Unauthorized access"});
  }
  
  try {
    const option = await Option.findOne({name: {$regex: `^${req.params.name}$`, $options: "i"}});
    
    if (!option) {
      // return res.status(401).json({message: "Option does not exists" });
      const newOption = new Option({
                  name: req.params.name,
                  options: [{
                    label: req.body.label, 
                    value: req.body.label,
                    description:req.body.description,
                    active: true
                  }]
                });
      
                try{
                  const savedOption = await newOption.save();
                  res.status(200).json({ message: "Option saved successfully" });
                }catch(err){
                  res.status(500).json({message: "Optiona saving failed" });
                }


    } else {

      if(option.options.some(item => item.label.toUpperCase() === req.body.label.toUpperCase())){
        return res.status(401).json({message: "Option already exists" });
      }

      option.options.push({
        label: req.body.label, 
        value: req.body.label,
        description:req.body.description,
        active: true
      })

      option.save();
      return res.status(200).json({ message: "Option saved successfully" });
    }
  } catch (error) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});


// update options
router.post("/update/:name", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [100])){
    return res.status(401).json({ message: "Unauthorized access"});
  }
  try {
    const option = await Option.findOne({name: {$regex: `^${req.params.name}$`, $options: "i"}});
    
    if (!option) {
      return res.status(401).json({message: "Option does not exists" });
    } else {

      const updated = await Option.findOneAndUpdate({name: req.params.name},{
        options: req.body.options
      })

      
      return res.status(200).json({ message: "Option saved successfully" });
    }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

module.exports = router;
