const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const DownloadSessionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    unique: true,
    required: true
  },
  expirationTime: {
    type: Date,
    required: true
  },
  numDownloads: {
    type: Number,
    default: 0  
  }
});

module.exports = mongoose.model("DownloadSession", DownloadSessionSchema, "downloadsessions");