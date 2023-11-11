const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    reg_no: {
      type: String,
      required: true,
      unique: true,
    },
    designation: {
      type: String,
      default: "",
    },
    contact_no: {
      type: String,
      default: "",
    },
    picture: {
      type: String,
      default: "",
    },
    availability: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema, "users");
