const mongoose = require("mongoose");

const studyPlanSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true
    },

    goal: {
      type: String,
      required: true,
      trim: true
    },

    days: {
      type: Number,
      required: true,
      min: 1
    },

    plan: {
      type: String,
      required: true
    },

    completedDays: {
      type: [Number],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const StudyPlan = mongoose.model("StudyPlan", studyPlanSchema);

module.exports = StudyPlan;