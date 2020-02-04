const mongoose = require('mongoose');

const { Schema } = mongoose;

const ownUsageSchema = new Schema(
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
    jenisPembangkit: {
      type: String,
      required: true,
    },
    produksiBruto: {
      type: Number,
      required: true,
    },
    pemakaianSendiri: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ownUsageSchema.index({ bulan: 1, tahun: 1, upk: 1, ulpl: 1 }, { unique: true });

const OwnUsage = mongoose.model('OwnUsage', ownUsageSchema);

module.exports = OwnUsage;
