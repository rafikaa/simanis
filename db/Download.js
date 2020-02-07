const mongoose = require('mongoose');

const { Schema } = mongoose;

const downloadSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    gsPath: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

downloadSchema.index({ name: 1 }, { unique: true });

const Download = mongoose.model('Download', downloadSchema);

module.exports = Download;
