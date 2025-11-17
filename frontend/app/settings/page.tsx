'use client';

import Layout from '@/components/common/Layout';
import { Card, CardBody, CardHeader, Input, Button } from '@heroui/react';
import { getStoredUser, getStoredToken } from '@/lib/auth';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import { showTenantForm } from '@/lib/tenantForm';
import { User } from '@/types/user';

export default function SettingsPage() {
  const user = getStoredUser();
  
  // Edit mode states
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  
  // Personal info states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [originalName, setOriginalName] = useState(user?.name || '');
  const [originalEmail, setOriginalEmail] = useState(user?.email || '');
  
  // Address fields
  const [houseNumber, setHouseNumber] = useState('');
  const [villageNumber, setVillageNumber] = useState('');
  const [street, setStreet] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  
  // Tenant management (for owners only)
  const [tenants, setTenants] = useState<User[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  const handleSavePersonal = async () => {
    setLoading(true);
    
    // Mock save
    setTimeout(() => {
      setOriginalName(name);
      setOriginalEmail(email);
      setIsEditingPersonal(false);
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: 'ข้อมูลของคุณได้รับการอัพเดทแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
      setLoading(false);
    }, 1000);
  };

  const handleCancelPersonal = () => {
    setName(originalName);
    setEmail(originalEmail);
    setIsEditingPersonal(false);
  };

  const handleSaveAddress = async () => {
    setLoading(true);
    
    // Mock save
    setTimeout(() => {
      setIsEditingAddress(false);
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: 'ข้อมูลที่อยู่ได้รับการอัพเดทแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
      setLoading(false);
    }, 1000);
  };

  const handleCancelAddress = () => {
    setIsEditingAddress(false);
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'กรุณาตรวจสอบรหัสผ่านใหม่และยืนยันรหัสผ่าน',
      });
      return;
    }
    
    setLoading(true);
    
    // Mock save
    setTimeout(() => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditingPassword(false);
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: 'รหัสผ่านได้รับการอัพเดทแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
      setLoading(false);
    }, 1000);
  };

  const handleCancelPassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditingPassword(false);
  };

  // Load tenants (for owners only)
  useEffect(() => {
    const loadTenants = async () => {
      if (user?.role !== 'owner') return;
      
      try {
        setLoadingTenants(true);
        const token = getStoredToken();
        if (!token) return;
        
        apiClient.setToken(token);
        const allUsers = await apiClient.getUsers();
        const tenantUsers = allUsers.filter((u: User) => u.role === 'tenant');
        setTenants(tenantUsers);
      } catch (error) {
        console.error('Error loading tenants:', error);
      } finally {
        setLoadingTenants(false);
      }
    };

    loadTenants();
  }, [user]);

  const handleAddTenant = async () => {
    const token = getStoredToken();
    if (!token) return;
    apiClient.setToken(token);
    
    const newTenant = await showTenantForm();
    if (newTenant) {
      // Reload tenants
      const allUsers = await apiClient.getUsers();
      const tenantUsers = allUsers.filter((u: User) => u.role === 'tenant');
      setTenants(tenantUsers);
    }
  };

  const handleEditTenant = async (tenant: User) => {
    const token = getStoredToken();
    if (!token) return;
    apiClient.setToken(token);
    
    const updatedTenant = await showTenantForm(tenant);
    if (updatedTenant) {
      // Reload tenants
      const allUsers = await apiClient.getUsers();
      const tenantUsers = allUsers.filter((u: User) => u.role === 'tenant');
      setTenants(tenantUsers);
    }
  };

  const handleDeleteTenant = async (tenant: User) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการลบ',
      text: `คุณต้องการลบผู้เช่า "${tenant.name}" หรือไม่?`,
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        const token = getStoredToken();
        if (!token) return;
        apiClient.setToken(token);
        
        await apiClient.deleteUser(tenant.id);
        
        await Swal.fire({
          icon: 'success',
          title: 'ลบสำเร็จ',
          text: 'ผู้เช่าถูกลบแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
        
        // Reload tenants
        const allUsers = await apiClient.getUsers();
        const tenantUsers = allUsers.filter((u: User) => u.role === 'tenant');
        setTenants(tenantUsers);
      } catch (error: any) {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message || 'ไม่สามารถลบผู้เช่าได้',
        });
      }
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="app-settings-page space-y-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ตั้งค่า</h1>
          <p className="text-gray-600">จัดการข้อมูลส่วนตัวและตั้งค่าระบบ</p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="pb-3 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">ข้อมูลส่วนตัว</h2>
            {!isEditingPersonal && (
              <Button
                color="primary"
                variant="light"
                size="sm"
                startContent={<PencilIcon className="w-4 h-4" />}
                onPress={() => setIsEditingPersonal(true)}
              >
                แก้ไข
              </Button>
            )}
          </CardHeader>
          <CardBody className="space-y-5 pt-4" style={{ width: '100%', padding: '1rem' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ width: '100%', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div className="space-y-1 flex flex-col" style={{ minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                <label className="text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                {isEditingPersonal ? (
                  <div style={{ width: '100%', minWidth: 0, maxWidth: '100%', flex: '1 1 0%', overflow: 'hidden' }}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              variant="bordered"
                      style={{ width: '100%', minWidth: 0, maxWidth: '100%', display: 'block' }}
                      classNames={{
                        base: "!w-full !max-w-full !min-w-0 !block",
                        input: "text-base",
                        inputWrapper: "!border-2 !border-gray-200 hover:!border-gray-300 focus-within:!border-gray-400 !bg-white !h-[40px] !min-h-[40px] !rounded-lg !w-full !max-w-full !min-w-0",
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-base text-gray-900 py-2.5 px-3 min-h-[40px] h-[40px] border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center w-full">
                    {name || '-'}
                  </div>
                )}
              </div>
              <div className="space-y-1 flex flex-col" style={{ minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                <label className="text-sm font-medium text-gray-700">อีเมล</label>
                {isEditingPersonal ? (
                  <div style={{ width: '100%', minWidth: 0, maxWidth: '100%', flex: '1 1 0%', overflow: 'hidden' }}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="bordered"
                      style={{ width: '100%', minWidth: 0, maxWidth: '100%', display: 'block' }}
                      classNames={{
                        base: "!w-full !max-w-full !min-w-0 !block",
                        input: "text-base",
                        inputWrapper: "!border-2 !border-gray-200 hover:!border-gray-300 focus-within:!border-gray-400 !bg-white !h-[40px] !min-h-[40px] !rounded-lg !w-full !max-w-full !min-w-0",
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-base text-gray-900 py-2.5 px-3 min-h-[40px] h-[40px] border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center w-full">
                    {email || '-'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ width: '100%', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                <div className="text-base text-gray-900 py-2.5 px-3 min-h-[40px] h-[40px] border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center w-full">
                  {user?.phone || '-'}
                </div>
                <p className="text-xs text-gray-500 mt-1">ไม่สามารถเปลี่ยนเบอร์โทรศัพท์ได้</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">บทบาท</label>
                <div className="text-base text-gray-900 py-2.5 px-3 min-h-[40px] h-[40px] border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center w-full">
                  {user.role === 'owner' ? 'เจ้าของ' : user.role === 'tenant' ? 'ผู้เช่า' : 'ผู้ดูแลระบบ'}
                </div>
              </div>
            </div>

            {isEditingPersonal && (
              <div className="pt-4 border-t border-gray-200 flex gap-3 justify-end">
                <Button
                  variant="bordered"
                  onPress={handleCancelPersonal}
                  className="min-w-[120px] !bg-white !text-gray-700 !border-gray-300 hover:!bg-gray-50"
                >
                  ยกเลิก
                </Button>
                <Button
                  color="danger"
                  onPress={handleSavePersonal}
                  isLoading={loading}
                  className="min-w-[120px] !bg-red-600 hover:!bg-red-700 !text-white"
                >
                  บันทึก
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-3 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">ที่อยู่ตามทะเบียนบ้าน (สำหรับระบุในสัญญา)</h2>
            {!isEditingAddress && (
              <Button
                color="primary"
                variant="light"
                size="sm"
                startContent={<PencilIcon className="w-4 h-4" />}
                onPress={() => setIsEditingAddress(true)}
              >
                แก้ไข
              </Button>
            )}
          </CardHeader>
          <CardBody className="space-y-5 pt-4" style={{ width: '100%', padding: '1rem' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ width: '100%', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div className="space-y-1 flex flex-col" style={{ minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                <label className="text-sm font-medium text-gray-700">บ้านเลขที่</label>
                {isEditingAddress ? (
                  <div style={{ width: '100%', minWidth: 0, maxWidth: '100%', flex: '1 1 0%', overflow: 'hidden' }}>
                    <Input
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      variant="bordered"
                      placeholder="เช่น 123"
                      style={{ width: '100%', minWidth: 0, maxWidth: '100%', display: 'block' }}
                      classNames={{
                        base: "!w-full !max-w-full !min-w-0 !block",
                        input: "text-base",
                        inputWrapper: "!border-2 !border-gray-200 hover:!border-gray-300 focus-within:!border-gray-400 !bg-white !h-[40px] !min-h-[40px] !rounded-lg !w-full !max-w-full !min-w-0",
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-base text-gray-900 py-2.5 px-3 min-h-[40px] h-[40px] border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center w-full">
                    {houseNumber || '-'}
                  </div>
                )}
              </div>
              <div className="space-y-1 flex flex-col" style={{ minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                <label className="text-sm font-medium text-gray-700">หมู่ที่</label>
                {isEditingAddress ? (
                  <div style={{ width: '100%', minWidth: 0, maxWidth: '100%', flex: '1 1 0%', overflow: 'hidden' }}>
                    <Input
                      value={villageNumber}
                      onChange={(e) => setVillageNumber(e.target.value)}
                      variant="bordered"
                      placeholder="เช่น 5"
                      style={{ width: '100%', minWidth: 0, maxWidth: '100%', display: 'block' }}
                      classNames={{
                        base: "!w-full !max-w-full !min-w-0 !block",
                        input: "text-base",
                        inputWrapper: "!border-2 !border-gray-200 hover:!border-gray-300 focus-within:!border-gray-400 !bg-white !h-[40px] !min-h-[40px] !rounded-lg !w-full !max-w-full !min-w-0",
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-base text-gray-900 py-2.5 px-3 min-h-[40px] h-[40px] border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center w-full">
                    {villageNumber || '-'}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1 flex flex-col" style={{ minWidth: 0, width: '100%' }}>
              <label className="text-sm font-medium text-gray-700">ถนน</label>
              {isEditingAddress ? (
                <div style={{ width: '100%', minWidth: 0 }}>
                  <Input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    variant="bordered"
                    placeholder="เช่น ถนนสุขุมวิท"
                    style={{ width: '100%' }}
                    classNames={{
                      base: "!w-full !max-w-full !min-w-0",
                      input: "text-base",
                      inputWrapper: "!border-2 !border-gray-200 hover:!border-gray-300 focus-within:!border-gray-400 !bg-white !h-[40px] !min-h-[40px] !rounded-lg !w-full !max-w-full !min-w-0",
                    }}
                  />
                </div>
              ) : (
                <div className="text-base text-gray-900 py-2.5 px-3 min-h-[40px] h-[40px] border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center w-full">
                  {street || '-'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ width: '100%', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div className="space-y-1 flex flex-col" style={{ minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                <label className="text-sm font-medium text-gray-700">ตำบล/แขวง</label>
                {isEditingAddress ? (
                  <div style={{ width: '100%', minWidth: 0, maxWidth: '100%', flex: '1 1 0%', overflow: 'hidden' }}>
                    <Input
                      value={subDistrict}
                      onChange={(e) => setSubDistrict(e.target.value)}
                      variant="bordered"
                      placeholder="เช่น คลองตัน"
                      style={{ width: '100%', minWidth: 0, maxWidth: '100%', display: 'block' }}
                      classNames={{
                        base: "!w-full !max-w-full !min-w-0 !block",
                        input: "text-base",
                        inputWrapper: "!border-2 !border-gray-200 hover:!border-gray-300 focus-within:!border-gray-400 !bg-white !h-[40px] !min-h-[40px] !rounded-lg !w-full !max-w-full !min-w-0",
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-base text-gray-900 py-2.5 px-3 min-h-[40px] h-[40px] border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center w-full">
                    {subDistrict || '-'}
                  </div>
                )}
              </div>
              <div className="space-y-1 flex flex-col" style={{ minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                <label className="text-sm font-medium text-gray-700">อำเภอ/เขต</label>
                {isEditingAddress ? (
                  <div style={{ width: '100%', minWidth: 0, maxWidth: '100%', flex: '1 1 0%', overflow: 'hidden' }}>
                    <Input
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      variant="bordered"
                      placeholder="เช่น เขตคลองตัน"
                      style={{ width: '100%', minWidth: 0, maxWidth: '100%', display: 'block' }}
                      classNames={{
                        base: "!w-full !max-w-full !min-w-0 !block",
                        input: "text-base",
                        inputWrapper: "!border-2 !border-gray-200 hover:!border-gray-300 focus-within:!border-gray-400 !bg-white !h-[40px] !min-h-[40px] !rounded-lg !w-full !max-w-full !min-w-0",
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-base text-gray-900 py-2.5 px-3 min-h-[40px] h-[40px] border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center w-full">
                    {district || '-'}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ width: '100%', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div className="space-y-1 flex flex-col" style={{ minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                <label className="text-sm font-medium text-gray-700">จังหวัด</label>
                {isEditingAddress ? (
                  <div style={{ width: '100%', minWidth: 0 }}>
            <Input
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
              variant="bordered"
                      placeholder="เช่น กรุงเทพมหานคร"
                      style={{ width: '100%', minWidth: 0, maxWidth: '100%', display: 'block' }}
                      classNames={{
                        base: "!w-full !max-w-full !min-w-0 !block",
                        input: "text-base",
                        inputWrapper: "!border-2 !border-gray-200 hover:!border-gray-300 focus-within:!border-gray-400 !bg-white !h-[40px] !min-h-[40px] !rounded-lg !w-full !max-w-full !min-w-0",
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-base text-gray-900 py-2.5 px-3 min-h-[40px] h-[40px] border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center w-full">
                    {province || '-'}
                  </div>
                )}
              </div>
              <div className="space-y-1 flex flex-col" style={{ minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                <label className="text-sm font-medium text-gray-700">รหัสไปรษณีย์</label>
                {isEditingAddress ? (
                  <div style={{ width: '100%', minWidth: 0 }}>
            <Input
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
              variant="bordered"
                      placeholder="เช่น 10110"
                      maxLength={5}
                      style={{ width: '100%', minWidth: 0, maxWidth: '100%', display: 'block' }}
                      classNames={{
                        base: "!w-full !max-w-full !min-w-0 !block",
                        input: "text-base",
                        inputWrapper: "!border-2 !border-gray-200 hover:!border-gray-300 focus-within:!border-gray-400 !bg-white !h-[40px] !min-h-[40px] !rounded-lg !w-full !max-w-full !min-w-0",
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-base text-gray-900 py-2.5 px-3 min-h-[40px] h-[40px] border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center w-full">
                    {postalCode || '-'}
                  </div>
                )}
              </div>
            </div>

            {isEditingAddress && (
              <div className="pt-4 border-t border-gray-200 flex gap-3 justify-end">
                <Button
                  variant="bordered"
                  onPress={handleCancelAddress}
                  className="min-w-[120px] !bg-white !text-gray-700 !border-gray-300 hover:!bg-gray-50"
                >
                  ยกเลิก
                </Button>
            <Button
                  color="danger"
                  onPress={handleSaveAddress}
              isLoading={loading}
                  className="min-w-[120px] !bg-red-600 hover:!bg-red-700 !text-white"
            >
                  บันทึก
            </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {user.role === 'owner' && (
          <Card className="shadow-md">
            <CardHeader className="pb-3 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">จัดการผู้เช่า</h2>
              <Button
                color="primary"
                variant="solid"
                size="sm"
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={handleAddTenant}
              >
                เพิ่มผู้เช่า
              </Button>
            </CardHeader>
            <CardBody className="space-y-4 pt-4" style={{ width: '100%', padding: '1rem' }}>
              {loadingTenants ? (
                <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
              ) : tenants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  ยังไม่มีผู้เช่า กดปุ่ม "เพิ่มผู้เช่า" เพื่อเพิ่มผู้เช่าใหม่
                </div>
              ) : (
                <div className="space-y-3">
                  {tenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{tenant.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {tenant.phone} {tenant.email && `• ${tenant.email}`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="light"
                          color="primary"
                          startContent={<PencilIcon className="w-4 h-4" />}
                          onPress={() => handleEditTenant(tenant)}
                        >
                          แก้ไข
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          startContent={<TrashIcon className="w-4 h-4" />}
                          onPress={() => handleDeleteTenant(tenant)}
                        >
                          ลบ
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        <Card className="shadow-md">
          <CardHeader className="pb-3 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">เปลี่ยนรหัสผ่าน</h2>
            {!isEditingPassword && (
              <Button
                color="primary"
                variant="light"
                size="sm"
                startContent={<PencilIcon className="w-4 h-4" />}
                onPress={() => setIsEditingPassword(true)}
              >
                แก้ไข
              </Button>
            )}
          </CardHeader>
          <CardBody className="space-y-5 pt-4" style={{ width: '100%', padding: '1rem' }}>
            {isEditingPassword ? (
              <>
                <div className="space-y-1 flex flex-col" style={{ minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                  <label className="text-sm font-medium text-gray-700">รหัสผ่านปัจจุบัน</label>
                  <div style={{ width: '100%', minWidth: 0 }}>
            <Input
              type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
              variant="bordered"
                      placeholder="กรอกรหัสผ่านปัจจุบัน"
                      style={{ width: '100%', minWidth: 0, maxWidth: '100%', display: 'block' }}
                      classNames={{
                        base: "!w-full !max-w-full !min-w-0 !block",
                        input: "text-base",
                        inputWrapper: "!border-2 !border-gray-200 hover:!border-gray-300 focus-within:!border-gray-400 !bg-white !h-[40px] !min-h-[40px] !rounded-lg !w-full !max-w-full !min-w-0",
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1 flex flex-col" style={{ minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                  <label className="text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
                  <div style={{ width: '100%', minWidth: 0 }}>
            <Input
              type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
              variant="bordered"
                      placeholder="กรอกรหัสผ่านใหม่"
                      style={{ width: '100%', minWidth: 0, maxWidth: '100%', display: 'block' }}
                      classNames={{
                        base: "!w-full !max-w-full !min-w-0 !block",
                        input: "text-base",
                        inputWrapper: "!border-2 !border-gray-200 hover:!border-gray-300 focus-within:!border-gray-400 !bg-white !h-[40px] !min-h-[40px] !rounded-lg !w-full !max-w-full !min-w-0",
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1 flex flex-col" style={{ minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                  <label className="text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</label>
                  <div style={{ width: '100%', minWidth: 0 }}>
            <Input
              type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
              variant="bordered"
                      placeholder="ยืนยันรหัสผ่านใหม่"
                      style={{ width: '100%', minWidth: 0, maxWidth: '100%', display: 'block' }}
                      classNames={{
                        base: "!w-full !max-w-full !min-w-0 !block",
                        input: "text-base",
                        inputWrapper: "!border-2 !border-gray-200 hover:!border-gray-300 focus-within:!border-gray-400 !bg-white !h-[40px] !min-h-[40px] !rounded-lg !w-full !max-w-full !min-w-0",
                      }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 flex gap-3 justify-end">
            <Button
              variant="bordered"
                    onPress={handleCancelPassword}
                    className="min-w-[120px] !bg-white !text-gray-700 !border-gray-300 hover:!bg-gray-50"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    color="danger"
                    onPress={handleSavePassword}
                    isLoading={loading}
                    className="min-w-[120px] !bg-red-600 hover:!bg-red-700 !text-white"
            >
                    บันทึก
            </Button>
                </div>
              </>
            ) : (
              <div className="text-gray-500 text-sm py-4">
                กดปุ่ม "แก้ไข" เพื่อเปลี่ยนรหัสผ่าน
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
}

