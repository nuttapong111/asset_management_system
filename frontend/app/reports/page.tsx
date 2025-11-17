'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/common/Layout';
import { Card, CardBody, CardHeader, Tabs, Tab } from '@heroui/react';
import { apiClient } from '@/lib/api';
import { getStoredUser, getStoredToken } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalContracts: 0,
    occupancyRate: 0,
    totalIncome: 0,
    totalExpense: 0,
    roi: 0,
  });
  const user = getStoredUser();

  useEffect(() => {
    const loadData = async () => {
      if (!user || (user.role !== 'owner' && user.role !== 'admin')) return;

      try {
        const token = getStoredToken();
        if (!token) return;
        apiClient.setToken(token);
        
        const [assetsData, contractsData, paymentsData] = await Promise.all([
          apiClient.getAssets(),
          apiClient.getContracts(),
          apiClient.getPayments(),
        ]);

        const rentedAssets = assetsData.filter((a: any) => a.status === 'rented').length;
        const occupancyRate = assetsData.length > 0 
          ? (rentedAssets / assetsData.length) * 100 
          : 0;

        const paidPayments = paymentsData.filter((p: any) => p.status === 'paid');
        const income = paidPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const expense = 0; // Can be calculated from maintenance costs if needed

        const totalInvestment = assetsData.reduce((sum: number, a: any) => sum + (a.purchasePrice || 0), 0);
        const totalValue = assetsData.reduce((sum: number, a: any) => sum + (a.currentValue || 0), 0);
        const roi = totalInvestment > 0 
          ? ((totalValue - totalInvestment) / totalInvestment) * 100 
          : 0;

        setStats({
          totalAssets: assetsData.length,
          totalContracts: contractsData.length,
          occupancyRate,
          totalIncome: income,
          totalExpense: expense,
          roi,
        });
      } catch (error) {
        console.error('Error loading reports data:', error);
      }
    };

    loadData();
  }, [user]);

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">รายงานและวิเคราะห์</h1>
          <p className="text-gray-600 mt-2">ภาพรวมและสถิติการจัดการทรัพย์สิน</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-md">
            <CardBody className="p-6">
              <p className="text-sm text-gray-600 mb-1">ทรัพย์สินทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalAssets}</p>
            </CardBody>
          </Card>

          <Card className="shadow-md">
            <CardBody className="p-6">
              <p className="text-sm text-gray-600 mb-1">อัตราการเช่า</p>
              <p className="text-3xl font-bold text-blue-600">{stats.occupancyRate.toFixed(1)}%</p>
            </CardBody>
          </Card>

          <Card className="shadow-md">
            <CardBody className="p-6">
              <p className="text-sm text-gray-600 mb-1">ROI</p>
              <p className={`text-3xl font-bold ${stats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.roi.toFixed(2)}%
              </p>
            </CardBody>
          </Card>

          <Card className="shadow-md">
            <CardBody className="p-6">
              <p className="text-sm text-gray-600 mb-1">รายได้รวม</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</p>
            </CardBody>
          </Card>

          <Card className="shadow-md">
            <CardBody className="p-6">
              <p className="text-sm text-gray-600 mb-1">รายจ่ายรวม</p>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
            </CardBody>
          </Card>

          <Card className="shadow-md">
            <CardBody className="p-6">
              <p className="text-sm text-gray-600 mb-1">กำไรสุทธิ</p>
              <p className={`text-3xl font-bold ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.totalIncome - stats.totalExpense)}
              </p>
            </CardBody>
          </Card>
        </div>

        <Tabs aria-label="Reports tabs">
          <Tab key="overview" title="ภาพรวม">
            <Card className="shadow-md mt-4">
              <CardHeader>
                <h2 className="text-lg font-semibold">สรุปภาพรวม</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">จำนวนทรัพย์สินทั้งหมด</span>
                    <span className="font-bold text-gray-800">{stats.totalAssets} รายการ</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">สัญญาเช่าทั้งหมด</span>
                    <span className="font-bold text-gray-800">{stats.totalContracts} สัญญา</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">อัตราการเช่า</span>
                    <span className="font-bold text-blue-600">{stats.occupancyRate.toFixed(1)}%</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="financial" title="การเงิน">
            <Card className="shadow-md mt-4">
              <CardHeader>
                <h2 className="text-lg font-semibold">รายงานการเงิน</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-gray-700">รายได้รวม</span>
                    <span className="font-bold text-green-600">{formatCurrency(stats.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <span className="text-gray-700">รายจ่ายรวม</span>
                    <span className="font-bold text-red-600">{formatCurrency(stats.totalExpense)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <span className="text-gray-700">กำไรสุทธิ</span>
                    <span className={`font-bold ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.totalIncome - stats.totalExpense)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </Layout>
  );
}

