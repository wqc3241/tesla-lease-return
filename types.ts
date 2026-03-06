
export interface VehicleState {
  name: string;
  model: string;
  batteryLevel: number;
  rangeRemaining: number;
  isLocked: boolean;
  isCharging: boolean;
  insideTemp: number;
  outsideTemp: number;
  targetTemp: number;
  location: string;
  softwareVersion: string;
  odometer: number;
}

export type Lender = 'U.S. Bank' | 'Chase' | 'Santander' | 'Ally' | 'Tesla Finance';

export interface LeaseState {
  termMonths: number;
  startDate: string;
  maturityDate: string;
  daysLeft: number;
  lender: Lender;
  allowedMileage: number;
  currentMileage: number;
  isInspectionComplete: boolean;
  isEstimateConfirmed: boolean;
  selectedOption: 'Return' | 'Buy' | 'New Lease' | null;
  isScheduled: boolean;
  scheduledDate: string | null;
  isReturned: boolean;
  hasKeys: boolean;
  hasPersonalItemsRemoved: boolean;
}

export type TabType = 'Home' | 'Controls' | 'Location' | 'Upgrades' | 'Financing' | 'LeaseManagement';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
