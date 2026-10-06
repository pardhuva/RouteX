const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");
const authService = require("../services/auth.service");

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array().map((e) => ({ field: e.path, message: e.msg })));
    }

    const { user, token } = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array().map((e) => ({ field: e.path, message: e.msg })));
    }

    const { user, token } = await authService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await authService.getProfile(req.user._id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array().map((e) => ({ field: e.path, message: e.msg })));
    }

    const user = await authService.updateProfile(req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getProfile, updateProfile };
