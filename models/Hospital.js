const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    category:{
        type: String,
        default: ""
    },
    city:{
        type: String,
        default: ""
    },
    address:{
        type: String,
        default: ""
    },
    contact_no:{
        type: String,
        default: ""
    }
},
{
    versionKey: false,
    timestamps:true
}
);

module.exports = mongoose.model("Hospital",HospitalSchema,"hospitals")