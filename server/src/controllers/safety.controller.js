const safetyService = require("../services/safety.service");

async function triggerSafetyAlert(req, res, next) {
  try {
    const { id: rideId } = req.params;
    const { alertType, description } = req.body;

    const alert = await safetyService.triggerSafetyAlert({
      rideId,
      riderUser: req.user,
      alertType,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Safety alert triggered. Operations team has been notified.",
      data: { alert },
    });
  } catch (err) {
    next(err);
  }
}

async function confirmSafety(req, res, next) {
  try {
    const { id: rideId } = req.params;

    const alert = await safetyService.confirmSafety({
      rideId,
      riderUser: req.user,
    });

    res.status(200).json({
      success: true,
      message: "Safety check-in recorded. Glad you reached safely!",
      data: { alert },
    });
  } catch (err) {
    next(err);
  }
}

async function getRideSafetyStatus(req, res, next) {
  try {
    const { id: rideId } = req.params;
    const status = await safetyService.getRideSafetyStatus(rideId, req.user);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (err) {
    next(err);
  }
}

async function getAdminSafetyAlerts(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    const result = await safetyService.getSafetyAlertsForAdmin({ status, page, limit });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

async function getAdminSafetyAlertById(req, res, next) {
  try {
    const { alertId } = req.params;
    const alert = await safetyService.getSafetyAlertById(alertId);

    res.status(200).json({
      success: true,
      data: { alert },
    });
  } catch (err) {
    next(err);
  }
}

async function resolveSafetyAlert(req, res, next) {
  try {
    const { alertId } = req.params;
    const { status, resolutionNotes } = req.body;

    const alert = await safetyService.resolveSafetyAlert(alertId, req.user, {
      status,
      resolutionNotes,
    });

    res.status(200).json({
      success: true,
      message: "Safety alert updated successfully.",
      data: { alert },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  triggerSafetyAlert,
  confirmSafety,
  getRideSafetyStatus,
  getAdminSafetyAlerts,
  getAdminSafetyAlertById,
  resolveSafetyAlert,
};
