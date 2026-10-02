// Seeds a fixed set of simulated demo drivers for portfolio/demo use, so a
// rider can be matched, accepted, and driven around without a second
// (real) driver session running — see services/driverSimulationService.js
// for how a ride actually gets auto-accepted once one of these is matched.
//
// Idempotent by design: every driver here is upserted by email, so running
// this script again (after a restart, or just to be safe) updates their
// status/location/rating back to the demo defaults instead of creating
// duplicates.
//
// Run from server/:  npm run seed:drivers

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../src/models/User");
const Driver = require("../src/models/Driver");
const Vehicle = require("../src/models/Vehicle");

const SALT_ROUNDS = 10;
// Demo-only credential — these accounts exist to be auto-accepted by
// driverSimulationService, not to be logged into, but a real password is
// still set (rather than a random/invalid one) so they remain ordinary,
// loggable driver accounts if this project later moves away from
// simulation and someone wants to drive one manually.
const SIMULATED_DRIVER_PASSWORD = "Secret123!";

// Coordinates cluster around the same demo city center used everywhere
// else in this project (client/src/components/MapView.jsx's
// DEMO_CITY_CENTER) so a rider using either their real browser location (if
// testing from that area) or the map placeholder's default view always has
// a simulated driver within DRIVER_SEARCH_RADIUS_METERS — spread out by a
// few hundred meters each, deliberately not identical, so matching picks
// among genuinely distinct nearest-candidates instead of an arbitrary tie.
const SAMPLE_DRIVERS = [
  {
    name: "Srinivas Rao",
    email: "srinivas.sim@routex.demo",
    phone: "9000000001",
    vehicleType: "car",
    brand: "Maruti Suzuki",
    model: "Dzire",
    registrationNumber: "TS09UB1001",
    rating: 4.9,
    coordinates: [72.5714, 23.0225],
  },
  {
    name: "Venkateswara Rao",
    email: "venkateswara.sim@routex.demo",
    phone: "9000000002",
    vehicleType: "car",
    brand: "Tata",
    model: "Nexon EV",
    registrationNumber: "TS07UA1002",
    rating: 4.95,
    coordinates: [72.575, 23.026],
  },
  {
    name: "Venkat Ramana",
    email: "venkat.sim@routex.demo",
    phone: "9000000003",
    vehicleType: "auto",
    brand: "Bajaj",
    model: "RE Auto",
    registrationNumber: "TS11AB1003",
    rating: 4.9,
    coordinates: [72.568, 23.019],
  },
  {
    name: "Sai Teja",
    email: "saiteja.sim@routex.demo",
    phone: "9000000004",
    vehicleType: "car",
    brand: "Hyundai",
    model: "i20",
    registrationNumber: "TS08EV1004",
    rating: 4.8,
    coordinates: [72.573, 23.027],
  },
  {
    name: "Nagaraju Varma",
    email: "nagaraju.sim@routex.demo",
    phone: "9000000005",
    vehicleType: "bike",
    brand: "Honda",
    model: "Activa",
    registrationNumber: "TS10BK1005",
    rating: 4.7,
    coordinates: [72.569, 23.025],
  },
  {
    name: "Chaitanya Krishna",
    email: "chaitanya.sim@routex.demo",
    phone: "9000000006",
    vehicleType: "car",
    brand: "Honda",
    model: "Amaze",
    registrationNumber: "TS09UB1006",
    rating: 4.85,
    coordinates: [72.576, 23.021],
  },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB. Seeding simulated demo drivers & rider...\n");

  const hashedPassword = await bcrypt.hash(SIMULATED_DRIVER_PASSWORD, SALT_ROUNDS);

  // Also ensure demo rider exists for one-click test in Login page
  const riderPassword = await bcrypt.hash("Password123!", SALT_ROUNDS);
  let demoRider = await User.findOne({ $or: [{ email: "rider@demo.com" }, { phone: "9888888888" }] });
  if (!demoRider) {
    demoRider = await User.create({
      name: "Sandeep Rao",
      email: "rider@demo.com",
      phone: "9888888888",
      password: riderPassword,
      role: "rider",
    });
    console.log("Created demo rider: Sandeep Rao (rider@demo.com)");
  } else {
    demoRider.name = "Sandeep Rao";
    demoRider.email = "rider@demo.com";
    demoRider.phone = "9888888888";
    demoRider.password = riderPassword;
    demoRider.role = "rider";
    await demoRider.save();
    console.log("Updated demo rider: Sandeep Rao (rider@demo.com)");
  }

  for (const d of SAMPLE_DRIVERS) {
    let user = await User.findOne({ $or: [{ email: d.email }, { phone: d.phone }] });
    if (!user) {
      user = await User.create({
        name: d.name,
        email: d.email,
        phone: d.phone,
        password: hashedPassword,
        role: "driver",
      });
      console.log(`Created user: ${d.name} (${d.email})`);
    } else {
      user.name = d.name;
      user.email = d.email;
      user.phone = d.phone;
      user.password = hashedPassword;
      user.role = "driver";
      await user.save();
      console.log(`User updated/confirmed: ${d.name} (${d.email})`);
    }

    let vehicle = await Vehicle.findOne({ registrationNumber: d.registrationNumber });
    let driver = await Driver.findOne({ user: user._id });

    if (!driver) {
      driver = await Driver.create({
        user: user._id,
        status: "available",
        isSimulated: true,
        rating: d.rating,
        currentLocation: { type: "Point", coordinates: d.coordinates },
      });
    } else {
      driver.status = "available";
      driver.isSimulated = true;
      driver.rating = d.rating;
      driver.currentLocation = { type: "Point", coordinates: d.coordinates };
    }

    if (!vehicle) {
      vehicle = await Vehicle.create({
        driver: driver._id,
        vehicleType: d.vehicleType,
        brand: d.brand,
        model: d.model,
        registrationNumber: d.registrationNumber,
      });
    }
    driver.vehicle = vehicle._id;
    await driver.save();

    console.log(`  -> ${d.brand} ${d.model} (${d.registrationNumber}), rating ${d.rating}, status AVAILABLE\n`);
  }

  console.log(`Done. ${SAMPLE_DRIVERS.length} simulated demo drivers are AVAILABLE and ready to be matched.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
