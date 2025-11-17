import { Contract } from '@/types/contract';
import { Asset } from '@/types/asset';
import { apiClient } from './api';
import { getStoredToken } from './auth';
import Swal from 'sweetalert2';

interface OwnerInfo {
  name: string;
  phone: string;
  address?: {
    houseNumber?: string;
    villageNumber?: string;
    street?: string;
    subDistrict?: string;
    district?: string;
    province?: string;
    postalCode?: string;
  };
}

interface TenantInfo {
  name: string;
  phone: string;
  address?: {
    houseNumber?: string;
    villageNumber?: string;
    street?: string;
    subDistrict?: string;
    district?: string;
    province?: string;
    postalCode?: string;
  };
}

/**
 * Generate contract document as HTML and open in new window for printing/download
 */
export const generateContractDocument = async (contract: Contract, asset?: Asset) => {
  const contractAsset = asset;
  
  if (!contractAsset) {
    await Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่พบข้อมูลทรัพย์สิน',
    });
    return;
  }

  // Get token and set it
  const token = getStoredToken();
  if (!token) {
    await Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'กรุณาเข้าสู่ระบบใหม่',
    });
    return;
  }
  apiClient.setToken(token);

  try {
    // Get owner information (from asset owner_id)
    const owner = await apiClient.getUser(contractAsset.ownerId);
    const ownerInfo: OwnerInfo = {
      name: owner.name || '',
      phone: owner.phone || '',
      address: owner.address || undefined,
    };

    // Get tenant information
    const tenant = await apiClient.getUser(contract.tenantId);
    const tenantInfo: TenantInfo = {
      name: tenant.name || '',
      phone: tenant.phone || '',
      address: tenant.address || undefined,
    };

    // Validate required information
    const missingOwnerFields: string[] = [];
    const missingTenantFields: string[] = [];
    
    // Check owner information
    if (!ownerInfo.name) missingOwnerFields.push('ชื่อ');
    if (!ownerInfo.phone) missingOwnerFields.push('เบอร์โทรศัพท์');
    if (!ownerInfo.address) {
      missingOwnerFields.push('ที่อยู่ทั้งหมด');
    } else {
      if (!ownerInfo.address.houseNumber) missingOwnerFields.push('บ้านเลขที่');
      if (!ownerInfo.address.subDistrict) missingOwnerFields.push('ตำบล/แขวง');
      if (!ownerInfo.address.district) missingOwnerFields.push('อำเภอ/เขต');
      if (!ownerInfo.address.province) missingOwnerFields.push('จังหวัด');
      if (!ownerInfo.address.postalCode) missingOwnerFields.push('รหัสไปรษณีย์');
    }
    
    // Check tenant information
    if (!tenantInfo.name) missingTenantFields.push('ชื่อ');
    if (!tenantInfo.phone) missingTenantFields.push('เบอร์โทรศัพท์');
    if (!tenantInfo.address) {
      missingTenantFields.push('ที่อยู่ทั้งหมด');
    } else {
      if (!tenantInfo.address.houseNumber) missingTenantFields.push('บ้านเลขที่');
      if (!tenantInfo.address.subDistrict) missingTenantFields.push('ตำบล/แขวง');
      if (!tenantInfo.address.district) missingTenantFields.push('อำเภอ/เขต');
      if (!tenantInfo.address.province) missingTenantFields.push('จังหวัด');
      if (!tenantInfo.address.postalCode) missingTenantFields.push('รหัสไปรษณีย์');
    }

    // Show error message if any information is missing
    if (missingOwnerFields.length > 0 || missingTenantFields.length > 0) {
      let errorMessage = 'กรุณากรอกรายละเอียดให้ครบถ้วนก่อนพิมพ์สัญญา:<br><br>';
      
      if (missingOwnerFields.length > 0) {
        errorMessage += `<strong>ข้อมูลเจ้าของ:</strong><br>${missingOwnerFields.map(f => `• ${f}`).join('<br>')}<br><br>`;
      }
      
      if (missingTenantFields.length > 0) {
        errorMessage += `<strong>ข้อมูลผู้เช่า:</strong><br>${missingTenantFields.map(f => `• ${f}`).join('<br>')}<br><br>`;
      }
      
      errorMessage += 'กรุณาไปที่หน้า <strong>ตั้งค่า</strong> เพื่อกรอกข้อมูลให้ครบถ้วน';
      
      await Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกรายละเอียดของผู้เช่าและเจ้าของให้ครบถ้วน',
        html: errorMessage,
        confirmButtonText: 'เข้าใจแล้ว',
        confirmButtonColor: '#3085d6',
        allowOutsideClick: true,
        allowEscapeKey: true,
        allowEnterKey: true,
        showCloseButton: true,
        didClose: () => {
          // Ensure popup is closed when user clicks confirm or closes
          return;
        },
      });
      return;
    }

    // Format owner address
    const ownerAddressParts: string[] = [];
    if (ownerInfo.address) {
      if (ownerInfo.address.houseNumber) ownerAddressParts.push(`บ้านเลขที่ ${ownerInfo.address.houseNumber}`);
      if (ownerInfo.address.villageNumber) ownerAddressParts.push(`หมู่ที่ ${ownerInfo.address.villageNumber}`);
      if (ownerInfo.address.street) ownerAddressParts.push(`ถนน ${ownerInfo.address.street}`);
      if (ownerInfo.address.subDistrict) ownerAddressParts.push(ownerInfo.address.subDistrict);
      if (ownerInfo.address.district) ownerAddressParts.push(ownerInfo.address.district);
      if (ownerInfo.address.province) ownerAddressParts.push(ownerInfo.address.province);
      if (ownerInfo.address.postalCode) ownerAddressParts.push(ownerInfo.address.postalCode);
    }
    const ownerAddress = ownerAddressParts.length > 0 ? ownerAddressParts.join(', ') : '';

    // Format tenant address
    const tenantAddressParts: string[] = [];
    if (tenantInfo.address) {
      if (tenantInfo.address.houseNumber) tenantAddressParts.push(`บ้านเลขที่ ${tenantInfo.address.houseNumber}`);
      if (tenantInfo.address.villageNumber) tenantAddressParts.push(`หมู่ที่ ${tenantInfo.address.villageNumber}`);
      if (tenantInfo.address.street) tenantAddressParts.push(`ถนน ${tenantInfo.address.street}`);
      if (tenantInfo.address.subDistrict) tenantAddressParts.push(tenantInfo.address.subDistrict);
      if (tenantInfo.address.district) tenantAddressParts.push(tenantInfo.address.district);
      if (tenantInfo.address.province) tenantAddressParts.push(tenantInfo.address.province);
      if (tenantInfo.address.postalCode) tenantAddressParts.push(tenantInfo.address.postalCode);
    }
    const tenantAddress = tenantAddressParts.length > 0 ? tenantAddressParts.join(', ') : '';

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
      <p>คู่สัญญาฝ่ายที่ 1 (ผู้ให้เช่า): ${ownerInfo.name}</p>
      <p>ที่อยู่: ${ownerAddress || 'ไม่ระบุ'}</p>
      <p>โทรศัพท์: ${ownerInfo.phone}</p>
    </div>
    <div class="content">
      <p>คู่สัญญาฝ่ายที่ 2 (ผู้เช่า): ${tenantInfo.name}</p>
      <p>ที่อยู่: ${tenantAddress || 'ไม่ระบุ'}</p>
      <p>โทรศัพท์: ${tenantInfo.phone}</p>
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
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาตรวจสอบการตั้งค่า popup blocker',
      });
    }
  } catch (error) {
    console.error('Error generating contract document:', error);
    await Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถสร้างเอกสารสัญญาได้ กรุณาลองใหม่อีกครั้ง',
    });
  }
};

