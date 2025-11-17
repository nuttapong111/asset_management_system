'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/common/Layout';
import { Card, CardBody, CardHeader, Button, Chip, Tabs, Tab } from '@heroui/react';
import { MapPinIcon, PencilIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import { getStoredUser, getStoredToken } from '@/lib/auth';
import { formatCurrency, getStatusText, getStatusColor } from '@/lib/utils';
import { Asset } from '@/types/asset';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet (client-side only)
const MapComponent = dynamic(() => import('@/components/common/MapComponent'), {
  ssr: false,
});

export default function AssetDetailPage() {
  const params = useParams();
  const [asset, setAsset] = useState<Asset | null>(null);
  const user = getStoredUser();

  useEffect(() => {
    const loadAsset = async () => {
      try {
        const token = getStoredToken();
        if (!token) return;
        apiClient.setToken(token);
        
        const assetData = await apiClient.getAsset(params.id as string);
        setAsset(assetData);
      } catch (error) {
        console.error('Error loading asset:', error);
        setAsset(null);
      }
    };

    if (params.id) {
      loadAsset();
    }
  }, [params.id]);

  if (!asset) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">ไม่พบข้อมูลทรัพย์สิน</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{asset.name}</h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <MapPinIcon className="w-4 h-4" />
              {asset.address}, {asset.district}, {asset.province} {asset.postalCode}
            </p>
          </div>
          {(user?.role === 'owner' || user?.role === 'admin') && (
            <Button
              color="primary"
              startContent={<PencilIcon className="w-5 h-5" />}
            >
              แก้ไขข้อมูล
            </Button>
          )}
        </div>

        <Tabs aria-label="Asset details">
          <Tab key="overview" title="ภาพรวม">
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-md">
                  <CardHeader>
                    <h2 className="text-lg font-semibold">ข้อมูลพื้นฐาน</h2>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ประเภท:</span>
                      <span className="font-medium">{asset.type === 'house' ? 'บ้าน' : asset.type === 'condo' ? 'คอนโด' : 'อพาร์ทเมนต์'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ขนาด:</span>
                      <span className="font-medium">{asset.size} ตารางเมตร</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">จำนวนห้อง:</span>
                      <span className="font-medium">{asset.rooms} ห้อง</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">สถานะ:</span>
                      <Chip
                        color={getStatusColor(asset.status) as any}
                        size="sm"
                        variant="flat"
                      >
                        {getStatusText(asset.status)}
                      </Chip>
                    </div>
                  </CardBody>
                </Card>

                <Card className="shadow-md">
                  <CardHeader>
                    <h2 className="text-lg font-semibold">ข้อมูลการเงิน</h2>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ราคาซื้อ:</span>
                      <span className="font-medium">{formatCurrency(asset.purchasePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">มูลค่าปัจจุบัน:</span>
                      <span className="font-medium text-green-600">{formatCurrency(asset.currentValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">กำไร/ขาดทุน:</span>
                      <span className={`font-medium ${
                        asset.currentValue - asset.purchasePrice >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(asset.currentValue - asset.purchasePrice)}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {asset.description && (
                <Card className="shadow-md">
                  <CardHeader>
                    <h2 className="text-lg font-semibold">รายละเอียด</h2>
                  </CardHeader>
                  <CardBody>
                    <p className="text-gray-700">{asset.description}</p>
                  </CardBody>
                </Card>
              )}

              {asset.latitude && asset.longitude && (
                <Card className="shadow-md">
                  <CardHeader>
                    <h2 className="text-lg font-semibold">ตำแหน่งบนแผนที่</h2>
                  </CardHeader>
                  <CardBody className="p-0">
                    <div className="h-96 w-full">
                      <MapComponent
                        latitude={asset.latitude}
                        longitude={asset.longitude}
                        title={asset.name}
                      />
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </Tab>

          <Tab key="images" title="รูปภาพ">
            <div className="mt-4">
              {asset.images && asset.images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {asset.images.map((image, index) => (
                    <Card key={index} className="shadow-md">
                      <CardBody className="p-0">
                        <img
                          src={image}
                          alt={`${asset.name} ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="shadow-md">
                  <CardBody className="p-12 text-center">
                    <p className="text-gray-500">ยังไม่มีรูปภาพ</p>
                  </CardBody>
                </Card>
              )}
            </div>
          </Tab>
        </Tabs>
      </div>
    </Layout>
  );
}

