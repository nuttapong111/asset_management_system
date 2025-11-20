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
  const [images, setImages] = useState<string[]>([]);
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
      setImages(maintenance.images || []);
    } else {
      setFormData({
        assetId: defaultAssetId || '',
        type: 'repair',
        title: '',
        description: '',
        cost: '',
      });
      setImages([]);
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
        images: images,
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
                <SelectItem key={asset.id}>
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
              <SelectItem key="repair">ซ่อมแซม</SelectItem>
              <SelectItem key="routine">บำรุงรักษา</SelectItem>
              <SelectItem key="emergency">ฉุกเฉิน</SelectItem>
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

            {/* รูปภาพปัญหา */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปภาพปัญหา (ถ้ามี)
              </label>
              <div className="space-y-3">
                {/* รูปภาพที่อัปโหลดแล้ว */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`รูปภาพปัญหา ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImages(images.filter((_, i) => i !== index));
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* ปุ่มอัปโหลด */}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;

                      // Convert files to base64
                      const imagePromises = Array.from(files).map((file) => {
                        return new Promise<string>((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            resolve(e.target?.result as string);
                          };
                          reader.onerror = reject;
                          reader.readAsDataURL(file);
                        });
                      });

                      try {
                        const newImages = await Promise.all(imagePromises);
                        setImages([...images, ...newImages]);
                      } catch (error) {
                        console.error('Error reading images:', error);
                        Swal.fire({
                          icon: 'error',
                          title: 'เกิดข้อผิดพลาด',
                          text: 'ไม่สามารถอ่านไฟล์รูปภาพได้',
                        });
                      }
                    }}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    <p className="text-sm text-gray-600">
                      คลิกเพื่อเลือกรูปภาพ หรือลากวางที่นี่
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      สามารถเลือกรูปภาพได้หลายไฟล์
                    </p>
                  </div>
                </label>
              </div>
            </div>
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

