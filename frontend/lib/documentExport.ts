import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Payment } from '@/types/finance';
import { Contract } from '@/types/contract';
import { Asset } from '@/types/asset';
import { User } from '@/types/user';
import { formatCurrency } from './utils';

export type DocumentType = 
  | 'monthly_summary' 
  | 'annual_summary' 
  | 'invoice' 
  | 'receipt' 
  | 'payment_report' 
  | 'contract_summary';

export type ExportFormat = 'excel' | 'pdf';

interface DocumentExportParams {
  type: DocumentType;
  format: ExportFormat;
  year?: string;
  month?: string;
  tenantId?: string;
  // Data will be fetched from backend later
  payments?: Payment[];
  contracts?: Contract[];
  assets?: Asset[];
  tenants?: User[];
  stats?: any;
}

/**
 * Generate Monthly Income Summary
 */
const generateMonthlySummary = (params: DocumentExportParams) => {
  try {
    const { year, month, stats } = params;
    
    // Parse month - format should be YYYY-MM
    let monthDate: Date;
    let monthName: string;
    
    if (month && month.match(/^\d{4}-\d{2}$/)) {
      monthDate = new Date(`${month}-01`);
      monthName = monthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    } else {
      monthDate = new Date();
      monthName = monthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    }
    
    const workbook = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['สรุปรายได้ประจำเดือน'],
      [`เดือน: ${monthName}`],
      [''],
      ['รายการ', 'จำนวนเงิน (บาท)'],
      ['รายได้รวมประจำเดือน', stats?.monthlyIncome || 0],
      ['รายได้ที่เก็บได้', stats?.collectedThisMonth || 0],
      ['รายได้ที่ค้างชำระ', stats?.overdueAmount || 0],
      ['จำนวนรายการค้างชำระ', stats?.overdueCount || 0],
      [''],
      ['จำนวนสินทรัพย์ทั้งหมด', stats?.totalAssets || 0],
      ['จำนวนสัญญาเช่า', stats?.totalContracts || 0],
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุป');
    
    // Payment Details Sheet (will be populated from backend)
    const paymentHeaders = [
      'ลำดับ',
      'สัญญาเลขที่',
      'ทรัพย์สิน',
      'ผู้เช่า',
      'ประเภท',
      'จำนวนเงิน',
      'กำหนดชำระ',
      'วันที่ชำระ',
      'สถานะ'
    ];
    
    const paymentSheet = XLSX.utils.aoa_to_sheet([paymentHeaders]);
    XLSX.utils.book_append_sheet(workbook, paymentSheet, 'รายละเอียดการชำระเงิน');
    
    return workbook;
  } catch (error) {
    console.error('Error generating monthly summary Excel:', error);
    throw new Error(`ไม่สามารถสร้างรายงาน Excel ได้: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate Annual Income Summary
 */
const generateAnnualSummary = (params: DocumentExportParams) => {
  const { year, stats } = params;
  
  const yearBE = year ? parseInt(year) + 543 : new Date().getFullYear() + 543;
  
  const workbook = XLSX.utils.book_new();
  
  // Summary Sheet
  const summaryData = [
    ['สรุปรายได้ประจำปี'],
    [`ปี: ${yearBE} (พ.ศ.)`],
    [''],
    ['รายการ', 'จำนวนเงิน (บาท)'],
    ['รายได้รวมประจำปี', stats?.monthlyIncome ? stats.monthlyIncome * 12 : 0],
    ['รายได้ที่เก็บได้ทั้งปี', 0], // Will be calculated from backend
    ['รายได้ที่ค้างชำระทั้งปี', 0], // Will be calculated from backend
    [''],
    ['จำนวนสินทรัพย์ทั้งหมด', stats?.totalAssets || 0],
    ['จำนวนสัญญาเช่า', stats?.totalContracts || 0],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุป');
  
  // Monthly Breakdown Sheet
  const monthlyHeaders = [
    'เดือน',
    'รายได้รวม',
    'รายได้ที่เก็บได้',
    'รายได้ที่ค้างชำระ',
    'จำนวนรายการค้างชำระ'
  ];
  
  const monthlySheet = XLSX.utils.aoa_to_sheet([monthlyHeaders]);
  XLSX.utils.book_append_sheet(workbook, monthlySheet, 'รายเดือน');
  
  return workbook;
};

/**
 * Generate Invoice
 */
const generateInvoice = (params: DocumentExportParams) => {
  const { month, tenantId, contracts, assets, tenants } = params;
  
  const monthDate = month ? new Date(`${month}-01`) : new Date();
  const monthName = monthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  
  const tenant = tenants?.find(t => t.id === tenantId);
  const contract = contracts?.find(c => c.tenantId === tenantId);
  const asset = contract ? assets?.find(a => a.id === contract.assetId) : null;
  
  const workbook = XLSX.utils.book_new();
  
  // Invoice Header
  const invoiceData = [
    ['ใบแจ้งหนี้'],
    [`เลขที่: INV-${month}-${tenantId?.substring(0, 4) || '0000'}`],
    [`วันที่ออก: ${new Date().toLocaleDateString('th-TH')}`],
    [''],
    ['ข้อมูลผู้เช่า'],
    ['ชื่อ-นามสกุล', tenant?.name || '-'],
    ['เบอร์โทรศัพท์', tenant?.phone || '-'],
    ['อีเมล', tenant?.email || '-'],
    [''],
    ['ข้อมูลทรัพย์สิน'],
    ['ชื่อทรัพย์สิน', asset?.name || contract?.assetName || '-'],
    ['ที่อยู่', asset ? `${asset.address}, ${asset.district}, ${asset.province}` : '-'],
    [''],
    ['รายการค่าเช่า'],
    ['เดือน', monthName],
    ['ค่าเช่า', contract?.rentAmount || 0],
    ['ค่าเช่าล่วงหน้า', contract?.deposit || 0],
    ['ค่าประกัน', contract?.insurance || 0],
    [''],
    ['รวมทั้งสิ้น', contract ? (contract.rentAmount + contract.deposit + contract.insurance) : 0],
  ];
  
  const invoiceSheet = XLSX.utils.aoa_to_sheet(invoiceData);
  XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'ใบแจ้งหนี้');
  
  // Payment History Sheet
  const paymentHeaders = [
    'ลำดับ',
    'เดือน',
    'จำนวนเงิน',
    'กำหนดชำระ',
    'วันที่ชำระ',
    'สถานะ'
  ];
  
  const paymentSheet = XLSX.utils.aoa_to_sheet([paymentHeaders]);
  XLSX.utils.book_append_sheet(workbook, paymentSheet, 'ประวัติการชำระเงิน');
  
  return workbook;
};

/**
 * Generate Receipt
 */
const generateReceipt = (params: DocumentExportParams) => {
  const { month, tenantId, contracts, assets, tenants, payments } = params;
  
  const monthDate = month ? new Date(`${month}-01`) : new Date();
  const monthName = monthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  
  const tenant = tenants?.find(t => t.id === tenantId);
  const contract = contracts?.find(c => c.tenantId === tenantId);
  const asset = contract ? assets?.find(a => a.id === contract.assetId) : null;
  const paidPayments = payments?.filter(p => 
    p.contractId === contract?.id && 
    p.status === 'paid' &&
    p.paidDate?.startsWith(month || '')
  ) || [];
  
  const workbook = XLSX.utils.book_new();
  
  // Receipt Header
  const receiptData = [
    ['ใบเสร็จรับเงิน'],
    [`เลขที่: RCP-${month}-${tenantId?.substring(0, 4) || '0000'}`],
    [`วันที่ออก: ${new Date().toLocaleDateString('th-TH')}`],
    [''],
    ['ข้อมูลผู้เช่า'],
    ['ชื่อ-นามสกุล', tenant?.name || '-'],
    ['เบอร์โทรศัพท์', tenant?.phone || '-'],
    [''],
    ['ข้อมูลทรัพย์สิน'],
    ['ชื่อทรัพย์สิน', asset?.name || contract?.assetName || '-'],
    ['ที่อยู่', asset ? `${asset.address}, ${asset.district}, ${asset.province}` : '-'],
    [''],
    ['รายการที่ชำระ'],
    ['เดือน', monthName],
  ];
  
  // Add payment details
  paidPayments.forEach((payment, index) => {
    receiptData.push([
      `รายการ ${index + 1}`,
      payment.type === 'rent' ? 'ค่าเช่า' : 
      payment.type === 'deposit' ? 'ค่าเช่าล่วงหน้า' : 
      payment.type === 'utility' ? 'ค่าน้ำ-ไฟ' : 'อื่นๆ',
      payment.amount.toString(),
      payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('th-TH') : '-'
    ]);
  });
  
  const totalAmount = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  receiptData.push(['']);
  receiptData.push(['รวมทั้งสิ้น', totalAmount.toString()]);
  
  const receiptSheet = XLSX.utils.aoa_to_sheet(receiptData);
  XLSX.utils.book_append_sheet(workbook, receiptSheet, 'ใบเสร็จ');
  
  return workbook;
};

/**
 * Generate Payment Report
 */
const generatePaymentReport = (params: DocumentExportParams) => {
  const { month, tenantId, contracts, assets, tenants, payments } = params;
  
  const monthDate = month ? new Date(`${month}-01`) : new Date();
  const monthName = monthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  
  const tenant = tenants?.find(t => t.id === tenantId);
  const contract = contracts?.find(c => c.tenantId === tenantId);
  const asset = contract ? assets?.find(a => a.id === contract.assetId) : null;
  const filteredPayments = payments?.filter(p => 
    p.contractId === contract?.id &&
    (month ? p.dueDate.startsWith(month) : true)
  ) || [];
  
  const workbook = XLSX.utils.book_new();
  
  // Summary Sheet
  const summaryData = [
    ['รายงานการชำระเงิน'],
    [`ผู้เช่า: ${tenant?.name || '-'}`],
    [`ทรัพย์สิน: ${asset?.name || contract?.assetName || '-'}`],
    [`เดือน: ${monthName}`],
    [''],
    ['รายการ', 'จำนวนเงิน (บาท)'],
    ['รวมทั้งหมด', filteredPayments.reduce((sum, p) => sum + p.amount, 0)],
    ['ชำระแล้ว', filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)],
    ['รอชำระ', filteredPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)],
    ['ค้างชำระ', filteredPayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0)],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุป');
  
  // Payment Details Sheet
  const paymentHeaders = [
    'ลำดับ',
    'ประเภท',
    'จำนวนเงิน',
    'กำหนดชำระ',
    'วันที่ชำระ',
    'สถานะ',
    'หมายเหตุ'
  ];
  
  const paymentRows = filteredPayments.map((payment, index) => [
    index + 1,
    payment.type === 'rent' ? 'ค่าเช่า' : 
    payment.type === 'deposit' ? 'ค่ามัดจำ' : 
    payment.type === 'utility' ? 'ค่าน้ำ-ไฟ' : 'อื่นๆ',
    payment.amount,
    new Date(payment.dueDate).toLocaleDateString('th-TH'),
    payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('th-TH') : '-',
    payment.status === 'paid' ? 'ชำระแล้ว' :
    payment.status === 'overdue' ? 'ค้างชำระ' : 'รอชำระ',
    ''
  ]);
  
  const paymentSheet = XLSX.utils.aoa_to_sheet([paymentHeaders, ...paymentRows]);
  XLSX.utils.book_append_sheet(workbook, paymentSheet, 'รายละเอียด');
  
  return workbook;
};

/**
 * Generate Contract Summary
 */
const generateContractSummary = (params: DocumentExportParams) => {
  const { tenantId, contracts, assets, tenants } = params;
  
  const tenant = tenants?.find(t => t.id === tenantId);
  const contract = contracts?.find(c => c.tenantId === tenantId);
  const asset = contract ? assets?.find(a => a.id === contract.assetId) : null;
  
  const workbook = XLSX.utils.book_new();
  
  // Contract Info Sheet
  const contractData = [
    ['สรุปสัญญาเช่า'],
    [`สัญญาเลขที่: ${contract?.id || '-'}`],
    [`วันที่สร้าง: ${contract ? new Date(contract.createdAt).toLocaleDateString('th-TH') : '-'}`],
    [''],
    ['ข้อมูลผู้เช่า'],
    ['ชื่อ-นามสกุล', tenant?.name || '-'],
    ['เบอร์โทรศัพท์', tenant?.phone || '-'],
    ['อีเมล', tenant?.email || '-'],
    [''],
    ['ข้อมูลทรัพย์สิน'],
    ['ชื่อทรัพย์สิน', asset?.name || contract?.assetName || '-'],
    ['ที่อยู่', asset ? `${asset.address}, ${asset.district}, ${asset.province}` : '-'],
    ['ขนาด', asset ? `${asset.size} ตร.ม.` : '-'],
    ['จำนวนห้อง', asset ? `${asset.rooms} ห้อง` : '-'],
    [''],
    ['รายละเอียดสัญญา'],
    ['วันที่เริ่มสัญญา', contract ? new Date(contract.startDate).toLocaleDateString('th-TH') : '-'],
    ['วันที่สิ้นสุดสัญญา', contract ? new Date(contract.endDate).toLocaleDateString('th-TH') : '-'],
    ['ค่าเช่าต่อเดือน', contract?.rentAmount || 0],
    ['ค่าเช่าล่วงหน้า', contract?.deposit || 0],
    ['ค่าประกัน', contract?.insurance || 0],
    ['สถานะ', contract?.status === 'active' ? 'ใช้งาน' : 
              contract?.status === 'expired' ? 'หมดอายุ' : 
              contract?.status === 'terminated' ? 'ยกเลิก' : 'รอดำเนินการ'],
  ];
  
  const contractSheet = XLSX.utils.aoa_to_sheet(contractData);
  XLSX.utils.book_append_sheet(workbook, contractSheet, 'ข้อมูลสัญญา');
  
  // Payment Schedule Sheet
  const scheduleHeaders = [
    'ลำดับ',
    'เดือน',
    'ค่าเช่า',
    'กำหนดชำระ',
    'สถานะ'
  ];
  
  const scheduleSheet = XLSX.utils.aoa_to_sheet([scheduleHeaders]);
  XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'ตารางการชำระเงิน');
  
  return workbook;
};

/**
 * Generate PDF for Monthly Income Summary using HTML
 */
const generateMonthlySummaryPDF = (params: DocumentExportParams) => {
  try {
    const { month, stats } = params;
    
    // Parse month - format should be YYYY-MM
    let monthDate: Date;
    let monthName: string;
    
    if (month && month.match(/^\d{4}-\d{2}$/)) {
      monthDate = new Date(`${month}-01`);
      monthName = monthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    } else {
      monthDate = new Date();
      monthName = monthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    }
    
    // Create HTML content
    const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>สรุปรายได้ประจำเดือน</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: 'Sarabun', 'Sukhumvit Set', 'Noto Sans Thai', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 15px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 10px 0;
      color: #1e40af;
    }
    .header p {
      margin: 5px 0;
      color: #666;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    table th {
      background-color: #2563eb;
      color: white;
      border: 1px solid #1e40af;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    table td {
      border: 1px solid #ddd;
      padding: 10px;
    }
    table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    table tr:hover {
      background-color: #e0e7ff;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 11px;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>สรุปรายได้ประจำเดือน</h1>
    <p>เดือน: ${monthName}</p>
    <p>วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>รายการ</th>
        <th>จำนวนเงิน (บาท)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>รายได้รวมประจำเดือน</td>
        <td>${formatCurrency(stats?.monthlyIncome || 0)}</td>
      </tr>
      <tr>
        <td>รายได้ที่เก็บได้</td>
        <td>${formatCurrency(stats?.collectedThisMonth || 0)}</td>
      </tr>
      <tr>
        <td>รายได้ที่ค้างชำระ</td>
        <td>${formatCurrency(stats?.overdueAmount || 0)}</td>
      </tr>
      <tr>
        <td>จำนวนรายการค้างชำระ</td>
        <td>${stats?.overdueCount || 0} รายการ</td>
      </tr>
      <tr>
        <td>จำนวนสินทรัพย์ทั้งหมด</td>
        <td>${stats?.totalAssets || 0} แห่ง</td>
      </tr>
      <tr>
        <td>จำนวนสัญญาเช่า</td>
        <td>${stats?.totalContracts || 0} สัญญา</td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <p>สร้างโดยระบบบริหารจัดการทรัพย์สิน</p>
  </div>
</body>
</html>
    `;
    
    // Create a new window and print
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาตรวจสอบ popup blocker');
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Close window after print dialog closes (user may cancel)
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 500);
    
    // Return a dummy jsPDF object for compatibility
    return new jsPDF();
  } catch (error) {
    console.error('Error generating monthly summary PDF:', error);
    throw new Error(`ไม่สามารถสร้างรายงาน PDF ได้: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate PDF for Annual Income Summary
 */
const generateAnnualSummaryPDF = (params: DocumentExportParams) => {
  const { year, stats } = params;
  const yearBE = year ? parseInt(year) + 543 : new Date().getFullYear() + 543;
  
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('สรุปรายได้ประจำปี', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`ปี: ${yearBE} (พ.ศ.)`, 105, 30, { align: 'center' });
  doc.text(`วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH')}`, 105, 37, { align: 'center' });
  
  // Summary Table
  const summaryData = [
    ['รายการ', 'จำนวนเงิน (บาท)'],
    ['รายได้รวมประจำปี', formatCurrency(stats?.monthlyIncome ? stats.monthlyIncome * 12 : 0)],
    ['รายได้ที่เก็บได้ทั้งปี', formatCurrency(0)], // Will be calculated from backend
    ['รายได้ที่ค้างชำระทั้งปี', formatCurrency(0)], // Will be calculated from backend
    ['จำนวนสินทรัพย์ทั้งหมด', `${stats?.totalAssets || 0} แห่ง`],
    ['จำนวนสัญญาเช่า', `${stats?.totalContracts || 0} สัญญา`],
  ];
  
  (doc as any).autoTable({
    startY: 45,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'Sarabun', fontSize: 11 },
  });
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`หน้า ${i} จาก ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
  }
  
  return doc;
};

/**
 * Generate PDF for Invoice
 */
const generateInvoicePDF = (params: DocumentExportParams) => {
  const { month, tenantId, contracts, assets, tenants } = params;
  const monthDate = month ? new Date(`${month}-01`) : new Date();
  const monthName = monthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  
  const tenant = tenants?.find(t => t.id === tenantId);
  const contract = contracts?.find(c => c.tenantId === tenantId);
  const asset = contract ? assets?.find(a => a.id === contract.assetId) : null;
  
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('ใบแจ้งหนี้', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`เลขที่: INV-${month}-${tenantId?.substring(0, 4) || '0000'}`, 20, 30);
  doc.text(`วันที่ออก: ${new Date().toLocaleDateString('th-TH')}`, 20, 37);
  
  // Tenant Info
  doc.setFontSize(12);
  doc.text('ข้อมูลผู้เช่า', 20, 50);
  doc.setFontSize(10);
  doc.text(`ชื่อ-นามสกุล: ${tenant?.name || '-'}`, 20, 58);
  doc.text(`เบอร์โทรศัพท์: ${tenant?.phone || '-'}`, 20, 65);
  doc.text(`อีเมล: ${tenant?.email || '-'}`, 20, 72);
  
  // Asset Info
  doc.setFontSize(12);
  doc.text('ข้อมูลทรัพย์สิน', 20, 85);
  doc.setFontSize(10);
  doc.text(`ชื่อทรัพย์สิน: ${asset?.name || contract?.assetName || '-'}`, 20, 93);
  doc.text(`ที่อยู่: ${asset ? `${asset.address}, ${asset.district}, ${asset.province}` : '-'}`, 20, 100);
  
  // Invoice Items
  const invoiceData = [
    ['รายการ', 'จำนวนเงิน (บาท)'],
    ['ค่าเช่า', formatCurrency(contract?.rentAmount || 0)],
    ['ค่ามัดจำ', formatCurrency(contract?.deposit || 0)],
    ['ค่าประกัน', formatCurrency(contract?.insurance || 0)],
    ['รวมทั้งสิ้น', formatCurrency(contract ? (contract.rentAmount + contract.deposit + contract.insurance) : 0)],
  ];
  
  (doc as any).autoTable({
    startY: 115,
    head: [invoiceData[0]],
    body: invoiceData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'Sarabun', fontSize: 11 },
  });
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`หน้า ${i} จาก ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
  }
  
  return doc;
};

