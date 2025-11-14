import { Payment } from '@/types/finance';
import { Contract } from '@/types/contract';
import { Asset } from '@/types/asset';

/**
 * Generate receipt document as HTML and open in new window for printing/download
 */
export const generateReceiptDocument = (payment: Payment, contract: Contract, asset: Asset) => {
  // Format dates
  const receiptDate = payment.paidDate 
    ? new Date(payment.paidDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

  const dueDate = new Date(payment.dueDate).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate receipt number (format: REC-YYYYMMDD-XXX)
  const receiptNumber = `REC-${new Date(payment.paidDate || new Date()).toISOString().split('T')[0].replace(/-/g, '')}-${payment.id.slice(-3).toUpperCase()}`;

  // Payment type text
  const paymentTypeText = 
    payment.type === 'rent' ? 'ค่าเช่า' :
    payment.type === 'deposit' ? 'ค่ามัดจำ' :
    payment.type === 'utility' ? 'ค่าน้ำ-ไฟ' : 'อื่นๆ';

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
      line-height: 1.8;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
      margin-bottom: 10px;
    }
    .header h2 {
      font-size: 18px;
      font-weight: normal;
      margin: 0;
      color: #666;
    }
    .receipt-info {
      margin: 30px 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .receipt-info-item {
      margin-bottom: 15px;
    }
    .receipt-info-item label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }
    .receipt-info-item p {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #1a1a1a;
      border-left: 4px solid #2563eb;
      padding-left: 10px;
    }
    .payment-details {
      background-color: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      margin: 20px 0;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .payment-row:last-child {
      border-bottom: none;
    }
    .payment-row-label {
      color: #6b7280;
      font-size: 14px;
    }
    .payment-row-value {
      font-weight: 600;
      font-size: 14px;
      color: #1f2937;
    }
    .amount-total {
      background-color: #dbeafe;
      padding: 15px;
      border-radius: 8px;
      margin-top: 15px;
    }
    .amount-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .amount-total-label {
      font-size: 16px;
      font-weight: 600;
      color: #1e40af;
    }
    .amount-total-value {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
    }
    .signature-section {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 45%;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 60px;
      padding-top: 5px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    .receipt-number {
      background-color: #f3f4f6;
      padding: 10px;
      border-radius: 5px;
      text-align: center;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      font-weight: bold;
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
      <p>${receiptDate}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">ข้อมูลผู้ชำระเงิน</div>
    <div class="payment-details">
      <div class="payment-row">
        <span class="payment-row-label">ชื่อผู้ชำระ</span>
        <span class="payment-row-value">${contract.tenantName || 'ผู้เช่า'}</span>
      </div>
      <div class="payment-row">
        <span class="payment-row-label">ที่อยู่</span>
        <span class="payment-row-value">${asset.address}, ${asset.district}, ${asset.province}</span>
      </div>
      <div class="payment-row">
        <span class="payment-row-label">สัญญาเลขที่</span>
        <span class="payment-row-value">${contract.id}</span>
      </div>
      <div class="payment-row">
        <span class="payment-row-label">ทรัพย์สิน</span>
        <span class="payment-row-value">${asset.name}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">รายละเอียดการชำระเงิน</div>
    <div class="payment-details">
      <div class="payment-row">
        <span class="payment-row-label">ประเภทการชำระ</span>
        <span class="payment-row-value">${paymentTypeText}</span>
      </div>
      <div class="payment-row">
        <span class="payment-row-label">กำหนดชำระ</span>
        <span class="payment-row-value">${dueDate}</span>
      </div>
      <div class="payment-row">
        <span class="payment-row-label">จำนวนเงิน</span>
        <span class="payment-row-value">${payment.amount.toLocaleString('th-TH')} บาท</span>
      </div>
      <div class="amount-total">
        <div class="amount-total-row">
          <span class="amount-total-label">ยอดรวมทั้งสิ้น</span>
          <span class="amount-total-value">${payment.amount.toLocaleString('th-TH')} บาท</span>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">หมายเหตุ</div>
    <p style="color: #6b7280; font-size: 13px;">
      ใบเสร็จนี้เป็นหลักฐานการชำระเงินที่ถูกต้องตามกฎหมาย<br>
      กรุณาเก็บใบเสร็จนี้ไว้เพื่อเป็นหลักฐาน
    </p>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <p><strong>ผู้ชำระเงิน</strong></p>
      <div class="signature-line">
        <p>(${contract.tenantName || 'ผู้เช่า'})</p>
        <p>วันที่ ___________________</p>
      </div>
    </div>
    <div class="signature-box">
      <p><strong>ผู้รับเงิน</strong></p>
      <div class="signature-line">
        <p>(___________________________)</p>
        <p>วันที่ ___________________</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>เอกสารนี้สร้างโดยระบบบริหารจัดการทรัพย์สิน</p>
    <p>สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}</p>
    <p style="margin-top: 10px; font-size: 11px; color: #9ca3af;">
      หมายเลขใบเสร็จ: ${receiptNumber} | Payment ID: ${payment.id}
    </p>
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

