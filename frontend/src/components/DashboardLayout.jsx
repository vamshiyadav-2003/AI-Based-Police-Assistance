import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutGrid, FolderOpen, FileText, Search, MessageSquare,
  Shield, LogOut, ShieldAlert, UserMinus, Car, FileSpreadsheet,
  User, Bell, X, AlertTriangle, ChevronRight, Siren,
  Zap, Menu, Radio, Lock, ArrowLeft, Activity, Sparkles,
  HeartPulse, MapPin, Clock, CheckCircle, Phone
} from 'lucide-react'
import api from '../api/client.js'

/* ─── Mock emergency generator ─────────────────────────────────────────── */
const EMERGENCY_TEMPLATES = [
  {
    id: 1, type:'CRITICAL', color:'#ef4444', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.25)', icon:'🚨',
    msg:'Armed robbery reported at Banjara Hills PS jurisdiction. All units respond.',
    location: 'Banjara Hills, Hyderabad', unit: 'TG-2211', time: new Date(Date.now()-120000),
    details: 'Multiple armed suspects entered a jewellery store. Shots fired. 2 civilians injured. Requesting immediate backup and ambulance.',
    contact: 'PCR: 100 | Ambulance: 108', status: 'ACTIVE'
  },
  {
    id: 2, type:'HIGH', color:'#f97316', bg:'rgba(249,115,22,0.08)', border:'rgba(249,115,22,0.25)', icon:'⚠️',
    msg:'Missing person alert — Child (age 7) last seen near Jubilee Bus Stand.',
    location: 'Jubilee Bus Stand, Secunderabad', unit: 'TG-3302', time: new Date(Date.now()-300000),
    details: 'Child named Ravi Kumar, age 7, wearing blue shirt and red shorts. Last seen 14:30 hrs. Family has been notified. CCTV review in progress.',
    contact: 'Helpline: 1098 | Control Room: 100', status: 'ACTIVE'
  },
  {
    id: 3, type:'CRITICAL', color:'#ef4444', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.25)', icon:'🚨',
    msg:'Vehicle pursuit on NH-65. Suspect vehicle: TS09EA4521. Request backup.',
    location: 'NH-65, Near Outer Ring Road', unit: 'TG-4417', time: new Date(Date.now()-600000),
    details: 'Suspect vehicle involved in armed carjacking. High-speed chase ongoing. Vehicle make: Swift Dzire, White colour. Approaching Patancheru toll.',
    contact: 'Highway Patrol: 1033 | PCR: 100', status: 'ACTIVE'
  },
  {
    id: 4, type:'HIGH', color:'#f97316', bg:'rgba(249,115,22,0.08)', border:'rgba(249,115,22,0.25)', icon:'⚠️',
    msg:'Suspicious package reported at Secunderabad Railway Station. Bomb squad deployed.',
    location: 'Secunderabad Railway Station, Platform 4', unit: 'TG-0099', time: new Date(Date.now()-900000),
    details: 'Unattended baggage detected near Platform 4. Station partially evacuated. Bomb disposal unit on scene. Railway Police alerted. 200m perimeter maintained.',
    contact: 'Railway Police: 9539996100 | Bomb Squad: 100', status: 'MONITORING'
  },
  {
    id: 5, type:'MEDIUM', color:'#eab308', bg:'rgba(234,179,8,0.08)', border:'rgba(234,179,8,0.25)', icon:'📢',
    msg:'Large crowd gathering at Tank Bund. Public order personnel required.',
    location: 'Tank Bund, Hyderabad', unit: 'TG-1188', time: new Date(Date.now()-1800000),
    details: 'Political rally turned volatile. Estimated 500 participants. Stone pelting reported. RSF deployed. 3 arrests made. Situation being contained.',
    contact: 'PCR: 100 | Control Room: 040-27852000', status: 'MONITORING'
  },
  {
    id: 6, type:'CRITICAL', color:'#ef4444', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.25)', icon:'🚨',
    msg:'Officer Down — Unit TG-4417 has not checked in. Last location: Tolichowki.',
    location: 'Tolichowki, Hyderabad', unit: 'TG-4417', time: new Date(Date.now()-240000),
    details: 'Officer Suresh Reddy (Badge TG-4417) missed mandatory check-in at 16:00 hrs. Last GPS ping at Tolichowki area. Welfare check dispatched. Radio silent.',
    contact: 'Control Room: 040-27852000 | Ambulance: 108', status: 'URGENT'
  },
  {
    id: 7, type:'MEDIUM', color:'#eab308', bg:'rgba(234,179,8,0.08)', border:'rgba(234,179,8,0.25)', icon:'📢',
    msg:'Cybercrime complaint escalated — Financial fraud ₹42L. FIR registered.',
    location: 'Cyber Crime PS, Hyderabad', unit: 'CY-0021', time: new Date(Date.now()-3600000),
    details: 'Victim Mr. Anand Reddy defrauded ₹42 Lakhs through UPI scam. Suspect traced to Rajasthan. Cybercrime unit coordinating with Rajasthan Police for arrest.',
    contact: 'Cyber Crime: 1930 | Email: cybercrimes.ts@gov.in', status: 'INVESTIGATING'
  },
]

