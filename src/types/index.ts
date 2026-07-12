export type Role = 'Fleet Manager' | 'Driver' | 'Safety Officer' | 'Financial Analyst';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';
export type VehicleType = 'Van' | 'Truck' | 'Refrigerated Truck' | 'Trailer' | 'Pickup' | 'Bike';
export type Region = 'North' | 'South' | 'East' | 'West';

export interface VehicleDocument {
  id: string;
  title: string;
  fileUrl: string;
  uploadDate: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string; // Unique
  nameModel: string;
  type: VehicleType;
  maxLoadCapacity: number; // in kg
  odometer: number; // in km
  acquisitionCost: number; // in USD
  status: VehicleStatus;
  region: Region;
  accumulatedRevenue?: number; // for exact ROI formula calculation
  documents?: VehicleDocument[];
}

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
export type LicenseCategory = 'Heavy Goods (C)' | 'Light Commercial (B)' | 'Hazardous (ADR)' | 'Universal (All)';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseExpiryDate: string; // YYYY-MM-DD
  contactNumber: string;
  safetyScore: number; // 0 - 100
  status: DriverStatus;
  region: Region;
}

export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export interface Trip {
  id: string;
  tripCode: string; // e.g., TRP-2026-001
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number; // in kg
  plannedDistance: number; // in km
  actualDistance?: number;
  status: TripStatus;
  createdAt: string;
  dispatchedAt?: string;
  completedAt?: string;
  finalOdometer?: number;
  fuelConsumed?: number; // liters consumed on trip
  revenueGenerated?: number; // USD
  notes?: string;
}

export type MaintenanceStatus = 'In Progress' | 'Completed' | 'Scheduled';

export interface MaintenanceLog {
  id: string;
  serviceCode: string; // e.g., MNT-101
  vehicleId: string;
  serviceDescription: string;
  cost: number; // in USD
  date: string; // YYYY-MM-DD
  status: MaintenanceStatus;
  provider: string;
  notes?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number; // in USD
  date: string; // YYYY-MM-DD
  odometerReading: number;
  stationName?: string;
}

export interface ExpenseLog {
  id: string;
  vehicleId: string;
  category: 'Tolls' | 'Insurance' | 'Repairs' | 'Cleaning' | 'Registration' | 'Other';
  amount: number; // in USD
  date: string; // YYYY-MM-DD
  description: string;
}

export interface RBACPermission {
  module: 'dashboard' | 'fleet' | 'drivers' | 'trips' | 'maintenance' | 'fuel' | 'analytics' | 'settings';
  actions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
}

export type RBACMatrix = Record<Role, Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>>;
