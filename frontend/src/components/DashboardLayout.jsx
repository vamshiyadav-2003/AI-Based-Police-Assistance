import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, FolderOpen, FileText, Search, MessageSquare,
  Shield, LogOut, ShieldAlert, UserMinus, Car, FileSpreadsheet,
  User, Bell, X, AlertTriangle, ChevronRight, Siren,
  Zap, Menu, Radio, Lock
} from 'lucide-react'
import api from '../api/client.js'

/* ─── Mock emergency generator ─────────────────────────────────────────── */
const EMERGENCY_TEMPLATES = [
  { type:'CRITICAL', color:'#ef4444', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.25)', icon:'🚨', msg:'Armed robbery reported at Banjara Hills PS jurisdiction. All units respond.' },
  { type:'HIGH', color:'#f97316', bg:'rgba(249,115,22,0.08)', border:'rgba(249,115,22,0.25)', icon:'⚠️', msg:'Missing person alert — Child (age 7) last seen near Jubilee Bus Stand.' },
  { type:'CRITICAL', color:'#ef4444', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.25)', icon:'🚨', msg:'Vehicle pursuit on NH-65. Suspect vehicle: TS09EA4521. Request backup.' },
  { type:'HIGH', color:'#f97316', bg:'rgba(249,115,22,0.08)', border:'rgba(249,115,22,0.25)', icon:'⚠️', msg:'Suspicious package reported at Secunderabad Railway Station. Bomb squad deployed.' },
  { type:'MEDIUM', color:'#eab308', bg:'rgba(234,179,8,0.08)', border:'rgba(234,179,8,0.25)', icon:'📢', msg:'Large crowd gathering at Tank Bund. Public order personnel required.' },
  { type:'CRITICAL', color:'#ef4444', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.25)', icon:'🚨', msg:'Officer Down — Unit TG-4417 has not checked in. Last location: Tolichowki.' },
  { type:'MEDIUM', color:'#eab308', bg:'rgba(234,179,8,0.08)', border:'rgba(234,179,8,0.25)', icon:'📢', msg:'Cybercrime complaint escalated — Financial fraud ₹42L. FIR registered.' },
]

