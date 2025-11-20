import Swal from 'sweetalert2';
import { Asset, AssetType, AssetStatus } from '@/types/asset';
import { apiClient } from './api';
import { getStoredUser, getStoredToken } from './auth';
import { showLocationPicker } from './locationPicker';

interface AssetFormData {
  name: string;
  type: AssetType;
  address: string;
  district: string;
  amphoe: string;
  province: string;
  postalCode: string;
  size: string;
  rooms: string;
  purchasePrice: string;
  currentValue: string;
  status: AssetStatus;
  latitude: string;
  longitude: string;
  description: string;
  isParent?: boolean;
}

export const showAssetForm = async (
  asset?: Asset | null,
  initialLocation?: { lat: number; lng: number }
): Promise<Asset | null> => {
  const user = getStoredUser();
  const token = getStoredToken();
  if (!user || !token) {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'กรุณาเข้าสู่ระบบใหม่',
    });
    return null;
  }
  apiClient.setToken(token);

  // Initialize form data
  const initialData: AssetFormData = asset
    ? {
        name: asset.name,
        type: asset.type,
        address: asset.address,
        district: asset.district,
        amphoe: asset.amphoe || '',
        province: asset.province,
        postalCode: asset.postalCode,
        size: asset.size.toString(),
        rooms: asset.rooms.toString(),
        purchasePrice: asset.purchasePrice.toString(),
        currentValue: asset.currentValue.toString(),
        status: asset.status,
        latitude: asset.latitude?.toString() || '',
        longitude: asset.longitude?.toString() || '',
        description: asset.description || '',
      }
    : {
        name: '',
        type: 'house',
        address: '',
        district: '',
        amphoe: '',
        province: '',
        postalCode: '',
        size: '',
        rooms: '',
        purchasePrice: '',
        currentValue: '',
        status: 'available',
        latitude: initialLocation ? initialLocation.lat.toString() : '',
        longitude: initialLocation ? initialLocation.lng.toString() : '',
        description: '',
      };

  // Create type options HTML
  const typeOptions: { value: AssetType; label: string }[] = [
    { value: 'house', label: 'บ้าน' },
    { value: 'condo', label: 'คอนโด' },
    { value: 'apartment', label: 'อพาร์ทเมนต์' },
    { value: 'land', label: 'ที่ดิน' },
  ];

  // If creating new asset and type is 'land', default isParent to true
  if (!asset && initialData.type === 'land') {
    initialData.isParent = true;
  }

  const typeOptionsHTML = typeOptions
    .map(
      (type) =>
        `<option value="${type.value}" ${initialData.type === type.value ? 'selected' : ''}>${type.label}</option>`
    )
    .join('');

  // Create status options HTML
  const statusOptions: { value: AssetStatus; label: string }[] = [
    { value: 'available', label: 'ว่าง' },
    { value: 'rented', label: 'ให้เช่าแล้ว' },
    { value: 'maintenance', label: 'ซ่อมแซม' },
  ];

  const statusOptionsHTML = statusOptions
    .map(
      (status) =>
        `<option value="${status.value}" ${initialData.status === status.value ? 'selected' : ''}>${status.label}</option>`
    )
    .join('');

  const { value: formValues } = await Swal.fire<AssetFormData>({
    title: asset ? 'แก้ไขข้อมูลทรัพย์สิน' : 'เพิ่มทรัพย์สินใหม่',
    html: `
      <div style="text-align: left; max-width: 100%; margin: 0; padding: 0;">
        <style>
          .swal2-form-group {
            margin-bottom: 1.5rem;
          }
          .swal2-form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            line-height: 1.5;
          }
          .swal2-form-input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 14px;
            box-sizing: border-box;
            transition: border-color 0.2s, box-shadow 0.2s;
            font-family: 'Sukhumvit Set', 'Noto Sans Thai', sans-serif;
          }
          .swal2-form-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          .swal2-form-textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 14px;
            box-sizing: border-box;
            font-family: 'Sukhumvit Set', 'Noto Sans Thai', sans-serif;
            resize: vertical;
            line-height: 1.5;
          }
          .swal2-form-textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          .swal2-form-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .swal2-form-grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1rem;
          }
          @media (max-width: 768px) {
            .swal2-form-grid-2,
            .swal2-form-grid-3 {
              grid-template-columns: 1fr;
            }
          }
        </style>
        
        <div class="swal2-form-group">
          <label class="swal2-form-label">ชื่อทรัพย์สิน</label>
          <input id="swal-name" type="text" class="swal2-form-input" value="${initialData.name}" placeholder="ชื่อทรัพย์สิน">
        </div>
        
        <div class="swal2-form-grid-2">
          <div class="swal2-form-group">
            <label class="swal2-form-label">ประเภท</label>
            <select id="swal-type" class="swal2-form-input">
              ${typeOptionsHTML}
            </select>
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">สถานะ</label>
            <select id="swal-status" class="swal2-form-input">
              ${statusOptionsHTML}
            </select>
          </div>
        </div>
        
        ${!asset ? `
        <div class="swal2-form-group">
          <label class="swal2-form-label">
            <input type="checkbox" id="swal-isParent" ${initialData.type === 'land' ? 'checked' : ''} style="margin-right: 0.5rem;">
            ที่ดินหลัก (สามารถสร้างห้องเช่าได้)
          </label>
          <p style="margin-top: 0.5rem; font-size: 12px; color: #6b7280;">
            เลือกถ้าต้องการสร้างห้องเช่าหลายห้องในที่ดินแปลงนี้
          </p>
        </div>
        ` : ''}
        
        <div class="swal2-form-group">
          <label class="swal2-form-label">ที่อยู่</label>
          <input id="swal-address" type="text" class="swal2-form-input" value="${initialData.address}" placeholder="เลขที่ ถนน">
        </div>
        
        <div class="swal2-form-grid-2">
          <div class="swal2-form-group">
            <label class="swal2-form-label">แขวง/ตำบล</label>
            <input id="swal-district" type="text" class="swal2-form-input" value="${initialData.district}" placeholder="แขวง/ตำบล">
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">อำเภอ/เขต</label>
            <input id="swal-amphoe" type="text" class="swal2-form-input" value="${initialData.amphoe}" placeholder="อำเภอ/เขต">
          </div>
        </div>
        
        <div class="swal2-form-grid-2">
          <div class="swal2-form-group">
            <label class="swal2-form-label">จังหวัด</label>
            <input id="swal-province" type="text" class="swal2-form-input" value="${initialData.province}" placeholder="จังหวัด">
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">รหัสไปรษณีย์</label>
            <input id="swal-postalCode" type="text" class="swal2-form-input" value="${initialData.postalCode}" placeholder="รหัสไปรษณีย์">
          </div>
        </div>
        
        <div class="swal2-form-grid-2">
          <div class="swal2-form-group">
            <label class="swal2-form-label">Latitude</label>
            <div style="display: flex; gap: 0.5rem;">
              <input id="swal-latitude" type="number" class="swal2-form-input" value="${initialData.latitude}" placeholder="13.7563" step="0.00000001" style="flex: 1; ${!asset ? 'background-color: #f3f4f6; cursor: not-allowed;' : ''}" ${!asset ? 'readonly' : ''}>
              ${asset ? `<button type="button" id="pick-location-btn" style="padding: 0.75rem 1rem; background: linear-gradient(to right, #3b82f6, #2563eb); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                📍 เลือกตำแหน่ง
              </button>` : '<span style="padding: 0.75rem 1rem; background-color: #e5e7eb; color: #6b7280; border-radius: 0.5rem; font-size: 12px; white-space: nowrap;">📍 เลือกแล้ว</span>'}
            </div>
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">Longitude</label>
            <input id="swal-longitude" type="number" class="swal2-form-input" value="${initialData.longitude}" placeholder="100.5018" step="0.00000001" style="${!asset ? 'background-color: #f3f4f6; cursor: not-allowed;' : ''}" ${!asset ? 'readonly' : ''}>
          </div>
        </div>
        
        <div class="swal2-form-grid-2">
          <div class="swal2-form-group">
            <label class="swal2-form-label">ขนาด (ตร.ม.)</label>
            <input id="swal-size" type="number" class="swal2-form-input" value="${initialData.size}" placeholder="0" min="0" step="0.01">
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">จำนวนห้อง</label>
            <input id="swal-rooms" type="number" class="swal2-form-input" value="${initialData.rooms}" placeholder="0" min="0">
          </div>
        </div>
        
        <div class="swal2-form-grid-2">
          <div class="swal2-form-group">
            <label class="swal2-form-label">ราคาซื้อ (บาท)</label>
            <input id="swal-purchasePrice" type="number" class="swal2-form-input" value="${initialData.purchasePrice}" placeholder="0" min="0" step="0.01">
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">มูลค่าปัจจุบัน (บาท)</label>
            <input id="swal-currentValue" type="number" class="swal2-form-input" value="${initialData.currentValue}" placeholder="0" min="0" step="0.01">
          </div>
        </div>
        
        <div class="swal2-form-group" style="margin-bottom: 0;">
          <label class="swal2-form-label">รายละเอียด</label>
          <textarea id="swal-description" class="swal2-form-textarea" placeholder="รายละเอียดทรัพย์สิน" style="min-height: 100px;">${initialData.description}</textarea>
        </div>
      </div>
    `,
    width: '850px',
    padding: '2rem',
    showCancelButton: true,
    confirmButtonText: asset ? 'บันทึกการแก้ไข' : 'เพิ่มทรัพย์สิน',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    focusConfirm: false,
    didOpen: async () => {
      // Add click handler for location picker button
      const pickLocationBtn = document.getElementById('pick-location-btn');
      if (pickLocationBtn) {
        pickLocationBtn.addEventListener('click', async () => {
          const currentLat = parseFloat((document.getElementById('swal-latitude') as HTMLInputElement)?.value || '0') || 13.7563;
          const currentLng = parseFloat((document.getElementById('swal-longitude') as HTMLInputElement)?.value || '0') || 100.5018;
          
          const location = await showLocationPicker(currentLat, currentLng);
          if (location) {
            (document.getElementById('swal-latitude') as HTMLInputElement).value = location.lat.toFixed(8);
            (document.getElementById('swal-longitude') as HTMLInputElement).value = location.lng.toFixed(8);
            
            // Auto-fill address fields if available
            // หมายเหตุ: ตำบล/แขวง (district) ไม่ auto-fill ให้ผู้ใช้กรอกเอง
            if (location.address) {
              const addressInput = document.getElementById('swal-address') as HTMLInputElement;
              if (addressInput && !addressInput.value.trim()) {
                addressInput.value = location.address;
              }
            }
            // district ไม่ auto-fill - ให้ผู้ใช้กรอกเอง
            if (location.amphoe) {
              const amphoeInput = document.getElementById('swal-amphoe') as HTMLInputElement;
              if (amphoeInput && !amphoeInput.value.trim()) {
                amphoeInput.value = location.amphoe;
              }
            }
            if (location.province) {
              const provinceInput = document.getElementById('swal-province') as HTMLInputElement;
              if (provinceInput && !provinceInput.value.trim()) {
                provinceInput.value = location.province;
              }
            }
            if (location.postalCode) {
              const postalCodeInput = document.getElementById('swal-postalCode') as HTMLInputElement;
              if (postalCodeInput && !postalCodeInput.value.trim()) {
                postalCodeInput.value = location.postalCode;
              }
            }
          }
        });
      }
      
      // Also handle when location is selected from map click (for new assets)
      if (!asset && initialLocation) {
        // Auto-fill address when initial location is provided
        const reverseGeocode = async (lat: number, lng: number) => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=th`,
              {
                headers: {
                  'User-Agent': 'AssetManagementSystem/1.0',
                },
              }
            );
            
            if (!response.ok) return;
            
            const data = await response.json();
            if (!data.address) return;
            
            const addr = data.address;
            
            // Debug: Log Nominatim response
            console.log('=== Nominatim Reverse Geocoding Debug (Asset Form) ===');
            console.log('Full response:', data);
            console.log('display_name:', data.display_name);
            console.log('address object:', addr);
            console.log('addr.suburb:', addr.suburb);
            console.log('addr.village:', addr.village);
            console.log('addr.town:', addr.town);
            console.log('addr.county:', addr.county);
            console.log('addr.city_district:', addr.city_district);
            
            // Parse display_name เพื่อดึงข้อมูลที่ถูกต้อง
            const displayParts = data.display_name ? data.display_name.split(',').map((p: string) => p.trim()) : [];
            console.log('displayParts:', displayParts);
            
            // อำเภอ/เขต (amphoe/khet) - ระดับกลาง
            // ในกรุงเทพ: city_district = เขต, ในจังหวัดอื่น: county = อำเภอ
            let amphoe = addr.city_district || addr.county || '';
            
            // ถ้า amphoe มีคำว่า "เขต" ให้เก็บไว้ (เช่น "เขตประเวศ" ถูกต้อง)
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
            const addressParts = [
              addr.house_number || addr.house_name || '',
              addr.road || addr.street || '',
            ].filter(Boolean);
            const address = addressParts.join(' ') || addr.display_name?.split(',')[0] || '';
            
            // Debug: Log parsed results
            console.log('=== Parsed Results (Asset Form) ===');
            console.log('district (ตำบล/แขวง):', district);
            console.log('amphoe (อำเภอ/เขต):', amphoe);
            console.log('province (จังหวัด):', province);
            console.log('postalCode:', postalCode);
            console.log('address:', address);
            console.log('==========================================');
            
            // Fill in the form fields
            // หมายเหตุ: ตำบล/แขวง (district) ไม่ auto-fill ให้ผู้ใช้กรอกเอง
            setTimeout(() => {
              const addressInput = document.getElementById('swal-address') as HTMLInputElement;
              const amphoeInput = document.getElementById('swal-amphoe') as HTMLInputElement;
              const provinceInput = document.getElementById('swal-province') as HTMLInputElement;
              const postalCodeInput = document.getElementById('swal-postalCode') as HTMLInputElement;
              
              if (addressInput && address.trim()) addressInput.value = address.trim();
              // district ไม่ auto-fill - ให้ผู้ใช้กรอกเอง
              if (amphoeInput && amphoe.trim()) amphoeInput.value = amphoe.trim();
              if (provinceInput && province.trim()) provinceInput.value = province.trim();
              if (postalCodeInput && postalCode.trim()) postalCodeInput.value = postalCode.trim();
            }, 500);
          } catch (error) {
            console.error('Error reverse geocoding:', error);
          }
        };
        
        if (initialLocation.lat && initialLocation.lng) {
          reverseGeocode(initialLocation.lat, initialLocation.lng);
        }
      }
    },
    preConfirm: () => {
      const name = (document.getElementById('swal-name') as HTMLInputElement)?.value || '';
      const type = (document.getElementById('swal-type') as HTMLSelectElement)?.value as AssetType || 'house';
      const address = (document.getElementById('swal-address') as HTMLInputElement)?.value || '';
      const district = (document.getElementById('swal-district') as HTMLInputElement)?.value || '';
      const amphoe = (document.getElementById('swal-amphoe') as HTMLInputElement)?.value || '';
      const province = (document.getElementById('swal-province') as HTMLInputElement)?.value || '';
      const postalCode = (document.getElementById('swal-postalCode') as HTMLInputElement)?.value || '';
      const size = (document.getElementById('swal-size') as HTMLInputElement)?.value || '';
      const rooms = (document.getElementById('swal-rooms') as HTMLInputElement)?.value || '';
      const purchasePrice = (document.getElementById('swal-purchasePrice') as HTMLInputElement)?.value || '';
      const currentValue = (document.getElementById('swal-currentValue') as HTMLInputElement)?.value || '';
      const status = (document.getElementById('swal-status') as HTMLSelectElement)?.value as AssetStatus || 'available';
      const latitude = (document.getElementById('swal-latitude') as HTMLInputElement)?.value || '';
      const longitude = (document.getElementById('swal-longitude') as HTMLInputElement)?.value || '';
      const description = (document.getElementById('swal-description') as HTMLTextAreaElement)?.value || '';
      const isParent = asset 
        ? asset.isParent 
        : (document.getElementById('swal-isParent') as HTMLInputElement)?.checked || false;

      // Validation
      if (!name.trim()) {
        Swal.showValidationMessage('กรุณาระบุชื่อทรัพย์สิน');
        return false;
      }

      if (!address.trim()) {
        Swal.showValidationMessage('กรุณาระบุที่อยู่');
        return false;
      }

      if (!district.trim()) {
        Swal.showValidationMessage('กรุณาระบุแขวง/ตำบล');
        return false;
      }

      if (!province.trim()) {
        Swal.showValidationMessage('กรุณาระบุจังหวัด');
        return false;
      }

      if (!size || parseFloat(size) <= 0) {
        Swal.showValidationMessage('กรุณาระบุขนาดที่ถูกต้อง');
        return false;
      }

      if (!rooms || parseInt(rooms) < 0) {
        Swal.showValidationMessage('กรุณาระบุจำนวนห้องที่ถูกต้อง');
        return false;
      }

      if (!purchasePrice || parseFloat(purchasePrice) < 0) {
        Swal.showValidationMessage('กรุณาระบุราคาซื้อที่ถูกต้อง');
        return false;
      }

      if (!currentValue || parseFloat(currentValue) < 0) {
        Swal.showValidationMessage('กรุณาระบุมูลค่าปัจจุบันที่ถูกต้อง');
        return false;
      }

      return {
        name: name.trim(),
        type,
        address: address.trim(),
        district: district.trim(),
        amphoe: amphoe.trim(),
        province: province.trim(),
        postalCode: postalCode.trim(),
        size: parseFloat(size),
        rooms: parseInt(rooms),
        purchasePrice: parseFloat(purchasePrice),
        currentValue: parseFloat(currentValue),
        status,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        description: description.trim() || undefined,
        isParent: asset ? asset.isParent : isParent,
      };
    },
  });

  if (!formValues) {
    return null;
  }

  try {
    let savedAsset: Asset;

    const assetData: any = {
      ...formValues,
      size: typeof formValues.size === 'string' ? parseFloat(formValues.size) : formValues.size,
      rooms: typeof formValues.rooms === 'string' ? parseInt(formValues.rooms) : formValues.rooms,
      purchasePrice: typeof formValues.purchasePrice === 'string' ? parseFloat(formValues.purchasePrice) : formValues.purchasePrice,
      currentValue: typeof formValues.currentValue === 'string' ? parseFloat(formValues.currentValue) : formValues.currentValue,
      latitude: formValues.latitude ? (typeof formValues.latitude === 'string' ? parseFloat(formValues.latitude) : formValues.latitude) : undefined,
      longitude: formValues.longitude ? (typeof formValues.longitude === 'string' ? parseFloat(formValues.longitude) : formValues.longitude) : undefined,
      images: asset?.images || [],
      documents: asset?.documents || [],
      isParent: formValues.isParent || false,
    };

    if (asset) {
      savedAsset = await apiClient.updateAsset(asset.id, assetData);
      await Swal.fire({
        icon: 'success',
        title: 'อัปเดตข้อมูลเรียบร้อย',
        text: 'ข้อมูลทรัพย์สินได้รับการอัปเดตแล้ว',
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      assetData.totalUnits = formValues.isParent ? 0 : undefined;
      assetData.childAssets = formValues.isParent ? [] : undefined;
      savedAsset = await apiClient.createAsset(assetData);
      await Swal.fire({
        icon: 'success',
        title: 'เพิ่มทรัพย์สินเรียบร้อย',
        text: 'ทรัพย์สินใหม่ได้รับการเพิ่มแล้ว',
        timer: 2000,
        showConfirmButton: false,
      });
    }

    return savedAsset;
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
    });
    return null;
  }
};

