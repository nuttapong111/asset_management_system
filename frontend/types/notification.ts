export type NotificationType = 'payment_proof' | 'payment_due' | 'payment_due_soon' | 'contract_expiring' | 'maintenance_request' | 'payment_overdue' | 'system';

export type NotificationStatus = 'unread' | 'read';

export interface Notification {
  id: string;
  userId: string; // ผู้รับการแจ้งเตือน
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string; // ID ที่เกี่ยวข้อง (เช่น paymentId, contractId)
  status: NotificationStatus;
  createdAt: string;
  readAt?: string;
}

