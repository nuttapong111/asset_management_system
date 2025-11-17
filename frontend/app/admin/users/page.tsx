'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/common/Layout';
import { Card, CardBody, Button, Chip } from '@heroui/react';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { getStoredUser, getStoredToken } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { User } from '@/types/user';
import Swal from 'sweetalert2';

export default function AdminUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [owners, setOwners] = useState<User[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = getStoredUser();
        const token = getStoredToken();

        if (!currentUser || currentUser.role !== 'admin' || !token) {
          router.push('/login');
          return;
        }

        setUser(currentUser);
        apiClient.setToken(token);

        // Load owner users from API
        const ownerUsers = await apiClient.getUsers('owner');
        setOwners(ownerUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadData();
  }, [router, refreshKey]);

  const handleAddOwner = async () => {
    const { value: formData } = await Swal.fire({
      title: 'เพิ่ม Owner ใหม่',
      html: `
        <div style="text-align: left;">
          <style>
            .swal2-form-group {
              margin-bottom: 1rem;
            }
            .swal2-form-label {
              display: block;
              margin-bottom: 0.5rem;
              font-weight: 600;
              color: #374151;
              font-size: 14px;
            }
            .swal2-form-input {
              width: 100%;
              padding: 0.75rem;
              border: 2px solid #e5e7eb;
              border-radius: 0.5rem;
              font-size: 14px;
              box-sizing: border-box;
            }
            .swal2-form-input:focus {
              outline: none;
              border-color: #3b82f6;
            }
          </style>
          <div class="swal2-form-group">
            <label class="swal2-form-label">ชื่อ-นามสกุล *</label>
            <input id="swal-name" type="text" class="swal2-form-input" placeholder="เช่น สมชาย ใจดี" required>
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">เบอร์โทรศัพท์ *</label>
            <input id="swal-phone" type="tel" class="swal2-form-input" placeholder="เช่น 0823456789" required>
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">อีเมล</label>
            <input id="swal-email" type="email" class="swal2-form-input" placeholder="เช่น owner@example.com">
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">รหัสผ่าน *</label>
            <input id="swal-password" type="password" class="swal2-form-input" placeholder="รหัสผ่าน" required>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'เพิ่ม',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement)?.value;
        const phone = (document.getElementById('swal-phone') as HTMLInputElement)?.value;
        const email = (document.getElementById('swal-email') as HTMLInputElement)?.value;
        const password = (document.getElementById('swal-password') as HTMLInputElement)?.value;

        if (!name || !phone || !password) {
          Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
          return false;
        }

        // Phone validation will be done by backend

        return { name, phone, email, password };
      },
    });

    if (formData) {
      try {
        await apiClient.createUser({
          phone: formData.phone,
          password: formData.password,
          role: 'owner',
          name: formData.name,
          email: formData.email || undefined,
        });

        await Swal.fire({
          icon: 'success',
          title: 'เพิ่ม Owner เรียบร้อย',
          text: 'ได้เพิ่ม Owner ใหม่เรียบร้อยแล้ว',
          timer: 2000,
          showConfirmButton: false,
        });
        setRefreshKey(prev => prev + 1);
      } catch (error: any) {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message || 'ไม่สามารถเพิ่ม Owner ได้',
        });
      }
    }
  };

  const handleEditOwner = async (owner: User) => {
    const { value: formData } = await Swal.fire({
      title: 'แก้ไขข้อมูล Owner',
      html: `
        <div style="text-align: left;">
          <style>
            .swal2-form-group {
              margin-bottom: 1rem;
            }
            .swal2-form-label {
              display: block;
              margin-bottom: 0.5rem;
              font-weight: 600;
              color: #374151;
              font-size: 14px;
            }
            .swal2-form-input {
              width: 100%;
              padding: 0.75rem;
              border: 2px solid #e5e7eb;
              border-radius: 0.5rem;
              font-size: 14px;
              box-sizing: border-box;
            }
            .swal2-form-input:focus {
              outline: none;
              border-color: #3b82f6;
            }
          </style>
          <div class="swal2-form-group">
            <label class="swal2-form-label">ชื่อ-นามสกุล *</label>
            <input id="swal-name" type="text" class="swal2-form-input" value="${owner.name}" required>
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">เบอร์โทรศัพท์ *</label>
            <input id="swal-phone" type="tel" class="swal2-form-input" value="${owner.phone}" required>
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">อีเมล</label>
            <input id="swal-email" type="email" class="swal2-form-input" value="${owner.email || ''}">
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">รหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)</label>
            <input id="swal-password" type="password" class="swal2-form-input" placeholder="รหัสผ่านใหม่">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement)?.value;
        const phone = (document.getElementById('swal-phone') as HTMLInputElement)?.value;
        const email = (document.getElementById('swal-email') as HTMLInputElement)?.value;
        const password = (document.getElementById('swal-password') as HTMLInputElement)?.value;

        if (!name || !phone) {
          Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
          return false;
        }

        // Phone validation will be done by backend

        return { name, phone, email, password };
      },
    });

    if (formData) {
      try {
        const updateData: any = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }

        await apiClient.updateUser(owner.id, updateData);

        await Swal.fire({
          icon: 'success',
          title: 'อัปเดตข้อมูลเรียบร้อย',
          text: 'ได้อัปเดตข้อมูล Owner เรียบร้อยแล้ว',
          timer: 2000,
          showConfirmButton: false,
        });
        setRefreshKey(prev => prev + 1);
      } catch (error: any) {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message || 'ไม่สามารถอัปเดตข้อมูล Owner ได้',
        });
      }
    }
  };

  const handleDeleteOwner = async (owner: User) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: `คุณต้องการลบ Owner "${owner.name}" หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        await apiClient.deleteUser(owner.id);
        await Swal.fire({
          icon: 'success',
          title: 'ลบ Owner เรียบร้อย',
          text: 'ได้ลบ Owner เรียบร้อยแล้ว',
          timer: 2000,
          showConfirmButton: false,
        });
        setRefreshKey(prev => prev + 1);
      } catch (error: any) {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message || 'ไม่สามารถลบ Owner ได้',
        });
      }
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">จัดการผู้ใช้งาน</h1>
            <p className="text-gray-600 mt-2">จัดการข้อมูล Owner ในระบบ</p>
          </div>
          <Button
            color="primary"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={handleAddOwner}
          >
            เพิ่ม Owner
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardBody className="p-0">
            {owners.length === 0 ? (
              <div className="p-12 text-center">
                <UserGroupIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">ยังไม่มี Owner ในระบบ</p>
                <Button
                  color="primary"
                  className="mt-4"
                  startContent={<PlusIcon className="w-5 h-5" />}
                  onPress={handleAddOwner}
                >
                  เพิ่ม Owner แรก
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        ชื่อ-นามสกุล
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        เบอร์โทรศัพท์
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        อีเมล
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {owners.map((owner) => (
                      <tr key={owner.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{owner.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{owner.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{owner.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Chip color="primary" size="sm" variant="flat">
                            Owner
                          </Chip>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="light"
                              startContent={<PencilIcon className="w-4 h-4" />}
                              onPress={() => handleEditOwner(owner)}
                            >
                              แก้ไข
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              variant="light"
                              startContent={<TrashIcon className="w-4 h-4" />}
                              onPress={() => handleDeleteOwner(owner)}
                            >
                              ลบ
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
}

