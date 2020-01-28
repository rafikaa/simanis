const mongoose = require('mongoose');

const { Schema } = mongoose;

const nphrSchema = new Schema(
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
    bahanBakar: [
      {
        jenis: {
          type: String,
          required: true,
        },
        volume: {
          type: Number,
          required: true,
        },
        kalorJenis: {
          type: Number,
          required: true,
        },
      },
    ],
    totalKalori: {
      type: Number,
      required: true,
    },
    produksiNetto: {
      type: Number,
      required: true,
    },
    NPHR: {
      type: Number,
      required: true,
    },
    targetNPHR: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const NPHR = mongoose.model('NPHR', nphrSchema);

module.exports = NPHR;
