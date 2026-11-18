export type ViewMode = 'split' | 'manager' | 'worker';

export type ThresholdMode = 'demo_15s' | 'real_15m';

export type WorkerStatus = 'moving' | 'at_customer' | 'stationary_alert' | 'off_shift';

export type TaskType = 'chit_collection' | 'new_enquiry';

export type PaymentMode = 'Cash' | 'UPI';

export interface RouteWaypoint {
  x: number; // 0-1000 SVG canvas X
  y: number; // 0-620 SVG canvas Y
  lat: number;
  lng: number;
  label: string;
}

export interface FieldWorker {
  id: string;
  name: string;
  employeeCode: string;
  phone: string;
  zone: string;
  status: WorkerStatus;
  onShift: boolean;
  simulatedStop: boolean;
  mapX: number;
  mapY: number;
  lat: number;
  lng: number;
  routeIndex: number;
  routeProgress: number; // 0..1 interpolation between waypoints
  routePoints: RouteWaypoint[];
  cashCollected: number;
  upiCollected: number;
  idleSeconds: number;
  alertSent: boolean;
  currentLocationLabel: string;
  lastUpdated: string;
}

export interface FieldTask {
  id: string;
  workerId: string;
  type: TaskType;
  customerName: string;
  phone: string;
  chitGroupId: string;
  amountDue: number;
  collectedAmount?: number;
  paymentMode?: PaymentMode;
  neighborhood: string;
  mapX: number;
  mapY: number;
  status: 'pending' | 'completed';
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AlertNotification {
  id: string;
  workerId: string;
  workerName: string;
  type: 'inactivity' | 'enquiry' | 'payment' | 'task_assigned';
  message: string;
  location: string;
  timestamp: string;
  acknowledged: boolean;
}
