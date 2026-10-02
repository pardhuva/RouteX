const express = require("express");
const { body } = require("express-validator");
const supportController = require("../controllers/support.controller");
const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.use(authenticate);

router.post(
  "/report",
  [
    body("rideId").isMongoId().withMessage("Valid ride ID is required"),
    body("category")
      .isIn([
        "driver_behavior",
        "rash_driving",
        "overcharging",
        "vehicle_condition",
        "lost_item",
        "emergency_safety",
        "rider_escaped_unpaid",
        "other",
      ])
      .withMessage("Invalid incident category"),
    body("description").trim().isLength({ min: 5, max: 2000 }).withMessage("Description must be between 5 and 2000 characters"),
    body("urgency").optional().isIn(["low", "medium", "high", "critical"]),
  ],
  supportController.reportIncident
);

router.get("/my-tickets", supportController.getMyIncidents);

// Admin-only endpoints
router.get("/admin/tickets", requireRole("admin"), supportController.getAllIncidents);
router.patch("/admin/tickets/:id", requireRole("admin"), supportController.resolveIncident);

module.exports = router;
