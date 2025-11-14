'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/common/Layout';
import { Card, CardBody, Button, Chip } from '@heroui/react';
import { PlusIcon, MapPinIcon, ListBulletIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { mockAssets, getAssetsByOwner } from '@/lib/mockData';
import { getStoredUser } from '@/lib/auth';
import { formatCurrency, getStatusText, getStatusColor } from '@/lib/utils';
import { Asset } from '@/types/asset';
import AssetsMapComponent from '@/components/common/AssetsMapComponent';
import Link from 'next/link';

type ViewMode = 'map' | 'list';

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const user = getStoredUser();

  useEffect(() => {
    if (!user) return;

    if (user.role === 'owner') {
      setAssets(getAssetsByOwner(user.id));
    } else if (user.role === 'admin') {
      setAssets(mockAssets);
    }
  }, [user]);

  const getStatusChipColor = (status: string) => {
    const colors: Record<string, 'success' | 'primary' | 'warning'> = {
      available: 'success',
      rented: 'primary',
      maintenance: 'warning',
    };
    return colors[status] || 'default';
  };

  const handleMarkerClick = (asset: Asset) => {
    setSelectedAsset(asset);
    router.push(`/assets/${asset.id}`);
  };

  const assetsWithLocation = assets.filter(asset => asset.latitude && asset.longitude);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">จัดการทรัพย์สิน</h1>
            <p className="text-gray-600 mt-2">
              {viewMode === 'map' 
                ? `แผนที่แสดงทรัพย์สินทั้งหมด ${assetsWithLocation.length} แห่ง` 
                : `รายการทรัพย์สินทั้งหมด ${assets.length} แห่ง`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                  viewMode === 'map'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Squares2X2Icon className="w-5 h-5" />
                <span>แผนที่</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <ListBulletIcon className="w-5 h-5" />
                <span>รายการ</span>
              </button>
            </div>
            {(user?.role === 'owner' || user?.role === 'admin') && (
              <Button
                color="primary"
                startContent={<PlusIcon className="w-5 h-5" />}
                className="font-semibold"
              >
                เพิ่มทรัพย์สิน
              </Button>
            )}
          </div>
        </div>

        {viewMode === 'map' ? (
          <Card className="shadow-lg">
            <CardBody className="p-0">
              <div className="relative" style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
                <AssetsMapComponent 
                  assets={assetsWithLocation} 
                  onMarkerClick={handleMarkerClick}
                />
                {/* Legend */}
                <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">สถานะทรัพย์สิน</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                      <span className="text-xs text-gray-700">ว่าง</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                      <span className="text-xs text-gray-700">ให้เช่าแล้ว</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></div>
                      <span className="text-xs text-gray-700">ซ่อมแซม</span>
                    </div>
                  </div>
                  {assetsWithLocation.length < assets.length && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        ⚠️ มี {assets.length - assetsWithLocation.length} ทรัพย์สินที่ไม่มีตำแหน่ง
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <Card key={asset.id} className="shadow-md hover:shadow-xl transition-shadow">
                <CardBody className="p-0">
                  <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600">
                    {asset.images && asset.images.length > 0 ? (
                      <img
                        src={asset.images[0]}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                        <MapPinIcon className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Chip
                        color={getStatusChipColor(asset.status)}
                        size="sm"
                        variant="flat"
                      >
                        {getStatusText(asset.status)}
                      </Chip>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{asset.name}</h3>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4" />
                        {asset.address}, {asset.district}, {asset.province}
                      </p>
                      <div className="flex items-center gap-4">
                        <span>ขนาด: {asset.size} ตร.ม.</span>
                        <span>ห้อง: {asset.rooms} ห้อง</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>ราคาซื้อ: {formatCurrency(asset.purchasePrice)}</span>
                      </div>
                      <span>มูลค่าปัจจุบัน: {formatCurrency(asset.currentValue)}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        as={Link}
                        href={`/assets/${asset.id}`}
                        variant="bordered"
                        className="flex-1"
                      >
                        ดูรายละเอียด
                      </Button>
                      {(user?.role === 'owner' || user?.role === 'admin') && (
                        <Button
                          color="primary"
                          variant="flat"
                          className="flex-1"
                        >
                          แก้ไข
                        </Button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {assets.length === 0 && (
          <Card className="shadow-md">
            <CardBody className="p-12 text-center">
              <p className="text-gray-500 text-lg">ยังไม่มีทรัพย์สิน</p>
              {(user?.role === 'owner' || user?.role === 'admin') && (
                <Button
                  color="primary"
                  className="mt-4"
                  startContent={<PlusIcon className="w-5 h-5" />}
                >
                  เพิ่มทรัพย์สินแรก
                </Button>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </Layout>
  );
}

