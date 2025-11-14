'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/common/Layout';
import { Card, CardBody, CardHeader, Button, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { PlusIcon, DocumentTextIcon, PencilIcon, XMarkIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { mockContracts, getContractsByTenant, terminateContract } from '@/lib/mockData';
import { getStoredUser } from '@/lib/auth';
import { formatCurrency, formatDate, getStatusText, getStatusColor, calculateDaysUntil } from '@/lib/utils';
import { Contract } from '@/types/contract';
import Link from 'next/link';
import { showContractForm } from '@/lib/contractForm';
import Swal from 'sweetalert2';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const user = getStoredUser();

  const loadContracts = () => {
    if (!user) return;

    if (user.role === 'tenant') {
      setContracts(getContractsByTenant(user.id));
    } else {
      setContracts([...mockContracts]);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [user]);

  const handleCreateNew = async () => {
    const result = await showContractForm();
    if (result) {
      loadContracts();
    }
  };

  const handleEdit = async (contract: Contract) => {
    const result = await showContractForm(contract);
    if (result) {
      loadContracts();
    }
  };

  const handleTerminate = async (contract: Contract) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการปิดการใช้งานสัญญา',
      text: `คุณต้องการปิดการใช้งานสัญญาเลขที่ ${contract.id} หรือไม่?`,
      showCancelButton: true,
      confirmButtonText: 'ใช่, ปิดการใช้งาน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });

    if (result.isConfirmed) {
      terminateContract(contract.id);
      Swal.fire({
        icon: 'success',
        title: 'ปิดการใช้งานสัญญาเรียบร้อย',
        text: 'สัญญาถูกปิดการใช้งานแล้ว',
        timer: 2000,
        showConfirmButton: false,
      });
      loadContracts();
    }
  };

  const getStatusChipColor = (status: string) => {
    const colors: Record<string, 'success' | 'default' | 'danger' | 'warning'> = {
      active: 'success',
      expired: 'default',
      terminated: 'danger',
      pending: 'warning',
    };
    return colors[status] || 'default';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">จัดการสัญญาเช่า</h1>
            <p className="text-gray-600 mt-2">รายการสัญญาเช่าทั้งหมด</p>
          </div>
          {(user?.role === 'owner' || user?.role === 'admin') && (
            <Button
              color="primary"
              startContent={<PlusIcon className="w-5 h-5" />}
              className="font-semibold"
              onPress={handleCreateNew}
            >
              สร้างสัญญาใหม่
            </Button>
          )}
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <h2 className="text-lg font-semibold">รายการสัญญา</h2>
          </CardHeader>
          <CardBody>
            {contracts.length > 0 ? (
              <Table aria-label="Contracts table">
                <TableHeader>
                  {user?.role !== 'tenant' ? (
                    <>
                      <TableColumn>ทรัพย์สิน</TableColumn>
                      <TableColumn>ผู้เช่า</TableColumn>
                      <TableColumn>ค่าเช่า</TableColumn>
                      <TableColumn>วันที่เริ่มต้น</TableColumn>
                      <TableColumn>วันที่สิ้นสุด</TableColumn>
                      <TableColumn>สถานะ</TableColumn>
                      <TableColumn>การจัดการ</TableColumn>
                    </>
                  ) : (
                    <>
                      <TableColumn>ทรัพย์สิน</TableColumn>
                      <TableColumn>ค่าเช่า</TableColumn>
                      <TableColumn>วันที่เริ่มต้น</TableColumn>
                      <TableColumn>วันที่สิ้นสุด</TableColumn>
                      <TableColumn>สถานะ</TableColumn>
                      <TableColumn>การจัดการ</TableColumn>
                    </>
                  )}
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => {
                    const daysUntil = calculateDaysUntil(contract.endDate);
                    const isExpiringSoon = daysUntil <= 30 && daysUntil > 0;

                    return (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                            <span className="font-medium">{contract.assetName}</span>
                          </div>
                        </TableCell>
                        {user?.role !== 'tenant' ? (
                          <>
                            <TableCell>{contract.tenantName}</TableCell>
                            <TableCell>{formatCurrency(contract.rentAmount)}</TableCell>
                            <TableCell>{formatDate(contract.startDate)}</TableCell>
                            <TableCell>
                              <div>
                                <p>{formatDate(contract.endDate)}</p>
                                {isExpiringSoon && (
                                  <p className="text-xs text-orange-600">
                                    เหลือ {daysUntil} วัน
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Chip
                                color={getStatusChipColor(contract.status)}
                                size="sm"
                                variant="flat"
                              >
                                {getStatusText(contract.status)}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  as={Link}
                                  href={`/contracts/${contract.id}`}
                                  size="sm"
                                  variant="bordered"
                                >
                                  ดูรายละเอียด
                                </Button>
                                <Dropdown>
                                  <DropdownTrigger>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                    >
                                      <EllipsisVerticalIcon className="w-5 h-5" />
                                    </Button>
                                  </DropdownTrigger>
                                  <DropdownMenu aria-label="Contract actions">
                                        <DropdownItem
                                          key="edit"
                                          startContent={<PencilIcon className="w-4 h-4" />}
                                          onPress={() => handleEdit(contract)}
                                        >
                                          แก้ไข
                                        </DropdownItem>
                                        {contract.status === 'active' ? (
                                          <DropdownItem
                                            key="terminate"
                                            className="text-danger"
                                            color="danger"
                                            startContent={<XMarkIcon className="w-4 h-4" />}
                                            onPress={() => handleTerminate(contract)}
                                          >
                                            ปิดการใช้งาน
                                          </DropdownItem>
                                        ) : null}
                                  </DropdownMenu>
                                </Dropdown>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{formatCurrency(contract.rentAmount)}</TableCell>
                            <TableCell>{formatDate(contract.startDate)}</TableCell>
                            <TableCell>
                              <div>
                                <p>{formatDate(contract.endDate)}</p>
                                {isExpiringSoon && (
                                  <p className="text-xs text-orange-600">
                                    เหลือ {daysUntil} วัน
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Chip
                                color={getStatusChipColor(contract.status)}
                                size="sm"
                                variant="flat"
                              >
                                {getStatusText(contract.status)}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              <Button
                                as={Link}
                                href={`/contracts/${contract.id}`}
                                size="sm"
                                variant="bordered"
                              >
                                ดูรายละเอียด
                              </Button>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">ยังไม่มีสัญญาเช่า</p>
                {(user?.role === 'owner' || user?.role === 'admin') && (
                  <Button
                    color="primary"
                    className="mt-4"
                    startContent={<PlusIcon className="w-5 h-5" />}
                    onPress={handleCreateNew}
                  >
                    สร้างสัญญาแรก
                  </Button>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
}

