import { Router } from 'express';
import { getDB } from '../db.js';
import { requireRBAC } from '../middleware/rbac.js';

const router = Router();

// GET /api/analytics/summary
router.get('/summary', requireRBAC('analytics', 'view'), (req, res) => {
  const db = getDB();

  // 1. Financials
  const completedTrips = db.trips.filter((t) => t.status === 'Completed');
  const totalRevenue = db.vehicles.reduce((acc, v) => acc + (v.accumulatedRevenue || 0), 0) +
    completedTrips.reduce((acc, t) => acc + (t.revenueGenerated || 0), 0);

  const totalFuelCost = db.fuelLogs.reduce((acc, f) => acc + f.cost, 0);
  const totalMaintenanceCost = db.maintenanceLogs.reduce((acc, m) => acc + m.cost, 0);
  const totalOtherExpenses = db.expenseLogs.reduce((acc, e) => acc + e.amount, 0);
  const totalExpenses = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;

  const netProfit = totalRevenue - totalExpenses;
  const roiPercentage = totalExpenses > 0 ? ((totalRevenue - totalExpenses) / totalExpenses) * 100 : 0;

  // 2. Operational Telemetry
  const activeVehicles = db.vehicles.filter((v) => v.status !== 'Retired');
  const vehiclesOnTrip = db.vehicles.filter((v) => v.status === 'On Trip');
  const fleetUtilization = activeVehicles.length > 0
    ? Math.round((vehiclesOnTrip.length / activeVehicles.length) * 100)
    : 0;

  // 3. Efficiency Metrics
  const totalDistanceKm = completedTrips.reduce((acc, t) => acc + (t.plannedDistance || 0), 0);
  const totalFuelLiters = db.fuelLogs.reduce((acc, f) => acc + f.liters, 0);
  const fuelEfficiencyKmL = totalFuelLiters > 0 ? (totalDistanceKm / totalFuelLiters).toFixed(2) : '8.50';
  const costPerKm = totalDistanceKm > 0 ? (totalExpenses / totalDistanceKm).toFixed(2) : '1.25';

  // 4. Safety & Compliance
  const averageSafetyScore = db.drivers.length > 0
    ? Math.round(db.drivers.reduce((acc, d) => acc + d.safetyScore, 0) / db.drivers.length)
    : 95;

  const expiredDriversCount = db.drivers.filter((d) => d.licenseExpiryDate < new Date().toISOString().split('T')[0]).length;
  const vehiclesInShopCount = db.vehicles.filter((v) => v.status === 'In Shop').length;

  res.json({
    success: true,
    data: {
      financials: {
        totalRevenue: Math.round(totalRevenue),
        totalFuelCost: Math.round(totalFuelCost),
        totalMaintenanceCost: Math.round(totalMaintenanceCost),
        totalOtherExpenses: Math.round(totalOtherExpenses),
        totalExpenses: Math.round(totalExpenses),
        netProfit: Math.round(netProfit),
        roiPercentage: Math.round(roiPercentage * 100) / 100,
      },
      operations: {
        totalFleetCount: db.vehicles.length,
        activeFleetCount: activeVehicles.length,
        vehiclesOnTripCount: vehiclesOnTrip.length,
        vehiclesInShopCount,
        fleetUtilizationPercentage: fleetUtilization,
        totalTripsDispatched: db.trips.length,
        completedTripsCount: completedTrips.length,
      },
      efficiency: {
        totalDistanceKm,
        totalFuelLiters: Math.round(totalFuelLiters),
        fuelEfficiencyKmL: Number(fuelEfficiencyKmL),
        costPerKm: Number(costPerKm),
      },
      safety: {
        averageSafetyScore,
        expiredDriversCount,
      },
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