function timeAgo(date) {
  const sec = Math.floor((Date.now() - date) / 1000)
  if (sec < 60) return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec/60)}m ago`
  return `${Math.floor(sec/3600)}h ago`
}

/* ─── Notification bell + dropdown ─────────────────────────────────────── */
function NotificationCenter({ isAdmin }) {
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [unread, setUnread] = useState(0)
  const panelRef = useRef(null)
  const accent = isAdmin ? '#a78bfa' : '#f59e0b'

  // Seed initial + add new ones periodically
  useEffect(() => {
    const initial = EMERGENCY_TEMPLATES.slice(0, 3).map((t, i) => ({
      ...t, id: i+1, time: new Date(Date.now() - (i+1)*120000), read: false
    }))
    setAlerts(initial)
    setUnread(initial.length)

    const interval = setInterval(() => {
      const tpl = EMERGENCY_TEMPLATES[Math.floor(Math.random() * EMERGENCY_TEMPLATES.length)]
      const newAlert = { ...tpl, id: Date.now(), time: new Date(), read: false }
      setAlerts(prev => [newAlert, ...prev].slice(0, 20))
      setUnread(prev => prev + 1)
    }, 30000) // new alert every 30s
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function markAllRead() {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
    setUnread(0)
  }

  function dismiss(id) {
    setAlerts(prev => prev.filter(a => a.id !== id))
    setUnread(prev => Math.max(0, prev - 1))
  }

  return (
    <div style={{ position:'relative' }} ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open && unread > 0) {} }}
        style={{
          position:'relative', background:'rgba(2,6,23,0.8)',
          border:`1px solid ${unread > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(51,65,85,0.8)'}`,
          borderRadius:'10px', padding:'8px 10px',
          color: unread > 0 ? '#ef4444' : '#94a3b8',
          cursor:'pointer', display:'flex', alignItems:'center',
          transition:'all 0.2s',
          boxShadow: unread > 0 ? '0 0 12px rgba(239,68,68,0.15)' : 'none',
          animation: unread > 0 ? 'bellShake 1.5s ease-in-out infinite' : 'none'
        }}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span style={{
            position:'absolute', top:'-5px', right:'-5px',
            minWidth:'18px', height:'18px', borderRadius:'9px',
            background:'#ef4444', color:'white',
            fontSize:'9px', fontWeight:900, display:'flex',
            alignItems:'center', justifyContent:'center',
            border:'2px solid #020617', padding:'0 3px',
            animation:'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 10px)', right:0,
          width:'380px', maxHeight:'520px',
          background:'rgba(10,15,30,0.97)',
          border:'1px solid rgba(51,65,85,0.7)',
          borderRadius:'16px', overflow:'hidden',
          boxShadow:'0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          backdropFilter:'blur(20px)',
          zIndex:1000, animation:'slideDown 0.2s cubic-bezier(0.34,1.56,0.64,1)'
        }}>
          {/* Panel header */}
          <div style={{
            padding:'16px 20px 12px',
            borderBottom:'1px solid rgba(51,65,85,0.5)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            background:'rgba(239,68,68,0.04)'
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{
                width:'32px', height:'32px', borderRadius:'8px',
                background:'rgba(239,68,68,0.12)',
                border:'1px solid rgba(239,68,68,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center'
              }}>
                <Siren size={14} color="#ef4444" />
              </div>
              <div>
                <p style={{ fontSize:'13px', fontWeight:800, color:'#f1f5f9', margin:0 }}>Emergency Alerts</p>
                <p style={{ fontSize:'10px', color:'#64748b', margin:0, marginTop:'1px' }}>
                  {unread > 0 ? `${unread} unread · Live feed active` : 'All clear · Monitoring active'}
                </p>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              {unread > 0 && (
                <button onClick={markAllRead} style={{
                  background:'rgba(51,65,85,0.4)', border:'1px solid rgba(51,65,85,0.6)',
                  borderRadius:'6px', padding:'4px 8px', color:'#94a3b8',
                  fontSize:'9px', fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em'
                }}>Mark all read</button>
              )}
              <button onClick={() => setOpen(false)} style={{
                background:'none', border:'none', color:'#475569', cursor:'pointer', display:'flex', alignItems:'center'
              }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Live indicator */}
          <div style={{
            display:'flex', alignItems:'center', gap:'6px',
            padding:'6px 20px', background:'rgba(239,68,68,0.04)',
            borderBottom:'1px solid rgba(51,65,85,0.3)'
          }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#ef4444', display:'inline-block', animation:'ping 1.2s ease-in-out infinite' }} />
            <span style={{ fontSize:'9px', color:'#ef4444', fontFamily:'monospace', fontWeight:700, letterSpacing:'0.1em' }}>LIVE MONITORING — DISTRICT CONTROL ROOM</span>
          </div>

          {/* Alerts list */}
          <div style={{ overflowY:'auto', maxHeight:'380px' }}>
            {alerts.length === 0 ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:'#334155' }}>
                <Shield size={32} style={{ margin:'0 auto 12px', display:'block', opacity:0.3 }} />
                <p style={{ fontSize:'12px', margin:0 }}>No active alerts. All systems normal.</p>
              </div>
            ) : (
              alerts.map((alert, i) => (
                <div key={alert.id} style={{
                  padding:'14px 20px',
                  borderBottom:'1px solid rgba(51,65,85,0.3)',
                  background: alert.read ? 'transparent' : alert.bg,
                  display:'flex', gap:'12px', alignItems:'flex-start',
                  transition:'background 0.3s',
                  animation: i === 0 && !alert.read ? 'slideIn 0.3s ease-out' : 'none'
                }}>
                  {/* Type badge */}
                  <div style={{
                    width:'32px', height:'32px', borderRadius:'8px', flexShrink:0,
                    background: alert.bg, border:`1px solid ${alert.border}`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px'
                  }}>
                    {alert.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                      <span style={{
                        fontSize:'9px', fontWeight:800, letterSpacing:'0.08em',
                        color: alert.color, textTransform:'uppercase',
                        background: alert.bg, border:`1px solid ${alert.border}`,
                        padding:'1px 6px', borderRadius:'4px'
                      }}>
                        {alert.type}
                      </span>
                      {!alert.read && (
                        <span style={{ width:'5px', height:'5px', borderRadius:'50%', background: alert.color, display:'inline-block' }} />
                      )}
                    </div>
                    <p style={{ fontSize:'11px', color: alert.read ? '#64748b' : '#cbd5e1', margin:0, lineHeight:1.5 }}>
                      {alert.msg}
                    </p>
                    <p style={{ fontSize:'9px', color:'#475569', margin:0, marginTop:'4px', fontFamily:'monospace' }}>
                      {timeAgo(alert.time)}
                    </p>
                  </div>
                  <button onClick={() => dismiss(alert.id)} style={{
                    background:'none', border:'none', color:'#334155', cursor:'pointer',
                    display:'flex', alignItems:'center', flexShrink:0, padding:'2px',
                    borderRadius:'4px', transition:'color 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color='#64748b'}
                  onMouseLeave={e => e.currentTarget.style.color='#334155'}>
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Panel footer */}
          <div style={{
            padding:'10px 20px', borderTop:'1px solid rgba(51,65,85,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(2,6,23,0.5)'
          }}>
            <span style={{ fontSize:'9px', color:'#334155', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'monospace' }}>
              GVAK Police Command Network · Encrypted Channel
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── NavItem ───────────────────────────────────────────────────────────── */
function NavItem({ to, label, icon: Icon, end, accent, adminAccent }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={{ textDecoration:'none', display:'block' }}
    >
      {({ isActive }) => (
        <div style={{
          display:'flex', alignItems:'center', gap:'10px',
          padding:'9px 12px', borderRadius:'10px', fontSize:'12px', fontWeight:600,
          letterSpacing:'0.02em', cursor:'pointer', transition:'all 0.15s',
          color: isActive ? (adminAccent ? '#c4b5fd' : '#fbbf24') : '#64748b',
          background: isActive ? (adminAccent ? 'rgba(167,139,250,0.1)' : 'rgba(245,158,11,0.08)') : 'transparent',
          border: isActive ? `1px solid ${adminAccent ? 'rgba(167,139,250,0.2)' : 'rgba(245,158,11,0.15)'}` : '1px solid transparent',
          boxShadow: isActive ? `0 2px 12px ${adminAccent ? 'rgba(167,139,250,0.08)' : 'rgba(245,158,11,0.08)'}` : 'none',
          position:'relative'
        }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background='rgba(30,41,59,0.6)'; e.currentTarget.style.color='#94a3b8' }}}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#64748b' }}}
        >
          {isActive && (
            <div style={{
              position:'absolute', left:0, top:'25%', bottom:'25%',
              width:'3px', borderRadius:'0 2px 2px 0',
              background: adminAccent ? '#a78bfa' : '#f59e0b'
            }} />
          )}
          <Icon size={15} style={{ flexShrink:0 }} />
          <span style={{ flex:1 }}>{label}</span>
          {isActive && <ChevronRight size={12} style={{ opacity:0.5 }} />}
        </div>
      )}
    </NavLink>
  )
}

/* ─── Main layout ───────────────────────────────────────────────────────── */
export default function DashboardLayout() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [time, setTime] = useState(new Date())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    api.get('/auth/me').then(r => setUser(r.data)).catch(() => {})
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const isAdmin = user?.role === 'admin'

  const navItems = [
    { to:'/', label:'Overview', icon:LayoutGrid, end:true },
    { to:'/cases', label:'Case Management', icon:FolderOpen },
    { to:'/fir', label:'FIR Assistant', icon:FileText },
    { to:'/search', label:'Case Search', icon:Search },
    { to:'/criminals', label:'Criminal Search', icon:ShieldAlert },
    { to:'/missing-persons', label:'Missing Persons', icon:UserMinus },
    { to:'/vehicles', label:'Vehicle Search', icon:Car },
    { to:'/reports', label:'Reports & Evidence', icon:FileSpreadsheet },
    { to:'/assistant', label:'AI Assistant', icon:MessageSquare },
    { to:'/profile', label:'User Profile', icon:User },
  ]
  if (isAdmin) navItems.push({ to:'/admin', label:'Admin Panel', icon:Shield })

  function handleLogout() {
    localStorage.clear()
    navigate('/login')
  }

  const sidebarW = sidebarCollapsed ? '72px' : '268px'

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#020617', color:'#f1f5f9', fontFamily:"'Inter', system-ui, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarW, flexShrink:0,
        background:'rgba(10,15,30,0.95)',
        borderRight:'1px solid rgba(51,65,85,0.4)',
        display:'flex', flexDirection:'column',
        transition:'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        position:'relative', zIndex:20, overflow:'hidden',
        backdropFilter:'blur(20px)'
      }}>
        {/* Accent glow */}
        <div style={{
          position:'absolute', top:0, bottom:0, left:0, width:'1px',
          background:`linear-gradient(to bottom, transparent, ${isAdmin ? 'rgba(167,139,250,0.4)' : 'rgba(245,158,11,0.3)'}, transparent)`
        }} />

        {/* Logo row */}
        <div style={{
          display:'flex', alignItems:'center', gap:'12px',
          padding:'18px 16px', borderBottom:'1px solid rgba(51,65,85,0.35)',
          overflow:'hidden', flexShrink:0
        }}>
          <div style={{
            width:'36px', height:'36px', borderRadius:'10px', flexShrink:0,
            background: isAdmin ? 'rgba(167,139,250,0.1)' : 'rgba(245,158,11,0.1)',
            border:`1px solid ${isAdmin ? 'rgba(167,139,250,0.2)' : 'rgba(245,158,11,0.2)'}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:`0 0 20px ${isAdmin ? 'rgba(167,139,250,0.1)' : 'rgba(245,158,11,0.1)'}`
          }}>
            <Shield size={18} color={isAdmin ? '#a78bfa' : '#f59e0b'} />
          </div>
          {!sidebarCollapsed && (
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:'13px', fontWeight:800, color:'#f1f5f9', margin:0, letterSpacing:'0.05em', textTransform:'uppercase' }}>Police AI</p>
              <p style={{ fontSize:'9px', color:'#334155', margin:0, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>TS Command Console</p>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(c => !c)} style={{
            marginLeft:'auto', background:'none', border:'none', color:'#334155',
            cursor:'pointer', display:'flex', alignItems:'center', flexShrink:0, padding:'4px'
          }}>
            <Menu size={14} />
          </button>
        </div>

        {/* Officer ID card */}
        {user && !sidebarCollapsed && (
          <div style={{
            margin:'12px', padding:'14px',
            background:'rgba(2,6,23,0.6)', borderRadius:'12px',
            border:`1px solid ${isAdmin ? 'rgba(167,139,250,0.15)' : 'rgba(51,65,85,0.5)'}`,
            position:'relative', overflow:'hidden', flexShrink:0
          }}>
            {/* Glow */}
            <div style={{
              position:'absolute', top:'-20px', right:'-20px',
              width:'80px', height:'80px', borderRadius:'50%',
              background: isAdmin ? 'rgba(167,139,250,0.12)' : 'rgba(245,158,11,0.1)',
              filter:'blur(20px)', pointerEvents:'none'
            }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
              <span style={{ fontSize:'8px', color:'#334155', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700 }}>TS Police · Officer ID</span>
              <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'8px', color:'#10b981', fontFamily:'monospace', fontWeight:700, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.15)', padding:'2px 6px', borderRadius:'4px' }}>
                <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#10b981', animation:'ping 1.5s ease-in-out infinite', display:'inline-block' }} />
                ONLINE
              </span>
            </div>
            <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
              <div style={{
                width:'40px', height:'40px', borderRadius:'50%', flexShrink:0,
                background:'rgba(30,41,59,0.8)',
                border:`2px solid ${isAdmin ? 'rgba(167,139,250,0.3)' : 'rgba(245,158,11,0.25)'}`,
                display:'flex', alignItems:'center', justifyContent:'center'
              }}>
                <Shield size={18} color={isAdmin ? '#a78bfa' : '#f59e0b'} />
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:'12px', fontWeight:700, color:'#f1f5f9', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={user.full_name}>{user.full_name}</p>
                <p style={{ fontSize:'9px', color:'#475569', fontFamily:'monospace', margin:0, marginTop:'2px' }}>ID: {user.badge_number}</p>
                <span style={{
                  display:'inline-block', marginTop:'4px', fontSize:'9px', fontWeight:700,
                  color: isAdmin ? '#c4b5fd' : '#fbbf24',
                  background: isAdmin ? 'rgba(167,139,250,0.1)' : 'rgba(245,158,11,0.08)',
                  border:`1px solid ${isAdmin ? 'rgba(167,139,250,0.2)' : 'rgba(245,158,11,0.15)'}`,
                  padding:'2px 8px', borderRadius:'4px', letterSpacing:'0.06em'
                }}>
                  {user.rank || (isAdmin ? 'DGP' : 'Officer')}
                </span>
              </div>
            </div>
            {(user.station || user.district) && (
              <div style={{
                marginTop:'10px', paddingTop:'10px',
                borderTop:'1px solid rgba(51,65,85,0.4)',
                display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'
              }}>
                {user.station && (
                  <div>
                    <p style={{ fontSize:'8px', color:'#334155', margin:0, textTransform:'uppercase', letterSpacing:'0.08em' }}>Station</p>
                    <p style={{ fontSize:'10px', color:'#94a3b8', margin:0, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.station.replace(' PS','')}</p>
                  </div>
                )}
                {user.district && (
                  <div>
                    <p style={{ fontSize:'8px', color:'#334155', margin:0, textTransform:'uppercase', letterSpacing:'0.08em' }}>District</p>
                    <p style={{ fontSize:'10px', color:'#94a3b8', margin:0, fontWeight:600 }}>{user.district}</p>
                  </div>
                )}
              </div>
            )}
            {isAdmin && (
              <div style={{ marginTop:'8px', paddingTop:'8px', borderTop:'1px solid rgba(51,65,85,0.4)' }}>
                <p style={{ fontSize:'9px', color:'#334155', margin:0, textTransform:'uppercase', letterSpacing:'0.08em' }}>Privilege</p>
                <p style={{ fontSize:'10px', color:'#a78bfa', fontWeight:800, margin:0, marginTop:'2px', textTransform:'uppercase', letterSpacing:'0.08em' }}>⚡ System Administrator</p>
              </div>
            )}
          </div>
        )}

        {/* Collapsed user avatar */}
        {user && sidebarCollapsed && (
          <div style={{ display:'flex', justifyContent:'center', padding:'12px 0', flexShrink:0 }}>
            <div style={{
              width:'36px', height:'36px', borderRadius:'50%',
              background:'rgba(30,41,59,0.8)',
              border:`2px solid ${isAdmin ? 'rgba(167,139,250,0.3)' : 'rgba(245,158,11,0.25)'}`,
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <Shield size={16} color={isAdmin ? '#a78bfa' : '#f59e0b'} />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px', overflowY:'auto', overflowX:'hidden' }}>
          {!sidebarCollapsed && (
            <p style={{ fontSize:'8px', color:'#1e293b', textTransform:'uppercase', letterSpacing:'0.14em', fontWeight:700, padding:'4px 12px 6px', margin:0 }}>Navigation</p>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
            {navItems.map(({ to, label, icon: Icon, end }) =>
              sidebarCollapsed ? (
                <div key={to} title={label} style={{ display:'flex', justifyContent:'center', padding:'8px 0' }}>
                  <NavLink to={to} end={end} style={{ textDecoration:'none' }}>
                    {({ isActive }) => (
                      <div style={{
                        width:'36px', height:'36px', borderRadius:'8px',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color: isActive ? (isAdmin ? '#c4b5fd' : '#fbbf24') : '#475569',
                        background: isActive ? (isAdmin ? 'rgba(167,139,250,0.1)' : 'rgba(245,158,11,0.08)') : 'transparent',
                        border: isActive ? `1px solid ${isAdmin ? 'rgba(167,139,250,0.2)' : 'rgba(245,158,11,0.15)'}` : '1px solid transparent',
                        transition:'all 0.15s'
                      }}>
                        <Icon size={15} />
                      </div>
                    )}
                  </NavLink>
                </div>
              ) : (
                <NavItem key={to} to={to} label={label} icon={Icon} end={end} adminAccent={isAdmin} />
              )
            )}
          </div>
        </nav>

        {/* Logout */}
        <div style={{ padding:'8px', borderTop:'1px solid rgba(51,65,85,0.35)', flexShrink:0 }}>
          <button
            onClick={handleLogout}
            style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap:'10px', padding:'9px 12px', borderRadius:'10px', border:'1px solid transparent',
              background:'none', color:'#475569', fontSize:'12px', fontWeight:600,
              cursor:'pointer', transition:'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.06)'; e.currentTarget.style.color='#f87171'; e.currentTarget.style.borderColor='rgba(239,68,68,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#475569'; e.currentTarget.style.borderColor='transparent' }}
          >
            <LogOut size={15} style={{ flexShrink:0 }} />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN PANEL ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* Topbar */}
        <header style={{
          height:'60px', flexShrink:0,
          background:'rgba(10,15,30,0.9)',
          borderBottom:'1px solid rgba(51,65,85,0.4)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 28px', backdropFilter:'blur(20px)',
          position:'sticky', top:0, zIndex:10
        }}>
          <div>
            <h1 style={{ fontSize:'13px', fontWeight:800, color:'#f1f5f9', margin:0, letterSpacing:'0.05em', textTransform:'uppercase' }}>
              {isAdmin ? '⚡ Control Headquarters' : '🛡️ Officer Intelligence Desk'}
            </h1>
            <p style={{ fontSize:'9px', color:'#334155', margin:0, marginTop:'2px', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'monospace' }}>
              IPARTS v2.0 · Secure Session · {time.toLocaleTimeString('en-IN', { hour12:false })} IST
            </p>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            {/* Secure badge */}
            <div style={{
              display:'flex', alignItems:'center', gap:'6px',
              background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)',
              borderRadius:'8px', padding:'5px 10px'
            }}>
              <Lock size={10} color="#10b981" />
              <span style={{ fontSize:'9px', color:'#10b981', fontFamily:'monospace', fontWeight:700, letterSpacing:'0.08em' }}>ENCRYPTED</span>
            </div>

            {/* Radio status */}
            <div style={{
              display:'flex', alignItems:'center', gap:'6px',
              background:'rgba(2,6,23,0.8)', border:'1px solid rgba(51,65,85,0.5)',
              borderRadius:'8px', padding:'5px 10px'
            }}>
              <Radio size={10} color="#3b82f6" />
              <span style={{ fontSize:'9px', color:'#3b82f6', fontFamily:'monospace', fontWeight:700, letterSpacing:'0.08em' }}>LIVE</span>
            </div>

            {/* Emergency alert button */}
            <button style={{
              display:'flex', alignItems:'center', gap:'6px',
              background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
              borderRadius:'8px', padding:'5px 12px', color:'#ef4444', cursor:'pointer',
              fontSize:'9px', fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase',
              transition:'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.2)' }}>
              <Zap size={11} />
              Emergency
            </button>

            {/* Notification center */}
            <NotificationCenter isAdmin={isAdmin} />
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto', background:'#020617' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes popIn {
          from { opacity:0; transform:scale(0.5); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes slideIn {
          from { opacity:0; transform:translateX(8px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes ping {
          0%   { opacity:1; }
          75%, 100% { opacity:0; }
        }
        @keyframes bellShake {
          0%, 100% { transform:rotate(0); }
          10%, 30%, 50% { transform:rotate(-8deg); }
          20%, 40% { transform:rotate(8deg); }
          60% { transform:rotate(0); }
        }
        * { scrollbar-width:thin; scrollbar-color:#1e293b transparent; }
        *::-webkit-scrollbar { width:4px; }
        *::-webkit-scrollbar-track { background:transparent; }
        *::-webkit-scrollbar-thumb { background:#1e293b; border-radius:4px; }
      `}</style>
    </div>
  )
}
