const mongoose = require('mongoose');

const { Schema } = mongoose;

const nphrAnalysisSchema = new Schema(
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
    parameters: [
      {
        name: String,
        baseline: Number,
        actual: Number,
        deviasiHeatRate: Number,
        costBenefit: Number,
      },
    ],
    harga: {
      type: Number,
      required: true,
    },
    kalorJenis: {
      type: Number,
      required: true,
    },
    rerataProduksiHarian: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const NPHRAnalysis = mongoose.model('NPHRAnalysis', nphrAnalysisSchema);

module.exports = NPHRAnalysis;
