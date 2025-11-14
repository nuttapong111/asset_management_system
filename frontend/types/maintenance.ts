export type MaintenanceType = 'repair' | 'routine' | 'emergency';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Maintenance {
  id: string;
  assetId: string;
  assetName?: string;
  type: MaintenanceType;
  title: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  reportedBy?: string;
  reportedByName?: string;
  scheduledDate?: string;
  completedDate?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

