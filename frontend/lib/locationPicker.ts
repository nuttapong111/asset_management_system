import Swal from 'sweetalert2';

export const showLocationPicker = async (
  initialLat?: number,
  initialLng?: number
): Promise<{ lat: number; lng: number } | null> => {
  return new Promise((resolve) => {
    const mapContainerId = 'location-picker-map';
    let map: any = null;
    let marker: any = null;
    let selectedLat = initialLat || 13.7563;
    let selectedLng = initialLng || 100.5018;

    Swal.fire({
      title: 'เลือกตำแหน่งบนแผนที่',
      html: `
        <div id="${mapContainerId}" style="width: 100%; height: 400px; border-radius: 0.5rem; margin: 1rem 0;"></div>
        <div style="margin-top: 1rem; padding: 0.75rem; background-color: #f3f4f6; border-radius: 0.5rem;">
          <p style="margin: 0; font-size: 14px; color: #374151;">
            <strong>Latitude:</strong> <span id="selected-lat">${selectedLat.toFixed(8)}</span><br>
            <strong>Longitude:</strong> <span id="selected-lng">${selectedLng.toFixed(8)}</span>
          </p>
          <p style="margin: 0.5rem 0 0 0; font-size: 12px; color: #6b7280;">
            💡 คลิกบนแผนที่หรือลาก marker เพื่อเลือกตำแหน่ง
          </p>
        </div>
      `,
      width: '700px',
      showCancelButton: true,
      confirmButtonText: 'ใช้ตำแหน่งนี้',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      didOpen: () => {
        // Dynamically import Leaflet and CSS
        Promise.all([
          import('leaflet'),
          import('leaflet/dist/leaflet.css'),
        ]).then(([L]) => {
          // Fix for default marker icons
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          });

          const mapElement = document.getElementById(mapContainerId);
          if (!mapElement) return;

          // Initialize map
          map = L.map(mapElement).setView([selectedLat, selectedLng], 13);

          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);

          // Add initial marker
          marker = L.marker([selectedLat, selectedLng], {
            draggable: true,
          }).addTo(map);

          // Update coordinates when marker is dragged
          marker.on('dragend', (e: any) => {
            const latlng = e.target.getLatLng();
            selectedLat = latlng.lat;
            selectedLng = latlng.lng;
            updateCoordinates();
          });

          // Update coordinates when map is clicked
          map.on('click', (e: any) => {
            selectedLat = e.latlng.lat;
            selectedLng = e.latlng.lng;
            marker.setLatLng([selectedLat, selectedLng]);
            updateCoordinates();
          });

          function updateCoordinates() {
            const latElement = document.getElementById('selected-lat');
            const lngElement = document.getElementById('selected-lng');
            if (latElement) latElement.textContent = selectedLat.toFixed(8);
            if (lngElement) lngElement.textContent = selectedLng.toFixed(8);
          }
        });
      },
      preConfirm: () => {
        return {
          lat: selectedLat,
          lng: selectedLng,
        };
      },
      willClose: () => {
        if (map) {
          map.remove();
        }
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        resolve(result.value);
      } else {
        resolve(null);
      }
    });
  });
};

