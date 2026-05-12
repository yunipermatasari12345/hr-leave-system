import ExcelJS from 'exceljs';

/**
 * Mengekspor data pengajuan cuti ke Excel dengan link lampiran (tanpa embed gambar).
 * @param {Array} leaves - Data pengajuan cuti yang akan diekspor.
 * @param {string} apiBaseUrl - URL dasar API untuk membentuk link lampiran.
 */
/**
 * Helper untuk mengambil nilai string dari berbagai format (string biasa atau sql.NullString)
 */
const getValue = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === 'object' && 'String' in val) {
    return val.Valid ? val.String : "";
  }
  return String(val);
};

/**
 * Mengekspor data pengajuan cuti ke Excel dengan link lampiran (tanpa embed gambar).
 * @param {Array} leaves - Data pengajuan cuti yang akan diekspor.
 * @param {string} apiBaseUrl - URL dasar API untuk membentuk link lampiran.
 */
export const exportLeavesWithImages = async (leaves, apiBaseUrl) => {
  if (!leaves || leaves.length === 0) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Pengajuan Cuti');

  // 1. Definisikan Kolom
  worksheet.columns = [
    { header: 'ID',         key: 'id',     width: 8  },
    { header: 'Karyawan',   key: 'name',   width: 25 },
    { header: 'Departemen', key: 'dept',   width: 20 },
    { header: 'Jenis Cuti', key: 'type',   width: 20 },
    { header: 'Mulai',      key: 'start',  width: 15 },
    { header: 'Selesai',    key: 'end',    width: 15 },
    { header: 'Hari',       key: 'days',   width: 8  },
    { header: 'Alasan',     key: 'reason', width: 35 },
    { header: 'Status',     key: 'status', width: 12 },
    { header: 'Catatan HRD',key: 'note',   width: 30 },
    { header: 'Link Lampiran', key: 'link', width: 50 },
  ];

  // 2. Styling Header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;

  // 3. Tambahkan Data
  leaves.forEach((l, i) => {
    const attachmentUrl = getValue(l.attachment_url);
    let linkDisplay = '-';
    
    if (attachmentUrl) {
      linkDisplay = attachmentUrl.startsWith('http')
        ? attachmentUrl
        : `${apiBaseUrl.replace(/\/$/, '')}${attachmentUrl.startsWith('/') ? '' : '/'}${attachmentUrl}`;
    } else if (l.has_attachment || l.has_binary_attachment) {
      linkDisplay = `Buka di aplikasi (ID #${l.id})`;
    }

    const rowData = {
      id:     l.id,
      name:   getValue(l.employee_name) || getValue(l.full_name),
      dept:   getValue(l.employee_department) || getValue(l.department),
      type:   getValue(l.leave_type_name) || '-',
      start:  l.start_date ? String(l.start_date).slice(0, 10) : '-',
      end:    l.end_date ? String(l.end_date).slice(0, 10) : '-',
      days:   l.total_days || 0,
      reason: getValue(l.reason) || '-',
      status: getValue(l.status).toUpperCase(),
      note:   getValue(l.hrd_note) || '-',
      link:   linkDisplay,
    };

    const row = worksheet.addRow(rowData);
    row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    row.height = 22;

    // Warna status
    const statusVal = getValue(l.status).toLowerCase();
    const statusCell = row.getCell('status');
    if (statusVal === 'approved' || statusVal === 'disetujui') {
      statusCell.font = { bold: true, color: { argb: 'FF166534' } };
    } else if (statusVal === 'rejected' || statusVal === 'ditolak') {
      statusCell.font = { bold: true, color: { argb: 'FF991B1B' } };
    } else {
      statusCell.font = { bold: true, color: { argb: 'FFB45309' } };
    }

    // Link Hyperlink
    const linkCell = row.getCell('link');
    if (attachmentUrl) {
      const fullUrl = attachmentUrl.startsWith('http') 
        ? attachmentUrl 
        : `${apiBaseUrl.replace(/\/$/, '')}${attachmentUrl.startsWith('/') ? '' : '/'}${attachmentUrl}`;
      
      // Jika itu endpoint API biner, arahkan ke download
      if (attachmentUrl.includes('/attachment')) {
         linkCell.value = { text: 'Klik untuk Download', hyperlink: fullUrl };
      } else {
         linkCell.value = { text: 'Buka File', hyperlink: fullUrl };
      }
      linkCell.font = { color: { argb: 'FF2563EB' }, underline: true };
    }

    // Zebra striping
    if (i % 2 === 0) {
      row.eachCell((cell) => {
        if (!cell.fill || cell.fill.type === 'none') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      });
    }
  });

  // 4. Border
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left:   { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right:  { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  // 5. Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekap_Cuti_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

