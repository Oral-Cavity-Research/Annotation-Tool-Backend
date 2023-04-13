const mongoose = require("mongoose");

const TeleConEntrySchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    clinician_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    complaint: {
      type: String,
      default: "",
    },
    start_time: {
      type: Date,
      default: Date.now(),
    },
    end_time: {
      type: Date,
      default: Date.now(),
    },
    findings: {
      type: String,
      default: "",
    },
    current_habits: {
      type: Array,
      default: [],
    },
    updated:{
      type: Boolean,
      default:false
    },
    reviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }]
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("TeleConEntry", TeleConEntrySchema, "teleconentries");
