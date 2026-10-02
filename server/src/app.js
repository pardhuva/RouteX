const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const driverRoutes = require("./routes/driver.routes");
const rideRoutes = require("./routes/ride.routes");
const paymentRoutes = require("./routes/payment.routes");
const adminRoutes = require("./routes/admin.routes");
const supportRoutes = require("./routes/support.routes");
const healthRoutes = require("./routes/health.routes");
const { requestTimer } = require("./middleware/observability.middleware");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const app = express();

app.use(cors());
app.use(requestTimer);
app.use(express.json());

// Routes
app.use("/api/health", healthRoutes);
app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/support", supportRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
