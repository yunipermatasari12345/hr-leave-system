const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'hrd', 'Dashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update exportLeavesToExcel function
content = content.replace(
  /const exportLeavesToExcel = \(\) => {[\s\S]*?};/,
  `const exportLeavesToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(leaves.map(l => ({
      ID: l.id, Karyawan: l.employee_name, Departemen: l.employee_department,
      "Tanggal Mulai": l.start_date?.slice(0, 10), "Tanggal Selesai": l.end_date?.slice(0, 10),
      "Total Hari": l.total_days, Alasan: l.reason, Status: l.status.toUpperCase(), 
      "Catatan HRD": l.hrd_note || "-", "Link Lampiran": l.attachment_url ? \`\${API_BASE_URL}\${l.attachment_url}\` : "-"
    })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Pengajuan Cuti");
    XLSX.writeFile(wb, "Data_Pengajuan_Cuti.xlsx");
  };`
);

// 2. Change <a> Lihat to button openPreview in tables
// Matches the Dashboard table and Leaves table <a> tags
const tableLinkRegex = /<a href=\{\`\$\{API_BASE_URL\}\$\{l\.attachment_url\}\`\} target="_blank" rel="noreferrer"[\s\S]*?style=\{\{ color: T\.primary, fontSize: 12, fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 \}\}>\s*📎 Lihat\s*<\/a>/g;
content = content.replace(tableLinkRegex, `<button onClick={() => openPreview(l)} style={{ color: T.primary, fontSize: 12, fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}>📎 Lihat</button>`);

// 3. Add Export Excel button in Leaves tab
content = content.replace(
  /<h3 style=\{\{ margin: 0, fontSize: 18, fontWeight: "700", color: T\.textDark \}\}>Semua Pengajuan Cuti<\/h3>/,
  `<h3 style={{ margin: 0, fontSize: 18, fontWeight: "700", color: T.textDark }}>Semua Pengajuan Cuti</h3>
               <div style={{ display: "flex", gap: 12 }}>
                 <Button disableRipple size="sm" onClick={exportLeavesToExcel} style={{ background: "white", border: T.cardBorder, color: T.textDark, fontWeight: "700", display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 16px", borderRadius: 10 }}>📊 Ekspor ke Excel</Button>
               </div>`
);

// 4. Add Preview Modal at the end
const modalInsertionPoint = '      {detailModalOpen && detailEmp && (';
const previewModalContent = `      {previewOpen && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, backdropFilter: "blur(4px)", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 24, padding: "32px", width: 500, maxWidth: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: "800", color: T.textDark, margin: 0 }}>Pratinjau Lampiran</h2>
                <p style={{ fontSize: 12, color: T.textGray, margin: 0 }}>Bukti pendukung dari {selected.employee_name}</p>
              </div>
              <button onClick={() => setPreviewOpen(false)} style={{ background: T.bg, border: "none", fontSize: 16, width: 32, height: 32, borderRadius: 16, cursor: "pointer"}}>✕</button>
            </div>
            
            <div style={{ background: T.bg, borderRadius: 16, padding: "12px", border: T.cardBorder }}>
              {selected.attachment_url?.match(/\\.(jpg|jpeg|png|gif)$/i) ? (
                <div style={{ borderRadius: 12, overflow: "hidden", background: "white" }}>
                  <img 
                    src={\`\${API_BASE_URL}\${selected.attachment_url}\`} 
                    alt="Lampiran" 
                    style={{ width: "100%", maxHeight: 400, objectFit: "contain" }}
                  />
                </div>
              ) : (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                   <span style={{ fontSize: 40, display: "block", marginBottom: 16 }}>📄</span>
                   <p style={{ fontSize: 14, color: T.textDark, fontWeight: "600", marginBottom: 16 }}>Dokumen File ({selected.attachment_url?.split('.').pop().toUpperCase()})</p>
                   <a href={\`\${API_BASE_URL}\${selected.attachment_url}\`} target="_blank" rel="noreferrer"
                      style={{ background: T.primary, color: "white", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: "700", display: "inline-block" }}>
                      Buka Dokumen di Tab Baru
                   </a>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
               <a 
                  href={\`\${API_BASE_URL}\${selected.attachment_url}\`} 
                  download 
                  style={{ flex: 1, textAlign: "center", background: T.primary, color: "white", padding: "12px", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: "700" }}>
                  📥 Simpan File Ke Komputer
               </a>
               <Button disableRipple onClick={() => setPreviewOpen(false)} style={{ flex: 1, background: T.bg, color: T.textDark, fontWeight: "700", height: 44, borderRadius: 10 }}>Tutup</Button>
            </div>
          </div>
        </div>
      )}\n\n`;

content = content.replace(modalInsertionPoint, previewModalContent + modalInsertionPoint);

fs.writeFileSync(filePath, content);
console.log('Dashboard.jsx updated successfully!');
