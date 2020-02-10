const mongoose = require('mongoose');

const { Schema } = mongoose;

const maturityLevelSchema = new Schema(
  {
    semester: {
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
    pengumpulanDataEfisiensi: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [{
        type: Boolean,
        required: true,
      }],
    },
    perhitunganPerformanceTest: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [{
        type: Boolean,
        required: true,
      }],
    },
    pemodelan: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [{
        type: Boolean,
        required: true,
      }],
    },
    heatRateAnalysis: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [{
        type: Boolean,
        required: true,
      }],
    },
    auxiliaryPowerAnalysis: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [{
        type: Boolean,
        required: true,
      }],
    },
    rekomendasi: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [{
        type: Boolean,
        required: true,
      }],
    },
    pelaporanEfisiensi: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [{
        type: Boolean,
        required: true,
      }],
    },
    monitoringPostProgram: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [{
        type: Boolean,
        required: true,
      }],
    },
    averageTarget: Number,
    averageRealisasi: Number,
  },
  {
    timestamps: true,
  }
);

maturityLevelSchema.index({ semester: 1, tahun: 1, upk: 1 }, { unique: true });

const MaturityLevel = mongoose.model(
  'MaturityLevel',
  maturityLevelSchema
);

module.exports = MaturityLevel;
