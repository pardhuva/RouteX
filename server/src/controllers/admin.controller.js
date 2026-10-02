const adminService = require("../services/admin.service");

async function getOverview(_req, res, next) {
  try {
    const data = await adminService.getPlatformOverview();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

async function getRides(req, res, next) {
  try {
    const data = await adminService.getAllRides(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

async function getDrivers(req, res, next) {
  try {
    const data = await adminService.getAllDrivers(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

async function getRiders(req, res, next) {
  try {
    const data = await adminService.getAllRiders(req.query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

async function getFleetMap(_req, res, next) {
  try {
    const drivers = await adminService.getLiveFleetMap();
    res.status(200).json({
      success: true,
      data: { drivers },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOverview,
  getRides,
  getDrivers,
  getRiders,
  getFleetMap,
};
