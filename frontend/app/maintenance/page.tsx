'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/common/Layout';
import { Card, CardBody, CardHeader, Button, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import { PlusIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { mockMaintenance } from '@/lib/mockData';
import { getStoredUser } from '@/lib/auth';
import { formatCurrency, formatDate, getStatusText, getStatusColor } from '@/lib/utils';
import { Maintenance } from '@/types/maintenance';

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const user = getStoredUser();

  useEffect(() => {
    if (!user) return;
    setMaintenance(mockMaintenance);
  }, [user]);

  const getStatusChipColor = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      completed: 'success',
      in_progress: 'warning',
      pending: 'default',
      cancelled: 'danger',
    };
    return colors[status] || 'default';
  };

  const getTypeText = (type: string) => {
    const types: Record<string, string> = {
      repair: 'ซ่อมแซม',
      routine: 'บำรุงรักษา',
      emergency: 'ฉุกเฉิน',
    };
    return types[type] || type;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">การบำรุงรักษา</h1>
            <p className="text-gray-600 mt-2">จัดการการซ่อมแซมและบำรุงรักษาทรัพย์สิน</p>
          </div>
          <Button
            color="primary"
            startContent={<PlusIcon className="w-5 h-5" />}
            className="font-semibold"
          >
            {user?.role === 'tenant' ? 'แจ้งปัญหา' : 'เพิ่มรายการ'}
          </Button>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <h2 className="text-lg font-semibold">รายการบำรุงรักษา</h2>
          </CardHeader>
          <CardBody>
            {maintenance.length > 0 ? (
              <Table aria-label="Maintenance table">
                <TableHeader>
                  <TableColumn>ทรัพย์สิน</TableColumn>
                  <TableColumn>ประเภท</TableColumn>
                  <TableColumn>หัวข้อ</TableColumn>
                  <TableColumn>รายละเอียด</TableColumn>
                  <TableColumn>ค่าใช้จ่าย</TableColumn>
                  <TableColumn>ผู้แจ้ง</TableColumn>
                  <TableColumn>สถานะ</TableColumn>
                  <TableColumn>การจัดการ</TableColumn>
                </TableHeader>
                <TableBody>
                  {maintenance.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">{item.assetName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeText(item.type)}</TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                      <TableCell>{formatCurrency(item.cost)}</TableCell>
                      <TableCell>{item.reportedByName || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          color={getStatusChipColor(item.status)}
                          size="sm"
                          variant="flat"
                        >
                          {getStatusText(item.status)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="bordered"
                        >
                          ดูรายละเอียด
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">ยังไม่มีรายการบำรุงรักษา</p>
                <Button
                  color="primary"
                  className="mt-4"
                  startContent={<PlusIcon className="w-5 h-5" />}
                >
                  เพิ่มรายการแรก
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
}

