const mongoose = require('mongoose');

const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    bulan: {
      type: Number,
      required: true,
    },
    tahun: {
      type: Number,
      required: true,
    },
    upk: {
      type: String,
      required: true,
    },
    ulpl: {
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

reportSchema.index({ gsPath: 1 }, { unique: true });
reportSchema.index({ upk: 1 });
reportSchema.index({ name: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
