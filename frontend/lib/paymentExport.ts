import { Payment } from '@/types/finance';
import { Contract } from '@/types/contract';
import { Asset } from '@/types/asset';

/**
 * Export payments to Excel (CSV format)
 */
export const exportPaymentsToExcel = (
  payments: Payment[],
  contracts: Contract[],
  assets: Asset[],
  filters?: {
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) => {
  // Filter payments if filters provided
  let filteredPayments = payments;
  
  if (filters) {
    filteredPayments = payments.filter(p => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.dateFrom && p.dueDate < filters.dateFrom) return false;
      if (filters.dateTo && p.dueDate > filters.dateTo) return false;
      return true;
    });
  }

  // Create CSV content
  const headers = [
    'ลำดับ',
    'สัญญาเลขที่',
    'ทรัพย์สิน',
    'ประเภท',
    'จำนวนเงิน',
    'กำหนดชำระ',
    'วันที่ชำระ',
    'สถานะ',
    'หมายเหตุ'
  ];

  const rows = filteredPayments.map((payment, index) => {
    const contract = contracts.find(c => c.id === payment.contractId);
    const asset = contract ? assets.find(a => a.id === contract.assetId) : null;
    
    const typeText = 
      payment.type === 'rent' ? 'ค่าเช่า' :
      payment.type === 'deposit' ? 'ค่ามัดจำ' :
      payment.type === 'utility' ? 'ค่าน้ำ-ไฟ' : 'อื่นๆ';
    
    const statusText = 
      payment.status === 'paid' ? 'ชำระแล้ว' :
      payment.status === 'overdue' ? 'ค้างชำระ' : 'รอชำระ';

    return [
      (index + 1).toString(),
      contract?.id || '-',
      asset?.name || contract?.assetName || '-',
      typeText,
      payment.amount.toLocaleString('th-TH'),
      new Date(payment.dueDate).toLocaleDateString('th-TH'),
      payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('th-TH') : '-',
      statusText,
      ''
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Add BOM for UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `รายการชำระเงิน_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export payments to PDF
 */
export const exportPaymentsToPDF = (
  payments: Payment[],
  contracts: Contract[],
  assets: Asset[],
  filters?: {
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) => {
  // Filter payments if filters provided
  let filteredPayments = payments;
  
  if (filters) {
    filteredPayments = payments.filter(p => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.dateFrom && p.dueDate < filters.dateFrom) return false;
      if (filters.dateTo && p.dueDate > filters.dateTo) return false;
      return true;
    });
  }

  // Calculate summary
  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = filteredPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);
  const overdueAmount = filteredPayments
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  // Create HTML content
  const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รายงานการชำระเงิน</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
    }
    body {
      font-family: 'Sarabun', 'Sukhumvit Set', 'Noto Sans Thai', sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
    }
    .header h1 {
      font-size: 20px;
      font-weight: bold;
      margin: 0;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin: 20px 0;
    }
    .summary-box {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      text-align: center;
    }
    .summary-box h3 {
      font-size: 11px;
      margin: 0 0 5px 0;
      color: #666;
    }
    .summary-box p {
      font-size: 16px;
      font-weight: bold;
      margin: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 11px;
    }
    table th {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      font-weight: 600;
    }
    table td {
      border: 1px solid #ddd;
      padding: 6px;
    }
    table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .status-paid { color: #059669; font-weight: 600; }
    .status-pending { color: #d97706; font-weight: 600; }
    .status-overdue { color: #dc2626; font-weight: 600; }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 10px;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    @media print {
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>รายงานการชำระเงิน</h1>
    <p>วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    ${filters ? `
    <p style="font-size: 10px; color: #999;">
      ${filters.status ? `สถานะ: ${filters.status === 'paid' ? 'ชำระแล้ว' : filters.status === 'pending' ? 'รอชำระ' : 'ค้างชำระ'} | ` : ''}
      ${filters.type ? `ประเภท: ${filters.type === 'rent' ? 'ค่าเช่า' : filters.type === 'deposit' ? 'ค่ามัดจำ' : filters.type === 'utility' ? 'ค่าน้ำ-ไฟ' : 'อื่นๆ'} | ` : ''}
      ${filters.dateFrom || filters.dateTo ? `วันที่: ${filters.dateFrom || 'ทั้งหมด'} ถึง ${filters.dateTo || 'ทั้งหมด'}` : ''}
    </p>
    ` : ''}
  </div>

  <div class="summary">
    <div class="summary-box">
      <h3>รวมทั้งหมด</h3>
      <p>${totalAmount.toLocaleString('th-TH')} บาท</p>
    </div>
    <div class="summary-box">
      <h3>ชำระแล้ว</h3>
      <p class="status-paid">${paidAmount.toLocaleString('th-TH')} บาท</p>
    </div>
    <div class="summary-box">
      <h3>รอชำระ</h3>
      <p class="status-pending">${pendingAmount.toLocaleString('th-TH')} บาท</p>
    </div>
    <div class="summary-box">
      <h3>ค้างชำระ</h3>
      <p class="status-overdue">${overdueAmount.toLocaleString('th-TH')} บาท</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>ลำดับ</th>
        <th>สัญญาเลขที่</th>
        <th>ทรัพย์สิน</th>
        <th>ประเภท</th>
        <th>จำนวนเงิน</th>
        <th>กำหนดชำระ</th>
        <th>วันที่ชำระ</th>
        <th>สถานะ</th>
      </tr>
    </thead>
    <tbody>
      ${filteredPayments.map((payment, index) => {
        const contract = contracts.find(c => c.id === payment.contractId);
        const asset = contract ? assets.find(a => a.id === contract.assetId) : null;
        
        const typeText = 
          payment.type === 'rent' ? 'ค่าเช่า' :
          payment.type === 'deposit' ? 'ค่ามัดจำ' :
          payment.type === 'utility' ? 'ค่าน้ำ-ไฟ' : 'อื่นๆ';
        
        const statusText = 
          payment.status === 'paid' ? 'ชำระแล้ว' :
          payment.status === 'overdue' ? 'ค้างชำระ' : 'รอชำระ';
        
        const statusClass = 
          payment.status === 'paid' ? 'status-paid' :
          payment.status === 'overdue' ? 'status-overdue' : 'status-pending';

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${contract?.id || '-'}</td>
            <td>${asset?.name || contract?.assetName || '-'}</td>
            <td>${typeText}</td>
            <td>${payment.amount.toLocaleString('th-TH')}</td>
            <td>${new Date(payment.dueDate).toLocaleDateString('th-TH')}</td>
            <td>${payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('th-TH') : '-'}</td>
            <td class="${statusClass}">${statusText}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>รายงานนี้สร้างโดยระบบบริหารจัดการทรัพย์สิน</p>
    <p>จำนวนรายการทั้งหมด: ${filteredPayments.length} รายการ</p>
  </div>

  <div class="no-print" style="position: fixed; bottom: 20px; right: 20px;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
      🖨️ พิมพ์/บันทึกเป็น PDF
    </button>
  </div>
</body>
</html>
  `;

  // Open in new window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  } else {
    alert('ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาตรวจสอบการตั้งค่า popup blocker');
  }
};

