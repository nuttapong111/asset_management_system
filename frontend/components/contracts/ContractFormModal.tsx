'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Select, SelectItem } from '@heroui/react';
import { Contract } from '@/types/contract';
import { Asset } from '@/types/asset';
import { User } from '@/types/user';
import { apiClient } from '@/lib/api';
import { getStoredToken } from '@/lib/auth';
import Swal from 'sweetalert2';

interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract?: Contract | null;
  onSuccess: () => void;
  defaultAssetId?: string;
}

export default function ContractFormModal({ isOpen, onClose, contract, onSuccess, defaultAssetId }: ContractFormModalProps) {
  console.log('ContractFormModal render', { isOpen, contract, defaultAssetId });
  const [formData, setFormData] = useState({
    assetId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    deposit: '',
    insurance: '',
    status: 'active' as Contract['status'],
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [tenants, setTenants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Load assets and tenants from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = getStoredToken();
        if (!token) return;
        apiClient.setToken(token);
        
        const [assetsData, usersData] = await Promise.all([
          apiClient.getAssets(),
          apiClient.getUsers(),
        ]);
        
        setAvailableAssets(assetsData.filter((asset: Asset) => asset.status !== 'maintenance'));
        setTenants(usersData.filter((user: User) => user.role === 'tenant'));
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (contract) {
      setFormData({
        assetId: contract.assetId,
        tenantId: contract.tenantId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rentAmount: contract.rentAmount.toString(),
        deposit: contract.deposit.toString(),
        insurance: contract.insurance.toString(),
        status: contract.status,
        notes: contract.notes || '',
      });
    } else {
      setFormData({
        assetId: defaultAssetId || '',
        tenantId: '',
        startDate: '',
        endDate: '',
        rentAmount: '',
        deposit: '',
        insurance: '',
        status: 'active',
        notes: '',
      });
    }
    setErrors({});
  }, [contract, isOpen, defaultAssetId]);

  // Update min attribute on end date input when start date changes
  useEffect(() => {
    if (!isOpen) return;
    
    // Use setTimeout to ensure DOM is ready
    const timer = setTimeout(() => {
      // Find the native input element inside the HeroUI Input component
      // Try multiple selectors to find the date input
      const selectors = [
        'input[type="date"]',
        'input[aria-label*="วันที่สิ้นสุด"]',
        'input[placeholder*="วันที่สิ้นสุด"]',
      ];
      
      let endDateInput: HTMLInputElement | null = null;
      for (const selector of selectors) {
        const inputs = document.querySelectorAll(selector);
        // Find the one that's for end date (usually the second date input)
        if (inputs.length >= 2) {
          endDateInput = inputs[1] as HTMLInputElement;
          break;
        } else if (inputs.length === 1 && selector.includes('วันที่สิ้นสุด')) {
          endDateInput = inputs[0] as HTMLInputElement;
          break;
        }
      }
      
      if (endDateInput) {
        if (formData.startDate) {
          endDateInput.setAttribute('min', formData.startDate);
          // Also set it via property
          endDateInput.min = formData.startDate;
        } else {
          endDateInput.removeAttribute('min');
          endDateInput.min = '';
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [formData.startDate, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.assetId) {
      newErrors.assetId = 'กรุณาเลือกทรัพย์สิน';
    }

    if (!formData.tenantId) {
      newErrors.tenantId = 'กรุณาเลือกผู้เช่า';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'กรุณาระบุวันที่เริ่มต้น';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'กรุณาระบุวันที่สิ้นสุด';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'วันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้น';
    }

    if (!formData.rentAmount || parseFloat(formData.rentAmount) <= 0) {
      newErrors.rentAmount = 'กรุณาระบุค่าเช่าที่ถูกต้อง';
    }

    if (!formData.deposit || parseFloat(formData.deposit) < 0) {
      newErrors.deposit = 'กรุณาระบุค่าเช่าล่วงหน้าที่ถูกต้อง';
    }
    
    // Validate: deposit should not exceed rentAmount (max 1 month advance)
    if (formData.deposit && formData.rentAmount) {
      const depositAmount = parseFloat(formData.deposit);
      const rentAmount = parseFloat(formData.rentAmount);
      if (depositAmount > rentAmount) {
        newErrors.deposit = 'ค่าเช่าล่วงหน้าไม่สามารถเกินค่าเช่าต่อเดือนได้ (สูงสุด 1 เดือน)';
      }
    }

    if (!formData.insurance || parseFloat(formData.insurance) < 0) {
      newErrors.insurance = 'กรุณาระบุค่าประกันที่ถูกต้อง';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const token = getStoredToken();
      if (!token) return;
      apiClient.setToken(token);

      const selectedAsset = availableAssets.find((a: Asset) => a.id === formData.assetId);
      const selectedTenant = tenants.find((u: User) => u.id === formData.tenantId);

      if (!selectedAsset || !selectedTenant) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่พบข้อมูลทรัพย์สินหรือผู้เช่า',
        });
        return;
      }

      // Check if there's an active contract for this asset (only when creating new contract or activating)
      if ((!contract || formData.status === 'active') && formData.status === 'active') {
        const allContracts = await apiClient.getContracts();
        const activeContract = allContracts.find((c: Contract) => 
          c.assetId === formData.assetId && c.status === 'active' && c.id !== contract?.id
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
            return;
          }
          
          // Terminate existing contract
          await apiClient.updateContract(activeContract.id, { status: 'terminated' });
        }
      }

      const contractData = {
        assetId: formData.assetId,
        tenantId: formData.tenantId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        rentAmount: parseFloat(formData.rentAmount),
        deposit: parseFloat(formData.deposit),
        insurance: parseFloat(formData.insurance),
        status: formData.status,
        documents: contract?.documents || [],
        notes: formData.notes || undefined,
      };

      if (contract) {
        await apiClient.updateContract(contract.id, contractData);
        Swal.fire({
          icon: 'success',
          title: 'อัปเดตสัญญาเรียบร้อย',
          text: 'ข้อมูลสัญญาได้รับการอัปเดตแล้ว',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await apiClient.createContract(contractData);
        Swal.fire({
          icon: 'success',
          title: 'สร้างสัญญาเรียบร้อย',
          text: 'สัญญาใหม่ได้รับการสร้างแล้ว',
          timer: 2000,
          showConfirmButton: false,
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
      });
    }
  };

  console.log('ContractFormModal returning JSX', { isOpen });
  
  if (!isOpen) {
    console.log('Modal is not open, returning null');
    return null;
  }
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="2xl" 
      scrollBehavior="inside" 
      placement="center"
      classNames={{
        base: "z-[9999]",
        backdrop: "z-[9998]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {contract ? 'แก้ไขสัญญาเช่า' : 'สร้างสัญญาเช่าใหม่'}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Select
              label="ทรัพย์สิน"
              placeholder="เลือกทรัพย์สิน"
              selectedKeys={formData.assetId ? [formData.assetId] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFormData({ ...formData, assetId: selected || '' });
                setErrors({ ...errors, assetId: '' });
              }}
              errorMessage={errors.assetId}
              isInvalid={!!errors.assetId}
              isDisabled={!!contract || !!defaultAssetId}
            >
              {availableAssets.map((asset) => (
                <SelectItem key={asset.id} textValue={`${asset.name} - ${asset.address}`}>
                  {asset.name} - {asset.address}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="ผู้เช่า"
              placeholder="เลือกผู้เช่า"
              selectedKeys={formData.tenantId ? [formData.tenantId] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFormData({ ...formData, tenantId: selected || '' });
                setErrors({ ...errors, tenantId: '' });
              }}
              errorMessage={errors.tenantId}
              isInvalid={!!errors.tenantId}
              isDisabled={!!contract}
            >
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} textValue={`${tenant.name} (${tenant.phone})`}>
                  {tenant.name} ({tenant.phone})
                </SelectItem>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="วันที่เริ่มต้น"
                value={formData.startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  setFormData({ 
                    ...formData, 
                    startDate: newStartDate,
                    // Reset endDate if it's before the new start date
                    endDate: formData.endDate && new Date(formData.endDate) < new Date(newStartDate) ? '' : formData.endDate
                  });
                  setErrors({ ...errors, startDate: '' });
                }}
                errorMessage={errors.startDate}
                isInvalid={!!errors.startDate}
              />

              <Input
                type="date"
                label="วันที่สิ้นสุด"
                value={formData.endDate}
                min={formData.startDate || undefined}
                onChange={(e) => {
                  const newEndDate = e.target.value;
                  // Validate that end date is not before start date
                  if (formData.startDate && newEndDate) {
                    const startDateObj = new Date(formData.startDate + 'T00:00:00');
                    const endDateObj = new Date(newEndDate + 'T00:00:00');
                    
                    if (endDateObj < startDateObj) {
                      setErrors({ ...errors, endDate: 'วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น' });
                      // Don't update the value if invalid
                      return;
                    }
                  }
                  setFormData({ ...formData, endDate: newEndDate });
                  setErrors({ ...errors, endDate: '' });
                }}
                onBlur={(e) => {
                  // Additional validation on blur
                  const endDate = e.target.value;
                  if (formData.startDate && endDate) {
                    const startDateObj = new Date(formData.startDate + 'T00:00:00');
                    const endDateObj = new Date(endDate + 'T00:00:00');
                    
                    if (endDateObj < startDateObj) {
                      setErrors({ ...errors, endDate: 'วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น' });
                      // Clear invalid date
                      setFormData({ ...formData, endDate: '' });
                    }
                  }
                }}
                errorMessage={errors.endDate}
                isInvalid={!!errors.endDate}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                type="number"
                label="ค่าเช่า (บาท/เดือน)"
                value={formData.rentAmount}
                onChange={(e) => {
                  setFormData({ ...formData, rentAmount: e.target.value });
                  setErrors({ ...errors, rentAmount: '' });
                }}
                errorMessage={errors.rentAmount}
                isInvalid={!!errors.rentAmount}
                startContent={<span className="text-gray-500">฿</span>}
              />

              <Input
                type="number"
                label="ค่าเช่าล่วงหน้า (บาท)"
                value={formData.deposit}
                onChange={(e) => {
                  setFormData({ ...formData, deposit: e.target.value });
                  setErrors({ ...errors, deposit: '' });
                }}
                errorMessage={errors.deposit}
                isInvalid={!!errors.deposit}
                startContent={<span className="text-gray-500">฿</span>}
              />

              <Input
                type="number"
                label="ค่าประกัน (บาท)"
                value={formData.insurance}
                onChange={(e) => {
                  setFormData({ ...formData, insurance: e.target.value });
                  setErrors({ ...errors, insurance: '' });
                }}
                errorMessage={errors.insurance}
                isInvalid={!!errors.insurance}
                startContent={<span className="text-gray-500">฿</span>}
              />
            </div>

            <Select
              label="สถานะ"
              selectedKeys={[formData.status]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as Contract['status'];
                setFormData({ ...formData, status: selected || 'active' });
              }}
            >
              <SelectItem key="active" textValue="ใช้งาน">ใช้งาน</SelectItem>
              <SelectItem key="pending" textValue="รอดำเนินการ">รอดำเนินการ</SelectItem>
              <SelectItem key="expired" textValue="หมดอายุ">หมดอายุ</SelectItem>
              <SelectItem key="terminated" textValue="ยกเลิก">ยกเลิก</SelectItem>
            </Select>

            <Textarea
              label="หมายเหตุ (ถ้ามี)"
              placeholder="หมายเหตุเพิ่มเติม"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              minRows={3}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            ยกเลิก
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {contract ? 'บันทึกการแก้ไข' : 'สร้างสัญญา'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

