const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reporterRole: {
      type: String,
      enum: ["rider", "driver"],
      required: true,
    },
    category: {
      type: String,
      enum: [
        "driver_behavior",
        "rash_driving",
        "overcharging",
        "vehicle_condition",
        "lost_item",
        "emergency_safety",
        "rider_escaped_unpaid",
        "other",
      ],
      required: true,
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["open", "investigating", "resolved", "dismissed"],
      default: "open",
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
    resolution: {
      type: String,
      trim: true,
      default: "",
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
  },
  { timestamps: true }
);

incidentSchema.index({ ride: 1 });
incidentSchema.index({ reporter: 1, createdAt: -1 });
incidentSchema.index({ status: 1, urgency: 1 });

module.exports = mongoose.model("Incident", incidentSchema);
