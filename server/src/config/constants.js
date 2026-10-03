const DRIVER_SEARCH_RADIUS_METERS = Number(process.env.DRIVER_SEARCH_RADIUS_METERS) || 30000;

// Driver status/location change every time a ride starts, ends, or a
// location ping comes in — a long TTL would let a stale "available" outlive
// the driver actually going busy. Kept short and configurable rather than
// hardcoded so it can be tuned without touching code.
const REDIS_DRIVER_TTL_SECONDS = Number(process.env.REDIS_DRIVER_TTL_SECONDS) || 30;

// A ride's live driver-location stream (Day 6) needs to survive brief gaps
// between socket updates but should self-clean if a ride's socket flow is
// ever abandoned (app crash, driver never reconnects) — a sliding TTL
// refreshed on every update, rather than tied to the ride's own lifecycle.
const REDIS_RIDE_LOCATION_TTL_SECONDS = Number(process.env.REDIS_RIDE_LOCATION_TTL_SECONDS) || 120;

// Key names centralized here so every service that touches Redis agrees on
// the same naming scheme instead of duplicating string literals.
const REDIS_KEYS = {
  driverStatus: (userId) => `driver:status:${userId}`,
  driversGeoSet: "drivers:geo",
  // Deliberately a *separate* key from driversGeoSet: that set's invariant
  // (Day 4) is "only currently-matchable available drivers" — a driver on
  // an active ride is "busy" and must stay out of it. This key instead
  // tracks "where is the driver on ride X right now", independent of
  // matchability, keyed per ride rather than per driver.
  rideDriverLocation: (rideId) => `ride:${rideId}:driver-location`,
};

// Centralized here for the same reason as REDIS_KEYS above: every producer/
// consumer that touches Kafka agrees on one topic name and one consumer
// group id instead of duplicating string literals.
//
// payment-events is a separate topic from ride-events, not reused, even
// though every payment belongs to exactly one ride: payments are a distinct
// domain (their own state machine, their own lifecycle, their own future
// growth — refunds, retries, multiple providers) that happens to reference
// a ride, the same way an order-service's events stay on their own topic
// even though every order references a customer. Splitting by domain now
// means a future payment-only consumer (e.g. a reconciliation job) can
// subscribe to payment-events without also receiving every ride.* event.
const KAFKA_TOPICS = {
  rideEvents: "ride-events",
  paymentEvents: "payment-events",
};

// A consumer group is how Kafka tracks "how far has this logical consumer
// read" (its committed offsets) and how it would split partitions across
// multiple consumer processes sharing the same group id, if more than one
// were running. RouteX runs a single consumer for ride-events, but naming the
// group now means scaling to several consumer instances later needs no
// code change — they'd just join this same group and Kafka would divide
// the topic's partitions between them automatically.
const KAFKA_CONSUMER_GROUP = process.env.KAFKA_CONSUMER_GROUP || "routex-ride-consumers";

// A separate consumer group from KAFKA_CONSUMER_GROUP above — payments and
// ride-lifecycle processing are independent concerns and should be able to
// fail, restart, or scale without affecting each other's offsets.
const PAYMENT_CONSUMER_GROUP = process.env.PAYMENT_CONSUMER_GROUP || "routex-payment-consumers";

// Event *names* describe something that already happened (past tense),
// deliberately distinct from the *command* endpoints that triggered them
// (e.g. the command is "PATCH /rides/:id/accept", the resulting event is
// "ride.accepted"). See ride.service.js and README "Command vs Event".
const RIDE_EVENT_TYPES = {
  requested: "ride.requested",
  accepted: "ride.accepted",
  started: "ride.started",
  completed: "ride.completed",
  cancelled: "ride.cancelled",
};

const PAYMENT_EVENT_TYPES = {
  created: "payment.created",
  success: "payment.success",
  failed: "payment.failed",
};

