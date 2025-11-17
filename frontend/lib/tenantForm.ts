import Swal from 'sweetalert2';
import { User } from '@/types/user';
import { apiClient } from './api';
import { getStoredToken } from './auth';

interface TenantFormData {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  houseNumber: string;
  villageNumber: string;
  street: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
}

export const showTenantForm = async (
  tenant?: User | null
): Promise<User | null> => {
  // Get tenant address from mockData (if exists)
  const tenantAddress = tenant ? (tenant as any).address : null;
  
  const initialData: TenantFormData = tenant
    ? {
        name: tenant.name,
        phone: tenant.phone,
        email: tenant.email || '',
        password: '',
        confirmPassword: '',
        houseNumber: tenantAddress?.houseNumber || '',
        villageNumber: tenantAddress?.villageNumber || '',
        street: tenantAddress?.street || '',
        subDistrict: tenantAddress?.subDistrict || '',
        district: tenantAddress?.district || '',
        province: tenantAddress?.province || '',
        postalCode: tenantAddress?.postalCode || '',
      }
    : {
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        houseNumber: '',
        villageNumber: '',
        street: '',
        subDistrict: '',
        district: '',
        province: '',
        postalCode: '',
      };

  const { value: formValues } = await Swal.fire<TenantFormData>({
    title: tenant ? 'แก้ไขข้อมูลผู้เช่า' : 'เพิ่มผู้เช่าใหม่',
    html: `
      <div style="text-align: left; max-width: 100%; margin: 0; padding: 0;">
        <style>
          .swal2-form-group {
            margin-bottom: 1.5rem;
          }
          .swal2-form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            line-height: 1.5;
          }
          .swal2-form-input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 14px;
            box-sizing: border-box;
            transition: border-color 0.2s, box-shadow 0.2s;
            font-family: 'Sukhumvit Set', 'Noto Sans Thai', sans-serif;
          }
          .swal2-form-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          .swal2-form-input:disabled {
            background-color: #f3f4f6;
            cursor: not-allowed;
          }
        </style>
        
        <div class="swal2-form-group">
          <label class="swal2-form-label">ชื่อ-นามสกุล *</label>
          <input id="swal-name" type="text" class="swal2-form-input" value="${initialData.name}" placeholder="ชื่อ-นามสกุล">
        </div>
        
        <div class="swal2-form-group">
          <label class="swal2-form-label">เบอร์โทรศัพท์ *</label>
          <input id="swal-phone" type="tel" class="swal2-form-input" value="${initialData.phone}" placeholder="เช่น 0812345678" ${tenant ? 'disabled' : ''}>
        </div>
        
        <div class="swal2-form-group">
          <label class="swal2-form-label">อีเมล</label>
          <input id="swal-email" type="email" class="swal2-form-input" value="${initialData.email}" placeholder="เช่น tenant@example.com">
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; margin: 1.5rem 0; padding-top: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; font-size: 16px; font-weight: 600; color: #111827;">ที่อยู่ (สำหรับระบุในสัญญาเช่า)</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="swal2-form-group">
              <label class="swal2-form-label">บ้านเลขที่ *</label>
              <input id="swal-houseNumber" type="text" class="swal2-form-input" value="${initialData.houseNumber}" placeholder="เช่น 123">
            </div>
            
            <div class="swal2-form-group">
              <label class="swal2-form-label">หมู่ที่</label>
              <input id="swal-villageNumber" type="text" class="swal2-form-input" value="${initialData.villageNumber}" placeholder="เช่น 5">
            </div>
          </div>
          
          <div class="swal2-form-group">
            <label class="swal2-form-label">ถนน</label>
            <input id="swal-street" type="text" class="swal2-form-input" value="${initialData.street}" placeholder="เช่น ถนนสุขุมวิท">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="swal2-form-group">
              <label class="swal2-form-label">ตำบล/แขวง *</label>
              <input id="swal-subDistrict" type="text" class="swal2-form-input" value="${initialData.subDistrict}" placeholder="เช่น คลองตัน">
            </div>
            
            <div class="swal2-form-group">
              <label class="swal2-form-label">อำเภอ/เขต *</label>
              <input id="swal-district" type="text" class="swal2-form-input" value="${initialData.district}" placeholder="เช่น เขตคลองตัน">
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="swal2-form-group">
              <label class="swal2-form-label">จังหวัด *</label>
              <input id="swal-province" type="text" class="swal2-form-input" value="${initialData.province}" placeholder="เช่น กรุงเทพมหานคร">
            </div>
            
            <div class="swal2-form-group">
              <label class="swal2-form-label">รหัสไปรษณีย์ *</label>
              <input id="swal-postalCode" type="text" class="swal2-form-input" value="${initialData.postalCode}" placeholder="เช่น 10110" maxlength="5">
            </div>
          </div>
        </div>
        
        ${!tenant ? `
        <div class="swal2-form-group">
          <label class="swal2-form-label">รหัสผ่าน *</label>
          <input id="swal-password" type="password" class="swal2-form-input" placeholder="รหัสผ่าน">
        </div>
        
        <div class="swal2-form-group">
          <label class="swal2-form-label">ยืนยันรหัสผ่าน *</label>
          <input id="swal-confirmPassword" type="password" class="swal2-form-input" placeholder="ยืนยันรหัสผ่าน">
        </div>
        ` : `
        <div class="swal2-form-group">
          <label class="swal2-form-label">รหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)</label>
          <input id="swal-password" type="password" class="swal2-form-input" placeholder="รหัสผ่านใหม่">
        </div>
        
        <div class="swal2-form-group">
          <label class="swal2-form-label">ยืนยันรหัสผ่านใหม่</label>
          <input id="swal-confirmPassword" type="password" class="swal2-form-input" placeholder="ยืนยันรหัสผ่านใหม่">
        </div>
        `}
      </div>
    `,
    width: '700px',
    showCancelButton: true,
    confirmButtonText: tenant ? 'บันทึก' : 'เพิ่มผู้เช่า',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280',
    preConfirm: () => {
      const name = (document.getElementById('swal-name') as HTMLInputElement)?.value.trim();
      const phone = (document.getElementById('swal-phone') as HTMLInputElement)?.value.trim();
      const email = (document.getElementById('swal-email') as HTMLInputElement)?.value.trim();
      const password = (document.getElementById('swal-password') as HTMLInputElement)?.value;
      const confirmPassword = (document.getElementById('swal-confirmPassword') as HTMLInputElement)?.value;
      const houseNumber = (document.getElementById('swal-houseNumber') as HTMLInputElement)?.value.trim();
      const villageNumber = (document.getElementById('swal-villageNumber') as HTMLInputElement)?.value.trim();
      const street = (document.getElementById('swal-street') as HTMLInputElement)?.value.trim();
      const subDistrict = (document.getElementById('swal-subDistrict') as HTMLInputElement)?.value.trim();
      const district = (document.getElementById('swal-district') as HTMLInputElement)?.value.trim();
      const province = (document.getElementById('swal-province') as HTMLInputElement)?.value.trim();
      const postalCode = (document.getElementById('swal-postalCode') as HTMLInputElement)?.value.trim();

      if (!name) {
        Swal.showValidationMessage('กรุณากรอกชื่อ-นามสกุล');
        return false;
      }

      if (!phone) {
        Swal.showValidationMessage('กรุณากรอกเบอร์โทรศัพท์');
        return false;
      }

      // Validate address fields
      if (!houseNumber) {
        Swal.showValidationMessage('กรุณากรอกบ้านเลขที่');
        return false;
      }

      if (!subDistrict) {
        Swal.showValidationMessage('กรุณากรอกตำบล/แขวง');
        return false;
      }

      if (!district) {
        Swal.showValidationMessage('กรุณากรอกอำเภอ/เขต');
        return false;
      }

      if (!province) {
        Swal.showValidationMessage('กรุณากรอกจังหวัด');
        return false;
      }

      if (!postalCode) {
        Swal.showValidationMessage('กรุณากรอกรหัสไปรษณีย์');
        return false;
      }

      if (postalCode.length !== 5 || !/^\d+$/.test(postalCode)) {
        Swal.showValidationMessage('รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก');
        return false;
      }

      // Phone validation will be done by backend

      // Validate password (only for new tenants or if password is provided)
      if (!tenant) {
        if (!password) {
          Swal.showValidationMessage('กรุณากรอกรหัสผ่าน');
          return false;
        }
        if (password.length < 6) {
          Swal.showValidationMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
          return false;
        }
        if (password !== confirmPassword) {
          Swal.showValidationMessage('รหัสผ่านไม่ตรงกัน');
          return false;
        }
      } else {
        // For editing, password is optional
        if (password || confirmPassword) {
          if (password.length < 6) {
            Swal.showValidationMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return false;
          }
          if (password !== confirmPassword) {
            Swal.showValidationMessage('รหัสผ่านไม่ตรงกัน');
            return false;
          }
        }
      }

      return {
        name,
        phone,
        email,
        password: password || undefined,
        confirmPassword: confirmPassword || undefined,
        houseNumber,
        villageNumber,
        street,
        subDistrict,
        district,
        province,
        postalCode,
      };
    },
  });

  if (!formValues) return null;

  const token = getStoredToken();
  if (!token) {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'กรุณาเข้าสู่ระบบใหม่',
    });
    return null;
  }
  apiClient.setToken(token);

  try {
    // Create or update tenant with address
    const address = {
      houseNumber: formValues.houseNumber,
      villageNumber: formValues.villageNumber,
      street: formValues.street,
      subDistrict: formValues.subDistrict,
      district: formValues.district,
      province: formValues.province,
      postalCode: formValues.postalCode,
    };

    const tenantData: any = {
      name: formValues.name,
      email: formValues.email || undefined,
      address,
    };

    if (tenant) {
      if (formValues.password) {
        tenantData.password = formValues.password;
      }
      const updatedTenant = await apiClient.updateUser(tenant.id, tenantData);
      await Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: 'ข้อมูลผู้เช่าถูกอัปเดตแล้ว',
        timer: 2000,
        showConfirmButton: false,
      });
      return updatedTenant;
    } else {
      tenantData.phone = formValues.phone;
      tenantData.password = formValues.password!;
      tenantData.role = 'tenant';
      const newTenant = await apiClient.createUser(tenantData);
      await Swal.fire({
        icon: 'success',
        title: 'เพิ่มผู้เช่าสำเร็จ',
        text: `ผู้เช่า "${formValues.name}" ถูกเพิ่มแล้ว`,
        timer: 2000,
        showConfirmButton: false,
      });
      return newTenant;
    }
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
    });
    return null;
  }
};

