import { Contract } from '@/types/contract';
import { Asset } from '@/types/asset';
import { mockAssets } from './mockData';

/**
 * Generate contract document as HTML and open in new window for printing/download
 */
export const generateContractDocument = (contract: Contract, asset?: Asset) => {
  const contractAsset = asset || mockAssets.find(a => a.id === contract.assetId);
  
  if (!contractAsset) {
    alert('ไม่พบข้อมูลทรัพย์สิน');
    return;
  }

  // Format dates
  const startDate = new Date(contract.startDate).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const endDate = new Date(contract.endDate).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const createdDate = new Date(contract.createdAt || new Date()).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate total months
  const start = new Date(contract.startDate);
  const end = new Date(contract.endDate);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

  // Create HTML document
  const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>สัญญาเช่าเลขที่ ${contract.id}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
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
    .contract-info {
      margin: 30px 0;
    }
    .contract-info p {
      margin: 8px 0;
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
    .content {
      text-align: justify;
      margin-bottom: 15px;
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
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    table td {
      padding: 8px;
      border: 1px solid #ddd;
    }
    table td:first-child {
      background-color: #f5f5f5;
      font-weight: 600;
      width: 30%;
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
    <h1>สัญญาเช่าอสังหาริมทรัพย์</h1>
    <h2>สัญญาเลขที่ ${contract.id}</h2>
  </div>

  <div class="contract-info">
    <p><strong>วันที่ทำสัญญา:</strong> ${createdDate}</p>
  </div>

  <div class="section">
    <div class="section-title">คู่สัญญา</div>
    <div class="content">
      <p>คู่สัญญาฝ่ายที่ 1 (ผู้ให้เช่า): [ชื่อผู้ให้เช่า]</p>
      <p>ที่อยู่: ${contractAsset.address}, ${contractAsset.district}, ${contractAsset.province} ${contractAsset.postalCode}</p>
      <p>โทรศัพท์: [เบอร์โทรศัพท์]</p>
    </div>
    <div class="content">
      <p>คู่สัญญาฝ่ายที่ 2 (ผู้เช่า): ${contract.tenantName || 'ผู้เช่า'}</p>
      <p>ที่อยู่: [ที่อยู่ผู้เช่า]</p>
      <p>โทรศัพท์: [เบอร์โทรศัพท์]</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">รายละเอียดทรัพย์สินที่ให้เช่า</div>
    <table>
      <tr>
        <td>ชื่อทรัพย์สิน</td>
        <td>${contractAsset.name}</td>
      </tr>
      <tr>
        <td>ที่อยู่</td>
        <td>${contractAsset.address}, ${contractAsset.district}, ${contractAsset.province} ${contractAsset.postalCode}</td>
      </tr>
      <tr>
        <td>ขนาด</td>
        <td>${contractAsset.size} ตารางเมตร</td>
      </tr>
      <tr>
        <td>จำนวนห้องนอน</td>
        <td>${contractAsset.rooms} ห้อง</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">เงื่อนไขการเช่า</div>
    <table>
      <tr>
        <td>ระยะเวลาเช่า</td>
        <td>${months} เดือน (${startDate} ถึง ${endDate})</td>
      </tr>
      <tr>
        <td>ค่าเช่าต่อเดือน</td>
        <td>${contract.rentAmount.toLocaleString('th-TH')} บาท</td>
      </tr>
      <tr>
        <td>ค่ามัดจำ</td>
        <td>${contract.deposit.toLocaleString('th-TH')} บาท</td>
      </tr>
      <tr>
        <td>ค่าประกัน</td>
        <td>${contract.insurance.toLocaleString('th-TH')} บาท</td>
      </tr>
      <tr>
        <td>รวมเงินที่ต้องชำระครั้งแรก</td>
        <td>${(contract.rentAmount + contract.deposit + contract.insurance).toLocaleString('th-TH')} บาท</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">ข้อกำหนดและเงื่อนไข</div>
    <div class="content">
      <p><strong>1. หน้าที่ของผู้เช่า:</strong></p>
      <p>ผู้เช่าต้องชำระค่าเช่าตามกำหนดเวลา และดูแลรักษาทรัพย์สินที่เช่าให้อยู่ในสภาพดี</p>
      
      <p><strong>2. หน้าที่ของผู้ให้เช่า:</strong></p>
      <p>ผู้ให้เช่าต้องส่งมอบทรัพย์สินที่อยู่ในสภาพพร้อมใช้งาน และรับผิดชอบค่าภาษีและค่าธรรมเนียมต่างๆ ที่เกี่ยวข้องกับทรัพย์สิน</p>
      
      <p><strong>3. การต่ออายุสัญญา:</strong></p>
      <p>หากผู้เช่าต้องการต่ออายุสัญญา ต้องแจ้งล่วงหน้าก่อนสัญญาหมดอายุอย่างน้อย 30 วัน</p>
      
      <p><strong>4. การสิ้นสุดสัญญา:</strong></p>
      <p>สัญญานี้จะสิ้นสุดลงเมื่อครบกำหนด หรือเมื่อคู่สัญญาฝ่ายใดฝ่ายหนึ่งผิดสัญญา</p>
    </div>
  </div>

  ${contract.notes ? `
  <div class="section">
    <div class="section-title">หมายเหตุเพิ่มเติม</div>
    <div class="content">
      <p>${contract.notes}</p>
    </div>
  </div>
  ` : ''}

  <div class="signature-section">
    <div class="signature-box">
      <p><strong>ผู้ให้เช่า</strong></p>
      <div class="signature-line">
        <p>(___________________________)</p>
        <p>วันที่ ___________________</p>
      </div>
    </div>
    <div class="signature-box">
      <p><strong>ผู้เช่า</strong></p>
      <div class="signature-line">
        <p>(___________________________)</p>
        <p>วันที่ ___________________</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>เอกสารนี้สร้างโดยระบบบริหารจัดการทรัพย์สิน</p>
    <p>สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}</p>
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

