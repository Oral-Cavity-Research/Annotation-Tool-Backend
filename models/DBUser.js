const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    affiliation: {
      type: String,
      default: "",
    },
    passkey: {
      type: String,
      default: "",
    }
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("DBUser", UserSchema, "dbusers");
