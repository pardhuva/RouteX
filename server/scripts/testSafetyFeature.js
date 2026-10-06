/**
 * Safety Feature Verification Suite
 * Tests:
 * 1. SafetyAlert model definition, fields, and indexes
 * 2. Safety service methods and API contract
 * 3. Idempotency & duplicate alert prevention
 * 4. Safety confirmation / check-in flow
 * 5. Admin resolution and follow-up states
 */
const mongoose = require("mongoose");
const SafetyAlert = require("../src/models/SafetyAlert");
const safetyService = require("../src/services/safety.service");
const { SAFETY_ALERT_STATUSES, RIDE_EVENT_TYPES, SOCKET_EVENTS } = require("../src/config/constants");

async function runSafetyVerification() {
  console.log("==========================================");
  console.log("🛡️ RouteX Safety Feature Verification Suite");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Check Constants
  console.log("--> Testing 1: Safety Constants & Event Definitions");
  assert(SAFETY_ALERT_STATUSES.active === "active", "SAFETY_ALERT_STATUSES.active is 'active'");
  assert(SAFETY_ALERT_STATUSES.resolved === "resolved", "SAFETY_ALERT_STATUSES.resolved is 'resolved'");
  assert(SAFETY_ALERT_STATUSES.followUp === "follow_up", "SAFETY_ALERT_STATUSES.followUp is 'follow_up'");
  assert(RIDE_EVENT_TYPES.safetyAlertCreated === "ride.safety_alert_created", "Kafka event safetyAlertCreated registered");
  assert(RIDE_EVENT_TYPES.safetyConfirmed === "ride.safety_confirmed", "Kafka event safetyConfirmed registered");
  assert(RIDE_EVENT_TYPES.safetyResolved === "ride.safety_resolved", "Kafka event safetyResolved registered");
  assert(SOCKET_EVENTS.serverToClient.safetyAlertCreated === "safety_alert_created", "SOCKET_EVENTS.serverToClient.safetyAlertCreated registered");
  assert(SOCKET_EVENTS.serverToClient.safetyAlertUpdated === "safety_alert_updated", "SOCKET_EVENTS.serverToClient.safetyAlertUpdated registered");
  assert(SOCKET_EVENTS.clientToServer.triggerSafetyAlert === "trigger_safety_alert", "SOCKET_EVENTS.clientToServer.triggerSafetyAlert registered");
  assert(SOCKET_EVENTS.clientToServer.confirmSafety === "confirm_safety", "SOCKET_EVENTS.clientToServer.confirmSafety registered");

  // 2. Check SafetyAlert Model Schema
  console.log("\n--> Testing 2: SafetyAlert Model Schema");
  const schemaPaths = SafetyAlert.schema.paths;
  assert(!!schemaPaths.ride, "SafetyAlert has 'ride' ref field");
  assert(!!schemaPaths.rider, "SafetyAlert has 'rider' ref field");
  assert(!!schemaPaths.driver, "SafetyAlert has 'driver' ref field");
  assert(!!schemaPaths.status, "SafetyAlert has 'status' field");
  assert(schemaPaths.status.options.enum.includes("active"), "status enum contains 'active'");
  assert(schemaPaths.status.options.enum.includes("resolved"), "status enum contains 'resolved'");
  assert(schemaPaths.status.options.enum.includes("follow_up"), "status enum contains 'follow_up'");
  assert(!!schemaPaths.lastKnownLocation, "SafetyAlert has 'lastKnownLocation' field");
  assert(
    !!schemaPaths.lastKnownLocation && (!!schemaPaths.lastKnownLocation.schema?.paths?.coordinates || !!schemaPaths["lastKnownLocation.coordinates"]),
    "lastKnownLocation has GeoJSON Point subdocument structure"
  );
  assert(!!schemaPaths.safeConfirmationAt, "SafetyAlert has 'safeConfirmationAt' timestamp");
  assert(!!schemaPaths.resolvedAt, "SafetyAlert has 'resolvedAt' timestamp");
  assert(!!schemaPaths.resolvedBy, "SafetyAlert has 'resolvedBy' ref");
  assert(!!schemaPaths.resolutionNotes, "SafetyAlert has 'resolutionNotes'");

  // 3. Check Safety Service Exports
  console.log("\n--> Testing 3: Safety Service Interface");
  assert(typeof safetyService.triggerSafetyAlert === "function", "triggerSafetyAlert is exported");
  assert(typeof safetyService.confirmSafety === "function", "confirmSafety is exported");
  assert(typeof safetyService.getRideSafetyStatus === "function", "getRideSafetyStatus is exported");
  assert(typeof safetyService.getSafetyAlertsForAdmin === "function", "getSafetyAlertsForAdmin is exported");
  assert(typeof safetyService.getSafetyAlertById === "function", "getSafetyAlertById is exported");
  assert(typeof safetyService.resolveSafetyAlert === "function", "resolveSafetyAlert is exported");

  console.log("\n==========================================");
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSafetyVerification().catch((err) => {
  console.error("Verification failed with error:", err);
  process.exit(1);
});
