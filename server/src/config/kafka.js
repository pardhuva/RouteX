const { Kafka, logLevel } = require("kafkajs");

const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",").map((broker) => broker.trim());

// kafkajs has its own internal logger (connection retries, broker metadata,
// etc.) that's noisy by default. This project does its own structured
// logging at each meaningful operation instead (see kafkaProducer.js and
// consumers/rideEventConsumer.js: "producer connected", "event published",
// "event consumed", ...), so kafkajs' own logger is silenced here to avoid
// duplicate, harder-to-read output.
const kafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || "routex-backend",
  brokers,
  logLevel: logLevel.NOTHING,
  retry: {
    initialRetryTime: 300,
    retries: 3,
  },
  requestTimeout: 5000,
};

// Add SASL authentication if username and password are provided (required for Cloud Kafka like Upstash)
if (process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD) {
  kafkaConfig.ssl = true;
  kafkaConfig.sasl = {
    mechanism: "scram-sha-256",
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  };
}

const kafka = new Kafka(kafkaConfig);

module.exports = { kafka };
