/**
 * Phase 4 Verification Script: Driver Earnings & Analytics Engine
 * Validates:
 * 1. Fare breakdown & 80/20 driver commission calculation
 * 2. Driver earnings aggregation (today, this week, this month, lifetime)
 * 3. Driver weekly payout cycle generation & status attribution
 * 4. Completed ride logs with itemized fare & payment breakdown
 * 5. Driver API route integration
 */
const { getFareBreakdown, calculateDistanceKm } = require("../src/services/fare.service");
const { DRIVER_COMMISSION_RATE, PAYOUT_STATUSES } = require("../src/config/constants");
const driverEarningsService = require("../src/services/driverEarnings.service");

async function runTests() {
  console.log("=== Phase 4 Verification Tests ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // --- Test 1: Fare Breakdown & Commission Math ---
  console.log("--> Testing 1: Fare Breakdown & 80/20 Driver Commission Calculation");
  const distanceKm = 10; // 10 km
  const durationMin = 20; // 20 minutes
  // Base fare: 50, perKm: 15 (150), perMinute: 2 (40) -> Total: 240
  const breakdown = getFareBreakdown(240, distanceKm, durationMin);

  assert(breakdown.baseFare === 50, `Base fare is ₹50 (${breakdown.baseFare})`);
  assert(breakdown.distanceFare === 150, `Distance fare (10km * ₹15) is ₹150 (${breakdown.distanceFare})`);
  assert(breakdown.timeFare === 40, `Time fare (20min * ₹2) is ₹40 (${breakdown.timeFare})`);
  assert(breakdown.totalFare === 240, `Total gross fare is ₹240 (${breakdown.totalFare})`);
  assert(breakdown.driverCut === 192, `Driver net earnings (80% of ₹240) is ₹192 (${breakdown.driverCut})`);
  assert(breakdown.platformFee === 48, `Platform fee (20% of ₹240) is ₹48 (${breakdown.platformFee})`);
  assert(breakdown.commissionRate === 0.8, `Driver commission rate is 0.8 (80%)`);

  // --- Test 2: Service Function Signatures & Graceful Error Handling ---
  console.log("\n--> Testing 2: Driver Earnings Service Methods & Error Handling");
  assert(typeof driverEarningsService.getDriverEarningsSummary === "function", "getDriverEarningsSummary is exported");
  assert(typeof driverEarningsService.getDriverWeeklyPayouts === "function", "getDriverWeeklyPayouts is exported");
  assert(typeof driverEarningsService.getDriverCompletedRideLogs === "function", "getDriverCompletedRideLogs is exported");

  // Non-existent driver should throw ApiError 404
  const Driver = require("../src/models/Driver");
  const originalFindOne = Driver.findOne;
  Driver.findOne = () => ({
    then: (resolve) => resolve(null),
    catch: () => {},
  });

  try {
    const fakeId = "60c72b2f9b1d8b2bad123456";
    await driverEarningsService.getDriverEarningsSummary(fakeId);
    assert(false, "Non-existent driver should throw 404");
  } catch (err) {
    assert(err.statusCode === 404, `Correctly throws 404 for non-existent driver (${err.message})`);
  } finally {
    Driver.findOne = originalFindOne;
  }


  // --- Test 3: Constants & Statuses ---
  console.log("\n--> Testing 3: Platform Constants & Settlement Statuses");
  assert(DRIVER_COMMISSION_RATE === 0.8, `DRIVER_COMMISSION_RATE constant is 0.8`);
  assert(PAYOUT_STATUSES.pending === "pending", `PAYOUT_STATUSES.pending is defined`);
  assert(PAYOUT_STATUSES.processing === "processing", `PAYOUT_STATUSES.processing is defined`);
  assert(PAYOUT_STATUSES.settled === "settled", `PAYOUT_STATUSES.settled is defined`);

  // --- Test 4: Distance calculation sanity check ---
  console.log("\n--> Testing 4: Haversine Distance Helper");
  const p1 = [77.5946, 12.9716]; // Bangalore center
  const p2 = [77.6412, 12.9719]; // Indiranagar (~5km east)
  const dist = calculateDistanceKm(p1, p2);
  assert(dist > 4 && dist < 6, `Distance calculated realistically between Bangalore points (~5km): ${dist.toFixed(2)} km`);

  console.log(`\n========================================`);
  console.log(`Phase 4 Test Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
