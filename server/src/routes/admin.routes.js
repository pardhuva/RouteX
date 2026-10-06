const express = require("express");
const adminController = require("../controllers/admin.controller");
const safetyController = require("../controllers/safety.controller");
const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.use(authenticate);
router.use(requireRole("admin"));

router.get("/overview", adminController.getOverview);
router.get("/rides", adminController.getRides);
router.get("/drivers", adminController.getDrivers);
router.get("/riders", adminController.getRiders);
router.get("/fleet-map", adminController.getFleetMap);

// Safety Monitoring & Emergency Operations
router.get("/safety-alerts", safetyController.getAdminSafetyAlerts);
router.get("/safety-alerts/:alertId", safetyController.getAdminSafetyAlertById);
router.patch("/safety-alerts/:alertId/resolve", safetyController.resolveSafetyAlert);

module.exports = router;

