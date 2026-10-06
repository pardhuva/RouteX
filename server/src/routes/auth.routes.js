const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const { authLimiter } = require("../middleware/rateLimit.middleware");

const router = express.Router();

const authenticate = require("../middleware/auth.middleware");

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email address"),
    body("phone")
      .matches(/^[0-9]{10}$/)
      .withMessage("Phone number must be a valid 10-digit number"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").isIn(["rider", "driver"]).withMessage("Role must be 'rider' or 'driver'"),
  ],
  authController.register
);

router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  authController.login
);

router.get("/profile", authenticate, authController.getProfile);

router.patch(
  "/profile",
  authenticate,
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("phone")
      .optional()
      .matches(/^[0-9]{10}$/)
      .withMessage("Phone number must be a valid 10-digit number"),
  ],
  authController.updateProfile
);

module.exports = router;

