import Swal from 'sweetalert2';
import { Contract } from '@/types/contract';
import { apiClient } from './api';
import { getStoredToken } from './auth';
import { generateContractDocument } from './contractDocument';

interface ContractFormData {
  assetId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  rentAmount: string;
  deposit: string;
  insurance: string;
  status: Contract['status'];
  description: string;
  notes: string;
}

export const showContractForm = async (
  contract?: Contract | null,
  defaultAssetId?: string
): Promise<Contract | null> => {
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

  // Load assets and users from API
  const allAssets = await apiClient.getAssets();
  const availableAssets = allAssets.filter((asset: any) => asset.status !== 'maintenance');
  const allUsers = await apiClient.getUsers();
  const tenants = allUsers.filter((user: any) => user.role === 'tenant');

  // Get selected asset if defaultAssetId is provided
  const selectedAssetForDisplay = defaultAssetId 
    ? allAssets.find((a: any) => a.id === defaultAssetId)
    : contract 
      ? allAssets.find((a: any) => a.id === contract.assetId)
      : null;

  // Initialize form data
  const initialData: ContractFormData = contract
    ? {
        assetId: contract.assetId,
        tenantId: contract.tenantId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rentAmount: contract.rentAmount.toString(),
        deposit: contract.deposit.toString(),
        insurance: contract.insurance.toString(),
        status: contract.status,
        description: '',
        notes: contract.notes || '',
      }
    : {
        assetId: defaultAssetId || '',
        tenantId: '',
        startDate: '',
        endDate: '',
        rentAmount: '',
        deposit: '',
        insurance: '',
        status: 'active',
        description: '',
        notes: '',
      };

  // Create asset options HTML
  const assetOptions = availableAssets
    .map(
      (asset) =>
        `<option value="${asset.id}" ${initialData.assetId === asset.id ? 'selected' : ''} ${defaultAssetId && asset.id === defaultAssetId ? 'disabled' : ''}>${asset.name} - ${asset.address}</option>`
    )
    .join('');

  // Create tenant options HTML
  const tenantOptions = tenants
    .map(
      (tenant) =>
        `<option value="${tenant.id}" ${initialData.tenantId === tenant.id ? 'selected' : ''}>${tenant.name} (${tenant.phone})</option>`
    )
    .join('');

  // Create status options HTML
  const statusOptions = [
    { value: 'active', label: 'ใช้งาน' },
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'expired', label: 'หมดอายุ' },
    { value: 'terminated', label: 'ยกเลิก' },
  ]
    .map(
      (status) =>
        `<option value="${status.value}" ${initialData.status === status.value ? 'selected' : ''}>${status.label}</option>`
    )
    .join('');

  // Asset field - show as input if defaultAssetId is provided, otherwise show as select
  const assetField = defaultAssetId && selectedAssetForDisplay
    ? `
      <label class="swal2-form-label">ทรัพย์สิน</label>
      <input 
        id="swal-assetId" 
        type="text" 
        class="swal2-form-input" 
        value="${selectedAssetForDisplay.name} - ${selectedAssetForDisplay.address}" 
        disabled>
      <input type="hidden" id="swal-assetId-hidden" value="${defaultAssetId}">
    `
    : `
      <label class="swal2-form-label">ทรัพย์สิน</label>
      <select id="swal-assetId" class="swal2-form-input">
        <option value="">เลือกทรัพย์สิน</option>
        ${assetOptions}
      </select>
    `;

  const { value: formValues } = await Swal.fire<ContractFormData>({
    title: contract ? 'แก้ไขสัญญาเช่า' : 'สร้างสัญญาเช่าใหม่',
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
            color: #6b7280;
            cursor: not-allowed;
          }
          .swal2-form-textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 14px;
            box-sizing: border-box;
            font-family: 'Sukhumvit Set', 'Noto Sans Thai', sans-serif;
            resize: vertical;
            line-height: 1.5;
          }
          .swal2-form-textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          .swal2-form-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .swal2-form-grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1rem;
          }
          @media (max-width: 768px) {
            .swal2-form-grid-2,
            .swal2-form-grid-3 {
              grid-template-columns: 1fr;
            }
          }
        </style>
        
        <div class="swal2-form-group">
          ${assetField}
        </div>
        
        <div class="swal2-form-group">
          <label class="swal2-form-label">ผู้เช่า</label>
          <select id="swal-tenantId" class="swal2-form-input" ${contract ? 'disabled' : ''}>
            <option value="">เลือกผู้เช่า</option>
            ${tenantOptions}
          </select>
        </div>
        
        <div class="swal2-form-grid-2">
          <div class="swal2-form-group">
            <label class="swal2-form-label">วันที่เริ่มต้น</label>
            <input id="swal-startDate" type="date" class="swal2-form-input" value="${initialData.startDate}">
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">วันที่สิ้นสุด</label>
            <input id="swal-endDate" type="date" class="swal2-form-input" value="${initialData.endDate}" min="${initialData.startDate || ''}">
          </div>
        </div>
        <script>
          (function() {
            const startDateInput = document.getElementById('swal-startDate');
            const endDateInput = document.getElementById('swal-endDate');
            
            if (startDateInput && endDateInput) {
              startDateInput.addEventListener('change', function() {
                if (this.value) {
                  endDateInput.min = this.value;
                  if (endDateInput.value && endDateInput.value < this.value) {
                    endDateInput.value = '';
                  }
                }
              });
              
              endDateInput.addEventListener('change', function() {
                if (startDateInput.value && this.value && this.value < startDateInput.value) {
                  this.value = '';
                  Swal.showValidationMessage('วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น');
                }
              });
            }
          })();
        </script>
        
        <div class="swal2-form-grid-3">
          <div class="swal2-form-group">
            <label class="swal2-form-label">ค่าเช่า (บาท/เดือน)</label>
            <input id="swal-rentAmount" type="number" class="swal2-form-input" value="${initialData.rentAmount}" placeholder="0" min="0" step="0.01">
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">ค่าเช่าล่วงหน้า (บาท)</label>
            <input id="swal-deposit" type="number" class="swal2-form-input" value="${initialData.deposit}" placeholder="0" min="0" step="0.01">
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">ค่าประกัน (บาท)</label>
            <input id="swal-insurance" type="number" class="swal2-form-input" value="${initialData.insurance}" placeholder="0" min="0" step="0.01">
          </div>
        </div>
        
        <div class="swal2-form-group">
          <label class="swal2-form-label">สถานะ</label>
          <select id="swal-status" class="swal2-form-input">
            ${statusOptions}
          </select>
        </div>
        
        <div class="swal2-form-group">
          <label class="swal2-form-label">รายละเอียด</label>
          <textarea id="swal-description" class="swal2-form-textarea" placeholder="รายละเอียดสัญญาเช่า" style="min-height: 100px;">${initialData.description}</textarea>
        </div>
        
        <div class="swal2-form-group" style="margin-bottom: 0;">
          <label class="swal2-form-label">หมายเหตุ (ถ้ามี)</label>
          <textarea id="swal-notes" class="swal2-form-textarea" placeholder="หมายเหตุเพิ่มเติม" style="min-height: 80px;">${initialData.notes}</textarea>
        </div>
      </div>
    `,
    width: '850px',
    padding: '2rem',
    customClass: {
      popup: 'swal2-popup-custom',
      htmlContainer: 'swal2-html-container-custom',
    },
    showCancelButton: true,
    confirmButtonText: contract ? 'บันทึกการแก้ไข' : 'สร้างสัญญา',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    focusConfirm: false,
    preConfirm: () => {
      // Get assetId - check hidden input first if defaultAssetId was provided
      const hiddenAssetId = (document.getElementById('swal-assetId-hidden') as HTMLInputElement)?.value;
      const selectAssetId = (document.getElementById('swal-assetId') as HTMLSelectElement)?.value;
      const assetId = hiddenAssetId || selectAssetId || '';
      
      const tenantId = (document.getElementById('swal-tenantId') as HTMLSelectElement)?.value || '';
      const startDate = (document.getElementById('swal-startDate') as HTMLInputElement)?.value || '';
      const endDate = (document.getElementById('swal-endDate') as HTMLInputElement)?.value || '';
      const rentAmount = (document.getElementById('swal-rentAmount') as HTMLInputElement)?.value || '';
      const deposit = (document.getElementById('swal-deposit') as HTMLInputElement)?.value || '';
      const insurance = (document.getElementById('swal-insurance') as HTMLInputElement)?.value || '';
      const status = (document.getElementById('swal-status') as HTMLSelectElement)?.value as Contract['status'] || 'active';
      const description = (document.getElementById('swal-description') as HTMLTextAreaElement)?.value || '';
      const notes = (document.getElementById('swal-notes') as HTMLTextAreaElement)?.value || '';

      // Validation
      if (!assetId) {
        Swal.showValidationMessage('กรุณาเลือกทรัพย์สิน');
        return false;
      }

      if (!tenantId) {
        Swal.showValidationMessage('กรุณาเลือกผู้เช่า');
        return false;
      }

      if (!startDate) {
        Swal.showValidationMessage('กรุณาระบุวันที่เริ่มต้น');
        return false;
      }

      if (!endDate) {
        Swal.showValidationMessage('กรุณาระบุวันที่สิ้นสุด');
        return false;
      }

      if (new Date(startDate) >= new Date(endDate)) {
        Swal.showValidationMessage('วันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้น');
        return false;
      }

      if (!rentAmount || parseFloat(rentAmount) <= 0) {
        Swal.showValidationMessage('กรุณาระบุค่าเช่าที่ถูกต้อง');
        return false;
      }

      if (!deposit || parseFloat(deposit) < 0) {
        Swal.showValidationMessage('กรุณาระบุค่าเช่าล่วงหน้าที่ถูกต้อง');
        return false;
      }
      
      // Validate: deposit should not exceed rentAmount (max 1 month advance)
      if (deposit && rentAmount) {
        const depositAmount = parseFloat(deposit);
        const rentAmountNum = parseFloat(rentAmount);
        if (depositAmount > rentAmountNum) {
          Swal.showValidationMessage('ค่าเช่าล่วงหน้าไม่สามารถเกินค่าเช่าต่อเดือนได้ (สูงสุด 1 เดือน)');
          return false;
        }
      }

      if (!insurance || parseFloat(insurance) < 0) {
        Swal.showValidationMessage('กรุณาระบุค่าประกันที่ถูกต้อง');
        return false;
      }

      return {
        assetId,
        tenantId,
        startDate,
        endDate,
        rentAmount,
        deposit,
        insurance,
        status,
        description,
        notes,
      };
    },
  });

  if (!formValues) {
    return null;
  }

  try {
    const selectedAsset = allAssets.find((a: any) => a.id === formValues.assetId);
    const selectedTenant = tenants.find((u: any) => u.id === formValues.tenantId);

    if (!selectedAsset || !selectedTenant) {
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่พบข้อมูลทรัพย์สินหรือผู้เช่า',
      });
      return null;
    }

    // Check if there's an active contract for this asset
    if ((!contract || formValues.status === 'active') && formValues.status === 'active') {
      const allContracts = await apiClient.getContracts();
      const activeContract = allContracts.find((c: any) => 
        c.assetId === formValues.assetId && c.status === 'active' && c.id !== contract?.id
      );
      if (activeContract) {
        const result = await Swal.fire({
          icon: 'warning',
          title: 'มีสัญญาใช้งานอยู่แล้ว',
          text: `ทรัพย์สินนี้มีสัญญาที่ใช้งานอยู่แล้ว (สัญญาเลขที่ ${activeContract.contractNumber || activeContract.id}) ต้องการปิดสัญญาเดิมและสร้างสัญญาใหม่หรือไม่?`,
          showCancelButton: true,
          confirmButtonText: 'ใช่, ปิดสัญญาเดิม',
          cancelButtonText: 'ยกเลิก',
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
        });

        if (!result.isConfirmed) {
          return null;
        }
        
        // Terminate existing contract
        await apiClient.updateContract(activeContract.id, { status: 'terminated' });
      }
    }

    // Combine description and notes
    const combinedNotes = [
      formValues.description ? `รายละเอียด: ${formValues.description}` : '',
      formValues.notes ? `หมายเหตุ: ${formValues.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const contractData = {
      assetId: formValues.assetId,
      tenantId: formValues.tenantId,
      startDate: formValues.startDate,
      endDate: formValues.endDate,
      rentAmount: parseFloat(formValues.rentAmount),
      deposit: parseFloat(formValues.deposit),
      insurance: parseFloat(formValues.insurance),
      status: formValues.status,
      documents: contract?.documents || [],
      notes: combinedNotes || undefined,
    };

    let savedContract: Contract;

    if (contract) {
      savedContract = await apiClient.updateContract(contract.id, contractData);
      await Swal.fire({
        icon: 'success',
        title: 'อัปเดตสัญญาเรียบร้อย',
        text: 'ข้อมูลสัญญาได้รับการอัปเดตแล้ว',
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      savedContract = await apiClient.createContract(contractData);
      
      // Generate contract document automatically for new contracts
      const result = await Swal.fire({
        icon: 'success',
        title: 'สร้างสัญญาเรียบร้อย',
        text: 'สัญญาใหม่ได้รับการสร้างแล้ว ต้องการเปิดเอกสารสัญญาหรือไม่?',
        showCancelButton: true,
        confirmButtonText: 'เปิดเอกสารสัญญา',
        cancelButtonText: 'ปิด',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6b7280',
      });

      if (result.isConfirmed) {
        // Generate and open contract document
        await generateContractDocument(savedContract, selectedAsset);
      }
    }

    return savedContract;
  } catch (error) {
    await Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถบันทึกข้อมูลได้',
    });
    return null;
  }
};

