const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    telecon_entry_id: {
      type: mongoose.Types.ObjectId,
      ref: "TeleConEntry",
      required: true,
    },
    report_name: {
      type: String,
      default: "",
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("Report", ReportSchema, "reports");
