const mongoose = require('mongoose');

const AssignentSchema = new mongoose.Schema({
    reviewer_id:{
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
    },
    telecon_entry: {
        type: mongoose.Types.ObjectId,
        ref: "TeleConEntry",
        required: true,
    },
    checked:{
        type: Boolean,
        default:false
    },
    reviewed:{
        type: Boolean,
        default:false
    }
},
{
    versionKey: false,
    timestamps:true
}
);

module.exports = mongoose.model("Assignment",AssignentSchema,"assignments")