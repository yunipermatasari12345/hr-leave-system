const fs = require('fs');

const empFile = 'c:\\Users\\LENOVO\\hr-leave-system\\frontend\\src\\pages\\employee\\Dashboard.jsx';

let empContent = fs.readFileSync(empFile, 'utf8');

// Restore Logout
empContent = empContent.replace(
  /<span style={{ marginRight: 8, fontWeight: "800" }}>✕<\/span> Keluar/g,
  '<span style={{ marginRight: 8 }}>🚪</span> Logout'
);

// Restore Calendar inside bar
empContent = empContent.replace(
  />\s*\{today\}\s*<\/div>/g,
  '>📅 &nbsp; {today}</div>'
);

// Restore Bar Chart emoji
empContent = empContent.replace(
  /<div style={{ width: 8, height: 8, borderRadius: "50%", background: elegantAccent }}><\/div>/g,
  '<span style={{ fontSize: 16 }}>📊</span>'
);

// Restore Ticket emoji
empContent = empContent.replace(
  /fontWeight: "800" }}>{b.remaining_days}<\/div>/g,
  'fontWeight: "bold" }}>🎟️</div>'
);
// Wait, my replacement for tickets earlier was:
// `<div style={{ width: 44, height: 44, borderRadius: 12, background: "#f8fafc", color: primaryColor, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: "800" }}>{b.remaining_days}</div>`
// Let's just restore it explicitly.
empContent = empContent.replace(
  /<div style={{ width: 44, height: 44, borderRadius: 12, background: "#f8fafc", color: primaryColor, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: "800" }}>{b.remaining_days}<\/div>/g,
  '<div style={{ width: 44, height: 44, borderRadius: 12, background: "#f8fafc", color: primaryColor, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: "bold" }}>🎟️</div>'
);

// Restore Airplane
empContent = empContent.replace(
  /<div style={{ width: 8, height: 8, borderRadius: "50%", background: elegantAccent }}><\/div>/g,
  '✈️'
);

// Restore Document 
empContent = empContent.replace(
  /\{"-"\}/g,
  '📄'
);

// Restore big background Calendar
empContent = empContent.replace(
  /<div style={{ position: "absolute", right: -20, bottom: -20, fontSize: 140, opacity: 0.05, pointerEvents: "none", transform: "rotate\(-10deg\)" }}><\/div>/g,
  '<div style={{ position: "absolute", right: -20, bottom: -20, fontSize: 140, opacity: 0.05, pointerEvents: "none", transform: "rotate(-10deg)" }}>🗓️</div>'
);

// Restore menu icons
empContent = empContent.replace(
  /icon=""/g,
  'icon="❖"' // Just defaulting to ❖, if I can't put everything accurately, it's better than empty.
);

fs.writeFileSync(empFile, empContent);
console.log("Restored emojis in Portal Karyawan.");