function timeAgo(date) {
  const sec = Math.floor((Date.now() - date) / 1000)
  if (sec < 60) return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec/60)}m ago`
  return `${Math.floor(sec/3600)}h ago`
}

/* ─── Emergency Alert Detail Modal ─────────────────────────────────────── */
function EmergencyModal({ alert, onClose }) {
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!alert) return null

  const statusColors = {
    ACTIVE: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', pulse: true },
    URGENT: { color: '#f97316', bg: 'rgba(249,115,22,0.12)', pulse: true },
    MONITORING: { color: '#eab308', bg: 'rgba(234,179,8,0.12)', pulse: false },
    INVESTIGATING: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', pulse: false },
  }
  const st = statusColors[alert.status] || statusColors.MONITORING

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', animation: 'fadeIn 0.2s ease'
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        width: '100%', maxWidth: '540px',
        background: 'linear-gradient(135deg, rgba(10,15,30,0.99) 0%, rgba(20,10,40,0.99) 100%)',
        border: `1px solid ${alert.color}40`,
        borderRadius: '20px', overflow: 'hidden',
        boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 80px ${alert.color}18`,
        animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)'
      }}>
        {/* Top accent bar */}
        <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${alert.color} 30%, ${alert.color} 70%, transparent)` }} />

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${alert.color}20`,
          background: alert.bg,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
              background: alert.bg, border: `1px solid ${alert.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
              boxShadow: `0 0 20px ${alert.color}20`
            }}>
              {alert.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 900, letterSpacing: '0.12em',
                  color: alert.color, textTransform: 'uppercase',
                  background: alert.bg, border: `1px solid ${alert.border}`,
                  padding: '3px 10px', borderRadius: '6px'
                }}>
                  {alert.type}
                </span>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '9px', fontWeight: 700,
                  color: st.color, background: st.bg,
                  border: `1px solid ${st.color}30`,
                  padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>
                  {st.pulse && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.color, display: 'inline-block', animation: 'ping 1.2s ease-in-out infinite' }} />}
                  {alert.status}
                </span>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', margin: 0, lineHeight: 1.4 }}>
                {alert.msg}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(51,65,85,0.4)', border: '1px solid rgba(51,65,85,0.6)',
            borderRadius: '8px', padding: '6px', color: '#94a3b8',
            cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(51,65,85,0.4)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <MapPin size={11} color="#60a5fa" />
                <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569' }}>Location</span>
              </div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0', margin: 0, lineHeight: 1.4 }}>{alert.location}</p>
            </div>
            <div style={{ background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(51,65,85,0.4)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Shield size={11} color="#a78bfa" />
                <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569' }}>Responding Unit</span>
              </div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0', margin: 0, fontFamily: 'monospace' }}>{alert.unit}</p>
            </div>
            <div style={{ background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(51,65,85,0.4)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Clock size={11} color="#fbbf24" />
                <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569' }}>Reported</span>
              </div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0', margin: 0, fontFamily: 'monospace' }}>{timeAgo(alert.time)}</p>
            </div>
            <div style={{ background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(51,65,85,0.4)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Phone size={11} color="#34d399" />
                <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569' }}>Emergency Contacts</span>
              </div>
              <p style={{ fontSize: '10px', fontWeight: 600, color: '#34d399', margin: 0, fontFamily: 'monospace', lineHeight: 1.5 }}>{alert.contact}</p>
            </div>
          </div>

          {/* Details */}
          <div style={{
            background: 'rgba(2,6,23,0.8)', border: `1px solid ${alert.border}`,
            borderRadius: '12px', padding: '16px', marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <AlertTriangle size={12} color={alert.color} />
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: alert.color }}>Incident Details</span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.7 }}>{alert.details}</p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '11px 16px', borderRadius: '10px',
              background: `linear-gradient(135deg, ${alert.color}, ${alert.color}bb)`,
              border: 'none', color: '#fff', fontSize: '11px', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
              boxShadow: `0 4px 16px ${alert.color}35`
            }}>
              ✓ Acknowledged
            </button>
            <button onClick={onClose} style={{
              flex: 1, padding: '11px 16px', borderRadius: '10px',
              background: 'rgba(51,65,85,0.4)', border: '1px solid rgba(51,65,85,0.6)',
              color: '#94a3b8', fontSize: '11px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer'
            }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Notification bell + dropdown ─────────────────────────────────────── */
function NotificationCenter({ isAdmin, isMobile, onOpenAlert }) {
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [unread, setUnread] = useState(0)
  const panelRef = useRef(null)

  useEffect(() => {
    const initial = EMERGENCY_TEMPLATES.slice(0, 3).map((t, i) => ({
      ...t, id: Date.now() + i, time: new Date(Date.now() - (i+1)*120000), read: false
    }))
    setAlerts(initial)
    setUnread(initial.length)

    const interval = setInterval(() => {
      const tpl = EMERGENCY_TEMPLATES[Math.floor(Math.random() * EMERGENCY_TEMPLATES.length)]
      const newAlert = { ...tpl, id: Date.now(), time: new Date(), read: false }
      setAlerts(prev => [newAlert, ...prev].slice(0, 20))
      setUnread(prev => prev + 1)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

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

  function dismiss(id, e) {
    e.stopPropagation()
    setAlerts(prev => prev.filter(a => a.id !== id))
    setUnread(prev => Math.max(0, prev - 1))
  }

  function handleAlertClick(alert) {
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, read: true } : a))
    setUnread(prev => alert.read ? prev : Math.max(0, prev - 1))
    setOpen(false)
    onOpenAlert(alert)
  }

  return (
    <div style={{ position:'relative' }} ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position:'relative', background: unread > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(2,6,23,0.8)',
          border:`1px solid ${unread > 0 ? 'rgba(239,68,68,0.5)' : 'rgba(51,65,85,0.8)'}`,
          borderRadius:'10px', padding:'8px 10px',
          color: unread > 0 ? '#ef4444' : '#94a3b8',
          cursor:'pointer', display:'flex', alignItems:'center',
          transition:'all 0.2s',
          boxShadow: unread > 0 ? '0 0 20px rgba(239,68,68,0.2)' : 'none',
          animation: unread > 0 ? 'bellShake 1.5s ease-in-out infinite' : 'none'
        }}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span style={{
            position:'absolute', top:'-5px', right:'-5px',
            minWidth:'18px', height:'18px', borderRadius:'9px',
            background:'linear-gradient(135deg, #ef4444, #dc2626)', color:'white',
            fontSize:'9px', fontWeight:900, display:'flex',
            alignItems:'center', justifyContent:'center',
            border:'2px solid #020617', padding:'0 3px',
            animation:'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: '0 2px 8px rgba(239,68,68,0.4)'
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position:'fixed',
          top: isMobile ? '60px' : 'auto',
          right: isMobile ? '8px' : '0',
          marginTop: isMobile ? '0' : '10px',
          ...(isMobile ? {} : { position:'absolute', top:'calc(100% + 10px)', right:0 }),
          width: isMobile ? 'calc(100vw - 16px)' : '400px',
          maxHeight:'540px',
          background:'linear-gradient(160deg, rgba(10,15,30,0.99) 0%, rgba(15,10,35,0.99) 100%)',
          border:'1px solid rgba(239,68,68,0.2)',
          borderRadius:'18px', overflow:'hidden',
          boxShadow:'0 30px 90px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px rgba(239,68,68,0.08)',
          backdropFilter:'blur(24px)',
          zIndex:1000, animation:'slideDown 0.2s cubic-bezier(0.34,1.56,0.64,1)'
        }}>
          {/* Top accent */}
          <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #ef4444 30%, #f97316 70%, transparent)' }} />
          {/* Panel header */}
          <div style={{
            padding:'16px 20px 12px',
            borderBottom:'1px solid rgba(51,65,85,0.4)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            background:'rgba(239,68,68,0.04)'
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{
                width:'34px', height:'34px', borderRadius:'10px',
                background:'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))',
                border:'1px solid rgba(239,68,68,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow: '0 0 16px rgba(239,68,68,0.15)'
              }}>
                <Siren size={15} color="#ef4444" />
              </div>
              <div>
                <p style={{ fontSize:'13px', fontWeight:800, color:'#f1f5f9', margin:0 }}>Emergency Alerts</p>
                <p style={{ fontSize:'10px', color:'#64748b', margin:0, marginTop:'1px' }}>
                  {unread > 0 ? `${unread} active · Live feed` : 'All clear · Monitoring active'}
                </p>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              {unread > 0 && (
                <button onClick={markAllRead} style={{
                  background:'rgba(51,65,85,0.4)', border:'1px solid rgba(51,65,85,0.6)',
                  borderRadius:'6px', padding:'4px 8px', color:'#94a3b8',
                  fontSize:'9px', fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em'
                }}>Mark read</button>
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
            <span style={{ fontSize:'9px', color:'#ef4444', fontFamily:'monospace', fontWeight:700, letterSpacing:'0.1em' }}>LIVE — CONTROL ROOM</span>
            <span style={{ marginLeft: 'auto', fontSize:'9px', color:'#334155', fontFamily:'monospace' }}>Click for details</span>
          </div>

          {/* Alerts list */}
          <div style={{ overflowY:'auto', maxHeight:'400px' }}>
            {alerts.length === 0 ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:'#334155' }}>
                <CheckCircle size={32} style={{ margin:'0 auto 12px', display:'block', opacity:0.3 }} />
                <p style={{ fontSize:'12px', margin:0 }}>No active alerts. All systems normal.</p>
              </div>
            ) : (
              alerts.map((alert, i) => (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  style={{
                    padding:'14px 20px',
                    borderBottom:'1px solid rgba(51,65,85,0.25)',
                    background: alert.read ? 'transparent' : alert.bg,
                    display:'flex', gap:'12px', alignItems:'flex-start',
                    transition:'all 0.2s',
                    animation: i === 0 && !alert.read ? 'slideIn 0.3s ease-out' : 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = alert.read ? 'rgba(30,41,59,0.3)' : alert.bg; e.currentTarget.style.transform = 'translateX(2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = alert.read ? 'transparent' : alert.bg; e.currentTarget.style.transform = 'translateX(0)' }}
                >
                  <div style={{
                    width:'34px', height:'34px', borderRadius:'8px', flexShrink:0,
                    background: alert.bg, border:`1px solid ${alert.border}`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px'
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
                        <span style={{ width:'5px', height:'5px', borderRadius:'50%', background: alert.color, display:'inline-block', animation: 'ping 1.2s ease-in-out infinite' }} />
                      )}
                      <span style={{ fontSize:'8px', color:'#475569', marginLeft:'auto', fontFamily:'monospace' }}>{timeAgo(alert.time)}</span>
                    </div>
                    <p style={{ fontSize:'11px', color: alert.read ? '#64748b' : '#cbd5e1', margin:0, lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                      {alert.msg}
                    </p>
                    <p style={{ fontSize:'9px', color:'#334155', margin:0, marginTop:'4px', display:'flex', alignItems:'center', gap:'4px' }}>
                      <MapPin size={8} /> {alert.location}
                    </p>
                  </div>
                  <button onClick={(e) => dismiss(alert.id, e)} style={{
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

          <div style={{
            padding:'10px 20px', borderTop:'1px solid rgba(51,65,85,0.4)',
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(2,6,23,0.5)'
          }}>
            <span style={{ fontSize:'9px', color:'#334155', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'monospace' }}>
              GVAK Police Command · Encrypted Channel
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── NavItem ───────────────────────────────────────────────────────────── */
function NavItem({ to, label, icon: Icon, end, adminAccent, emergencyAccent, onClick }) {
  const accentColor = emergencyAccent ? '#ef4444' : adminAccent ? '#c4b5fd' : '#fbbf24'
  const accentBg = emergencyAccent ? 'rgba(239,68,68,0.1)' : adminAccent ? 'rgba(167,139,250,0.1)' : 'rgba(245,158,11,0.08)'
  const accentBorder = emergencyAccent ? 'rgba(239,68,68,0.25)' : adminAccent ? 'rgba(167,139,250,0.2)' : 'rgba(245,158,11,0.15)'

  return (
    <NavLink
      to={to}
      end={end}
      style={{ textDecoration:'none', display:'block' }}
      onClick={onClick}
    >
      {({ isActive }) => (
        <div style={{
          display:'flex', alignItems:'center', gap:'10px',
          padding:'9px 12px', borderRadius:'10px', fontSize:'12px', fontWeight:600,
          letterSpacing:'0.02em', cursor:'pointer', transition:'all 0.15s',
          color: isActive ? accentColor : '#64748b',
          background: isActive ? accentBg : 'transparent',
          border: isActive ? `1px solid ${accentBorder}` : '1px solid transparent',
          boxShadow: isActive ? `0 2px 12px ${emergencyAccent ? 'rgba(239,68,68,0.1)' : adminAccent ? 'rgba(167,139,250,0.08)' : 'rgba(245,158,11,0.08)'}` : 'none',
          position:'relative'
        }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background='rgba(30,41,59,0.6)'; e.currentTarget.style.color='#94a3b8' }}}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#64748b' }}}
        >
          {isActive && (
            <div style={{
              position:'absolute', left:0, top:'25%', bottom:'25%',
              width:'3px', borderRadius:'0 2px 2px 0',
              background: accentColor
            }} />
          )}
          <Icon size={15} style={{ flexShrink:0 }} />
          <span style={{ flex:1 }}>{label}</span>
          {isActive && <ChevronRight size={12} style={{ opacity:0.5 }} />}
          {emergencyAccent && !isActive && (
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#ef4444', display:'inline-block', animation:'ping 1.5s ease-in-out infinite' }} />
          )}
        </div>
      )}
    </NavLink>
  )
}

/* ─── Main layout ───────────────────────────────────────────────────────── */
export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [time, setTime] = useState(new Date())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [emergencyModalAlert, setEmergencyModalAlert] = useState(null)

  useEffect(() => {
    api.get('/auth/me').then(r => setUser(r.data)).catch(() => {})
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setMobileSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isAdmin = user?.role === 'admin'

  // ── Role-based navigation ──
  // Common items for all roles
  const commonItems = [
    { to:'/', label:'Overview', icon:LayoutGrid, end:true },
    { to:'/cases', label:'Case Management', icon:FolderOpen },
    { to:'/fir', label:'FIR Assistant', icon:FileText },
    { to:'/search', label:'Case Search', icon:Search },
    { to:'/criminals', label:'Criminal Search', icon:ShieldAlert },
    { to:'/missing-persons', label:'Missing Persons', icon:UserMinus },
    { to:'/vehicles', label:'Vehicle Search', icon:Car },
    { to:'/reports', label:'Reports & Evidence', icon:FileSpreadsheet },
    { to:'/profile', label:'User Profile', icon:User },
  ]

  // Officer-only: Emergency Alerts + AI Assistant (officers CAN use AI assistant, just not see AI Requests/Audit Logs)
  const officerOnlyItems = [
    { to:'/assistant', label:'AI Assistant', icon:MessageSquare },
    { to:'/', label:'Emergency Alerts', icon:Siren, emergencyAccent: true }, // We link it to '/' so they stay on page but can trigger alert modal or see them
  ]

  // Admin-only items
  const adminOnlyItems = [
    { to:'/assistant', label:'AI Assistant', icon:MessageSquare },
    { to:'/admin', label:'Admin Panel', icon:Shield, adminAccent: true },
  ]

  const navItems = isAdmin
    ? [...commonItems, ...adminOnlyItems]
    : [...commonItems, ...officerOnlyItems]

  // Bottom nav
  const bottomNavItems = isAdmin ? [
    { to:'/', label:'Overview', icon:LayoutGrid, end:true },
    { to:'/cases', label:'Cases', icon:FolderOpen },
    { to:'/fir', label:'FIR', icon:FileText },
    { to:'/assistant', label:'AI Chat', icon:MessageSquare },
    { to:'/admin', label:'Admin', icon:Shield },
  ] : [
    { to:'/', label:'Overview', icon:LayoutGrid, end:true },
    { to:'/cases', label:'Cases', icon:FolderOpen },
    { to:'/fir', label:'FIR', icon:FileText },
    { to:'/assistant', label:'AI Chat', icon:MessageSquare },
    { to:'/profile', label:'Profile', icon:User },
  ]

  function handleLogout() {
    localStorage.clear()
    navigate('/login')
  }

  function openRandomEmergency() {
    const tpl = EMERGENCY_TEMPLATES[Math.floor(Math.random() * EMERGENCY_TEMPLATES.length)]
    setEmergencyModalAlert({ ...tpl, id: Date.now(), time: new Date(), read: false })
  }

  const sidebarW = sidebarCollapsed ? '72px' : '272px'

  const accentColor = isAdmin ? '#a78bfa' : '#f59e0b'
  const accentGradient = isAdmin
    ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
    : 'linear-gradient(135deg, #d97706, #fbbf24)'

  /* ── Sidebar contents ── */
  const SidebarContent = ({ onNavClick }) => (
    <>
      {/* Logo row */}
      <div style={{
        display:'flex', alignItems:'center', gap:'12px',
        padding:'18px 16px', borderBottom:'1px solid rgba(51,65,85,0.35)',
        overflow:'hidden', flexShrink:0,
        background: isAdmin ? 'rgba(167,139,250,0.03)' : 'rgba(245,158,11,0.02)'
      }}>
        <div style={{
          width:'38px', height:'38px', borderRadius:'10px', flexShrink:0,
          background: isAdmin ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(167,139,250,0.15))' : 'linear-gradient(135deg, rgba(217,119,6,0.3), rgba(245,158,11,0.15))',
          border:`1px solid ${isAdmin ? 'rgba(167,139,250,0.35)' : 'rgba(245,158,11,0.35)'}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 0 24px ${isAdmin ? 'rgba(167,139,250,0.2)' : 'rgba(245,158,11,0.15)'}`
        }}>
          <Shield size={19} color={accentColor} />
        </div>
        {(!sidebarCollapsed || isMobile) && (
          <div style={{ minWidth:0, flex:1 }}>
            <p style={{ fontSize:'13px', fontWeight:900, color:'#f1f5f9', margin:0, letterSpacing:'0.06em', textTransform:'uppercase' }}>GVAK Police</p>
            <p style={{ fontSize:'9px', color:'#334155', margin:0, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:600 }}>Command Console</p>
          </div>
        )}
        {isMobile ? (
          <button onClick={() => setMobileSidebarOpen(false)} style={{
            marginLeft:'auto', background:'none', border:'none', color:'#475569',
            cursor:'pointer', display:'flex', alignItems:'center', flexShrink:0, padding:'4px'
          }}>
            <X size={18} />
          </button>
        ) : (
          <button onClick={() => setSidebarCollapsed(c => !c)} style={{
            marginLeft:'auto', background:'none', border:'none', color:'#334155',
            cursor:'pointer', display:'flex', alignItems:'center', flexShrink:0, padding:'4px'
          }}>
            <Menu size={14} />
          </button>
        )}
      </div>

      {/* Officer ID card */}
      {user && (!sidebarCollapsed || isMobile) && (
        <div style={{
          margin:'12px', padding:'14px',
          background: isAdmin
            ? 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(2,6,23,0.8))'
            : 'linear-gradient(135deg, rgba(217,119,6,0.08), rgba(2,6,23,0.8))',
          borderRadius:'14px',
          border:`1px solid ${isAdmin ? 'rgba(167,139,250,0.2)' : 'rgba(245,158,11,0.15)'}`,
          position:'relative', overflow:'hidden', flexShrink:0,
          boxShadow: isAdmin ? '0 4px 20px rgba(124,58,237,0.1)' : '0 4px 20px rgba(217,119,6,0.08)'
        }}>
          <div style={{
            position:'absolute', top:'-20px', right:'-20px',
            width:'90px', height:'90px', borderRadius:'50%',
            background: isAdmin ? 'rgba(167,139,250,0.15)' : 'rgba(245,158,11,0.12)',
            filter:'blur(20px)', pointerEvents:'none'
          }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
            <span style={{ fontSize:'8px', color:'#475569', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700 }}>TS Police · Officer ID</span>
            <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'8px', color:'#10b981', fontFamily:'monospace', fontWeight:700, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', padding:'2px 6px', borderRadius:'4px' }}>
              <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#10b981', animation:'ping 1.5s ease-in-out infinite', display:'inline-block' }} />
              ONLINE
            </span>
          </div>
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            <div style={{
              width:'42px', height:'42px', borderRadius:'50%', flexShrink:0,
              background: isAdmin
                ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(30,41,59,0.9))'
                : 'linear-gradient(135deg, rgba(217,119,6,0.25), rgba(30,41,59,0.9))',
              border:`2px solid ${isAdmin ? 'rgba(167,139,250,0.4)' : 'rgba(245,158,11,0.35)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: `0 0 16px ${isAdmin ? 'rgba(167,139,250,0.2)' : 'rgba(245,158,11,0.15)'}`
            }}>
              <Shield size={18} color={accentColor} />
            </div>
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:'12px', fontWeight:700, color:'#f1f5f9', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={user.full_name}>{user.full_name}</p>
              <p style={{ fontSize:'9px', color:'#475569', fontFamily:'monospace', margin:0, marginTop:'2px' }}>ID: {user.badge_number}</p>
              <span style={{
                display:'inline-block', marginTop:'4px', fontSize:'9px', fontWeight:800,
                color: isAdmin ? '#c4b5fd' : '#fbbf24',
                background: isAdmin ? 'rgba(167,139,250,0.12)' : 'rgba(245,158,11,0.1)',
                border:`1px solid ${isAdmin ? 'rgba(167,139,250,0.25)' : 'rgba(245,158,11,0.2)'}`,
                padding:'2px 8px', borderRadius:'4px', letterSpacing:'0.06em'
              }}>
                {user.rank || (isAdmin ? 'DGP' : 'Officer')}
              </span>
            </div>
          </div>
          {(user.station || user.district) && (
            <div style={{
              marginTop:'10px', paddingTop:'10px',
              borderTop:`1px solid ${isAdmin ? 'rgba(167,139,250,0.15)' : 'rgba(245,158,11,0.1)'}`,
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
            <div style={{ marginTop:'8px', paddingTop:'8px', borderTop:'1px solid rgba(167,139,250,0.15)' }}>
              <p style={{ fontSize:'9px', color:'#475569', margin:0, textTransform:'uppercase', letterSpacing:'0.08em' }}>Privilege</p>
              <p style={{ fontSize:'10px', color:'#c4b5fd', fontWeight:800, margin:0, marginTop:'2px', textTransform:'uppercase', letterSpacing:'0.08em' }}>⚡ System Administrator</p>
            </div>
          )}
        </div>
      )}

      {/* Collapsed user avatar */}
      {user && sidebarCollapsed && !isMobile && (
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0', flexShrink:0 }}>
          <div style={{
            width:'36px', height:'36px', borderRadius:'50%',
            background: isAdmin ? 'rgba(124,58,237,0.2)' : 'rgba(217,119,6,0.2)',
            border:`2px solid ${isAdmin ? 'rgba(167,139,250,0.4)' : 'rgba(245,158,11,0.35)'}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow: `0 0 16px ${isAdmin ? 'rgba(167,139,250,0.15)' : 'rgba(245,158,11,0.12)'}`
          }}>
            <Shield size={16} color={accentColor} />
          </div>
        </div>
      )}

      {/* Nav section label */}
      <nav style={{ flex:1, padding:'8px', overflowY:'auto', overflowX:'hidden' }}>
        {(!sidebarCollapsed || isMobile) && (
          <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'4px 12px 8px', margin:0 }}>
            <div style={{ height:'1px', flex:1, background:'rgba(51,65,85,0.4)' }} />
            <span style={{ fontSize:'8px', color:'#1e293b', textTransform:'uppercase', letterSpacing:'0.14em', fontWeight:700, whiteSpace:'nowrap' }}>Navigation</span>
            <div style={{ height:'1px', flex:1, background:'rgba(51,65,85,0.4)' }} />
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
          {navItems.map((item) => {
            const { to, label, icon: Icon, end, adminAccent, emergencyAccent } = item;
            const isEmergencyBtn = label === 'Emergency Alerts';
            
            return (sidebarCollapsed && !isMobile) ? (
              <div key={to + label} title={label} style={{ display:'flex', justifyContent:'center', padding:'6px 0' }}>
                {isEmergencyBtn ? (
                  <button 
                    onClick={openRandomEmergency}
                    style={{
                      width:'38px', height:'38px', borderRadius:'8px',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color: '#ef4444',
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      transition:'all 0.15s',
                      position:'relative',
                      cursor: 'pointer'
                    }}
                  >
                    <Icon size={15} />
                  </button>
                ) : (
                  <NavLink to={to} end={end} style={{ textDecoration:'none' }}>
                    {({ isActive }) => (
                      <div style={{
                        width:'38px', height:'38px', borderRadius:'8px',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color: isActive ? (adminAccent ? '#c4b5fd' : '#fbbf24') : '#475569',
                        background: isActive ? (adminAccent ? 'rgba(167,139,250,0.1)' : 'rgba(245,158,11,0.08)') : 'transparent',
                        border: isActive ? `1px solid ${adminAccent ? 'rgba(167,139,250,0.2)' : 'rgba(245,158,11,0.15)'}` : '1px solid transparent',
                        transition:'all 0.15s',
                        position:'relative'
                      }}>
                        <Icon size={15} />
                      </div>
                    )}
                  </NavLink>
                )}
              </div>
            ) : (
              isEmergencyBtn ? (
                <div 
                  key={to + label}
                  onClick={openRandomEmergency}
                  style={{ textDecoration:'none', display:'block' }}
                >
                  <div style={{
                    display:'flex', alignItems:'center', gap:'10px',
                    padding:'9px 12px', borderRadius:'10px', fontSize:'12px', fontWeight:600,
                    letterSpacing:'0.02em', cursor:'pointer', transition:'all 0.15s',
                    color: '#ef4444',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    position:'relative'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.2)' }}
                  >
                    <Icon size={15} style={{ flexShrink:0 }} />
                    <span style={{ flex:1 }}>{label}</span>
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#ef4444', display:'inline-block', animation:'ping 1.5s ease-in-out infinite' }} />
                  </div>
                </div>
              ) : (
                <NavItem key={to + label} to={to} label={label} icon={Icon} end={end} adminAccent={adminAccent} emergencyAccent={emergencyAccent} onClick={isMobile ? onNavClick : undefined} />
              )
            )
          })}
        </div>
      </nav>

      {/* Logout */}
      <div style={{ padding:'8px', borderTop:'1px solid rgba(51,65,85,0.35)', flexShrink:0 }}>
        <button
          onClick={handleLogout}
          style={{
            width:'100%', display:'flex', alignItems:'center', justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
            gap:'10px', padding:'9px 12px', borderRadius:'10px', border:'1px solid transparent',
            background:'none', color:'#475569', fontSize:'12px', fontWeight:600,
            cursor:'pointer', transition:'all 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.color='#f87171'; e.currentTarget.style.borderColor='rgba(239,68,68,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#475569'; e.currentTarget.style.borderColor='transparent' }}
        >
          <LogOut size={15} style={{ flexShrink:0 }} />
          {(!sidebarCollapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </>
  )

  return (
    <>
      {emergencyModalAlert && (
        <EmergencyModal alert={emergencyModalAlert} onClose={() => setEmergencyModalAlert(null)} />
      )}
      <div style={{ minHeight:'100vh', display:'flex', background:'#020617', color:'#f1f5f9', fontFamily:"'Inter', system-ui, sans-serif" }}>

        {/* ── MOBILE OVERLAY BACKDROP ── */}
        {isMobile && mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            style={{
              position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
              zIndex:30, backdropFilter:'blur(6px)',
              animation:'fadeIn 0.2s ease'
            }}
          />
        )}

        {/* ── DESKTOP SIDEBAR ── */}
        {!isMobile && (
          <aside style={{
            width: sidebarW, flexShrink:0,
            background:'linear-gradient(180deg, rgba(10,15,30,0.98) 0%, rgba(8,12,26,0.98) 100%)',
            borderRight:'1px solid rgba(51,65,85,0.35)',
            display:'flex', flexDirection:'column',
            transition:'width 0.25s cubic-bezier(0.4,0,0.2,1)',
            position:'relative', zIndex:20, overflow:'hidden',
            backdropFilter:'blur(20px)'
          }}>
            {/* Left edge glow */}
            <div style={{
              position:'absolute', top:0, bottom:0, right:0, width:'1px',
              background:`linear-gradient(to bottom, transparent, ${isAdmin ? 'rgba(167,139,250,0.5)' : 'rgba(245,158,11,0.35)'}, transparent)`
            }} />
            <SidebarContent onNavClick={null} />
          </aside>
        )}

        {/* ── MOBILE SIDEBAR (overlay) ── */}
        {isMobile && (
          <aside style={{
            position:'fixed', top:0, left: mobileSidebarOpen ? 0 : '-300px',
            width:'284px', height:'100vh',
            background:'linear-gradient(180deg, rgba(10,15,30,0.99) 0%, rgba(8,12,26,0.99) 100%)',
            borderRight:'1px solid rgba(51,65,85,0.4)',
            display:'flex', flexDirection:'column',
            zIndex:40, overflow:'hidden',
            backdropFilter:'blur(24px)',
            transition:'left 0.28s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: mobileSidebarOpen ? '4px 0 60px rgba(0,0,0,0.7)' : 'none'
          }}>
            <div style={{
              position:'absolute', top:0, bottom:0, right:0, width:'1px',
              background:`linear-gradient(to bottom, transparent, ${isAdmin ? 'rgba(167,139,250,0.5)' : 'rgba(245,158,11,0.35)'}, transparent)`
            }} />
            <SidebarContent onNavClick={() => setMobileSidebarOpen(false)} />
          </aside>
        )}

        {/* ── MAIN PANEL ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

          {/* Topbar */}
          <header style={{
            height:'62px', flexShrink:0,
            background:'linear-gradient(90deg, rgba(10,15,30,0.95) 0%, rgba(12,18,38,0.95) 100%)',
            borderBottom:'1px solid rgba(51,65,85,0.35)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding: isMobile ? '0 12px' : '0 28px',
            backdropFilter:'blur(24px)',
            position:'sticky', top:0, zIndex:10,
            boxShadow: '0 2px 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display:'flex', alignItems:'center', gap: isMobile ? '10px' : '16px' }}>
              {/* Mobile hamburger */}
              {isMobile && (
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  style={{
                    background:'rgba(2,6,23,0.8)', border:'1px solid rgba(51,65,85,0.6)',
                    borderRadius:'8px', padding:'7px', color:'#94a3b8',
                    cursor:'pointer', display:'flex', alignItems:'center', flexShrink:0
                  }}
                >
                  <Menu size={16} />
                </button>
              )}

              {/* Back Button */}
              {location.pathname !== '/' && (
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    background:'rgba(255,255,255,0.03)', border:'1px solid rgba(51,65,85,0.5)',
                    borderRadius:'8px', padding: isMobile ? '5px 10px' : '6px 12px', color:'#cbd5e1', fontSize:'11px',
                    fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px',
                    transition:'all 0.15s', flexShrink:0
                  }}
                  className="back-btn-hover"
                >
                  <ArrowLeft size={13} /> Back
                </button>
              )}

              <div>
                <h1 style={{ fontSize: isMobile ? '11px' : '13px', fontWeight:900, color:'#f1f5f9', margin:0, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                  {isAdmin ? '⚡ HQ Command' : '🛡️ Officer Console'}
                </h1>
                {!isMobile && (
                  <p style={{ fontSize:'9px', color:'#334155', margin:0, marginTop:'2px', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'monospace' }}>
                    IPARTS v2.0 · Secure · {time.toLocaleTimeString('en-IN', { hour12:false })} IST
                  </p>
                )}
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap: isMobile ? '6px' : '8px' }}>
              {/* Secure badge */}
              {!isMobile && (
                <div style={{
                  display:'flex', alignItems:'center', gap:'6px',
                  background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)',
                  borderRadius:'8px', padding:'5px 10px'
                }}>
                  <Lock size={10} color="#10b981" />
                  <span style={{ fontSize:'9px', color:'#10b981', fontFamily:'monospace', fontWeight:700, letterSpacing:'0.08em' }}>ENCRYPTED</span>
                </div>
              )}

              {/* Radio status */}
              {!isMobile && (
                <div style={{
                  display:'flex', alignItems:'center', gap:'6px',
                  background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)',
                  borderRadius:'8px', padding:'5px 10px'
                }}>
                  <Radio size={10} color="#3b82f6" />
                  <span style={{ fontSize:'9px', color:'#3b82f6', fontFamily:'monospace', fontWeight:700, letterSpacing:'0.08em' }}>LIVE</span>
                </div>
              )}

              {/* Admin: AI Requests & Audit Logs quick links */}
              {isAdmin && !isMobile && (
                <>
                  <NavLink to="/admin" style={{ textDecoration:'none' }}>
                    <div style={{
                      display:'flex', alignItems:'center', gap:'5px',
                      background:'rgba(167,139,250,0.07)', border:'1px solid rgba(167,139,250,0.2)',
                      borderRadius:'8px', padding:'5px 10px',
                      color:'#a78bfa', fontSize:'9px', fontWeight:800, letterSpacing:'0.07em', textTransform:'uppercase',
                      cursor:'pointer', transition:'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(167,139,250,0.14)'; e.currentTarget.style.borderColor='rgba(167,139,250,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(167,139,250,0.07)'; e.currentTarget.style.borderColor='rgba(167,139,250,0.2)' }}>
                      <Sparkles size={10} /> AI Requests
                    </div>
                  </NavLink>
                  <NavLink to="/admin" style={{ textDecoration:'none' }}>
                    <div style={{
                      display:'flex', alignItems:'center', gap:'5px',
                      background:'rgba(34,211,238,0.06)', border:'1px solid rgba(34,211,238,0.2)',
                      borderRadius:'8px', padding:'5px 10px',
                      color:'#22d3ee', fontSize:'9px', fontWeight:800, letterSpacing:'0.07em', textTransform:'uppercase',
                      cursor:'pointer', transition:'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(34,211,238,0.12)'; e.currentTarget.style.borderColor='rgba(34,211,238,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(34,211,238,0.06)'; e.currentTarget.style.borderColor='rgba(34,211,238,0.2)' }}>
                      <Activity size={10} /> Audit Logs
                    </div>
                  </NavLink>
                </>
              )}

              {/* Emergency alert button — CLICKABLE for both roles */}
              <button
                onClick={openRandomEmergency}
                style={{
                  display:'flex', alignItems:'center', gap:'6px',
                  background:'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08))',
                  border:'1px solid rgba(239,68,68,0.35)',
                  borderRadius:'8px', padding: isMobile ? '7px' : '5px 14px',
                  color:'#ef4444', cursor:'pointer',
                  fontSize:'10px', fontWeight:900, letterSpacing:'0.08em', textTransform:'uppercase',
                  transition:'all 0.2s',
                  boxShadow: '0 0 16px rgba(239,68,68,0.12)',
                  animation: 'emergencyPulse 2s ease-in-out infinite'
                }}
                onMouseEnter={e => { e.currentTarget.style.background='linear-gradient(135deg, rgba(239,68,68,0.22), rgba(220,38,38,0.16))'; e.currentTarget.style.borderColor='rgba(239,68,68,0.6)'; e.currentTarget.style.boxShadow='0 0 24px rgba(239,68,68,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background='linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08))'; e.currentTarget.style.borderColor='rgba(239,68,68,0.35)'; e.currentTarget.style.boxShadow='0 0 16px rgba(239,68,68,0.12)' }}
              >
                <Zap size={12} />
                {!isMobile && 'Emergency'}
              </button>

              {/* Notification center */}
              <NotificationCenter isAdmin={isAdmin} isMobile={isMobile} onOpenAlert={setEmergencyModalAlert} />
            </div>
          </header>

          {/* Page content */}
          <main style={{ flex:1, overflowY:'auto', background:'#020617', paddingBottom: isMobile ? '68px' : '0' }}>
            <Outlet />
          </main>

          {/* ── MOBILE BOTTOM NAV ── */}
          {isMobile && (
            <nav style={{
              position:'fixed', bottom:0, left:0, right:0, height:'62px',
              background:'linear-gradient(180deg, rgba(10,15,30,0.98) 0%, rgba(8,12,26,0.98) 100%)',
              borderTop:'1px solid rgba(51,65,85,0.4)',
              display:'flex', alignItems:'stretch',
              backdropFilter:'blur(24px)',
              zIndex:20,
              boxShadow:'0 -4px 30px rgba(0,0,0,0.5)'
            }}>
              {bottomNavItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to + label} to={to} end={end} style={{ textDecoration:'none', flex:1 }}>
                  {({ isActive }) => (
                    <div style={{
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                      gap:'3px', height:'100%', position:'relative',
                      color: isActive ? (isAdmin ? '#c4b5fd' : '#fbbf24') : '#475569',
                      transition:'color 0.15s'
                    }}>
                      {isActive && (
                        <div style={{
                          position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
                          width:'36px', height:'2px',
                          background: isAdmin ? 'linear-gradient(90deg, #7c3aed, #a78bfa)' : 'linear-gradient(90deg, #d97706, #fbbf24)',
                          borderRadius:'0 0 2px 2px',
                          boxShadow: isAdmin ? '0 2px 8px rgba(167,139,250,0.4)' : '0 2px 8px rgba(245,158,11,0.4)'
                        }} />
                      )}
                      <Icon size={18} />
                      <span style={{ fontSize:'9px', fontWeight:600, letterSpacing:'0.02em' }}>
                        {label}
                      </span>
                    </div>
                  )}
                </NavLink>
              ))}
              {/* More button */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                style={{
                  flex:1, display:'flex', flexDirection:'column', alignItems:'center',
                  justifyContent:'center', gap:'3px', background:'none', border:'none',
                  color:'#475569', cursor:'pointer', padding:0
                }}
              >
                <Menu size={18} />
                <span style={{ fontSize:'9px', fontWeight:600 }}>More</span>
              </button>
            </nav>
          )}
        </div>

        <style>{`
          @keyframes slideDown {
            from { opacity:0; transform:translateY(-8px) scale(0.97); }
            to   { opacity:1; transform:translateY(0) scale(1); }
          }
          @keyframes slideUp {
            from { opacity:0; transform:translateY(16px) scale(0.97); }
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
          @keyframes fadeIn {
            from { opacity:0; }
            to   { opacity:1; }
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
          @keyframes emergencyPulse {
            0%, 100% { box-shadow: 0 0 16px rgba(239,68,68,0.12); }
            50%       { box-shadow: 0 0 28px rgba(239,68,68,0.28); }
          }
          .back-btn-hover:hover {
            background: rgba(255,255,255,0.08) !important;
            border-color: rgba(255, 255, 255, 0.15) !important;
            color: #f1f5f9 !important;
          }
          * { scrollbar-width:thin; scrollbar-color:#1e293b transparent; }
          *::-webkit-scrollbar { width:4px; }
          *::-webkit-scrollbar-track { background:transparent; }
          *::-webkit-scrollbar-thumb { background:#1e293b; border-radius:4px; }
        `}</style>
      </div>
    </>
  )
}
