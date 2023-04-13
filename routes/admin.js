const router = require("express").Router();
const User = require("../models/User");
const Request = require("../models/Request");
const Hospital = require("../models/Hospital");
const Role = require("../models/Role");
const Option = require("../models/Option");
const { authenticateToken, checkPermissions} = require("../middleware/auth");
const emailService = require("../utils/emailService");
const bcrypt = require("bcrypt");

require("dotenv").config();

// get all requests
router.get("/requests", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [100])){
    return res.status(401).json({ message: "Unauthorized access"});
  }

  try {
    const requests = await Request.find(
      {},
      { _id: true, username: true, reg_no: true, hospital: true}
    );
    return res.status(200).json(requests);

  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// get one request
router.get("/requests/:id", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [100])){
    return res.status(401).json({ message: "Unauthorized access"});
  }

  try {
    const request = await Request.findById(req.params.id);

    if (request) {
      request.password = undefined;
      return res.status(200).json(request);
    } else {
      return res.status(404).json({ message: "Request not found" });
    }

  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// reject a request
router.post("/requests/:id", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [100])){
    return res.status(401).json({ message: "Unauthorized access"});
  }

  try {
    const request = await Request.findById(req.params.id);

    if (request) {
      try {
        await Request.findByIdAndDelete(req.params.id);

        emailService
          .sendEmail(request.email, "REJECT", req.body.reason, request.username)
          .then((response) => {
            res.status(200).json({ message: "Request has been deleted!" });
          })
          .catch((error) => {
            res.status(200).json({
              message:
                "Request has been deleted! Error: Email notification Failed",
            });
            return res.status(200).json(others);
          });
      } catch (error) {
        return res.status(500).json({ message: "Request deletion failed" });
      }
    } else {
      return res.status(404).json({ message: "Request not found" });
    }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// accept a requests
router.post("/accept/:id", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [100])){
    return res.status(401).json({ message: "Unauthorized access"});
  }

  try {
    const request = await Request.findById(req.params.id);

    if (request) {
      const regno = await User.findOne({ reg_no: request.reg_no });
      if (regno) {
        return res.status(401).json({ message: "Reg No already in use" });
      }

      const user = await User.findOne({ email: request.email });
      if (user) {
        return res.status(401).json({ message: "Email address already in use" });
      }

      const newUser = new User({
        username: req.body.username? req.body.username: request.username,
        email: request.email,
        password: request.password,
        reg_no: request.reg_no,
        role: req.body.role,
        hospital: request.hospital,
        designation: request.designation ? req.body.designation : "",
        contact_no: request.contact_no ? req.body.contact_no : "",
        availability: true
      });

      try {
        const adduser = await newUser.save();
        const { password, ...others } = adduser._doc;
        await Request.findByIdAndDelete(req.params.id);

        emailService
          .sendEmail(request.email, "ACCEPT", req.body.reason, request.username)
          .then((response) => {
            others["message"] = "User registration successful!";
            return res.status(200).json(others);
          })
          .catch((error) => {
            others["message"] =
              "User registration successful! Error: Email notification Failed. ";
            return res.status(200).json(others);
          });
      } catch (error) {
        return res.status(500).json({ message: "User registration failed" });
      }
    } else {
      return res.status(404).json({ message: "Request not found" });
    }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// get users by the roles
// only for read or write access permissions
router.get("/users/role/:role", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [106, 107])){
    return res.status(401).json({ message: "Unauthorized access"});
  }
  
  try {
    if(req.params.role === "All"){
      const users = await User.find(
        {},
        { username: 1, _id: 1, reg_no: 1, hospital:1, role: 1 }
      );
      return res.status(200).json(users);
    }else{
      const users = await User.find(
        { role: req.params.role },
        { username: 1, _id: 1, reg_no: 1, hospital:1, role: 1 }
      );
      return res.status(200).json(users);
    }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// get all the user roles
router.get("/roles", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [106, 107, 100, 109])){
    return res.status(401).json({ message: "Unauthorized access"});
  }
  
  try {
      const users = await Role.find();
      return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// get one user role
router.get("/roles/:id", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [109])){
    return res.status(401).json({ message: "Unauthorized access"});
  }
  
  try {
      const role = await Role.findById(req.params.id);
      if(role){
        return res.status(200).json(role);
      }else{
        return res.status(404).json({ message: "Role not found"});
      }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// add a new user role
router.post("/roles", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [109])){
    return res.status(401).json({ message: "Unauthorized access"});
  }
  
  try {

    //case insensitive search
    const role = await Role.findOne({role: {$regex: `^${req.body.role}$`, $options: "i"}});
    
    if(!role){

      const newRole = new Role({
        role: req.body.role,
        permissions: req.body.permissions
      });
  
      try {
        const addrole = await newRole.save();
        return res.status(200).json({ message: "New role added successfully"});
      }catch(err){
        return res.status(500).json({ message: "New role insertion failed" });
      }


    }else{
        return res.status(401).json({message:"Role already exists"});
    }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// update user permissions
router.post("/roles/:id", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [109])){
    return res.status(401).json({ message: "Unauthorized access"});
  }
  
  try {

    //case insensitive search
    const role = await Role.findById(req.params.id);
    
    if(role){
      try {
        const update = await Role.findOneAndUpdate(
          { _id: req.params.id },
          {
            role: req.body.role,
            permissions: req.body.permissions,
          }
        );
        return res.status(200).json({ message: "Role updated successfully"});
      }catch(err){
        return res.status(500).json({ message: "Role updation failed" });
      }


    }else{
        return res.status(404).json({message:"Role not found"});
    }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// get a specific user
router.get("/users/:id", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [106, 107])){
    return res.status(401).json({ message: "Unauthorized access"});
  }

  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.password = undefined;
      return res.status(200).json(user);
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// update users
router.post("/update/user/:id", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [107])){
    return res.status(401).json({ message: "Unauthorized access"});
  }

  try {
    let user = await User.findById(req.params.id);

    if (user) {
      try {
        const update = await User.findOneAndUpdate(
          { _id: req.params.id },
          {
            username: req.body.username,
            role: req.body.role,
          }
        );

        user = await User.findById(req.params.id);

        const { password, ...others } = user._doc;
        others["message"] = "User details updated succesfully";
        return res.status(200).json(user);
      } catch (error) {
        return res.status(500).json({ message: "User details update failed" });
      }
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// delete a user
router.post("/delete/user/:id", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [107])){
    return res.status(401).json({ message: "Unauthorized access"});
  }

  try {
    let user = await User.findById(req.params.id);
    if (user) {
      try {
        await User.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "User deleted successfully" });
      } catch (error) {
        return res.status(500).json({ message: "User deletion failed" });
      }
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// reset user password
router.post("/reset/user/:id", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [107])){
    return res.status(401).json({ message: "Unauthorized access"});
  }

  try {
    let user = await User.findById(req.params.id);
    if (user) {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const update = await User.findOneAndUpdate(
          { _id: req.params.id },
          {
            password: hashedPassword,
          }
        );

        return res.status(200).json({ message: "User password reseted successfully" });
      } catch (error) {
        return res.status(500).json({ message: "User deletion failed" });
      }
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// add hospitals
router.post("/hospital", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [101])){
    return res.status(401).json({ message: "Unauthorized access"});
  }

  try {
    let hospital = await Hospital.findOne({ name: req.body.name });

    if (!hospital) {
      try {
        const newHospital = new Hospital({
          name: req.body.name,
          category: req.body.category,
          city: req.body.city,
          address: req.body.address,
          contact_no: req.body.contact_no
        });

        const addHospital = await newHospital.save();

        return res.status(200).json({ message: "Hospital is added successfully!" });
      } catch (error) {
        return res.status(500).json({ message: "Hospital details update failed" });
      }
    } else {
      return res.status(401).json({ message: "Hospital is already added" });
    }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// update hospital details
router.post("/hospitals/update/:id", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [101])){
    return res.status(401).json({ message: "Unauthorized access"});
  }

  try {
    const hospital = await Hospital.findById({_id: req.params.id});
    if (hospital) {
      try {
        const update = await User.findOneAndUpdate(
          {_id: req.params.id},
          {
            name: req.body.name,
            category: req.body.category,
            city: req.body.city,
            address: req.body.address? req.body.address: "",
            contact_no: req.body.contact_no ? req.body.contact_no:""
          }
        );

        return res.status(200).json({ message: "Hospital details updated successfully!" });
      } catch (error) {
        return res.status(500).json({ message: "Hospital details update failed" });
      }

    } else {
      return res.status(401).json({ message: "Hospital Not Found" });
    }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// delete a hospital
router.post("/hospitals/delete/:id", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [101])){
    return res.status(401).json({ message: "Unauthorized access"});
  }

  try {
    const hospital = Hospital.findById(req.params.id);
    if (hospital) {
      try {
        await Hospital.deleteOne({_id: req.params.id});
        return res.status(200).json({ message: "Hospital deleted successfully" });
      } catch (e) {
        return res.status(500).json({ message: "Hospital deletion failed" });
      }
    } else {
      return res.status(404).json({ message: "Hospital not found" });
    }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});


// get hospital details
router.get("/hospitals/:id", authenticateToken, async (req, res) => {

  if(!checkPermissions(req.permissions, [101])){
    return res.status(401).json({ message: "Unauthorized access"});
  }
  
  try {
      const hospital = await Hospital.findById(req.params.id);
      if(!hospital){
        return res.status(404).json({ message: `Hospital not found`});
      }else{
        return res.status(200).json(hospital);
      }
  } catch (err) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

// get options (labels and values)
router.get("/option/:name", authenticateToken, async (req, res) => {  
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

// only to add options by tech team
router.post("/option", async (req, res) => {
  try {
    const option = await Option.findOne({name: {$regex: `^${req.body.name}$`, $options: "i"}});
    
    if (option) {
      return res.status(401).json({ message: "Option already exists" });

    } else {
     
      try{
        const newOption = new Option({
          name: req.body.name,
          options: req.body.options,
        });
        const saveOption = await newOption.save();
        res.status(200).json({message:"Option is saved"});
      }catch(err){
        return res.status(500).json({ error: err, message: "Internal Server Error!" });
      }
      
      
    }
  } catch (error) {
    return res.status(500).json({ error: err, message: "Internal Server Error!" });
  }
});

module.exports = router;
