const fs = require('fs');

const hrdFile = 'c:\\Users\\LENOVO\\hr-leave-system\\frontend\\src\\pages\\hrd\\Dashboard.jsx';
const empFile = 'c:\\Users\\LENOVO\\hr-leave-system\\frontend\\src\\pages\\employee\\Dashboard.jsx';

// Hrd Dashboard
let hrdContent = fs.readFileSync(hrdFile, 'utf8');

// Restore Bell
hrdContent = hrdContent.replace(
  /onMouseLeave={\(e\)=>e\.currentTarget\.style\.background="white"}>\s*Tugas/g, 
  'onMouseLeave={(e)=>e.currentTarget.style.background="white"}>\n                🔔'
);

// Restore Approve/Reject Button sizes and icons
hrdContent = hrdContent.replace(
  /width: 70,\s*height: 32,\s*borderRadius: 10,\s*background: "#111827",\s*color: "white",\s*border: "none",\s*cursor: "pointer",\s*display: "flex",\s*alignItems: "center",\s*justifyContent: "center",\s*fontWeight: "600",\s*fontSize: 11,\s*transition: "all 0.2s" }} onMouseEnter={\(e\)=>e\.currentTarget\.style\.background="#000000"} onMouseLeave={\(e\)=>e\.currentTarget\.style\.background="#111827"}>Setujui<\/button>/g,
  'width: 38, height: 32, borderRadius: 10, background: "#111827", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 16, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#000000"} onMouseLeave={(e)=>e.currentTarget.style.background="#111827"}>✓</button>'
);

hrdContent = hrdContent.replace(
  /width: 60,\s*height: 32,\s*borderRadius: 10,\s*background: "#dc2626",\s*color: "white",\s*border: "none",\s*cursor: "pointer",\s*display: "flex",\s*alignItems: "center",\s*justifyContent: "center",\s*fontWeight: "600",\s*fontSize: 11,\s*transition: "all 0.2s" }} onMouseEnter={\(e\)=>e\.currentTarget\.style\.background="#b91c1c"} onMouseLeave={\(e\)=>e\.currentTarget\.style\.background="#dc2626"}>Tolak<\/button>/g,
  'width: 38, height: 32, borderRadius: 10, background: "#dc2626", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#b91c1c"} onMouseLeave={(e)=>e.currentTarget.style.background="#dc2626"}>✕</button>'
);

// Restore Trash
hrdContent = hrdContent.replace(
  /width: 60,\s*height: 32,\s*borderRadius: 10,\s*background: "#dc2626",\s*color: "white",\s*border: "none",\s*cursor: "pointer",\s*display: "flex",\s*alignItems: "center",\s*justifyContent: "center",\s*fontWeight: "600",\s*fontSize: 12,\s*transition: "all 0.2s" }} onMouseEnter={\(e\)=>e\.currentTarget\.style\.background="#991b1b"} onMouseLeave={\(e\)=>e\.currentTarget\.style\.background="#dc2626"}>Hapus<\/button>/g,
  'width: 38, height: 32, borderRadius: 10, background: "#dc2626", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#991b1b"} onMouseLeave={(e)=>e.currentTarget.style.background="#dc2626"}>🗑️</button>'
);

fs.writeFileSync(hrdFile, hrdContent);

// Employee Dashboard
let empContent = fs.readFileSync(empFile, 'utf8');

// Restore Bell
empContent = empContent.replace(
  /onMouseLeave={\(e\) => { e\.currentTarget\.style\.background = "white"; }}>\s*NOTIF/g,
  'onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}>\n                🔔'
);

// Restore Calendar inside "Sisa Cuti" and "Jadwal" and "Rencana Cuti"
// Wait, user only mentioned "emoji lonceng di tukar sama tugas" and "ongsanpah merah" and "dempet". 


fs.writeFileSync(empFile, empContent);

console.log("Restored icons successfully.");
