'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/common/Layout';
import { Card, CardBody, CardHeader, Tabs, Tab, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from '@heroui/react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { mockFinancialRecords, mockPayments } from '@/lib/mockData';
import { getStoredUser } from '@/lib/auth';
import { formatCurrency, formatDate, getStatusText, getStatusColor } from '@/lib/utils';
import { FinancialRecord, Payment } from '@/types/finance';

export default function FinancePage() {
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const user = getStoredUser();

  useEffect(() => {
    if (!user) return;

    const incomeRecords = mockFinancialRecords.filter(r => r.type === 'income');
    const expenseRecords = mockFinancialRecords.filter(r => r.type === 'expense');

    const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = expenseRecords.reduce((sum, r) => sum + r.amount, 0);

    setIncome(totalIncome);
    setExpense(totalExpense);
    setRecords(mockFinancialRecords);
    setPayments(mockPayments);
  }, [user]);

  const profit = income - expense;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">จัดการการเงิน</h1>
          <p className="text-gray-600 mt-2">รายรับ รายจ่าย และการชำระเงิน</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-md">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">รายรับรวม</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(income)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <ArrowUpIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-md">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">รายจ่ายรวม</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(expense)}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <ArrowDownIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-md">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">กำไร/ขาดทุน</p>
                  <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(profit)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {profit >= 0 ? (
                    <ArrowUpIcon className={`w-6 h-6 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  ) : (
                    <ArrowDownIcon className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <Tabs aria-label="Finance tabs">
          <Tab key="records" title="รายการการเงิน">
            <Card className="shadow-md mt-4">
              <CardHeader>
                <h2 className="text-lg font-semibold">รายการรายรับ-รายจ่าย</h2>
              </CardHeader>
              <CardBody>
                <Table aria-label="Financial records table">
                  <TableHeader>
                    <TableColumn>วันที่</TableColumn>
                    <TableColumn>ประเภท</TableColumn>
                    <TableColumn>หมวดหมู่</TableColumn>
                    <TableColumn>รายละเอียด</TableColumn>
                    <TableColumn>จำนวนเงิน</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>
                          <Chip
                            color={record.type === 'income' ? 'success' : 'danger'}
                            size="sm"
                            variant="flat"
                          >
                            {record.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                          </Chip>
                        </TableCell>
                        <TableCell>{record.category}</TableCell>
                        <TableCell>{record.description}</TableCell>
                        <TableCell className={record.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="payments" title="การชำระเงิน">
            <Card className="shadow-md mt-4">
              <CardHeader>
                <h2 className="text-lg font-semibold">รายการชำระเงิน</h2>
              </CardHeader>
              <CardBody>
                <Table aria-label="Payments table">
                  <TableHeader>
                    <TableColumn>ประเภท</TableColumn>
                    <TableColumn>จำนวนเงิน</TableColumn>
                    <TableColumn>กำหนดชำระ</TableColumn>
                    <TableColumn>วันที่ชำระ</TableColumn>
                    <TableColumn>สถานะ</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.type === 'rent' ? 'ค่าเช่า' : payment.type}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell>
                          {payment.paidDate ? formatDate(payment.paidDate) : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={getStatusColor(payment.status) as any}
                            size="sm"
                            variant="flat"
                          >
                            {getStatusText(payment.status)}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </Layout>
  );
}

