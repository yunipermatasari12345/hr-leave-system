const fs = require('fs');
const path = require('path');

const employeeFile = 'c:\\Users\\LENOVO\\hr-leave-system\\frontend\\src\\pages\\employee\\Dashboard.jsx';
const hrdFile = 'c:\\Users\\LENOVO\\hr-leave-system\\frontend\\src\\pages\\hrd\\Dashboard.jsx';

// 1. Employee Dashboard Updates
let empContent = fs.readFileSync(employeeFile, 'utf8');

// Polling
empContent = empContent.replace(
  `  useEffect(() => { 
    fetchLeaves(); 
    fetchBalances();
    fetchNotifications();
    fetchLeaveTypes();
  }, []);`,
  `  useEffect(() => { 
    fetchLeaves(); 
    fetchBalances();
    fetchNotifications();
    fetchLeaveTypes();
    const interval = setInterval(() => {
      fetchLeaves();
      fetchBalances();
      fetchNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, []);`
);

// Colors and Status BGs
empContent = empContent.replace(
  `const statusBg = { pending: "#fef3c7", approved: "#dcfce7", rejected: "#fce7f3" };`,
  `const statusBg = { pending: "#FDF6B2", approved: "#DEF7EC", rejected: "#FDE8E8" };`
).replace(
  `const statusColor = { pending: "#d97706", approved: "#166534", rejected: "#be185d" };`,
  `const statusColor = { pending: "#723B13", approved: "#03543F", rejected: "#9B1C1C" };`
).replace(
  `const mainBgColor = "#f8fafc";`,
  `const mainBgColor = "#FAFAFA";`
).replace(
  `const sidebarColor = "#ffffff";`,
  `const sidebarColor = "#FFFFFF";`
).replace(
  `const primaryColor = "#0f172a";`,
  `const primaryColor = "#111827";`
).replace(
  `const elegantAccent = "#0d9488";`,
  `const elegantAccent = "#000000";`
).replace(
  `boxShadow: "0 4px 6px -1px rgba(13,148,136,0.2)"`,
  `boxShadow: "0 4px 10px rgba(0,0,0,0.05)"`
).replace(
  `fontFamily: "'Inter', sans-serif"`,
  `fontFamily: "'Outfit', sans-serif"`
);

// Remove emojis
empContent = empContent.replace(/icon="❖"/g, 'icon=""')
  .replace(/icon="📄"/g, 'icon=""')
  .replace(/icon="💡"/g, 'icon=""')
  .replace(/<span style={{ fontSize: 18 }}>{icon}<\/span>/g, '')
  .replace(/<span style={{ fontSize: 16 }}>📊<\/span>/g, '<div style={{ width: 8, height: 8, borderRadius: "50%", background: elegantAccent }}></div>')
  .replace(/<span style={{ marginRight: 8 }}>🚪<\/span> Logout/g, '<span style={{ marginRight: 8, fontWeight: "800" }}>✕</span> Keluar')
  .replace(/📅 &nbsp; {today}/g, '{today}')
  .replace(/🔔/g, 'Info')
  .replace(/<div style={{ position: "absolute", right: -20, bottom: -20, fontSize: 140, opacity: 0.05, pointerEvents: "none", transform: "rotate\(-10deg\)" }}>🗓️<\/div>/g, '')
  .replace(/🎟️/g, '✨') // Using minimal symbol or we can just use text
  .replace(/>✈️\s+</g, '>• <');

// Adjust icon wrapper in Employee dashboard recent items
empContent = empContent.replace(/📄/g, '');


// 2. HRD Dashboard Updates
let hrdContent = fs.readFileSync(hrdFile, 'utf8');

