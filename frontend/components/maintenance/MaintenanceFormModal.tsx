'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Select, SelectItem } from '@heroui/react';
import { Maintenance, MaintenanceType } from '@/types/maintenance';
import { Asset } from '@/types/asset';
import { apiClient } from '@/lib/api';
import { getStoredToken, getStoredUser } from '@/lib/auth';
import Swal from 'sweetalert2';

interface MaintenanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance?: Maintenance | null;
  onSuccess: () => void;
  defaultAssetId?: string;
}

export default function MaintenanceFormModal({ isOpen, onClose, maintenance, onSuccess, defaultAssetId }: MaintenanceFormModalProps) {
  const [formData, setFormData] = useState({
    assetId: '',
    type: 'repair' as MaintenanceType,
    title: '',
    description: '',
    cost: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const user = getStoredUser();

  // Load assets from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = getStoredToken();
        if (!token) return;
        apiClient.setToken(token);
        
        const assetsData = await apiClient.getAssets();
        
        // For tenants, only show assets they have active contracts for
        if (user?.role === 'tenant') {
          const contracts = await apiClient.getContracts();
          const activeContractAssetIds = contracts
            .filter((c: any) => c.status === 'active')
            .map((c: any) => c.assetId);
          setAvailableAssets(assetsData.filter((asset: Asset) => activeContractAssetIds.includes(asset.id)));
        } else {
          // For owner/admin, show all assets
          setAvailableAssets(assetsData);
        }
      } catch (error) {
        console.error('Error loading assets:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถโหลดข้อมูลทรัพย์สินได้',
        });
      }
    };
    
    if (isOpen) {
      loadData();
    }
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (maintenance) {
      setFormData({
        assetId: maintenance.assetId,
        type: maintenance.type,
        title: maintenance.title,
        description: maintenance.description,
        cost: maintenance.cost.toString(),
      });
    } else {
      setFormData({
        assetId: defaultAssetId || '',
        type: 'repair',
        title: '',
        description: '',
        cost: '',
      });
    }
    setErrors({});
  }, [maintenance, isOpen, defaultAssetId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.assetId) {
      newErrors.assetId = 'กรุณาเลือกทรัพย์สิน';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'กรุณากรอกหัวข้อ';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'กรุณากรอกรายละเอียด';
    }
    if (formData.cost && isNaN(Number(formData.cost))) {
      newErrors.cost = 'กรุณากรอกตัวเลข';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
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

      const data = {
        assetId: formData.assetId,
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        cost: formData.cost ? Number(formData.cost) : 0,
      };

      if (maintenance) {
        // Update existing maintenance (only owner/admin can update)
        await apiClient.updateMaintenance(maintenance.id, data);
        Swal.fire({
          icon: 'success',
          title: 'อัปเดตสำเร็จ',
          text: 'อัปเดตรายการบำรุงรักษาเรียบร้อยแล้ว',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // Create new maintenance
        await apiClient.createMaintenance(data);
        Swal.fire({
          icon: 'success',
          title: 'เพิ่มรายการสำเร็จ',
          text: user?.role === 'tenant' ? 'แจ้งปัญหาเรียบร้อยแล้ว' : 'เพิ่มรายการบำรุงรักษาเรียบร้อยแล้ว',
          timer: 2000,
          showConfirmButton: false,
        });
      }

      onSuccess();
      onClose();
      
      // Trigger dashboard refresh if on dashboard page
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } catch (error: any) {
      console.error('Error saving maintenance:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          {maintenance ? 'แก้ไขรายการบำรุงรักษา' : (user?.role === 'tenant' ? 'แจ้งปัญหา' : 'เพิ่มรายการบำรุงรักษา')}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Select
              label="ทรัพย์สิน"
              placeholder="เลือกทรัพย์สิน"
              selectedKeys={formData.assetId ? [formData.assetId] : []}
              onSelectionChange={(keys) => {
                const selectedId = Array.from(keys)[0] as string;
                setFormData({ ...formData, assetId: selectedId || '' });
                setErrors({ ...errors, assetId: '' });
              }}
              isDisabled={!!defaultAssetId || !!maintenance}
              errorMessage={errors.assetId}
              isInvalid={!!errors.assetId}
            >
              {availableAssets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.name} - {asset.address}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="ประเภท"
              placeholder="เลือกประเภท"
              selectedKeys={[formData.type]}
              onSelectionChange={(keys) => {
                const selectedType = Array.from(keys)[0] as MaintenanceType;
                setFormData({ ...formData, type: selectedType || 'repair' });
              }}
            >
              <SelectItem key="repair" value="repair">ซ่อมแซม</SelectItem>
              <SelectItem key="routine" value="routine">บำรุงรักษา</SelectItem>
              <SelectItem key="emergency" value="emergency">ฉุกเฉิน</SelectItem>
            </Select>

            <Input
              label="หัวข้อ"
              placeholder="กรอกหัวข้อ"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setErrors({ ...errors, title: '' });
              }}
              isInvalid={!!errors.title}
              errorMessage={errors.title}
            />

            <Textarea
              label="รายละเอียด"
              placeholder="กรอกรายละเอียดปัญหา"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setErrors({ ...errors, description: '' });
              }}
              isInvalid={!!errors.description}
              errorMessage={errors.description}
              minRows={4}
            />

            <Input
              label="ค่าใช้จ่าย (บาท)"
              placeholder="0"
              type="number"
              value={formData.cost}
              onChange={(e) => {
                setFormData({ ...formData, cost: e.target.value });
                setErrors({ ...errors, cost: '' });
              }}
              isInvalid={!!errors.cost}
              errorMessage={errors.cost}
              description="กรอกค่าใช้จ่ายถ้ามี (ถ้าไม่มีให้เว้นว่าง)"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={loading}>
            ยกเลิก
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={loading}>
            {maintenance ? 'บันทึก' : 'เพิ่มรายการ'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

