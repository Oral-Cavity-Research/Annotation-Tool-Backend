const mongoose = require("mongoose");

const OptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    options: {
      type: Array,
      default: [],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("Option", OptionSchema,"options");
