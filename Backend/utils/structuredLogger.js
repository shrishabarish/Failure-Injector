const Log = require("../models/LogModel");
const { CloudWatchClient, PutMetricDataCommand } = require("@aws-sdk/client-cloudwatch");

// Initialize CloudWatch Client
// It automatically uses credentials from environment variables, ~/.aws/credentials, or IAM roles
const cwClient = new CloudWatchClient({ region: process.env.AWS_REGION || "eu-north-1" });

async function sendToCloudWatch(logEntry) {
  try {
    // Extract the Target Service (EC2, DynamoDB, Auth, Worker, API, or Application)
    const targetService = (logEntry.details && logEntry.details.targetService) || logEntry.module || "Application";
    const faultType = logEntry.event || "Unknown";

    const params = {
      Namespace: "ChaosLab/Faults",
      MetricData: [
        {
          MetricName: logEntry.is_fault_injected ? "FaultInjected" : "ServiceError",
          Value: 1,
          Unit: "Count",
          Dimensions: [
            { Name: "TargetService", Value: targetService },
            { Name: "FaultType", Value: faultType }
          ],
          Timestamp: new Date(logEntry.timestamp)
        }
      ]
    };
    
    const command = new PutMetricDataCommand(params);
    await cwClient.send(command);
  } catch (error) {
    console.error("[CloudWatch PutMetricData Error]:", error.message);
  }
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

    // Enrich logs with telemetry data if a fault is injected
    if (isFaultInjected && details.type) {
      logEntry.event_type = details.type;
      
      switch (details.type) {
        case "db_disconnect":
          logEntry.metric = "DatabaseConnectionState";
          logEntry.value = 0; // 0 implies down
          logEntry.severity = "HIGH";
          break;
        case "db_latency":
          logEntry.metric = "DatabaseQueryLatency";
          logEntry.value = details.payload?.delayMs || 4000;
          logEntry.severity = "MEDIUM";
          break;
        case "api_error":
          logEntry.metric = "5xxErrorRate";
          logEntry.value = 100.0;
          logEntry.severity = "CRITICAL";
          break;
        case "dependency_timeout":
          logEntry.metric = "DependencyLatency";
          logEntry.value = details.payload?.delayMs || 8000;
          logEntry.severity = "HIGH";
          break;
        case "service_unhealthy":
          logEntry.metric = "ServiceHealthState";
          logEntry.value = 0; // 0 implies unhealthy
          logEntry.severity = "CRITICAL";
          break;
      }
    }

    if (level === "ERROR" || level === "CRITICAL") {
      console.error(JSON.stringify(logEntry));
    } else if (level === "WARN") {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }

    // Push ERROR/CRITICAL/WARN telemetry to AWS CloudWatch
    if (level === "ERROR" || level === "CRITICAL" || level === "WARN") {
      sendToCloudWatch(logEntry);
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
