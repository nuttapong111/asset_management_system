import Swal from 'sweetalert2';

interface LocationInfo {
  lat: number;
  lng: number;
  address?: string;
  district?: string; // แขวง/ตำบล
  amphoe?: string; // อำเภอ/เขต
  province?: string;
  postalCode?: string;
}

// Reverse geocoding function using Nominatim (OpenStreetMap)
async function reverseGeocode(lat: number, lng: number): Promise<LocationInfo | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=th`,
      {
        headers: {
          'User-Agent': 'AssetManagementSystem/1.0',
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.address) return null;
    
    const addr = data.address;
    
    // Debug: Log Nominatim response
    console.log('=== Nominatim Reverse Geocoding Debug ===');
    console.log('Full response:', data);
    console.log('display_name:', data.display_name);
    console.log('address object:', addr);
    console.log('addr.suburb:', addr.suburb);
    console.log('addr.village:', addr.village);
    console.log('addr.town:', addr.town);
    console.log('addr.county:', addr.county);
    console.log('addr.city_district:', addr.city_district);
    
    // Extract Thai address components
    // สำหรับประเทศไทย Nominatim จะ return:
    // - suburb = แขวง/ตำบล (sub-district) - ระดับที่เล็กที่สุด
    // - city_district = เขต (กรุงเทพ) หรือ county = อำเภอ (จังหวัดอื่น) - ระดับกลาง
    // - state = จังหวัด (province) - ระดับใหญ่ที่สุด
    
    // Parse display_name เพื่อดึงข้อมูลที่ถูกต้อง
    const displayParts = data.display_name ? data.display_name.split(',').map(p => p.trim()) : [];
    console.log('displayParts:', displayParts);
    
    // อำเภอ/เขต (amphoe/khet) - ระดับกลาง
    // ในกรุงเทพ: city_district = เขต, ในจังหวัดอื่น: county = อำเภอ
    let amphoe = addr.city_district || addr.county || '';
    
    // ถ้า amphoe มีคำว่า "เขต" ให้ลบคำว่า "เขต" ออก (เช่น "เขตประเวศ" -> "ประเวศ")
    // แต่ถ้าไม่มี city_district/county ลองหาจาก display_name
    if (!amphoe) {
      for (const part of displayParts) {
        if (part.includes('เขต') && !part.includes('แขวง') && !part.includes('ตำบล')) {
          amphoe = part.replace(/^.*?เขต\s*/, '').trim();
          break;
        } else if (part.includes('อำเภอ')) {
          amphoe = part.replace(/^.*?อำเภอ\s*/, '').trim();
          break;
        }
      }
    } else if (amphoe.includes('เขต')) {
      // ถ้ามีคำว่า "เขต" อยู่แล้ว ไม่ต้องลบ (เช่น "เขตประเวศ" ถูกต้อง)
    }
    
    // แขวง/ตำบล (sub-district) - ระดับที่เล็กที่สุด
    // ให้ความสำคัญกับ display_name ก่อน เพราะ Nominatim อาจจะ return suburb ผิด
    let district = '';
    
    // หาแขวง/ตำบลจาก display_name ก่อน (ให้ความสำคัญสูงสุด)
    // เพราะ display_name มักจะถูกต้องกว่า address object
    for (let i = 0; i < displayParts.length; i++) {
      const part = displayParts[i];
      
      // หาแขวง (กรุงเทพ) - ต้องมีคำว่า "แขวง" และไม่มีคำว่า "เขต" หรือ "ตำบล"
      if (part.includes('แขวง') && !part.includes('เขต') && !part.includes('ตำบล')) {
        // Extract แขวง โดยลบคำว่า "แขวง" ออก
        district = part.replace(/^.*?แขวง\s*/, '').trim();
        // ถ้ายังมีคำว่า "เขต" อยู่ แสดงว่าอาจจะ parse ผิด
        if (district.includes('เขต')) {
          district = district.replace(/เขต.*$/, '').trim();
        }
        // ถ้ายังมีคำว่า "อำเภอ" อยู่ แสดงว่าอาจจะ parse ผิด
        if (district.includes('อำเภอ')) {
          district = district.replace(/อำเภอ.*$/, '').trim();
        }
        break;
      }
      // หาตำบล (จังหวัดอื่น) - ต้องมีคำว่า "ตำบล" และไม่มีคำว่า "อำเภอ" หรือ "เขต"
      else if (part.includes('ตำบล') && !part.includes('อำเภอ') && !part.includes('เขต')) {
        // Extract ตำบล โดยลบคำว่า "ตำบล" ออก
        district = part.replace(/^.*?ตำบล\s*/, '').trim();
        // ถ้ายังมีคำว่า "อำเภอ" อยู่ แสดงว่าอาจจะ parse ผิด
        if (district.includes('อำเภอ')) {
          district = district.replace(/อำเภอ.*$/, '').trim();
        }
        // ถ้ายังมีคำว่า "เขต" อยู่ แสดงว่าอาจจะ parse ผิด
        if (district.includes('เขต')) {
          district = district.replace(/เขต.*$/, '').trim();
        }
        break;
      }
    }
    
    // ถ้ายังหาไม่เจอจาก display_name ลองใช้ address object
    if (!district) {
      if (addr.suburb && !addr.suburb.includes('อำเภอ') && !addr.suburb.includes('เขต')) {
        district = addr.suburb;
      } else if (addr.village && !addr.village.includes('อำเภอ') && !addr.village.includes('เขต')) {
        district = addr.village;
      } else if (addr.town && !addr.town.includes('อำเภอ') && !addr.town.includes('เขต')) {
        district = addr.town;
      }
    }
    
    // ถ้ายังหาไม่เจอ ลองหาจากส่วนที่อยู่ก่อนอำเภอ/เขตใน display_name
    if (!district) {
      for (let i = 0; i < displayParts.length; i++) {
        const part = displayParts[i];
        
        // ถ้าพบอำเภอหรือเขต ให้ดูส่วนก่อนหน้านี้
        if ((part.includes('อำเภอ') || part.includes('เขต')) && i > 0) {
          const prevPart = displayParts[i - 1];
          // ถ้าส่วนก่อนหน้าไม่ใช่ถนนหรือเลขที่ และไม่มีคำว่า "อำเภอ" หรือ "เขต" หรือ "จังหวัด"
          if (prevPart && 
              !prevPart.includes('ถนน') && 
              !prevPart.includes('เลขที่') && 
              !prevPart.includes('อำเภอ') && 
              !prevPart.includes('เขต') &&
              !prevPart.includes('จังหวัด') &&
              !prevPart.includes('แขวง') &&
              !prevPart.includes('ตำบล')) {
            district = prevPart.trim();
            break;
          }
        }
      }
    }
    
    // จังหวัด (province) - ระดับใหญ่ที่สุด
    let province = addr.state || addr.province || '';
    
    // ถ้าไม่มี province ลองหาจาก display_name
    if (!province) {
      for (const part of displayParts) {
        if (part.includes('กรุงเทพ') || part.includes('มหานคร')) {
          province = 'กรุงเทพมหานคร';
          break;
        } else if (part.includes('จังหวัด')) {
          province = part.replace(/^.*?จังหวัด\s*/, '').trim();
          break;
        }
      }
      // ถ้ายังไม่มี ลองหาจากส่วนท้ายๆ ของ display_name
      if (!province && displayParts.length > 0) {
        const lastPart = displayParts[displayParts.length - 1];
        if (lastPart.includes('ประเทศไทย')) {
          // ลองหาจากส่วนก่อนหน้า
          if (displayParts.length > 1) {
            const secondLast = displayParts[displayParts.length - 2];
            if (secondLast && !secondLast.includes('เขต') && !secondLast.includes('แขวง') && !secondLast.includes('ตำบล')) {
              province = secondLast;
            }
          }
        }
      }
    }
    
    const postalCode = addr.postcode || '';
    
    // Build full address
    const addressParts = [
      addr.house_number || addr.house_name || '',
      addr.road || addr.street || '',
    ].filter(Boolean);
    const address = addressParts.join(' ') || addr.display_name?.split(',')[0] || '';
    
    // Debug: Log parsed results
    console.log('=== Parsed Results ===');
    console.log('district (ตำบล/แขวง):', district);
    console.log('amphoe (อำเภอ/เขต):', amphoe);
    console.log('province (จังหวัด):', province);
    console.log('postalCode:', postalCode);
    console.log('address:', address);
    console.log('==========================================');
    
    return {
      lat,
      lng,
      address: address.trim(),
      district: district.trim(),
      amphoe: amphoe.trim(),
      province: province.trim(),
      postalCode: postalCode.trim(),
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

export const showLocationPicker = async (
  initialLat?: number,
  initialLng?: number
): Promise<LocationInfo | null> => {
  return new Promise((resolve) => {
    const mapContainerId = 'location-picker-map';
    let map: any = null;
    let marker: any = null;
    let selectedLat = initialLat || 13.7563;
    let selectedLng = initialLng || 100.5018;
    let addressInfo: LocationInfo | null = null;
    let isLoadingAddress = false;

    Swal.fire({
      title: 'เลือกตำแหน่งบนแผนที่',
      html: `
        <div id="${mapContainerId}" style="width: 100%; height: 400px; border-radius: 0.5rem; margin: 1rem 0;"></div>
        <div style="margin-top: 1rem; padding: 0.75rem; background-color: #f3f4f6; border-radius: 0.5rem;">
          <p style="margin: 0; font-size: 14px; color: #374151;">
            <strong>Latitude:</strong> <span id="selected-lat">${selectedLat.toFixed(8)}</span><br>
            <strong>Longitude:</strong> <span id="selected-lng">${selectedLng.toFixed(8)}</span>
          </p>
          <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #d1d5db;">
            <p style="margin: 0 0 0.25rem 0; font-size: 12px; font-weight: 600; color: #374151;">ที่อยู่:</p>
            <p id="selected-address" style="margin: 0; font-size: 13px; color: #6b7280; min-height: 1.5rem;">
              กำลังโหลดข้อมูลที่อยู่...
            </p>
          </div>
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
          import('leaflet/dist/leaflet.css' as string),
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

          const updateCoordinates = async () => {
            const latElement = document.getElementById('selected-lat');
            const lngElement = document.getElementById('selected-lng');
            const addressElement = document.getElementById('selected-address');
            
            if (latElement) latElement.textContent = selectedLat.toFixed(8);
            if (lngElement) lngElement.textContent = selectedLng.toFixed(8);
            
            // Show loading state
            if (addressElement) {
              addressElement.innerHTML = '<span style="color: #6b7280; font-style: italic;">กำลังโหลดข้อมูลที่อยู่...</span>';
            }
            
            // Fetch address information
            if (!isLoadingAddress) {
              isLoadingAddress = true;
              try {
                addressInfo = await reverseGeocode(selectedLat, selectedLng);
                if (addressElement && addressInfo) {
                  const parts = [];
                  if (addressInfo.address) parts.push(addressInfo.address);
                  if (addressInfo.district) parts.push(addressInfo.district);
                  if (addressInfo.province) parts.push(addressInfo.province);
                  if (addressInfo.postalCode) parts.push(addressInfo.postalCode);
                  
                  addressElement.innerHTML = parts.length > 0 
                    ? `<span style="color: #111827;">${parts.join(', ')}</span>`
                    : '<span style="color: #6b7280;">ไม่พบข้อมูลที่อยู่</span>';
                } else if (addressElement) {
                  addressElement.innerHTML = '<span style="color: #6b7280;">ไม่พบข้อมูลที่อยู่</span>';
                }
              } catch (error) {
                console.error('Error fetching address:', error);
                if (addressElement) {
                  addressElement.innerHTML = '<span style="color: #ef4444;">เกิดข้อผิดพลาดในการโหลดข้อมูล</span>';
                }
              } finally {
                isLoadingAddress = false;
              }
            }
          };
          
          // Initial address load
          updateCoordinates();
        });
      },
      preConfirm: async () => {
        // Wait for address info if still loading
        if (isLoadingAddress) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          // Try to get address info one more time
          if (!addressInfo) {
            addressInfo = await reverseGeocode(selectedLat, selectedLng);
          }
        }
        return addressInfo || {
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

