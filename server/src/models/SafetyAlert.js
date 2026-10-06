const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  { _id: false }
);

const safetyAlertSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true,
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "resolved", "follow_up"],
      default: "active",
      index: true,
    },
    alertType: {
      type: String,
      enum: ["rider_unsafe", "sos", "route_deviation", "safety_checkin_missed"],
      default: "rider_unsafe",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    lastKnownLocation: {
      type: pointSchema,
      default: null,
    },
    safeConfirmationAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index to quickly look up active alerts for a ride and prevent duplicates
safetyAlertSchema.index({ ride: 1, status: 1 });
safetyAlertSchema.index({ createdAt: -1 });

module.exports = mongoose.model("SafetyAlert", safetyAlertSchema);