/**
 * Generate PDF for Receipt
 */
const generateReceiptPDF = (params: DocumentExportParams) => {
  const { month, tenantId, contracts, assets, tenants, payments } = params;
  const monthDate = month ? new Date(`${month}-01`) : new Date();
  const monthName = monthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  
  const tenant = tenants?.find(t => t.id === tenantId);
  const contract = contracts?.find(c => c.tenantId === tenantId);
  const asset = contract ? assets?.find(a => a.id === contract.assetId) : null;
  const paidPayments = payments?.filter(p => 
    p.contractId === contract?.id && 
    p.status === 'paid' &&
    p.paidDate?.startsWith(month || '')
  ) || [];
  
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('ใบเสร็จรับเงิน', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`เลขที่: RCP-${month}-${tenantId?.substring(0, 4) || '0000'}`, 20, 30);
  doc.text(`วันที่ออก: ${new Date().toLocaleDateString('th-TH')}`, 20, 37);
  
  // Tenant Info
  doc.setFontSize(12);
  doc.text('ข้อมูลผู้เช่า', 20, 50);
  doc.setFontSize(10);
  doc.text(`ชื่อ-นามสกุล: ${tenant?.name || '-'}`, 20, 58);
  doc.text(`เบอร์โทรศัพท์: ${tenant?.phone || '-'}`, 20, 65);
  
  // Asset Info
  doc.setFontSize(12);
  doc.text('ข้อมูลทรัพย์สิน', 20, 78);
  doc.setFontSize(10);
  doc.text(`ชื่อทรัพย์สิน: ${asset?.name || contract?.assetName || '-'}`, 20, 86);
  doc.text(`ที่อยู่: ${asset ? `${asset.address}, ${asset.district}, ${asset.province}` : '-'}`, 20, 93);
  
  // Payment Items
  const paymentData = [
    ['ลำดับ', 'รายการ', 'จำนวนเงิน (บาท)', 'วันที่ชำระ'],
    ...paidPayments.map((payment, index) => [
      (index + 1).toString(),
      payment.type === 'rent' ? 'ค่าเช่า' : 
      payment.type === 'deposit' ? 'ค่าเช่าล่วงหน้า' : 
      payment.type === 'utility' ? 'ค่าน้ำ-ไฟ' : 'อื่นๆ',
      formatCurrency(payment.amount),
      payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('th-TH') : '-'
    ]),
    ['', 'รวมทั้งสิ้น', formatCurrency(paidPayments.reduce((sum, p) => sum + p.amount, 0)), '']
  ];
  
  (doc as any).autoTable({
    startY: 105,
    head: [paymentData[0]],
    body: paymentData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'Sarabun', fontSize: 11 },
  });
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`หน้า ${i} จาก ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
  }
  
  return doc;
};

/**
 * Generate PDF for Payment Report
 */
const generatePaymentReportPDF = (params: DocumentExportParams) => {
  const { month, tenantId, contracts, assets, tenants, payments } = params;
  const monthDate = month ? new Date(`${month}-01`) : new Date();
  const monthName = monthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  
  const tenant = tenants?.find(t => t.id === tenantId);
  const contract = contracts?.find(c => c.tenantId === tenantId);
  const asset = contract ? assets?.find(a => a.id === contract.assetId) : null;
  const filteredPayments = payments?.filter(p => 
    p.contractId === contract?.id &&
    (month ? p.dueDate.startsWith(month) : true)
  ) || [];
  
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('รายงานการชำระเงิน', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`ผู้เช่า: ${tenant?.name || '-'}`, 20, 30);
  doc.text(`ทรัพย์สิน: ${asset?.name || contract?.assetName || '-'}`, 20, 37);
  doc.text(`เดือน: ${monthName}`, 20, 44);
  doc.text(`วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH')}`, 20, 51);
  
  // Summary
  const summaryData = [
    ['รายการ', 'จำนวนเงิน (บาท)'],
    ['รวมทั้งหมด', formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0))],
    ['ชำระแล้ว', formatCurrency(filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0))],
    ['รอชำระ', formatCurrency(filteredPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0))],
    ['ค้างชำระ', formatCurrency(filteredPayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0))],
  ];
  
  (doc as any).autoTable({
    startY: 60,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'Sarabun', fontSize: 11 },
  });
  
  // Payment Details
  const paymentData = [
    ['ลำดับ', 'ประเภท', 'จำนวนเงิน', 'กำหนดชำระ', 'วันที่ชำระ', 'สถานะ'],
    ...filteredPayments.map((payment, index) => [
      (index + 1).toString(),
      payment.type === 'rent' ? 'ค่าเช่า' : 
      payment.type === 'deposit' ? 'ค่าเช่าล่วงหน้า' : 
      payment.type === 'utility' ? 'ค่าน้ำ-ไฟ' : 'อื่นๆ',
      formatCurrency(payment.amount),
      new Date(payment.dueDate).toLocaleDateString('th-TH'),
      payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('th-TH') : '-',
      payment.status === 'paid' ? 'ชำระแล้ว' :
      payment.status === 'overdue' ? 'ค้างชำระ' : 'รอชำระ'
    ])
  ];
  
  (doc as any).autoTable({
    startY: (doc as any).lastAutoTable.finalY + 15,
    head: [paymentData[0]],
    body: paymentData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'Sarabun', fontSize: 10 },
  });
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`หน้า ${i} จาก ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
  }
  
  return doc;
};

/**
 * Generate PDF for Contract Summary
 */
const generateContractSummaryPDF = (params: DocumentExportParams) => {
  const { tenantId, contracts, assets, tenants } = params;
  
  const tenant = tenants?.find(t => t.id === tenantId);
  const contract = contracts?.find(c => c.tenantId === tenantId);
  const asset = contract ? assets?.find(a => a.id === contract.assetId) : null;
  
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('สรุปสัญญาเช่า', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`สัญญาเลขที่: ${contract?.id || '-'}`, 20, 30);
  doc.text(`วันที่สร้าง: ${contract ? new Date(contract.createdAt).toLocaleDateString('th-TH') : '-'}`, 20, 37);
  
  // Tenant Info
  doc.setFontSize(12);
  doc.text('ข้อมูลผู้เช่า', 20, 50);
  doc.setFontSize(10);
  doc.text(`ชื่อ-นามสกุล: ${tenant?.name || '-'}`, 20, 58);
  doc.text(`เบอร์โทรศัพท์: ${tenant?.phone || '-'}`, 20, 65);
  doc.text(`อีเมล: ${tenant?.email || '-'}`, 20, 72);
  
  // Asset Info
  doc.setFontSize(12);
  doc.text('ข้อมูลทรัพย์สิน', 20, 85);
  doc.setFontSize(10);
  doc.text(`ชื่อทรัพย์สิน: ${asset?.name || contract?.assetName || '-'}`, 20, 93);
  doc.text(`ที่อยู่: ${asset ? `${asset.address}, ${asset.district}, ${asset.province}` : '-'}`, 20, 100);
  doc.text(`ขนาด: ${asset ? `${asset.size} ตร.ม.` : '-'}`, 20, 107);
  doc.text(`จำนวนห้อง: ${asset ? `${asset.rooms} ห้อง` : '-'}`, 20, 114);
  
  // Contract Details
  const contractData = [
    ['รายการ', 'รายละเอียด'],
    ['วันที่เริ่มสัญญา', contract ? new Date(contract.startDate).toLocaleDateString('th-TH') : '-'],
    ['วันที่สิ้นสุดสัญญา', contract ? new Date(contract.endDate).toLocaleDateString('th-TH') : '-'],
    ['ค่าเช่าต่อเดือน', formatCurrency(contract?.rentAmount || 0)],
    ['ค่ามัดจำ', formatCurrency(contract?.deposit || 0)],
    ['ค่าประกัน', formatCurrency(contract?.insurance || 0)],
    ['สถานะ', contract?.status === 'active' ? 'ใช้งาน' : 
              contract?.status === 'expired' ? 'หมดอายุ' : 
              contract?.status === 'terminated' ? 'ยกเลิก' : 'รอดำเนินการ'],
  ];
  
  (doc as any).autoTable({
    startY: 125,
    head: [contractData[0]],
    body: contractData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    styles: { font: 'Sarabun', fontSize: 11 },
  });
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`หน้า ${i} จาก ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
  }
  
  return doc;
};

