const fs = require('fs');

function applyDarkMode(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Add hook for Dark Mode
  if (!code.includes("isDarkMode")) {
    const toggleLogic = `
  const savedTheme = localStorage.getItem("hr_theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [isDarkMode, setIsDarkMode] = useState(savedTheme ? savedTheme === "dark" : systemDark);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("hr_theme", next ? "dark" : "light");
  };

  const mode = isDarkMode ? "dark" : "light";
  const T = { 
    bg: mode === "dark" ? "#0f172a" : "#f8fafc", 
    sidebar: mode === "dark" ? "#1e293b" : "white", 
    cardBg: mode === "dark" ? "#1e293b" : "white",
    cardBorder: mode === "dark" ? "1px solid #334155" : "1px solid #e5e7eb", 
    textDark: mode === "dark" ? "#f8fafc" : "#1f2937", 
    textGray: mode === "dark" ? "#94a3b8" : "#64748b", 
    textLight: mode === "dark" ? "#475569" : "#94a3b8", 
    primary: "#2563eb", 
    red: "#ef4444", 
    green: "#10b981", 
    yellow: mode === "dark" ? "#d97706" : "#f59e0b",
    highlightBg: mode === "dark" ? "#1e3a8a" : "#eff6ff"
  };
`;
    // Replace the old T definition
    code = code.replace(/const T = \{ bg: "#f8fafc".*?\};/, toggleLogic);
  }

  // 2. Add Toggle Menu Item
  const moonIcon = 'isDarkMode ? "☀️" : "🌙"';
  const label = 'isDarkMode ? "Mode Terang" : "Mode Gelap"';
  const menuStr = `<MenuItem id="theme" label={${label}} icon={${moonIcon}} onClick={toggleTheme} />`;
  
  if (!code.includes('id="theme"')) {
    // For HR dashboard
    if (code.includes('<MenuItem id="calendar" label="Kalender Cuti" icon="📅" />')) {
      code = code.replace('<MenuItem id="calendar" label="Kalender Cuti" icon="📅" />', `<MenuItem id="calendar" label="Kalender Cuti" icon="📅" />\n          ${menuStr}`);
    } 
    // For Employee dashboard
    else if (code.includes('<MenuItem id="calendar" label="Kalender Saya" icon="📅" />')) {
      code = code.replace('<MenuItem id="calendar" label="Kalender Saya" icon="📅" />', `<MenuItem id="calendar" label="Kalender Saya" icon="📅" />\n          ${menuStr}`);
    }
  }

  // 3. Fix the MenuItem component implementation to parse dynamic onClick
  if (code.includes('const MenuItem = ({ id, label, icon }) => (')) {
     code = code.replace(
        'const MenuItem = ({ id, label, icon }) => (',
        'const MenuItem = ({ id, label, icon, onClick }) => ('
     );
     // Support onClick inside MenuItem
     code = code.replace(
        'onClick={() => setActivePage(id)}',
        'onClick={() => onClick ? onClick() : setActivePage(id)}'
     );
     // Note: some Dashboards use navigate logic instead of setActivePage directly inside MenuItem! Let's just use generic:
     code = code.replace(
        'onClick={() => navigate(id === \'dashboard\' ? "/dashboard" : "/leaves/new")}',
        'onClick={() => onClick ? onClick() : navigate(id === \'dashboard\' ? "/dashboard" : "/leaves/new")}'
     );
  }

  // 4. Safely replace hardcoded styles with T properties
  code = code.replace(/background:\s*["']white["']/g, 'background: T.cardBg');
  code = code.replace(/background:\s*["']#f8fafc["']/g, 'background: T.bg');
  code = code.replace(/background:\s*["']#eff6ff["']/g, 'background: T.highlightBg');
  code = code.replace(/color:\s*["']#1f2937["']/g, 'color: T.textDark');
  code = code.replace(/color:\s*["']#64748b["']/g, 'color: T.textGray');

  fs.writeFileSync(filePath, code);
  console.log('Successfully applied Dark Mode hooks to ' + filePath);
}

try {
  applyDarkMode('c:/Users/LENOVO/hr-leave-system/frontend/src/pages/hrd/Dashboard.jsx');
  applyDarkMode('c:/Users/LENOVO/hr-leave-system/frontend/src/pages/employee/Dashboard.jsx');
} catch (e) {
  console.error("Error applying dark mode:", e);
}
