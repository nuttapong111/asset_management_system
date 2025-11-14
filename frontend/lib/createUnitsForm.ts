import Swal from 'sweetalert2';
import { Asset } from '@/types/asset';
import { createUnitsFromParent, CreateUnitsConfig } from '@/lib/mockData';

export const showCreateUnitsForm = async (parentAsset: Asset): Promise<boolean> => {
  if (!parentAsset.isParent) {
    await Swal.fire({
      icon: 'error',
      title: 'ไม่สามารถสร้างห้องเช่าได้',
      text: 'ทรัพย์สินนี้ไม่ใช่ที่ดินหลัก',
    });
    return false;
  }

  const { value: formValues } = await Swal.fire<CreateUnitsConfig>({
    title: `สร้างห้องเช่าจาก: ${parentAsset.name}`,
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
          .swal2-form-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          @media (max-width: 768px) {
            .swal2-form-grid-2 {
              grid-template-columns: 1fr;
            }
          }
          .info-box {
            background-color: #f3f4f6;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
            font-size: 14px;
            color: #374151;
          }
        </style>
        
        <div class="info-box">
          <p style="margin: 0 0 0.5rem 0;"><strong>ที่ดิน:</strong> ${parentAsset.name}</p>
          <p style="margin: 0 0 0.5rem 0;"><strong>ขนาดที่ดิน:</strong> ${parentAsset.size} ตร.ม.</p>
          <p style="margin: 0;"><strong>ห้องเช่าที่มีอยู่:</strong> ${parentAsset.totalUnits || 0} ห้อง</p>
        </div>
        
        <div class="swal2-form-group">
          <label class="swal2-form-label">จำนวนห้องเช่าที่ต้องการสร้าง</label>
          <input id="swal-numberOfUnits" type="number" class="swal2-form-input" value="10" min="1" max="100" placeholder="10">
        </div>
        
        <div class="swal2-form-grid-2">
          <div class="swal2-form-group">
            <label class="swal2-form-label">ขนาดห้อง (ตร.ม.)</label>
            <input id="swal-unitSize" type="number" class="swal2-form-input" value="30" min="1" step="0.01" placeholder="30">
          </div>
          <div class="swal2-form-group">
            <label class="swal2-form-label">จำนวนห้องนอน</label>
            <input id="swal-rooms" type="number" class="swal2-form-input" value="1" min="0" placeholder="1">
          </div>
        </div>
        
        <div class="swal2-form-group">
          <label class="swal2-form-label">เลขห้องเริ่มต้น (เช่น 101, 201, A)</label>
          <input id="swal-unitPrefix" type="text" class="swal2-form-input" value="101" placeholder="101">
          <p style="margin-top: 0.5rem; font-size: 12px; color: #6b7280;">
            ระบบจะสร้างห้องตามลำดับ เช่น 101, 102, 103, ...
          </p>
        </div>
      </div>
    `,
    width: '600px',
    padding: '2rem',
    showCancelButton: true,
    confirmButtonText: 'สร้างห้องเช่า',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    focusConfirm: false,
    preConfirm: async () => {
      const numberOfUnits = parseInt((document.getElementById('swal-numberOfUnits') as HTMLInputElement)?.value || '0');
      const unitSize = parseFloat((document.getElementById('swal-unitSize') as HTMLInputElement)?.value || '0');
      const rooms = parseInt((document.getElementById('swal-rooms') as HTMLInputElement)?.value || '0');
      const unitPrefix = (document.getElementById('swal-unitPrefix') as HTMLInputElement)?.value || '101';

      if (!numberOfUnits || numberOfUnits <= 0) {
        Swal.showValidationMessage('กรุณาระบุจำนวนห้องเช่าที่ต้องการสร้าง');
        return false;
      }

      if (!unitSize || unitSize <= 0) {
        Swal.showValidationMessage('กรุณาระบุขนาดห้องที่ถูกต้อง');
        return false;
      }

      if (rooms < 0) {
        Swal.showValidationMessage('กรุณาระบุจำนวนห้องนอนที่ถูกต้อง');
        return false;
      }

      // Check total size
      const totalSize = numberOfUnits * unitSize;
      if (totalSize > parentAsset.size * 0.9) {
        const result = await Swal.fire({
          icon: 'warning',
          title: 'ขนาดห้องรวมเกินขนาดที่ดิน',
          text: `ขนาดห้องรวม (${totalSize.toFixed(2)} ตร.ม.) เกิน 90% ของขนาดที่ดิน (${parentAsset.size} ตร.ม.) ต้องการดำเนินการต่อหรือไม่?`,
          showCancelButton: true,
          confirmButtonText: 'ดำเนินการต่อ',
          cancelButtonText: 'ยกเลิก',
        });
        if (!result.isConfirmed) {
          return false;
        }
      }

      return {
        numberOfUnits,
        unitSize,
        rooms,
        unitPrefix,
      };
    },
  });

  if (!formValues) {
    return false;
  }

  try {
    const createdUnits = createUnitsFromParent(parentAsset.id, formValues);
    
    await Swal.fire({
      icon: 'success',
      title: 'สร้างห้องเช่าเรียบร้อย',
      html: `
        <p>สร้างห้องเช่า <strong>${createdUnits.length}</strong> ห้องเรียบร้อยแล้ว</p>
        <p style="margin-top: 0.5rem; font-size: 14px; color: #6b7280;">
          ห้องเช่า: ${createdUnits.map(u => u.unitNumber).join(', ')}
        </p>
      `,
      timer: 3000,
      showConfirmButton: true,
    });

    return true;
  } catch (error: any) {
    await Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message || 'ไม่สามารถสร้างห้องเช่าได้',
    });
    return false;
  }
};

