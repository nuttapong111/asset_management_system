export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    available: 'success',
    rented: 'primary',
    maintenance: 'warning',
    active: 'success',
    expired: 'default',
    terminated: 'danger',
    pending: 'warning',
    waiting_approval: 'primary',
    paid: 'success',
    overdue: 'danger',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger',
  };
  return statusColors[status] || 'default';
};

export const getStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    available: 'ว่าง',
    rented: 'ให้เช่าแล้ว',
    maintenance: 'ซ่อมแซม',
    active: 'ใช้งาน',
    expired: 'หมดอายุ',
    terminated: 'ยกเลิก',
    pending: 'รอชำระ',
    waiting_approval: 'รออนุมัติ',
    paid: 'ชำระแล้ว',
    overdue: 'ค้างชำระ',
    in_progress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
  };
  return statusTexts[status] || status;
};

export const calculateDaysUntil = (date: string): number => {
  const today = new Date();
  const target = new Date(date);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

