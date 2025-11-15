'use client';

import { useEffect, useRef } from 'react';
import { Asset } from '@/types/asset';
import { formatCurrency, getStatusText } from '@/lib/utils';

interface AssetsMapComponentProps {
  assets: Asset[];
  onMarkerClick?: (asset: Asset) => void;
}

export default function AssetsMapComponent({ assets, onMarkerClick }: AssetsMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import leaflet
    Promise.all([
      import('leaflet'),
      import('leaflet.markercluster'),
      import('leaflet/dist/leaflet.css' as string),
    ]).then(([leaflet, LMC]) => {
      if (!mapRef.current) return;

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
      const map = L.map(mapRef.current).setView([13.7563, 100.5018], 11);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create marker cluster group
    if (!MarkerClusterGroup) {
      console.error('MarkerClusterGroup is not available');
      return;
    }

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

        // Create popup content with asset summary
        const popupContent = `
          <div style="min-width: 250px; font-family: 'Sukhumvit Set', 'Noto Sans Thai', sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
              ${asset.name}
            </h3>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
              📍 ${asset.address}, ${asset.district}
            </p>
            <div style="display: flex; gap: 12px; margin-bottom: 8px; font-size: 12px;">
              <span style="color: #6b7280;">📐 ${asset.size} ตร.ม.</span>
              <span style="color: #6b7280;">🚪 ${asset.rooms} ห้อง</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="
                display: inline-block;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                ${
                  asset.status === 'available'
                    ? 'background-color: #d1fae5; color: #065f46;'
                    : asset.status === 'rented'
                    ? 'background-color: #dbeafe; color: #1e40af;'
                    : 'background-color: #fed7aa; color: #9a3412;'
                }
              ">
                ${getStatusText(asset.status)}
              </span>
            </div>
            <div style="font-size: 12px; color: #6b7280;">
              <p style="margin: 4px 0;">💰 มูลค่าปัจจุบัน: <strong style="color: #1f2937;">${formatCurrency(asset.currentValue)}</strong></p>
              <p style="margin: 4px 0;">💵 ราคาซื้อ: ${formatCurrency(asset.purchasePrice)}</p>
            </div>
            <button 
              onclick="window.location.href='/assets/${asset.id}'"
              style="
                margin-top: 8px;
                width: 100%;
                padding: 8px;
                background: linear-gradient(to right, #3b82f6, #8b5cf6);
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 0.2s;
              "
              onmouseover="this.style.opacity='0.9'"
              onmouseout="this.style.opacity='1'"
            >
              ดูรายละเอียด
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);

        // Add click handler
        if (onMarkerClick) {
          marker.on('click', () => {
            onMarkerClick(asset);
          });
        }

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
    }).catch((error) => {
      console.error('Error loading leaflet:', error);
    });

    return () => {
      if (markersRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(markersRef.current);
        markersRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [assets, onMarkerClick]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-lg"
      style={{ minHeight: '600px', zIndex: 0 }}
    />
  );
}

