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
      detailRealisasi: [[Boolean]],
      fileGsPath: String,
      fileName: String,
      approved: Boolean,
      catatan: String,
    },
    perhitunganPerformanceTest: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [[Boolean]],
      fileGsPath: String,
      fileName: String,
      approved: Boolean,
      catatan: String,
    },
    pemodelan: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [[Boolean]],
      fileGsPath: String,
      fileName: String,
      approved: Boolean,
      catatan: String,
    },
    heatRateAnalysis: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [[Boolean]],
      fileGsPath: String,
      fileName: String,
      approved: Boolean,
      catatan: String,
    },
    auxiliaryPowerAnalysis: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [[Boolean]],
      fileGsPath: String,
      fileName: String,
      approved: Boolean,
      catatan: String,
    },
    rekomendasi: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [[Boolean]],
      fileGsPath: String,
      fileName: String,
      approved: Boolean,
      catatan: String,
    },
    pelaporanEfisiensi: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [[Boolean]],
      fileGsPath: String,
      fileName: String,
      approved: Boolean,
      catatan: String,
    },
    monitoringPostProgram: {
      target: Number,
      realisasi: Number,
      detailRealisasi: [[Boolean]],
      fileGsPath: String,
      fileName: String,
      approved: Boolean,
      catatan: String,
    },
    averageTarget: Number,
    averageRealisasi: Number,
  },
  {
    timestamps: true,
  }
);

maturityLevelSchema.index({ semester: 1, tahun: 1, upk: 1 }, { unique: true });

const MaturityLevel = mongoose.model('MaturityLevel', maturityLevelSchema);

module.exports = MaturityLevel;
