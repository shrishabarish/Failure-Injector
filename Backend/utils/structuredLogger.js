const Log = require("../models/LogModel");
const http = require("http");
const url = require("url");

// RCA Webhook: fire-and-forget POST to CloudLens RCA platform
const RCA_WEBHOOK_URL = process.env.RCA_WEBHOOK_URL || null;

function sendToRcaWebhook(logEntry) {
  if (!RCA_WEBHOOK_URL) return;
  try {
    const parsed = url.parse(RCA_WEBHOOK_URL);
    const postData = JSON.stringify(logEntry);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        "X-Source-App": "aws-failure-codereview",
      },
      timeout: 3000,
    };
    const req = http.request(options, () => {});
    req.on("error", () => {}); // silent: RCA platform may be down
    req.on("timeout", () => req.destroy());
    req.write(postData);
    req.end();
  } catch (_) {}
}

const structuredLogger = {
  log: async ({
    level = "INFO",
    event,
    module = "APP",
    action = "",
    userId = "ANONYMOUS",
    requestId = "N/A",
    correlationId = "N/A",
    latencyMs = null,
    errorType = null,
    errorMessage = null,
    isFaultInjected = false,
    details = {},
  }) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service: "code-review-backend",
      environment: process.env.APP_ENV || "local",
      level,
      event,
      module,
      action,
      user_id: userId,
      request_id: requestId,
      correlation_id: correlationId,
      latency_ms: latencyMs,
      error_type: errorType,
      error_message: errorMessage,
      is_fault_injected: isFaultInjected,
      details,
    };

    if (level === "ERROR" || level === "CRITICAL") {
      console.error(JSON.stringify(logEntry));
    } else if (level === "WARN") {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }

    // Push ERROR/CRITICAL/WARN telemetry to RCA platform webhook
    if (level === "ERROR" || level === "CRITICAL" || level === "WARN") {
      sendToRcaWebhook(logEntry);
    }

    try {
      if (Log && Log.create) {
        await Log.create({
          userId: String(userId),
          action: action || event,
          module,
          details: { ...details, requestId, correlationId, errorType, errorMessage, isFaultInjected },
        });
      }
    } catch (err) {}

    return logEntry;
  },

  info: (params) => structuredLogger.log({ ...params, level: "INFO" }),
  warn: (params) => structuredLogger.log({ ...params, level: "WARN" }),
  error: (params) => structuredLogger.log({ ...params, level: "ERROR" }),
};

module.exports = structuredLogger;
