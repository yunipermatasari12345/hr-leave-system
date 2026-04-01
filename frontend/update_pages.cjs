const fs = require('fs');

const files = [
  'c:\\Users\\LENOVO\\hr-leave-system\\frontend\\src\\pages\\hrd\\AddEmployee.jsx',
  'c:\\Users\\LENOVO\\hr-leave-system\\frontend\\src\\pages\\employee\\NewLeave.jsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace colors
  content = content.replace(/const mainBgColor = "#eef4fb";/g, 'const mainBgColor = "#FAFAFA";')
                   .replace(/const sidebarColor = "#1a73e8";/g, 'const sidebarColor = "#FFFFFF";')
                   .replace(/color: isActive \? "#000000" : "#ffffff"/g, 'color: isActive ? "#000000" : "#64748b"')
                   .replace(/color: "white"/g, 'color: "#111827"');
                   
  // Replace font styles and emojis
  content = content.replace(/fontFamily: "'Inter', sans-serif"/g, `fontFamily: "'Outfit', sans-serif"`)
                   .replace(/icon="❖"/g, 'icon=""')
                   .replace(/icon="📑"/g, 'icon=""')
                   .replace(/icon="👥"/g, 'icon=""')
                   .replace(/icon="📄"/g, 'icon=""')
                   .replace(/icon="➕"/g, 'icon=""')
                   .replace(/📅 &nbsp; /g, '')
                   .replace(/<span style={{ fontSize: 16 }}>{icon}<\/span>/g, '')
                   .replace(/background: "#1a73e8"/g, 'background: "#111827"');
                   
  // Specific Button text color corrections which might have been flipped by previous white -> #111827
  // We want the submit buttons to have white text on dark background
  if(content.includes('KIRIM PENGAJUAN')) {
    content = content.replace(/background: "#111827", border: "2px solid #000", color: "#111827"/g, 'background: "#111827", border: "none", color: "white"');
  }
  if(content.includes('SIMPAN KARYAWAN')) {
    content = content.replace(/background: "#111827", border: "2px solid #000", color: "#111827"/g, 'background: "#111827", border: "none", color: "white"');
  }

  // Sidebar header adjustments
  content = content.replace(/font-weight: "bold", margin: 0, letterSpacing: -0.5 }}/g, 'fontWeight: "bold", margin: 0, letterSpacing: -0.5, color: "#111827" }}');
  
  // Back to Dashboard button
  content = content.replace(/border: "2px solid #000", color: "#000"/g, 'border: "1px solid #e2e8f0", color: "#64748b"');

  content = content.replace(/<h1 style={{ color: "#111827", fontSize: 18, fontWeight: "bold", margin: 0, letterSpacing: -0.5 }}>Appskep<\/h1>/g, '<h1 style={{ color: "#111827", fontSize: 20, fontWeight: "800", margin: 0, letterSpacing: -0.5 }}>Appskep</h1>')

  fs.writeFileSync(file, content);
}

console.log('Dependencies and styles updated successfully.');
