export interface HealthStatus {
  status: string;
  timestamp: Date;
}

export const CITIES = [
  'Mumbai',
  'Delhi NCR',
  'Bengaluru',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
  'Pune'
] as const;

export type CityType = typeof CITIES[number];
export * from './schemas/auth.js';
