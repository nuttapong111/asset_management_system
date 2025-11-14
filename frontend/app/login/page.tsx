'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody } from '@heroui/react';
import { BuildingOfficeIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { login, storeAuth } from '@/lib/auth';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login({ phone, password });
      
      if (result) {
        storeAuth(result.user, result.token);
        
        await Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ',
          text: `ยินดีต้อนรับ ${result.user.name}`,
          timer: 1500,
          showConfirmButton: false,
        });

        router.push('/dashboard');
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'เข้าสู่ระบบไม่สำเร็จ',
          text: 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง',
        });
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="w-full max-w-5xl">
        {/* Main Card */}
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="grid md:grid-cols-2 min-h-[600px]">
            {/* Left Side - Branding */}
            <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-12 text-white">
              <div className="mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <BuildingOfficeIcon className="w-14 h-14 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <BuildingOfficeIcon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4 text-center">Asset Management</h1>
              <p className="text-xl text-white/90 text-center mb-2">ระบบบริหารจัดการทรัพย์สิน</p>
              <p className="text-sm text-white/80 text-center max-w-sm">
                จัดการทรัพย์สินของคุณอย่างมีประสิทธิภาพ ด้วยระบบที่ทันสมัยและใช้งานง่าย
              </p>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex flex-col justify-center p-8 md:p-12 bg-white">
              {/* Logo for Mobile */}
              <div className="md:hidden flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <BuildingOfficeIcon className="w-9 h-9 text-white" />
                  </div>
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">เข้าสู่ระบบ</h2>
                <p className="text-gray-600">ยินดีต้อนรับกลับสู่ระบบบริหารจัดการทรัพย์สิน</p>
              </div>

              {/* Form Card */}
              <Card className="shadow-lg border border-gray-100 mb-6">
                <CardBody className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">เข้าสู่ระบบ</h3>
                  <p className="text-sm text-gray-600 mb-6">กรุณากรอกเบอร์โทรและรหัสผ่านของคุณ</p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        type="tel"
                        placeholder="กรอกเบอร์โทรของคุณ"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-base text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        รหัสผ่าน
                      </label>
                      <div className="relative">
                        <input
                          type={isVisible ? "text" : "password"}
                          placeholder="กรอกรหัสผ่านของคุณ"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full h-12 px-4 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-base text-gray-900 placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={toggleVisibility}
                          className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none hover:opacity-70 transition-opacity flex items-center justify-center"
                        >
                          {isVisible ? (
                            <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                          ) : (
                            <EyeIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="remember-me"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-3 h-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <label 
                          htmlFor="remember-me"
                          className="text-sm text-gray-700 font-normal cursor-pointer select-none"
                        >
                          จดจำการเข้าสู่ระบบ
                        </label>
                      </div>
                      <a
                        href="/forgot-password"
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors whitespace-nowrap"
                      >
                        ลืมรหัสผ่าน?
                      </a>
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      isLoading={loading}
                    >
                      {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </Button>
                  </form>
                </CardBody>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
