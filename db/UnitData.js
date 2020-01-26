const mongoose = require('mongoose');

const { Schema } = mongoose;

const unitDataSchema = new Schema(
  {
    upk: {
      type: String,
      required: true,
    },
    ulpl: {
      type: String,
      required: true,
    },
    tahunPembuatan: {
      type: Number,
      required: true,
    },
    statusUnit: {
      type: String,
      required: true,
    },
    dayaPasok: {
      type: Number,
      required: true,
    },
    dayaNetto: {
      type: Number,
      required: true,
    },
    manufaktur: {
      type: String,
      required: true,
    },
    tipeMesin: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const UnitData = mongoose.model('UnitData', unitDataSchema);

module.exports = UnitData;
