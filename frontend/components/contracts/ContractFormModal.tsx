'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from '@heroui/react';
import { Contract } from '@/types/contract';
import { Asset } from '@/types/asset';
import { User } from '@/types/user';
import { mockAssets, mockUsers, addContract, updateContract, getActiveContractByAsset } from '@/lib/mockData';
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

  // Get available assets (only for owner/admin)
  const availableAssets = mockAssets.filter(asset => asset.status !== 'maintenance');
  
  // Get tenants (users with role 'tenant')
  const tenants = mockUsers.filter(user => user.role === 'tenant');

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
      newErrors.deposit = 'กรุณาระบุค่ามัดจำที่ถูกต้อง';
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
      const selectedAsset = mockAssets.find(a => a.id === formData.assetId);
      const selectedTenant = mockUsers.find(u => u.id === formData.tenantId);

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
        const activeContract = getActiveContractByAsset(formData.assetId);
        if (activeContract && activeContract.id !== contract?.id) {
          const result = await Swal.fire({
            icon: 'warning',
            title: 'มีสัญญาใช้งานอยู่แล้ว',
            text: `ทรัพย์สินนี้มีสัญญาที่ใช้งานอยู่แล้ว (สัญญาเลขที่ ${activeContract.id}) ต้องการปิดสัญญาเดิมและสร้างสัญญาใหม่หรือไม่?`,
            showCancelButton: true,
            confirmButtonText: 'ใช่, ปิดสัญญาเดิม',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
          });

          if (!result.isConfirmed) {
            return;
          }
        }
      }

      const contractData = {
        assetId: formData.assetId,
        assetName: selectedAsset.name,
        tenantId: formData.tenantId,
        tenantName: selectedTenant.name,
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
        updateContract(contract.id, contractData);
        Swal.fire({
          icon: 'success',
          title: 'อัปเดตสัญญาเรียบร้อย',
          text: 'ข้อมูลสัญญาได้รับการอัปเดตแล้ว',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        addContract(contractData);
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
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถบันทึกข้อมูลได้',
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
                <SelectItem key={asset.id} value={asset.id} textValue={`${asset.name} - ${asset.address}`}>
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
                <SelectItem key={tenant.id} value={tenant.id} textValue={`${tenant.name} (${tenant.phone})`}>
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
                  setFormData({ ...formData, startDate: e.target.value });
                  setErrors({ ...errors, startDate: '' });
                }}
                errorMessage={errors.startDate}
                isInvalid={!!errors.startDate}
              />

              <Input
                type="date"
                label="วันที่สิ้นสุด"
                value={formData.endDate}
                onChange={(e) => {
                  setFormData({ ...formData, endDate: e.target.value });
                  setErrors({ ...errors, endDate: '' });
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
                label="ค่ามัดจำ (บาท)"
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
              <SelectItem key="active" value="active" textValue="ใช้งาน">ใช้งาน</SelectItem>
              <SelectItem key="pending" value="pending" textValue="รอดำเนินการ">รอดำเนินการ</SelectItem>
              <SelectItem key="expired" value="expired" textValue="หมดอายุ">หมดอายุ</SelectItem>
              <SelectItem key="terminated" value="terminated" textValue="ยกเลิก">ยกเลิก</SelectItem>
            </Select>

            <Input
              label="หมายเหตุ (ถ้ามี)"
              placeholder="หมายเหตุเพิ่มเติม"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
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

