// this will act as a log for all the reviews made by reviewers on respective patients
const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    telecon_entry_id: {
      type: mongoose.Types.ObjectId,
      ref: "TeleConEntry",
      required: true,
    },
    reviewer_id: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provisional_diagnosis: {
      type: String,
      default: "",
    },
    management_suggestions: {
      type: String,
      default: "",
    },
    referral_suggestions: {
      type: String,
      default: "",
    },
    other_comments: {
      type: String,
      default: "",
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("Review", ReviewSchema, "reviews");