// Polling for HRD
hrdContent = hrdContent.replace(
  `  useEffect(() => {
    if (activePage === "dashboard") {
      fetchDashboardStats();
    }
    fetchLeaves();
    fetchEmployees();
    if (activePage === "reports" || activePage === "master") {
      fetchMasterData();
      fetchReports();
    }
  }, [activePage, filterStatus, filterDept]);`,
  `  useEffect(() => {
    const fetchData = () => {
      if (activePage === "dashboard") fetchDashboardStats();
      fetchLeaves();
      fetchEmployees();
      if (activePage === "reports" || activePage === "master") {
        fetchMasterData();
        fetchReports();
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [activePage, filterStatus, filterDept]);`
);


// Colors
hrdContent = hrdContent.replace(
  `const statusBg = { pending: "#fef3c7", approved: "#dcfce7", rejected: "#fee2e2" };`,
  `const statusBg = { pending: "#FDF6B2", approved: "#DEF7EC", rejected: "#FDE8E8" };`
).replace(
  `const statusColor = { pending: "#d97706", approved: "#166534", rejected: "#991b1b" };`,
  `const statusColor = { pending: "#723B13", approved: "#03543F", rejected: "#9B1C1C" };`
).replace(
  `const mainBgColor = "#f8fafc";`,
  `const mainBgColor = "#FAFAFA";`
).replace(
  `const sidebarColor = "#ffffff";`,
  `const sidebarColor = "#FFFFFF";`
).replace(
  `const primaryColor = "#0f172a";`,
  `const primaryColor = "#111827";`
).replace(
  `const elegantAccent = "#0d9488";`,
  `const elegantAccent = "#111827";` // So HRD has dark clean vibes
).replace(
  `fontFamily: "'Inter', sans-serif"`,
  `fontFamily: "'Outfit', sans-serif"`
);

// Remove emojis
hrdContent = hrdContent.replace(/icon="❖"/g, 'icon=""')
  .replace(/icon="📑"/g, 'icon=""')
  .replace(/icon="👥"/g, 'icon=""')
  .replace(/icon="📊"/g, 'icon=""')
  .replace(/<span style={{ fontSize: 18 }}>{icon}<\/span>/g, '')
  .replace(/<span style={{ fontSize: 16 }}>📊<\/span>/g, '<div style={{ width: 8, height: 8, borderRadius: "50%", background: primaryColor }}></div>')
  .replace(/📅 &nbsp; {today}/g, '{today}')
  .replace(/🔔/g, 'Tugas')
  .replace(/📥 Ekspor ke Excel/g, 'Ekspor ke Excel')
  .replace(/📥 Download Data \(Excel\)/g, 'Download Data (Excel)');

// Hapus buttons: update styling for HRD
// From: background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca"  title="Hapus">🗑</button>
// To: elegant red button
hrdContent = hrdContent.replace(/title="Hapus">🗑<\/button>/g, 'title="Hapus" style={{ width: 60, height: 32, borderRadius: 10, background: "#dc2626", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 12, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#991b1b"} onMouseLeave={(e)=>e.currentTarget.style.background="#dc2626"}>Hapus</button>');

// Approve/Reject buttons:
hrdContent = hrdContent.replace(/title="Setujui">✓<\/button>/g, 'title="Setujui" style={{ width: 70, height: 32, borderRadius: 10, background: "#111827", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 11, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#000000"} onMouseLeave={(e)=>e.currentTarget.style.background="#111827"}>Setujui</button>')
  .replace(/title="Tolak">✕<\/button>/g, 'title="Tolak" style={{ width: 60, height: 32, borderRadius: 10, background: "#dc2626", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 11, transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#b91c1c"} onMouseLeave={(e)=>e.currentTarget.style.background="#dc2626"}>Tolak</button>');

// Ensure employee icons are updated
empContent = empContent.replace(/✨/g, ''); // Remove the sparkle we just put or any emoji
empContent = empContent.replace(/<div style={{ position: "absolute", right: -20, bottom: -20, fontSize: 140, opacity: 0.05, pointerEvents: "none", transform: "rotate\(-10deg\)" }}>🗓️<\/div>/g, '');

fs.writeFileSync(employeeFile, empContent);
fs.writeFileSync(hrdFile, hrdContent);

console.log("UI updated and polling added successfully.");
