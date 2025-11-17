'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, Card, CardBody } from '@heroui/react';
import { BuildingOfficeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import Swal from 'sweetalert2';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.forgotPassword(phone);
      
      await Swal.fire({
        icon: 'success',
        title: 'ส่งข้อมูลสำเร็จ',
        html: `
          <p>ระบบได้ส่งข้อมูลรีเซ็ตรหัสผ่านไปยังเบอร์โทร <strong>${phone}</strong> แล้ว</p>
          <p class="mt-2 text-sm text-gray-600">กรุณาตรวจสอบข้อความ SMS</p>
        `,
      });
      
      router.push('/login');
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่พบเบอร์โทรศัพท์นี้ในระบบ',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="p-8 md:p-12 bg-white">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <BuildingOfficeIcon className="w-9 h-9 text-white" />
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">ลืมรหัสผ่าน</h2>
              <p className="text-gray-600">กรุณากรอกเบอร์โทรศัพท์เพื่อรีเซ็ตรหัสผ่าน</p>
            </div>

            {/* Form Card */}
            <Card className="shadow-lg border border-gray-100 mb-6">
              <CardBody className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    label="เบอร์โทรศัพท์"
                    placeholder="0812345678"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    variant="bordered"
                    classNames={{
                      base: "mb-2",
                      label: "text-gray-700 font-medium",
                      input: "text-base font-sans",
                      inputWrapper: "border-gray-300 hover:border-purple-500 focus-within:border-purple-500 h-12",
                      innerWrapper: "py-0",
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="bordered"
                      className="flex-1"
                      onPress={() => router.push('/login')}
                      startContent={<ArrowLeftIcon className="w-4 h-4" />}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      className="flex-1 font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      isLoading={loading}
                    >
                      {loading ? 'กำลังส่ง...' : 'ส่งข้อมูล'}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
