import ExcelJS from 'exceljs';

/**
 * Mengekspor data pengajuan cuti ke Excel dengan link lampiran (tanpa embed gambar).
 * @param {Array} leaves - Data pengajuan cuti yang akan diekspor.
 * @param {string} apiBaseUrl - URL dasar API untuk membentuk link lampiran.
 */
export const exportLeavesWithImages = async (leaves, apiBaseUrl) => {
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
  for (let i = 0; i < leaves.length; i++) {
    const l = leaves[i];
    const row = worksheet.addRow({
      id:     l.id,
      name:   l.employee_name,
      dept:   l.employee_department,
      type:   l.leave_type_name || '-',
      start:  l.start_date?.slice(0, 10),
      end:    l.end_date?.slice(0, 10),
      days:   l.total_days,
      reason: l.reason || '-',
      status: l.status?.toUpperCase(),
      note:   l.hrd_note || '-',
      link:   l.attachment_url ? `${apiBaseUrl}${l.attachment_url}` : '-',
    });

    // Styling baris data
    row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    row.height = 22;

    // Warna status
    const statusCell = row.getCell('status');
    if (l.status === 'approved') {
      statusCell.font = { bold: true, color: { argb: 'FF166534' } };
    } else if (l.status === 'rejected') {
      statusCell.font = { bold: true, color: { argb: 'FF991B1B' } };
    } else {
      statusCell.font = { bold: true, color: { argb: 'FFB45309' } };
    }

    // Jadikan link lampiran bisa diklik
    const linkCell = row.getCell('link');
    if (l.attachment_url) {
      const fullUrl = `${apiBaseUrl}${l.attachment_url}`;
      linkCell.value = { text: 'Buka Lampiran', hyperlink: fullUrl };
      linkCell.font = { color: { argb: 'FF2563EB' }, underline: true };
    }

    // Warna baris ganjil/genap
    if (i % 2 === 0) {
      row.eachCell((cell) => {
        if (!cell.fill || cell.fill.type === 'none') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      });
    }
  }

  // 4. Border tipis di semua sel
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

  // 5. Generate & Download File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekap_Pengajuan_Cuti_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
