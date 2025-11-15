'use client';

import { useEffect, useRef, useState } from 'react';
import { Asset } from '@/types/asset';
import { formatCurrency, getStatusText } from '@/lib/utils';
import { Card, CardBody, Button } from '@heroui/react';
import { XMarkIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

// Import leaflet and markercluster will be done in useEffect

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface DashboardMapComponentProps {
  assets: Asset[];
  stats: {
    totalAssets: number;
    totalContracts: number;
    totalIncome: number;
    pendingMaintenance: number;
  };
  statCards: StatCard[];
}

export default function DashboardMapComponent({ assets, stats, statCards }: DashboardMapComponentProps) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const tooltipRef = useRef<any>(null);
  const statsButtonRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mapRef.current) {
      console.error('mapRef.current is null');
      return;
    }
    if (mapInstanceRef.current) {
      console.log('Map already initialized');
      return;
    }

    console.log('Starting to load Leaflet...');

    // Dynamic import leaflet only on client
    Promise.all([
      import('leaflet'),
      import('leaflet.markercluster')
    ]).then(([leaflet, LMC]) => {
      if (!mapRef.current) {
        console.error('mapRef.current is null after import');
        return;
      }

      console.log('Leaflet loaded successfully');

      const L = leaflet.default;
      const MarkerClusterGroup = LMC.default || LMC;

      // Fix for default marker icons in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Initialize map centered on Bangkok
      console.log('Initializing map...');
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([13.7563, 100.5018], 11);
      
      console.log('Map initialized:', map);
      
      // Force map to invalidate size after a short delay
      setTimeout(() => {
        map.invalidateSize();
        console.log('Map size invalidated');
      }, 300);

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create marker cluster group
      const markers = new (MarkerClusterGroup as any)({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50,
      });

      // Create custom icons based on asset status
      const getIcon = (status: Asset['status']) => {
        const colors: Record<Asset['status'], string> = {
          available: 'green',
          rented: 'blue',
          maintenance: 'orange',
        };
        const color = colors[status] || 'gray';

        return L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: ${color};
              width: 30px;
              height: 30px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              <div style="
                transform: rotate(45deg);
                color: white;
                font-weight: bold;
                font-size: 14px;
              ">🏠</div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -30],
        });
      };

      // Add markers for each asset
      assets
        .filter(asset => asset.latitude && asset.longitude)
        .forEach((asset) => {
          const marker = L.marker(
            [asset.latitude!, asset.longitude!],
            { icon: getIcon(asset.status) }
          );

          // Create hover tooltip (simple text)
          const tooltipContent = `
            <div style="font-family: 'Sukhumvit Set', 'Noto Sans Thai', sans-serif; font-size: 12px; font-weight: 600;">
              ${asset.name}
            </div>
          `;

          marker.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top',
            offset: [0, -10],
            className: 'custom-tooltip',
          });

          // Handle hover events
          marker.on('mouseover', () => {
            marker.openTooltip();
          });

          marker.on('mouseout', () => {
            marker.closeTooltip();
          });

          // Handle click to show detailed popup
          marker.on('click', () => {
            setSelectedAsset(asset);
          });

          markers.addLayer(marker);
        });

      // Add markers to map
      map.addLayer(markers);
      markersRef.current = markers;
      mapInstanceRef.current = map;

      // Fit bounds to show all assets
      if (assets.filter(a => a.latitude && a.longitude).length > 0) {
        const bounds = L.latLngBounds(
          assets
            .filter(a => a.latitude && a.longitude)
            .map(a => [a.latitude!, a.longitude!] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      // Add stats button icon on map
      const statsButton = (L.control as any)({ position: 'topright' });
      statsButton.onAdd = function() {
        const div = L.DomUtil.create('div', 'stats-button-container');
        div.style.cssText = 'margin: 10px;';
        
        const button = L.DomUtil.create('button', 'stats-button');
        button.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          width: 56px;
          height: 56px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, box-shadow 0.2s;
        `;
        
        button.innerHTML = `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3V21H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7 16L12 11L16 15L21 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 10V3H14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
        
        button.onmouseover = function() {
          button.style.transform = 'scale(1.1)';
          button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
        };
        
        button.onmouseout = function() {
          button.style.transform = 'scale(1)';
          button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        };
        
        L.DomEvent.disableClickPropagation(button);
        L.DomEvent.on(button, 'click', () => {
          setShowStatsModal(true);
        });
        
        div.appendChild(button);
        return div;
      };
      statsButton.addTo(map);
      statsButtonRef.current = statsButton;
      setIsMapReady(true);
      setMapError(null);
      console.log('Map setup complete');

      return () => {
        console.log('Cleaning up map...');
        if (statsButtonRef.current) {
          map.removeControl(statsButtonRef.current);
          statsButtonRef.current = null;
        }
        if (markersRef.current) {
          map.removeLayer(markersRef.current);
          markersRef.current = null;
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }).catch((error) => {
      console.error('Error loading leaflet:', error);
      setMapError('ไม่สามารถโหลดแผนที่ได้ กรุณารีเฟรชหน้าเว็บ');
      setIsMapReady(false);
    });
  }, [assets, stats, statCards]);

  return (
    <>
      <div 
        ref={mapRef} 
        className="w-full h-full relative bg-gray-200"
        style={{ width: '100%', height: '100%', minHeight: '600px', zIndex: 0 }}
      >
        {!isMapReady && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดแผนที่...</p>
            </div>
          </div>
        )}
        
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
              <p className="text-red-600 mb-4">{mapError}</p>
              <Button
                color="primary"
                onClick={() => {
                  setMapError(null);
                  setIsMapReady(false);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove();
                    mapInstanceRef.current = null;
                  }
                  window.location.reload();
                }}
              >
                รีเฟรชหน้าเว็บ
              </Button>
            </div>
          </div>
        )}

        {/* Legend */}
        {isMapReady && (
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
          </div>
        )}
      </div>

      {/* Stats Summary Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl shadow-2xl">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <ChartBarIcon className="w-8 h-8 text-blue-600" />
                  ข้อมูลสรุปทั้งหมด
                </h3>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statCards.map((stat, index) => {
                  const Icon = stat.icon;
                  const colorClasses = {
                    blue: 'bg-blue-500',
                    green: 'bg-green-500',
                    yellow: 'bg-yellow-500',
                    orange: 'bg-orange-500',
                  };

                  return (
                    <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                      <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                          </div>
                          <div className={`${colorClasses[stat.color as keyof typeof colorClasses]} p-4 rounded-lg`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">ทรัพย์สินทั้งหมด</p>
                    <p className="text-lg font-semibold text-gray-800">{stats.totalAssets} แห่ง</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">สัญญาเช่า</p>
                    <p className="text-lg font-semibold text-gray-800">{stats.totalContracts} สัญญา</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">รายได้รวม</p>
                    <p className="text-lg font-semibold text-blue-600">{formatCurrency(stats.totalIncome)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">บำรุงรักษารอดำเนินการ</p>
                    <p className="text-lg font-semibold text-orange-600">{stats.pendingMaintenance} รายการ</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  color="primary"
                  onClick={() => setShowStatsModal(false)}
                  className="px-6"
                >
                  ปิด
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">ข้อมูลสรุปทรัพย์สิน</h3>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{selectedAsset.name}</h4>
                  <p className="text-sm text-gray-600 flex items-start gap-2">
                    <span>📍</span>
                    <span>{selectedAsset.address}, {selectedAsset.district}, {selectedAsset.province}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ขนาด</p>
                    <p className="text-sm font-medium text-gray-800">{selectedAsset.size} ตร.ม.</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">จำนวนห้อง</p>
                    <p className="text-sm font-medium text-gray-800">{selectedAsset.rooms} ห้อง</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">สถานะ</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      selectedAsset.status === 'available'
                        ? 'bg-green-100 text-green-700'
                        : selectedAsset.status === 'rented'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {getStatusText(selectedAsset.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ประเภท</p>
                    <p className="text-sm font-medium text-gray-800 capitalize">{selectedAsset.type}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">ราคาซื้อ</p>
                    <p className="text-sm font-medium text-gray-800">{formatCurrency(selectedAsset.purchasePrice)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">มูลค่าปัจจุบัน</p>
                    <p className="text-sm font-semibold text-blue-600">{formatCurrency(selectedAsset.currentValue)}</p>
                  </div>
                </div>

                {selectedAsset.description && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-500 mb-1">รายละเอียด</p>
                    <p className="text-sm text-gray-700">{selectedAsset.description}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="bordered"
                    className="flex-1"
                    onClick={() => setSelectedAsset(null)}
                  >
                    ปิด
                  </Button>
                  <Button
                    color="primary"
                    className="flex-1"
                    onClick={() => {
                      router.push(`/assets/${selectedAsset.id}`);
                      setSelectedAsset(null);
                    }}
                  >
                    ดูรายละเอียด
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}

