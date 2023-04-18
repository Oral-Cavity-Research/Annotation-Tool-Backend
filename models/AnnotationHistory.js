const mongoose = require('mongoose');

const AnnotationHistorySchema = new mongoose.Schema({
    annotator:{
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
    },
    image:{
        type: mongoose.Types.ObjectId,
        ref: "Image",
        required: true,
    },
    action: {
        type: String,
        default:""
    },
    title:{
        type: String,
        default:""
    },
    comment:{
        type: String,
        default:""
    } 
},
{
    versionKey: false,
    timestamps:true
}
);

module.exports = mongoose.model("AnnotationHistory",AnnotationHistorySchema,"annotationhistory")