// Fare is deliberately simple and fully backend-controlled — see
// services/fare.service.js. Configurable via .env rather than hardcoded so
// pricing can be tuned without a code change, same reasoning as
// DRIVER_SEARCH_RADIUS_METERS above.
// Vehicle Tiers with transparent, affordable market rates (Rapido / Uber pricing structure)
const VEHICLE_TIERS = {
  bike: {
    id: "bike",
    name: "RouteX Moto",
    category: "bike",
    capacity: "1 seat",
    baseFare: 15,
    perKm: 5.5,
    perMinute: 0.2,
    minFare: 20,
    tagline: "Fastest solo rides, beat traffic",
    etaMins: 2,
    badge: "Budget Solo",
  },
  auto: {
    id: "auto",
    name: "RouteX Auto",
    category: "auto",
    capacity: "3 seats",
    baseFare: 25,
    perKm: 8.5,
    perMinute: 0.3,
    minFare: 30,
    tagline: "Affordable, doorstep 3-wheeler",
    etaMins: 3,
    badge: "Popular",
  },
  car: {
    id: "car",
    name: "RouteX Go",
    category: "car",
    capacity: "4 seats",
    baseFare: 35,
    perKm: 11.5,
    perMinute: 0.5,
    minFare: 45,
    tagline: "Comfortable AC compact hatchback",
    etaMins: 4,
    badge: "Best Value",
  },
  sedan: {
    id: "sedan",
    name: "RouteX Premier",
    category: "car",
    capacity: "4 seats",
    baseFare: 50,
    perKm: 14.0,
    perMinute: 0.6,
    minFare: 60,
    tagline: "Spacious sedans & top rated drivers",
    etaMins: 5,
    badge: "Premium",
  },
  suv: {
    id: "suv",
    name: "RouteX XL",
    category: "car",
    capacity: "6 seats",
    baseFare: 75,
    perKm: 17.0,
    perMinute: 0.8,
    minFare: 90,
    tagline: "Extra legroom & large luggage",
    etaMins: 6,
    badge: "6 Seater",
  },
};

const FARE_CONFIG = {
  baseFare: Number(process.env.FARE_BASE) || 50,
  perKm: Number(process.env.FARE_PER_KM) || 15,
  perMinute: Number(process.env.FARE_PER_MINUTE) || 2,
};

// RouteX Driver Commission Split: 80% to driver, 20% platform service fee
const DRIVER_COMMISSION_RATE = Number(process.env.DRIVER_COMMISSION_RATE) || 0.8;

const PAYOUT_STATUSES = {
  pending: "pending",
  processing: "processing",
  settled: "settled",
};

const PAYMENT_CURRENCY = process.env.PAYMENT_CURRENCY || "INR";

// Dynamic Expanding Radius Matching Tiers (3km -> 7km -> 15km)
const MATCHING_RADIUS_TIERS = [3000, 7000, 15000];
const TIER_EXPANSION_DELAY_MS = Number(process.env.TIER_EXPANSION_DELAY_MS) || 15000;

// Client->server and server->client socket event names, centralized for the
// same reason as the Kafka/Redis constants above — one name per concept,
// agreed on by every file that emits or listens for it.
const SOCKET_EVENTS = {
  clientToServer: {
    joinRide: "join_ride",
    driverLocationUpdate: "driver_location_update",
  },
  serverToClient: {
    rideJoined: "ride_joined",
    rideStatusUpdated: "ride_status_updated",
    driverLocationUpdated: "driver_location_updated",
    paymentStatusUpdated: "payment_status_updated",
    matchingRadiusExpanded: "matching_radius_expanded",
    // Pushed to a specific driver's personal room (`driver:<userId>`, see
    // config/socket.js) when they're the nearest-match candidate for a new
    // ride — the piece Day 6 originally left advisory-only/frontend-only.
    // Unlike the other events above, this isn't broadcast to a *ride* room
    // (the driver hasn't accepted, so isn't a participant yet).
    newRideRequest: "new_ride_request",
    rideError: "ride_error",
  },
};

module.exports = {
  DRIVER_SEARCH_RADIUS_METERS,
  MATCHING_RADIUS_TIERS,
  TIER_EXPANSION_DELAY_MS,
  REDIS_DRIVER_TTL_SECONDS,
  REDIS_RIDE_LOCATION_TTL_SECONDS,
  REDIS_KEYS,
  KAFKA_TOPICS,
  KAFKA_CONSUMER_GROUP,
  PAYMENT_CONSUMER_GROUP,
  RIDE_EVENT_TYPES,
  PAYMENT_EVENT_TYPES,
  VEHICLE_TIERS,
  FARE_CONFIG,
  DRIVER_COMMISSION_RATE,
  PAYOUT_STATUSES,
  PAYMENT_CURRENCY,
  SOCKET_EVENTS,
};

