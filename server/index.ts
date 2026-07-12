import express from 'express';
import cors from 'cors';
import { getDB } from './db.js';

import authRouter from './routes/auth.js';
import vehiclesRouter from './routes/vehicles.js';
import driversRouter from './routes/drivers.js';
import tripsRouter from './routes/trips.js';
import maintenanceRouter from './routes/maintenance.js';
import expensesRouter from './routes/expenses.js';
import analyticsRouter from './routes/analytics.js';
import rbacRouter from './routes/rbac.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);

// Middleware
app.use(cors());
app.use(express.json());

// API Telemetry & Request Logging
app.use((req, res, next) => {
  const role = req.headers['x-user-role'] || 'Fleet Manager';
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '❌' : '⚡';
    console.log(`[TransitOps API] ${statusColor} ${req.method} ${req.originalUrl} (${res.statusCode}) - [Role: ${role}] - ${duration}ms`);
  });
  next();
});

// Initialize DB on boot
getDB();

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/rbac', rbacRouter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const db = getDB();
  res.json({
    status: 'ONLINE',
    system: 'TransitOps Smart Transport Operations Platform Backend',
    version: '1.0.0 (Hackathon Edition)',
    timestamp: new Date().toISOString(),
    counts: {
      vehicles: db.vehicles.length,
      drivers: db.drivers.length,
      trips: db.trips.length,
      maintenanceLogs: db.maintenanceLogs.length,
      fuelLogs: db.fuelLogs.length,
      expenseLogs: db.expenseLogs.length,
    },
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` 🚚 TransitOps Backend Server running on Port ${PORT}`);
  console.log(` 📦 Database Engine: Atomic JSON File Storage`);
  console.log(` 🛡️ RBAC Enforcer: ACTIVE (4 Hackathon Roles)`);
  console.log(` 🔗 REST API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});

export default app;
