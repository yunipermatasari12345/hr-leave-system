import ExcelJS from 'exceljs';

/**
 * Mengekspor data pengajuan cuti ke Excel dengan foto lampiran yang tersemat.
 * @param {Array} leaves - Data pengajuan cuti yang akan diekspor.
 * @param {string} apiBaseUrl - URL dasar API untuk mendownload gambar.
 */
export const exportLeavesWithImages = async (leaves, apiBaseUrl) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Pengajuan Cuti');

  // 1. Definisikan Kolom
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Karyawan', key: 'name', width: 25 },
    { header: 'Departemen', key: 'dept', width: 20 },
    { header: 'Mulai', key: 'start', width: 15 },
    { header: 'Selesai', key: 'end', width: 15 },
    { header: 'Hari', key: 'days', width: 10 },
    { header: 'Alasan', key: 'reason', width: 30 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Lampiran (Preview)', key: 'photo', width: 30 },
    { header: 'Link Lampiran', key: 'link', width: 40 },
  ];

  // 2. Styling Header
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' } // Slate-800
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;

  // 3. Tambahkan Data & Gambar
  for (let i = 0; i < leaves.length; i++) {
    const l = leaves[i];
    const rowIndex = i + 2; // Mulai dari baris ke-2 (setelah header)
    const row = worksheet.addRow({
      id: l.id,
      name: l.employee_name,
      dept: l.employee_department,
      start: l.start_date?.slice(0, 10),
      end: l.end_date?.slice(0, 10),
      days: l.total_days,
      reason: l.reason,
      status: l.status.toUpperCase(),
      photo: '', // Placeholder untuk gambar
      link: l.attachment_url ? `${apiBaseUrl}${l.attachment_url}` : '-'
    });

    // Set alignment
    row.alignment = { vertical: 'middle', horizontal: 'left' };

    // 4. Proses Gambar (Jika ada)
    if (l.attachment_url && l.attachment_url.match(/\.(jpg|jpeg|png|gif)$/i)) {
      try {
        const imageUrl = `${apiBaseUrl}${l.attachment_url}`;
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();
        
        const imageId = workbook.addImage({
          buffer: buffer,
          extension: l.attachment_url.split('.').pop(),
        });

        // Set row height lebih tinggi agar foto terlihat (misal 120px)
        worksheet.getRow(rowIndex).height = 100;

        // Tambahkan gambar ke sel kolom 'photo' (kolom ke-9)
        worksheet.addImage(imageId, {
          tl: { col: 8.1, row: rowIndex - 0.9 },
          ext: { width: 120, height: 120 }
        });
      } catch (err) {
        console.error("Gagal mendownload gambar untuk baris", rowIndex, err);
        worksheet.getCell(`I${rowIndex}`).value = "Gagal memuat foto";
      }
    } else {
       worksheet.getCell(`I${rowIndex}`).value = l.attachment_url ? "Bukan Foto" : "-";
    }
  }

  // 5. Generate & Download File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekap_Pengajuan_Cuti_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
