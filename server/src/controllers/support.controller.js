const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");
const supportService = require("../services/support.service");

async function reportIncident(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array().map((e) => ({ field: e.path, message: e.msg })));
    }

    const incident = await supportService.reportIncident(req.user, req.body);

    res.status(201).json({
      success: true,
      message: "Incident report submitted successfully. Our Trust & Safety team is reviewing it.",
      data: { incident },
    });
  } catch (err) {
    next(err);
  }
}

async function getMyIncidents(req, res, next) {
  try {
    const incidents = await supportService.getMyIncidents(req.user);

    res.status(200).json({
      success: true,
      data: { incidents },
    });
  } catch (err) {
    next(err);
  }
}

async function getAllIncidents(req, res, next) {
  try {
    const { incidents, pagination } = await supportService.getAllIncidents(req.query);

    res.status(200).json({
      success: true,
      data: { incidents, pagination },
    });
  } catch (err) {
    next(err);
  }
}

async function resolveIncident(req, res, next) {
  try {
    const incident = await supportService.resolveIncident(req.params.id, req.user, req.body);

    res.status(200).json({
      success: true,
      message: "Incident report updated successfully",
      data: { incident },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  reportIncident,
  getMyIncidents,
  getAllIncidents,
  resolveIncident,
};
