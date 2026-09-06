const DEFAULT_SERVICE_FOR_FAULT = {
  db_disconnect: "DynamoDB",
  db_latency: "DynamoDB",
  api_error: "API",
  dependency_timeout: "Worker",
  service_unhealthy: "EC2",
};

class FaultController {
  constructor() {
    this.enabled = process.env.FAULT_INJECTION_ENABLED === "true";
    this.state = {
      dbDisconnect: false,
      dbLatencyMs: 0,
      apiErrors: {},
      dependencyTimeoutMs: 0,
      serviceUnhealthy: false,
      targetService: null,
      serviceFaults: {
        EC2: [],
        DynamoDB: [],
        Auth: [],
        Worker: [],
        API: [],
        Application: [],
      },
    };
  }

  getStatus() {
    // Enrich the status with telemetry metadata for the RCA platform
    const telemetryContext = {};
    if (this.state.dbDisconnect) telemetryContext["db_disconnect"] = { metric: "DatabaseConnectionState", value: 0 };
    if (this.state.dbLatencyMs > 0) telemetryContext["db_latency"] = { metric: "DatabaseQueryLatency", value: this.state.dbLatencyMs };
    if (this.state.dependencyTimeoutMs > 0) telemetryContext["dependency_timeout"] = { metric: "DependencyLatency", value: this.state.dependencyTimeoutMs };
    if (this.state.serviceUnhealthy) telemetryContext["service_unhealthy"] = { metric: "ServiceHealthState", value: 0 };
    
    Object.keys(this.state.apiErrors).forEach(ep => {
      telemetryContext[`api_error:${ep}`] = { metric: "5xxErrorRate", value: 100.0 };
    });

    return {
      injectionEnabled: this.enabled,
      activeFaults: this.state,
      telemetryContext,
      targetService: this.state.targetService,
      serviceFaults: this.state.serviceFaults,
      availableTargetServices: ["EC2", "DynamoDB", "Auth", "Worker", "API", "Application"],
      timestamp: new Date().toISOString(),
    };
  }

  _recordServiceFault(service, faultName, isEnabled) {
    if (!this.state.serviceFaults[service]) {
      this.state.serviceFaults[service] = [];
    }
    if (isEnabled) {
      if (!this.state.serviceFaults[service].includes(faultName)) {
        this.state.serviceFaults[service].push(faultName);
      }
    } else {
      this.state.serviceFaults[service] = this.state.serviceFaults[service].filter(
        (f) => f !== faultName
      );
    }
  }

  inject(type, payload = {}) {
    const targetService = payload.targetService || DEFAULT_SERVICE_FOR_FAULT[type] || "API";
    this.state.targetService = targetService;

    switch (type) {
      case "db_disconnect":
        this.state.dbDisconnect = Boolean(payload.enabled !== false);
        this._recordServiceFault(targetService, "db_disconnect", this.state.dbDisconnect);
        break;

      case "db_latency":
        this.state.dbLatencyMs = Number(payload.delayMs) || 0;
        this._recordServiceFault(targetService, "db_latency", this.state.dbLatencyMs > 0);
        break;

      case "api_error":
        if (payload.endpoint) {
          if (payload.enabled === false) {
            delete this.state.apiErrors[payload.endpoint];
            this._recordServiceFault(targetService, `api_error:${payload.endpoint}`, false);
          } else {
            this.state.apiErrors[payload.endpoint] = {
              statusCode: Number(payload.statusCode) || 500,
              message: payload.message || "Simulated API Internal Server Error (Fault Injected)",
              targetService,
            };
            this._recordServiceFault(targetService, `api_error:${payload.endpoint}`, true);
          }
        }
        break;

      case "dependency_timeout":
        this.state.dependencyTimeoutMs = Number(payload.delayMs) || 0;
        this._recordServiceFault(targetService, "dependency_timeout", this.state.dependencyTimeoutMs > 0);
        break;

      case "service_unhealthy":
        this.state.serviceUnhealthy = Boolean(payload.enabled !== false);
        this._recordServiceFault(targetService, "service_unhealthy", this.state.serviceUnhealthy);
        break;

      default:
        throw new Error(`Unknown fault type: ${type}`);
    }
    return this.getStatus();
  }

  reset() {
    this.state = {
      dbDisconnect: false,
      dbLatencyMs: 0,
      apiErrors: {},
      dependencyTimeoutMs: 0,
      serviceUnhealthy: false,
      targetService: null,
      serviceFaults: {
        EC2: [],
        DynamoDB: [],
        Auth: [],
        Worker: [],
        API: [],
        Application: [],
      },
    };
    return this.getStatus();
  }

  isDbDisconnected() {
    return this.enabled && this.state.dbDisconnect;
  }

  getDbLatency() {
    return this.enabled ? this.state.dbLatencyMs : 0;
  }

  getApiError(endpoint) {
    if (!this.enabled) return null;
    return this.state.apiErrors[endpoint] || null;
  }

  getDependencyTimeout() {
    return this.enabled ? this.state.dependencyTimeoutMs : 0;
  }

  isServiceUnhealthy() {
    return this.enabled && this.state.serviceUnhealthy;
  }
}

const instance = new FaultController();
module.exports = instance;
