const driverEarningsService = require("../services/driverEarnings.service");

async function getEarningsSummary(req, res, next) {
  try {
    const summary = await driverEarningsService.getDriverEarningsSummary(req.user._id);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
}

async function getWeeklyPayouts(req, res, next) {
  try {
    const payouts = await driverEarningsService.getDriverWeeklyPayouts(req.user._id);
    res.status(200).json({
      success: true,
      data: payouts,
    });
  } catch (err) {
    next(err);
  }
}

async function getCompletedRideLogs(req, res, next) {
  try {
    const { timeframe, page, limit } = req.query;
    const logs = await driverEarningsService.getDriverCompletedRideLogs(req.user._id, {
      timeframe,
      page,
      limit,
    });
    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEarningsSummary,
  getWeeklyPayouts,
  getCompletedRideLogs,
};