export const showTenantDetail = async (tenant: User): Promise<void> => {
  const token = getStoredToken();
  if (!token) {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'กรุณาเข้าสู่ระบบใหม่',
    });
    return;
  }
  apiClient.setToken(token);

  try {
    // Get tenant's contracts from API
    const allContracts = await apiClient.getContracts();
    const tenantContracts = allContracts.filter((c: any) => c.tenantId === tenant.id);
    
    // Get assets for each contract
    const allAssets = await apiClient.getAssets();
    const contractDetails = tenantContracts.map((contract: any) => {
      const asset = allAssets.find((a: any) => a.id === contract.assetId);
      return {
        contract,
        asset,
      };
    });

  // Format contracts HTML
  const contractsHTML = contractDetails.length > 0
    ? contractDetails.map(({ contract, asset }) => `
        <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
            <div>
              <h4 style="margin: 0; font-weight: 600; color: #111827;">${asset?.name || 'ไม่มีชื่อทรัพย์สิน'}</h4>
              <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; color: #6b7280;">${asset?.address || '-'}</p>
            </div>
            <span style="padding: 0.25rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 500; 
              ${contract.status === 'active' ? 'background-color: #dbeafe; color: #1e40af;' : ''}
              ${contract.status === 'expired' ? 'background-color: #fee2e2; color: #991b1b;' : ''}
              ${contract.status === 'terminated' ? 'background-color: #f3f4f6; color: #374151;' : ''}
              ${contract.status === 'pending' ? 'background-color: #fef3c7; color: #92400e;' : ''}
            ">
              ${contract.status === 'active' ? 'ใช้งาน' : contract.status === 'expired' ? 'หมดอายุ' : contract.status === 'terminated' ? 'ยกเลิก' : 'รอดำเนินการ'}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.875rem;">
            <div>
              <span style="color: #6b7280;">ค่าเช่า:</span>
              <span style="color: #111827; font-weight: 500; margin-left: 0.5rem;">฿${contract.rentAmount.toLocaleString()}/เดือน</span>
            </div>
            <div>
              <span style="color: #6b7280;">วันที่เริ่ม:</span>
              <span style="color: #111827; font-weight: 500; margin-left: 0.5rem;">${new Date(contract.startDate).toLocaleDateString('th-TH')}</span>
            </div>
            <div>
              <span style="color: #6b7280;">วันที่สิ้นสุด:</span>
              <span style="color: #111827; font-weight: 500; margin-left: 0.5rem;">${new Date(contract.endDate).toLocaleDateString('th-TH')}</span>
            </div>
            <div>
              <span style="color: #6b7280;">เงินมัดจำ:</span>
              <span style="color: #111827; font-weight: 500; margin-left: 0.5rem;">฿${contract.deposit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      `).join('')
    : '<p style="text-align: center; color: #6b7280; padding: 1rem;">ไม่มีสัญญาเช่า</p>';

  await Swal.fire({
    title: 'รายละเอียดผู้เช่า',
    html: `
      <div style="text-align: left; max-width: 100%; margin: 0; padding: 0;">
        <style>
          .swal2-detail-section {
            margin-bottom: 1.5rem;
          }
          .swal2-detail-label {
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            margin-bottom: 0.25rem;
            display: block;
          }
          .swal2-detail-value {
            color: #111827;
            font-size: 14px;
            margin-bottom: 0.75rem;
          }
        </style>
        
        <div class="swal2-detail-section">
          <span class="swal2-detail-label">ชื่อ-นามสกุล</span>
          <div class="swal2-detail-value">${tenant.name}</div>
        </div>
        
        <div class="swal2-detail-section">
          <span class="swal2-detail-label">เบอร์โทรศัพท์</span>
          <div class="swal2-detail-value">${tenant.phone}</div>
        </div>
        
        <div class="swal2-detail-section">
          <span class="swal2-detail-label">อีเมล</span>
          <div class="swal2-detail-value">${tenant.email || '-'}</div>
        </div>
        
        <div class="swal2-detail-section">
          <span class="swal2-detail-label">Username</span>
          <div class="swal2-detail-value">${tenant.phone}</div>
        </div>
        
        ${(tenant as any).address ? `
        <div class="swal2-detail-section" style="margin-top: 1.5rem; border-top: 1px solid #e5e7eb; padding-top: 1rem;">
          <span class="swal2-detail-label" style="margin-bottom: 0.75rem; display: block; font-size: 16px;">ที่อยู่</span>
          <div class="swal2-detail-value" style="line-height: 1.8;">
            ${(tenant as any).address.houseNumber}${(tenant as any).address.villageNumber ? ` หมู่ ${(tenant as any).address.villageNumber}` : ''}${(tenant as any).address.street ? ` ${(tenant as any).address.street}` : ''}<br>
            ${(tenant as any).address.subDistrict} ${(tenant as any).address.district}<br>
            ${(tenant as any).address.province} ${(tenant as any).address.postalCode}
          </div>
        </div>
        ` : ''}
        
        <div class="swal2-detail-section" style="margin-top: 1.5rem;">
          <span class="swal2-detail-label" style="margin-bottom: 0.75rem; display: block;">สัญญาเช่า (${contractDetails.length})</span>
          <div style="max-height: 400px; overflow-y: auto;">
            ${contractsHTML}
          </div>
        </div>
      </div>
    `,
    width: '700px',
    showConfirmButton: true,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#3b82f6',
  });
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message || 'ไม่สามารถโหลดข้อมูลได้',
    });
  }
};

