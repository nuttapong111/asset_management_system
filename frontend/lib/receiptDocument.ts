import { Payment } from '@/types/finance';
import { Contract } from '@/types/contract';
import { Asset } from '@/types/asset';
import { apiClient } from '@/lib/api';
import { getStoredToken } from '@/lib/auth';

/**
 * Generate receipt document as HTML and open in new window for printing/download
 * Format: Detailed itemized receipt (like Thai apartment receipt)
 */
export const generateReceiptDocument = async (payment: Payment, contract: Contract, asset: Asset) => {
  // Format dates - use receiptDate if available, otherwise use paidDate, otherwise use today
  const receiptDateStr = payment.receiptDate || payment.paidDate || new Date().toISOString().split('T')[0];
  const paidDateStr = payment.paidDate || receiptDateStr;
  
  const receiptDate = new Date(receiptDateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const paidDate = new Date(paidDateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const paidDateObj = new Date(paidDateStr);
  const receiptMonth = paidDateObj.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const receiptYear = paidDateObj.getFullYear() + 543; // Buddhist Era

  // Use receipt number from payment, or generate fallback
  const receiptNumber = payment.receiptNumber || `REC-${paidDateObj.toISOString().split('T')[0].replace(/-/g, '')}-${payment.id.slice(-3).toUpperCase()}`;

  // Use contract number from contract
  const contractNumber = contract.contractNumber || contract.id;

  // Payment method
  const paymentMethod = payment.paymentMethod || 'โอนเงิน';

  // Payment type breakdown - for itemized receipt
  // Check if this is the first payment (deposit + insurance)
  // First payment typically has amount = deposit + insurance and is due on contract creation date
  // Use Math.abs to handle floating point precision issues
  const depositAmount = Number(contract.deposit) || 0;
  const insuranceAmount = Number(contract.insurance) || 0;
  const paymentAmount = Number(payment.amount) || 0;
  const expectedFirstPaymentAmount = depositAmount + insuranceAmount;
  
  // Check if this is the first payment: amount matches deposit + insurance (with tolerance for floating point)
  const isFirstPayment = payment.type === 'rent' && 
    Math.abs(paymentAmount - expectedFirstPaymentAmount) < 0.01 &&
    depositAmount > 0 && 
    insuranceAmount > 0;
  
  const paymentItems: Array<{ name: string; quantity?: string; unitPrice?: string; amount: number }> = [];
  
  if (isFirstPayment) {
    // First payment: split into deposit and insurance
    if (depositAmount > 0) {
      paymentItems.push({
        name: 'ค่าเช่าล่วงหน้า',
        amount: depositAmount
      });
    }
    if (insuranceAmount > 0) {
      paymentItems.push({
        name: 'ค่าประกัน',
        amount: insuranceAmount
      });
    }
  } else if (payment.type === 'rent') {
    paymentItems.push({
      name: 'ค่าเช่า',
      amount: payment.amount
    });
  } else if (payment.type === 'deposit') {
    paymentItems.push({
      name: 'ค่าเช่าล่วงหน้า',
      amount: payment.amount
    });
  } else if (payment.type === 'utility') {
    // Split utility into electricity and water (50/50 for now, can be customized later)
    paymentItems.push({
      name: 'ค่าไฟ',
      amount: Math.round(payment.amount / 2)
    });
    paymentItems.push({
      name: 'ค่าน้ำ',
      amount: Math.round(payment.amount / 2)
    });
  } else {
    paymentItems.push({
      name: 'อื่นๆ',
      amount: payment.amount
    });
  }

  const totalAmount = paymentItems.reduce((sum, item) => sum + item.amount, 0);

  // Get owner name
  let ownerName = 'เจ้าของทรัพย์สิน';
  try {
    const token = getStoredToken();
    if (token) {
      apiClient.setToken(token);
      const owner = await apiClient.getUser(asset.ownerId);
      ownerName = owner.name || ownerName;
    }
  } catch (error) {
    console.error('Error fetching owner name:', error);
  }

  // Create HTML document
  const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ใบเสร็จรับเงิน ${receiptNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
    }
    body {
      font-family: 'Sarabun', 'Sukhumvit Set', 'Noto Sans Thai', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
    }
    .header h1 {
      font-size: 22px;
      font-weight: bold;
      margin: 0;
      margin-bottom: 5px;
    }
    .header h2 {
      font-size: 16px;
      font-weight: normal;
      margin: 0;
      color: #666;
    }
    .receipt-info {
      margin: 20px 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      font-size: 13px;
    }
    .receipt-info-item {
      margin-bottom: 10px;
    }
    .receipt-info-item label {
      display: block;
      font-size: 11px;
      color: #666;
      margin-bottom: 3px;
    }
    .receipt-info-item p {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: #333;
    }
    .section {
      margin: 20px 0;
    }
    .section-title {
      font-size: 15px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #1a1a1a;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 13px;
    }
    .items-table th {
      background-color: #f3f4f6;
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      font-weight: 600;
    }
    .items-table td {
      border: 1px solid #ddd;
      padding: 8px;
    }
    .items-table tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .total-section {
      margin-top: 15px;
      padding: 15px;
      background-color: #eff6ff;
      border: 2px solid #3b82f6;
      border-radius: 5px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: bold;
      color: #1e40af;
    }
    .amount-in-words {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 13px;
      color: #666;
      text-align: center;
    }
    .payment-method {
      margin: 15px 0;
      padding: 10px;
      background-color: #f9fafb;
      border-radius: 5px;
    }
    .signature-section {
      margin-top: 40px;
      display: flex;
      justify-content: center;
    }
    .signature-box {
      width: 45%;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 50px;
      padding-top: 5px;
      font-size: 12px;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 11px;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    .receipt-number {
      text-align: center;
      margin: 15px 0;
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ใบเสร็จรับเงิน</h1>
    <h2>RECEIPT</h2>
  </div>

  <div class="receipt-number">
    เลขที่ใบเสร็จ: ${receiptNumber}
  </div>

  <div class="receipt-info">
    <div class="receipt-info-item">
      <label>วันที่ออกใบเสร็จ</label>
      <p>${receiptDate}</p>
    </div>
    <div class="receipt-info-item">
      <label>วันที่ชำระเงิน</label>
      <p>${paidDate}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">ข้อมูลผู้ชำระเงิน</div>
    <div style="font-size: 13px; line-height: 1.8;">
      <p><strong>ชื่อ-นามสกุล:</strong> ${contract.tenantName || 'ผู้เช่า'}</p>
      <p><strong>ที่อยู่:</strong> ${asset.address || ''} ${asset.district || ''} ${asset.province || ''} ${asset.postalCode || ''}</p>
      <p><strong>สัญญาเลขที่:</strong> ${contractNumber}</p>
      <p><strong>ทรัพย์สิน:</strong> ${asset.name}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">รายการที่ชำระ</div>
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%;">ลำดับ</th>
          <th style="width: 40%;">รายการ</th>
          <th style="width: 15%;" class="text-center">จำนวน</th>
          <th style="width: 20%;" class="text-right">ราคาต่อหน่วย</th>
          <th style="width: 20%;" class="text-right">จำนวนเงิน</th>
        </tr>
      </thead>
      <tbody>
        ${paymentItems.map((item, index) => `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.name}</td>
            <td class="text-center">${item.quantity || '-'}</td>
            <td class="text-right">${item.unitPrice ? `${item.unitPrice} บาท` : '-'}</td>
            <td class="text-right">${item.amount.toLocaleString('th-TH')} บาท</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="total-section">
      <div class="total-row">
        <span>ยอดรวมทั้งสิ้น</span>
        <span>${totalAmount.toLocaleString('th-TH')} บาท</span>
      </div>
    </div>
    
    <div class="amount-in-words">
      <p><strong>จำนวนเงินเป็นตัวอักษร:</strong> ${numberToThaiWords(totalAmount)}</p>
    </div>
  </div>

  <div class="payment-method">
    <p style="margin: 5px 0;"><strong>วิธีการชำระเงิน:</strong> ${paymentMethod}</p>
    <p style="margin: 5px 0; font-size: 12px; color: #666;">หมายเหตุ: ใบเสร็จนี้เป็นหลักฐานการชำระเงินที่ถูกต้องตามกฎหมาย</p>
  </div>

  <div class="signature-section">
    <div class="signature-box" style="margin: 0 auto;">
      <p><strong>ผู้รับเงิน</strong></p>
      <div class="signature-line">
        <p>(${ownerName})</p>
        <p>วันที่ ${paidDate}</p>
      </div>
    </div>
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

/**
 * Convert number to Thai words
 */
function numberToThaiWords(num: number): string {
  const units = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const tens = ['', 'สิบ', 'ยี่สิบ', 'สามสิบ', 'สี่สิบ', 'ห้าสิบ', 'หกสิบ', 'เจ็ดสิบ', 'แปดสิบ', 'เก้าสิบ'];
  const scales = ['', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  
  if (num === 0) return 'ศูนย์';
  if (num < 10) return units[num];
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    if (ten === 1 && unit === 1) return 'สิบเอ็ด';
    if (ten === 1 && unit > 1) return `สิบ${units[unit]}`;
    if (ten === 2 && unit === 1) return 'ยี่สิบเอ็ด';
    if (unit === 1) return `${tens[ten]}เอ็ด`;
    return `${tens[ten]}${units[unit]}`;
  }
  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    if (hundred === 1) {
      return remainder === 0 ? 'หนึ่งร้อย' : `หนึ่งร้อย${numberToThaiWords(remainder)}`;
    }
    return remainder === 0 ? `${units[hundred]}ร้อย` : `${units[hundred]}ร้อย${numberToThaiWords(remainder)}`;
  }
  if (num < 10000) {
    const thousand = Math.floor(num / 1000);
    const remainder = num % 1000;
    if (thousand === 1) {
      return remainder === 0 ? 'หนึ่งพัน' : `หนึ่งพัน${numberToThaiWords(remainder)}`;
    }
    return remainder === 0 ? `${units[thousand]}พัน` : `${units[thousand]}พัน${numberToThaiWords(remainder)}`;
  }
  if (num < 100000) {
    const tenThousand = Math.floor(num / 10000);
    const remainder = num % 10000;
    return remainder === 0 ? `${numberToThaiWords(tenThousand)}หมื่น` : `${numberToThaiWords(tenThousand)}หมื่น${numberToThaiWords(remainder)}`;
  }
  if (num < 1000000) {
    const hundredThousand = Math.floor(num / 100000);
    const remainder = num % 100000;
    return remainder === 0 ? `${numberToThaiWords(hundredThousand)}แสน` : `${numberToThaiWords(hundredThousand)}แสน${numberToThaiWords(remainder)}`;
  }
  
  // For numbers >= 1,000,000
  const million = Math.floor(num / 1000000);
  const remainder = num % 1000000;
  if (remainder === 0) {
    return `${numberToThaiWords(million)}ล้าน`;
  }
  return `${numberToThaiWords(million)}ล้าน${numberToThaiWords(remainder)}`;
}
