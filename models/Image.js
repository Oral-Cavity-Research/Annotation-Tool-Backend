const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema(
  {
    telecon_entry_id: {
      type: mongoose.Types.ObjectId,
      ref: "TeleConEntry",
      required: true,
    },
    image_name: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    clinical_diagnosis: {
      type: String,
      default: "",
    },
    lesions_appear: {
      type: Boolean,
      default: false,
    },
    annotation: {
      type: Array,
      default: [],
    },
    annotators: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User'
    }],
    predicted_cat: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "New",
    },
    last_comment:{
      type: mongoose.Types.ObjectId,
      ref: "AnnotationHistory",
    }
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("Image", ImageSchema, "images");
