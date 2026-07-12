import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initialUsers, initialVehicles, initialDrivers, initialTrips,
  initialMaintenanceLogs, initialFuelLogs, initialExpenseLogs, initialRBACMatrix
} from '../src/data/mockData.js';
import type {
  User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, ExpenseLog, RBACMatrix
} from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'transitops.db.json');

export interface DBState {
  users: User[];
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenseLogs: ExpenseLog[];
  rbacMatrix: RBACMatrix;
}

const getDefaultState = (): DBState => ({
  users: [...initialUsers],
  vehicles: [...initialVehicles],
  drivers: [...initialDrivers],
  trips: [...initialTrips],
  maintenanceLogs: [...initialMaintenanceLogs],
  fuelLogs: [...initialFuelLogs],
  expenseLogs: [...initialExpenseLogs],
  rbacMatrix: JSON.parse(JSON.stringify(initialRBACMatrix)),
});

export const getDB = (): DBState => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const defaultState = getDefaultState();
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultState, null, 2), 'utf-8');
      return defaultState;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data) as DBState;
  } catch (error) {
    console.error('Database read error, falling back to default memory state:', error);
    return getDefaultState();
  }
};

export const saveDB = (state: DBState): void => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Database write error:', error);
  }
};

export const resetDB = (): DBState => {
  const defaultState = getDefaultState();
  saveDB(defaultState);
  return defaultState;
};