/**
 * Main export function
 */
export const exportDocument = (params: DocumentExportParams) => {
  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0];
  const typeNames: Record<DocumentType, string> = {
    monthly_summary: 'สรุปรายได้ประจำเดือน',
    annual_summary: 'สรุปรายได้ประจำปี',
    invoice: 'ใบแจ้งหนี้',
    receipt: 'ใบเสร็จ',
    payment_report: 'รายงานการชำระเงิน',
    contract_summary: 'สรุปสัญญาเช่า'
  };
  
  // Export PDF
  if (params.format === 'pdf') {
    // For monthly_summary, use HTML to PDF (better Thai font support)
    if (params.type === 'monthly_summary') {
      generateMonthlySummaryPDF(params);
      return;
    }
    
    let doc: jsPDF;
    
    switch (params.type) {
      case 'annual_summary':
        doc = generateAnnualSummaryPDF(params);
        break;
      case 'invoice':
        doc = generateInvoicePDF(params);
        break;
      case 'receipt':
        doc = generateReceiptPDF(params);
        break;
      case 'payment_report':
        doc = generatePaymentReportPDF(params);
        break;
      case 'contract_summary':
        doc = generateContractSummaryPDF(params);
        break;
      default:
        throw new Error('Invalid document type');
    }
    
    const filename = `${typeNames[params.type]}_${dateStr}.pdf`;
    doc.save(filename);
    return;
  }
  
  // Export Excel/XLSX
  let workbook: XLSX.WorkBook;
  
  // Generate workbook based on document type
  switch (params.type) {
    case 'monthly_summary':
      workbook = generateMonthlySummary(params);
      break;
    case 'annual_summary':
      workbook = generateAnnualSummary(params);
      break;
    case 'invoice':
      workbook = generateInvoice(params);
      break;
    case 'receipt':
      workbook = generateReceipt(params);
      break;
    case 'payment_report':
      workbook = generatePaymentReport(params);
      break;
    case 'contract_summary':
      workbook = generateContractSummary(params);
      break;
    default:
      throw new Error('Invalid document type');
  }
  
  const filename = `${typeNames[params.type]}_${dateStr}.xls`;
  
  // Export Excel format
  XLSX.writeFile(workbook, filename, { bookType: 'xls' });
};

