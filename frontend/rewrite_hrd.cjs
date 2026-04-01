const fs = require('fs');

const hrdFile = 'c:\\Users\\LENOVO\\hr-leave-system\\frontend\\src\\pages\\hrd\\Dashboard.jsx';
let content = fs.readFileSync(hrdFile, 'utf8');

// Split at `  return (`
const splitIndex = content.indexOf('  return (');
const logicPart = content.substring(0, splitIndex);

// Retrieve Modal chunks
const modalActionIndex = content.indexOf('{/* MODAL ACTION VIEW */}');
let modals = "";
if (modalActionIndex !== -1) {
   modals = content.substring(modalActionIndex, content.lastIndexOf('</div>\r\n    </div>\r\n  );\r\n}'));
   // Handle both \r\n and \n
   if(modals === "") modals = content.substring(modalActionIndex, content.lastIndexOf('</div>\n    </div>\n  );\n}'));
}

const newJSX = `  // TALENTA DESIGN TOKENS
  const T = {
    bg: "#f3f4f6",
    sidebar: "#ffffff",
    cardBorder: "1px solid #e5e7eb",
    textDark: "#1f2937",
    textGray: "#6b7280",
    textLight: "#9ca3af",
    primary: "#4f46e5",
    red: "#e11d48",
    activeBg: "#eef2ff",
    activeText: "#4338ca",
    white: "#ffffff",
    green: "#10b981",    
    yellow: "#f59e0b"
  };

  const AvatarInitials = name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  const SidebarItem = ({ id, label, icon }) => {
    const isActive = activePage === id;
    return (
      <div 
        onClick={() => setActivePage(id)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 16px",
          marginLeft: 8, marginRight: 8,
          borderRadius: 6,
          cursor: "pointer",
          background: isActive ? T.activeBg : "transparent",
          color: isActive ? T.activeText : T.textDark,
          fontWeight: isActive ? "600" : "500",
          fontSize: 14, transition: "background 0.2s"
        }}>
        <span style={{ fontSize: 16, color: isActive ? T.activeText : T.textGray }}>{icon}</span>
        {label}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'Inter', sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: 240, background: T.sidebar, borderRight: T.cardBorder, display: "flex", flexDirection: "column", flexShrink: 0, zIndex: 10 }}>
        {/* Logo talenta-like */}
        <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 24px" }}>
          <h1 style={{ color: T.red, fontSize: 18, fontWeight: "800", margin: 0, letterSpacing: -0.5, textTransform: "uppercase" }}>Appskep</h1>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
          <SidebarItem id="dashboard" label="Home" icon="🏠" />
          <SidebarItem id="leaves" label="Leave Requests" icon="📑" />
          <SidebarItem id="employees" label="Employees Data" icon="👥" />
          <SidebarItem id="reports" label="Reports & Logs" icon="📊" />
        </div>
      </div>

      {/* MAIN CONTENT DIV */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        
        {/* TALENTA TOP NAV */}
        <div style={{ height: 60, background: T.white, borderBottom: T.cardBorder, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <span style={{ fontSize: 13, color: T.textGray, fontWeight: "500" }}>HRIS</span>
            <span style={{ fontSize: 10, color: T.textLight, marginLeft: 6 }}>▼</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Button size="sm" style={{ background: "#f3f4f6", border: T.cardBorder, color: T.textDark, fontWeight: "500", borderRadius: 20 }}>
              ✨ Summarize data
            </Button>
            
            <div style={{ display: "flex", alignItems: "center", gap: 16, color: T.textGray, fontSize: 18, marginLeft: 8 }}>
              <span style={{ cursor: "pointer" }}>+</span>
              <span style={{ cursor: "pointer" }}>🔍</span>
              <div style={{ position: "relative", cursor: "pointer" }}>
                🔔
                {pending.length > 0 && (
                  <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, background: T.red, borderRadius: "50%" }} />
                )}
              </div>
              <span style={{ cursor: "pointer", letterSpacing: -1 }}>⋮⋮</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, borderLeft: T.cardBorder, paddingLeft: 16, height: 32 }}>
               <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.yellow, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "700" }}>
                 {AvatarInitials}
               </div>
               <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                 <p style={{ margin: 0, fontSize: 12, fontWeight: "600", color: T.textDark, lineHeight: 1.2 }}>{name}</p>
                 <p style={{ margin: 0, fontSize: 10, color: T.textGray, lineHeight: 1.2 }}>HRD Admin</p>
               </div>
               <span onClick={handleLogout} style={{ cursor: "pointer", fontSize: 16, marginLeft: 8 }} title="Logout">🚪</span>
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          
          {activePage === "dashboard" && (
            <>
              {/* HERO GREETING BANNER */}
              <div style={{ background: T.white, borderRadius: 8, border: T.cardBorder, padding: "24px", display: "flex", justifyContent: "space-between", position: "relative", marginBottom: 24, overflow: "hidden" }}>
                 <div>
                   <h2 style={{ fontSize: 22, fontWeight: "600", color: T.textDark, margin: "0 0 6px 0" }}>Good morning, {name.split(' ')[0]}!</h2>
                   <p style={{ fontSize: 13, color: T.textGray, margin: "0 0 24px 0" }}>It's {todayStr}</p>
                   
                   <p style={{ fontSize: 11, fontWeight: "600", color: T.textDark, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 12px 0" }}>Shortcut</p>
                   <div style={{ display: "flex", gap: 12 }}>
                     <Button disableRipple onPress={() => navigate("/hrd/add-employee")} style={{ background: T.white, border: T.cardBorder, color: T.textDark, fontWeight: "500", borderRadius: 20, padding: "0 16px", height: 34, fontSize: 13 }}>
                       Tambahkan Karyawan Baru
                     </Button>
                     <Button disableRipple onPress={() => setActivePage("leaves")} style={{ background: T.white, border: T.cardBorder, color: T.textDark, fontWeight: "500", borderRadius: 20, padding: "0 16px", height: 34, fontSize: 13 }}>
                       Lihat Pengajuan Cuti
                     </Button>
                     <Button disableRipple style={{ background: T.white, border: T.cardBorder, color: T.textDark, fontWeight: "500", borderRadius: 20, padding: "0 16px", height: 34, fontSize: 13 }}>
                       More request ▼
                     </Button>
                   </div>
                 </div>

                 {/* Talenta-like abstract illustration area */}
                 <div style={{ position: "absolute", right: 24, bottom: 0, top: 0, display: "flex", alignItems: "flex-end", paddingBottom: 16, pointerEvents: "none" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                       <div style={{ background: T.green, borderRadius: "12px 12px 0 12px", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "white", marginTop: 24 }}>
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                       </div>
                       <div style={{ width: 140, height: "100%", display: "flex", alignItems: "flex-end" }}>
                         <div style={{ width: "100%", height: 120, background: "#fef3c7", borderRadius: "20px 20px 0 0", border: \`2px solid \${T.yellow}\`, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", padding: 10 }}>
                            <div style={{ width: 60, height: 10, background: T.yellow, borderRadius: 10, marginBottom: 8 }}></div>
                            <div style={{ width: 80, height: 4, background: "#fcd34d", borderRadius: 2 }}></div>
                         </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* DASHBOARD CARDS / WIDGETS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
                
                {/* Employment Status */}
                <div style={{ background: T.white, borderRadius: 8, border: T.cardBorder, padding: 20, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: "600", color: T.textDark }}>Leave Status</h3>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: T.textLight, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: "bold" }}>i</div>
                    </div>
                    <span style={{ color: T.textGray, cursor: "pointer", letterSpacing: -1, fontWeight: "bold" }}>⋮</span>
                  </div>
                  
                  <div style={{ height: 12, background: T.bg, borderRadius: 2, marginBottom: 6, display: "flex" }}>
                    <div style={{ width: \`\${(stats.total_pending / (leaves.length || 1)) * 100}%\`, height: "100%", background: "#f59e0b" }}></div>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textGray, marginBottom: 16 }}>
                    <span>0</span>
                    <span>Total {leaves.length}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 16, borderBottom: T.cardBorder }}>
                    <span style={{ fontSize: 13, fontWeight: "600", color: T.textDark }}>Pending</span>
                    <span style={{ fontSize: 13, color: T.textGray }}>{stats.total_pending} Leaves</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, background: "#f59e0b", borderRadius: 1 }}></div>
                      <span style={{ fontSize: 13, fontWeight: "500", color: T.textDark }}>Unreviewed</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, color: T.textGray }}>{pending.length}</span>
                      <span style={{ fontSize: 12, color: T.textLight }}>{leaves.length ? ((pending.length/leaves.length)*100).toFixed(1) : 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Employees */}
                <div style={{ background: T.white, borderRadius: 8, border: T.cardBorder, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: "600", color: T.textDark }}>Total Employees</h3>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: T.textLight, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: "bold" }}>i</div>
                    </div>
                    <span style={{ color: T.textGray, cursor: "pointer", letterSpacing: -1, fontWeight: "bold" }}>⋮</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 100 }}>
                     <h1 style={{ fontSize: 48, fontWeight: "700", color: T.textDark, margin: 0 }}>{stats.total_employees}</h1>
                     <p style={{ fontSize: 13, color: T.textGray, margin: 0 }}>Active users</p>
                  </div>
                </div>

                {/* Job Level mapping to Leave Stats */}
                <div style={{ background: T.white, borderRadius: 8, border: T.cardBorder, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: "600", color: T.textDark }}>Leave Actions</h3>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: T.textLight, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: "bold" }}>i</div>
                    </div>
                    <span style={{ color: T.textGray, cursor: "pointer", letterSpacing: -1, fontWeight: "bold" }}>⋮</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: T.textDark }}>Approved</span>
                      <span style={{ fontSize: 13, color: T.green, fontWeight: "600" }}>{stats.total_approved} Leaves</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: T.textDark }}>Rejected</span>
                      <span style={{ fontSize: 13, color: T.red, fontWeight: "600" }}>{stats.total_rejected} Leaves</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: T.textDark }}>Pending Today</span>
                      <span style={{ fontSize: 13, color: T.yellow, fontWeight: "600" }}>{stats.pending_today} Leaves</span>
                    </div>
                  </div>
                </div>

                {/* Gender Diversity (mapped to Approved Ratio) */}
                <div style={{ background: T.white, borderRadius: 8, border: T.cardBorder, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: "600", color: T.textDark }}>Approval Ratio</h3>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: T.textLight, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: "bold" }}>i</div>
                    </div>
                    <span style={{ color: T.textGray, cursor: "pointer", letterSpacing: -1, fontWeight: "bold" }}>⋮</span>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
                     <div style={{ width: 100, height: 100, borderRadius: "50%", border: \`16px solid #0ea5e9\`, borderRightColor: stats.total_approved > 0 ? "#10b981" : "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 16, fontWeight: "600", color: T.textDark }}>{leaves.length}</span>
                     </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                     <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                       <div style={{ width: 8, height: 8, background: "#10b981", borderRadius: 1 }}></div>
                       <span style={{ fontSize: 13, fontWeight: "500", color: T.textDark }}>Approved</span>
                     </div>
                     <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                       <span style={{ fontSize: 13, color: T.textGray }}>{stats.total_approved}</span>
                       <span style={{ fontSize: 12, color: T.textLight }}>
                         {leaves.length ? ((stats.total_approved / leaves.length)*100).toFixed(1) : 0}%
                       </span>
                     </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {activePage === "leaves" && (
            <div style={{ background: T.white, borderRadius: 8, border: T.cardBorder }}>
              <div style={{ padding: "16px 20px", borderBottom: T.cardBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: "600", color: T.textDark }}>Employee Leave Requests</h3>
                  <div style={{ display: "flex", gap: 12 }}>
                     <Button size="sm" onClick={exportLeavesToExcel} style={{ background: T.white, border: T.cardBorder, color: T.textDark, fontWeight: "500", borderRadius: 6 }}>Export CSV</Button>
                  </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Employee</th>
                    <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Duration</th>
                    <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Status</th>
                    <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(l => (
                     <tr key={l.id} style={{ borderBottom: T.cardBorder }}>
                       <td style={{ padding: "14px 20px", fontSize: 13, color: T.textDark, fontWeight: "500" }}>{l.employee_name}<br/><span style={{fontSize: 11, color: T.textLight}}>{l.employee_department}</span></td>
                       <td style={{ padding: "14px 20px", fontSize: 13, color: T.textGray }}>
                         {l.start_date.slice(0,10)} - {l.end_date.slice(0,10)} <br/>
                         <span style={{ fontSize: 11, color: T.textLight }}>({l.total_days} Days)</span>
                       </td>
                       <td style={{ padding: "14px 20px" }}>
                         <span style={{ background: statusStyle[l.status]?.bg || "#f3f4f6", color: statusStyle[l.status]?.color || "#374151", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>
                           {statusStyle[l.status]?.label || l.status}
                         </span>
                       </td>
                       <td style={{ padding: "14px 20px", display: "flex", gap: 8, justifyContent: "center" }}>
                          <button onClick={() => openAction(l, "detail")} style={{ width: 32, height: 32, borderRadius: 6, background: T.bg, color: T.textDark, border: T.cardBorder, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>👁️</button>
                          {l.status === 'pending' && (
                            <>
                              <button onClick={() => openAction(l, "approved")} style={{ width: 32, height: 32, borderRadius: 6, background: T.textDark, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>✓</button>
                              <button onClick={() => openAction(l, "rejected")} style={{ width: 32, height: 32, borderRadius: 6, background: T.red, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>✕</button>
                            </>
                          )}
                       </td>
                     </tr>
                  ))}
                  {leaves.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: "24px", textAlign: "center", fontSize: 13, color: T.textGray }}>No leaves found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activePage === "employees" && (
            <div style={{ background: T.white, borderRadius: 8, border: T.cardBorder }}>
              <div style={{ padding: "16px 20px", borderBottom: T.cardBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: "600", color: T.textDark }}>Employee Directory</h3>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Name</th>
                    <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Department</th>
                    <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Leave Days Used</th>
                    <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Rem. Balance</th>
                    <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => (
                    <tr key={emp.id} style={{ borderBottom: T.cardBorder }}>
                       <td style={{ padding: "14px 20px", fontSize: 13, color: T.textDark, fontWeight: "500" }}>{emp.full_name}</td>
                       <td style={{ padding: "14px 20px", fontSize: 13, color: T.textGray }}>{emp.department}</td>
                       <td style={{ padding: "14px 20px", fontSize: 13, color: T.textGray, textAlign: "center" }}>{emp.used_days}</td>
                       <td style={{ padding: "14px 20px", fontSize: 13, color: T.primary, fontWeight: "600", textAlign: "center" }}>{emp.remaining_days}</td>
                       <td style={{ padding: "14px 20px", display: "flex", gap: 8, justifyContent: "center" }}>
                          <button onClick={(e) => { e.stopPropagation(); openDetail(emp); }} style={{ padding: "0 12px", height: 32, borderRadius: 6, background: T.bg, color: T.textDark, border: T.cardBorder, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 12 }}>Detail</button>
                          <button onClick={(e) => { e.stopPropagation(); openEdit(emp); }} style={{ padding: "0 12px", height: 32, borderRadius: 6, background: T.textDark, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: 12 }}>Edit</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id, emp.full_name); }} style={{ padding: "0 12px", height: 32, borderRadius: 6, background: T.red, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>🗑️</button>
                       </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: "24px", textAlign: "center", fontSize: 13, color: T.textGray }}>No employee data found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activePage === "reports" && (
            <div style={{ background: T.white, borderRadius: 8, border: T.cardBorder }}>
              <div style={{ padding: "16px 20px", borderBottom: T.cardBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: "600", color: T.textDark }}>Department Analytics</h3>
                  <Button size="sm" onClick={exportReportsToExcel} style={{ background: T.white, border: T.cardBorder, color: T.textDark, fontWeight: "500", borderRadius: 6 }}>Export CSV</Button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase" }}>Department</th>
                    <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Total Approved</th>
                    <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: "600", color: T.textGray, borderBottom: T.cardBorder, background: T.bg, textTransform: "uppercase", textAlign: "center" }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, i) => (
                    <tr key={i} style={{ borderBottom: T.cardBorder }}>
                       <td style={{ padding: "14px 20px", fontSize: 14, color: T.textDark, fontWeight: "600" }}>{r.department}</td>
                       <td style={{ padding: "14px 20px", fontSize: 13, color: T.textGray, textAlign: "center" }}>{r.total_leaves} requests</td>
                       <td style={{ padding: "14px 20px", fontSize: 13, color: T.primary, fontWeight: "600", textAlign: "center" }}>{r.total_days} Days</td>
                    </tr>
                  ))}
                  {reports.length === 0 && <tr><td colSpan="3" style={{ padding: "24px", textAlign: "center", fontSize: 13, color: T.textGray }}>No data</td></tr>}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
\n`;

content = logicPart + newJSX + modals;

fs.writeFileSync(hrdFile, content);
console.log('HRD Rewritten successfully.');
