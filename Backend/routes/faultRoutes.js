const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const faultController = require("../utils/faultController");
const structuredLogger = require("../utils/structuredLogger");

function verifyFaultAdmin(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  const expectedKey = process.env.ADMIN_API_KEY || "admin-fault-injection-secret-key";

  if (apiKey && apiKey === expectedKey) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret_key");
      req.user = decoded;
    } catch (e) {
      // Token expired or invalid, proceed to role/key check
    }
  }

  if (req.user && (req.user.role === "ADMIN" || req.user.role === "admin")) {
    return next();
  }

  return res.status(403).json({
    error: "Forbidden",
    message: "Fault injection endpoints require administrative authorization (x-api-key or ADMIN token)",
  });
}

router.get("/status", verifyFaultAdmin, (req, res) => {
  res.json(faultController.getStatus());
});

router.post("/inject", verifyFaultAdmin, async (req, res) => {
  const { type, ...payload } = req.body;

  if (!type) {
    return res.status(400).json({ message: "Fault 'type' is required" });
  }

  try {
    const status = faultController.inject(type, payload);

    await structuredLogger.warn({
      event: "FAULT_INJECTED",
      module: "FAULT_INJECTION",
      action: "INJECT_FAULT",
      requestId: req.id,
      correlationId: req.correlationId,
      isFaultInjected: true,
      details: { type, payload, activeState: status.activeFaults },
    });

    res.json({
      message: `Fault '${type}' successfully injected`,
      state: status,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/reset", verifyFaultAdmin, async (req, res) => {
  const status = faultController.reset();

  await structuredLogger.info({
    event: "FAULTS_RESET",
    module: "FAULT_INJECTION",
    action: "RESET_FAULTS",
    requestId: req.id,
    correlationId: req.correlationId,
    details: { message: "All faults cleared" },
  });

  res.json({
    message: "All failure injections have been disabled. System restored to normal.",
    state: status,
  });
});

router.post("/crash", verifyFaultAdmin, async (req, res) => {
  await structuredLogger.log({
    level: "CRITICAL",
    event: "SERVICE_CRASH_INJECTED",
    module: "FAULT_INJECTION",
    action: "CRASH_SERVICE",
    requestId: req.id,
    correlationId: req.correlationId,
    isFaultInjected: true,
    details: { reason: "Intentional crash for RCA auto-recovery demonstration" },
  });

  res.status(500).json({
    message: "Simulated service crash initiated. Process will exit.",
  });

  setTimeout(() => {
    process.exit(1);
  }, 300);
});

module.exports = router;
