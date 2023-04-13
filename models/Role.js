const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
    },
    permissions: {
      type: Array,
      default:[],
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("Role", RoleSchema, 'roles');
