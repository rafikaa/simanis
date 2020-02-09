const mongoose = require('mongoose');

const { Schema } = mongoose;

const laporanSchema = new Schema(
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

laporanSchema.index({ gsPath: 1 }, { unique: true });
laporanSchema.index({ upk: 1 });
laporanSchema.index({ name: 1 }, { unique: true });

const Laporan = mongoose.model('Laporan', laporanSchema);

module.exports = Laporan;
