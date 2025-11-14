export type ContractStatus = 'active' | 'expired' | 'terminated' | 'pending';

export interface Contract {
  id: string;
  assetId: string;
  assetName?: string;
  tenantId: string;
  tenantName?: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  deposit: number;
  insurance: number;
  status: ContractStatus;
  documents: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

