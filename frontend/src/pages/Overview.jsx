import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Users, BadgeAlert, Activity, FileSpreadsheet, PlusCircle,
  Search, UserMinus, Car, FolderOpen, ArrowRight, ShieldCheck,
  HeartPulse, Sparkles, TrendingUp, Clock, Zap
} from 'lucide-react'
import api from '../api/client.js'

/* ── Animated counter ─────────────────────────────────────────── */
function CountUp({ target, duration = 1200 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    if (typeof target !== 'number') return
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * target))
      if (p < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [target])
  return <span>{val}</span>
}

/* ── Stat card ────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, glow, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
      borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden',
      transition: 'all 0.3s', cursor: 'default',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${glow}` }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
      {/* Glow blob */}
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: glow, filter: 'blur(25px)', opacity: 0.4, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569' }}>{label}</span>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: glow, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 900, color: '#f1f5f9', fontFamily: 'monospace', lineHeight: 1 }}>
        {typeof value === 'number' ? <CountUp target={value} /> : value}
      </div>
      <div style={{ marginTop: '8px', height: '2px', borderRadius: '1px', background: 'rgba(30,41,59,0.6)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: visible ? '100%' : '0%', background: `linear-gradient(90deg, ${color}, transparent)`, transition: `width 1.5s ease ${delay}ms` }} />
      </div>
    </div>
  )
}

/* ── Quick action card ────────────────────────────────────────── */
function ActionCard({ label, desc, to, icon: Icon, color, glow, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [])
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? `rgba(10,17,34,0.95)` : 'rgba(10,17,34,0.7)',
          border: `1px solid ${hovered ? color : 'rgba(30,41,59,0.8)'}`,
          borderRadius: '16px', padding: '20px', minHeight: '140px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          cursor: 'pointer', transition: 'all 0.25s',
          transform: visible ? (hovered ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(20px)',
          opacity: visible ? 1 : 0,
          boxShadow: hovered ? `0 12px 40px ${glow}` : 'none',
          position: 'relative', overflow: 'hidden'
        }}>
        {hovered && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 70% 20%, ${glow} 0%, transparent 60%)`, opacity: 0.15, pointerEvents: 'none' }} />}
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: glow, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={color} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: hovered ? color : '#e2e8f0', transition: 'color 0.2s' }}>{label}</span>
            <ArrowRight size={12} color={color} style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'translateX(2px)' : 'translateX(-4px)', transition: 'all 0.2s' }} />
          </div>
          <p style={{ fontSize: '10px', color: '#475569', margin: 0, lineHeight: 1.5 }}>{desc}</p>
        </div>
      </div>
    </Link>
  )
}

/* ── Status badge ─────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    new:          { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  label: 'New' },
    investigating:{ color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', label: 'Active' },
    chargesheet:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',border: 'rgba(167,139,250,0.25)',label: 'Chargesheet' },
    closed:       { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)', label: 'Closed' },
  }
  const s = map[status] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)', label: status }
  return (
    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: s.color, background: s.bg, border: `1px solid ${s.border}`, padding: '3px 8px', borderRadius: '5px', flexShrink: 0 }}>
      {s.label}
    </span>
  )
}

/* ── Greeting ─────────────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function Overview() {
  const [user, setUser] = useState(null)
  const [cases, setCases] = useState([])
  const [stats, setStats] = useState({ total_cases: 0, solved_cases: 0, pending_cases: 0, total_firs: 0, missing_persons: 0, criminal_records: 0 })
  const [adminStats, setAdminStats] = useState(null)
  const [time, setTime] = useState(new Date())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    api.get('/auth/me').then(r => {
      setUser(r.data)
      if (r.data.role === 'admin') api.get('/admin/stats').then(rs => setAdminStats(rs.data)).catch(() => {})
    }).catch(() => {})
    api.get('/cases/').then(r => setCases(r.data)).catch(() => {})
    api.get('/dashboard/stats').then(r => { setStats(r.data); setTimeout(() => setLoaded(true), 200) }).catch(() => setLoaded(true))
    return () => clearInterval(t)
  }, [])

  const isAdmin = user?.role === 'admin'
  const accent = isAdmin ? '#a78bfa' : '#fbbf24'
  const accentGlow = isAdmin ? 'rgba(167,139,250,0.15)' : 'rgba(251,191,36,0.12)'

  const statsConfig = [
    { label: 'Total FIRs',       value: stats.total_firs,       icon: FileSpreadsheet, color: '#60a5fa', glow: 'rgba(96,165,250,0.12)',   delay: 0   },
    { label: 'Total Cases',      value: stats.total_cases,      icon: FolderOpen,      color: '#818cf8', glow: 'rgba(129,140,248,0.12)',  delay: 80  },
    { label: 'Solved Cases',     value: stats.solved_cases,     icon: ShieldCheck,     color: '#34d399', glow: 'rgba(52,211,153,0.12)',   delay: 160 },
    { label: 'Pending Cases',    value: stats.pending_cases,    icon: BadgeAlert,      color: '#fbbf24', glow: 'rgba(251,191,36,0.12)',   delay: 240 },
    { label: 'Missing Persons',  value: stats.missing_persons,  icon: UserMinus,       color: '#f87171', glow: 'rgba(248,113,113,0.12)',  delay: 320 },
    { label: 'Criminal Records', value: stats.criminal_records, icon: Shield,          color: '#94a3b8', glow: 'rgba(148,163,184,0.12)',  delay: 400 },
  ]

  const adminStatsConfig = adminStats ? [
    { label: 'Registered Officers', value: adminStats.total_users,         icon: Users,       color: '#a78bfa', glow: 'rgba(167,139,250,0.12)', delay: 0   },
    { label: 'Active Complaints',   value: adminStats.active_complaints,   icon: FolderOpen,  color: '#60a5fa', glow: 'rgba(96,165,250,0.12)',  delay: 80  },
    { label: 'Emergency Alerts',    value: adminStats.emergency_alerts,    icon: BadgeAlert,  color: '#f87171', glow: 'rgba(248,113,113,0.12)', delay: 160 },
    { label: 'AI Requests Today',   value: adminStats.ai_requests_today,   icon: Sparkles,    color: '#fbbf24', glow: 'rgba(251,191,36,0.12)',  delay: 240 },
    { label: 'Audit Logs',          value: adminStats.langsmith_traces,    icon: Activity,    color: '#22d3ee', glow: 'rgba(34,211,238,0.12)',  delay: 320 },
    { label: 'System Health',       value: adminStats.system_health,       icon: HeartPulse,  color: '#34d399', glow: 'rgba(52,211,153,0.12)',  delay: 400 },
  ] : []

  const quickActions = isAdmin ? [
    { label: 'Configure AI Prompts', desc: 'Modify FIR generator AI instructions', to: '/admin', icon: Sparkles, color: '#a78bfa', glow: 'rgba(167,139,250,0.15)', delay: 0   },
    { label: 'User Directory',       desc: 'Manage registered police officers',    to: '/admin', icon: Users,    color: '#60a5fa', glow: 'rgba(96,165,250,0.15)',  delay: 100 },
    { label: 'Audit Logs',           desc: 'Inspect AI session activities',        to: '/admin', icon: Activity, color: '#fbbf24', glow: 'rgba(251,191,36,0.15)',  delay: 200 },
  ] : [
    { label: 'Generate FIR via AI',  desc: 'Convert complaint to FIR instantly',  to: '/fir',      icon: PlusCircle, color: '#fbbf24', glow: 'rgba(251,191,36,0.15)',  delay: 0   },
    { label: 'Smart Case Search',    desc: 'Natural language case intelligence',   to: '/search',   icon: Search,     color: '#60a5fa', glow: 'rgba(96,165,250,0.15)',  delay: 100 },
    { label: 'Vehicle Verification', desc: 'Verify theft & registration status',   to: '/vehicles', icon: Car,        color: '#34d399', glow: 'rgba(52,211,153,0.15)',  delay: 200 },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Welcome Banner ── */}
      {user && (
        <div style={{
          position: 'relative', borderRadius: '20px', overflow: 'hidden',
          background: isAdmin
            ? 'linear-gradient(135deg, rgba(10,17,34,0.95) 0%, rgba(30,17,60,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(10,17,34,0.95) 0%, rgba(30,25,10,0.95) 100%)',
          border: `1px solid ${isAdmin ? 'rgba(167,139,250,0.2)' : 'rgba(251,191,36,0.15)'}`,
          padding: '32px 36px', marginBottom: '32px',
          boxShadow: `0 20px 60px ${accentGlow}`,
          animation: 'slideDown 0.5s cubic-bezier(0.34,1.56,0.64,1)'
        }}>
          {/* BG glow */}
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '200px', height: '200px', borderRadius: '50%', background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`, filter: 'blur(30px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${accent}33, transparent)` }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: accent, background: `${accentGlow}`, border: `1px solid ${accent}33`,
                  padding: '4px 10px', borderRadius: '6px'
                }}>
                  {isAdmin ? '⚡ System Administrator' : `🛡️ ${user.district || 'Command'} Division`}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#10b981', fontFamily: 'monospace' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'ping 1.5s ease-in-out infinite' }} />
                  ACTIVE SESSION
                </span>
              </div>
              <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                {greeting()}, <span style={{ color: accent }}>{user.rank || (isAdmin ? 'DGP' : 'Officer')}</span> {user.full_name} 👋
              </h2>
              <p style={{ fontSize: '12px', color: '#475569', margin: 0, maxWidth: '600px', lineHeight: 1.6 }}>
                {isAdmin
                  ? 'Accessing GVAK Police Command headquarters. Root privilege active — manage AI prompts, audit logs, and system metrics.'
                  : `Logged into ${user.station || 'Station HQ'}. Ready to classify complaints, record FIRs, and run intelligence searches.`}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '20px' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: accent, fontFamily: 'monospace' }}>
                {time.toLocaleTimeString('en-IN', { hour12: false })}
              </div>
              <div style={{ fontSize: '9px', color: '#334155', fontFamily: 'monospace', marginTop: '2px' }}>
                {time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                <TrendingUp size={10} color="#10b981" />
                <span style={{ fontSize: '9px', color: '#10b981', fontFamily: 'monospace' }}>SYSTEM NOMINAL</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Zap size={14} color={accent} />
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#475569' }}>
            {isAdmin ? 'Administrative Metrics' : 'Live Enforcement Snapshot'}
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(30,41,59,0.6)' }} />
        </div>
        <div className="stats-grid">
          {(isAdmin ? adminStatsConfig : statsConfig).map(s => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="main-grid">

        {/* Left / Middle: Quick Actions + Chart */}
        <div className="main-left-col">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Zap size={14} color={accent} />
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#475569' }}>Quick Operations</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(30,41,59,0.6)' }} />
          </div>
          <div className="actions-grid">
            {quickActions.map(a => <ActionCard key={a.label} {...a} />)}
          </div>

          {/* Activity Trend Graph */}
          <div style={{
            marginTop: '20px', background: 'rgba(10,17,34,0.8)',
            border: '1px solid rgba(30,41,59,0.8)', borderRadius: '16px', padding: '24px',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Command Center Performance Log</p>
                <p style={{ fontSize: '9px', color: '#475569', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Weekly analytics tracking AI assistance & case flow</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#60a5fa', display: 'inline-block' }} />
                  <span style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace' }}>CASES RESOLVED</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent, display: 'inline-block' }} />
                  <span style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace' }}>AI ASSISTS</span>
                </div>
              </div>
            </div>

            {/* Glowing Chart Area */}
            <div style={{ width: '100%', height: '180px', position: 'relative' }}>
              <svg viewBox="0 0 600 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="casesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.00"/>
                  </linearGradient>
                  <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity="0.25"/>
                    <stop offset="100%" stopColor={accent} stopOpacity="0.00"/>
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines */}
                {[0, 45, 90, 135, 180].map(y => (
                  <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(30,41,59,0.3)" strokeWidth="1" strokeDasharray="4 4" />
                ))}

                {/* Area Under Cases Curve */}
                <path d="M 0 180 L 0 130 C 50 120, 50 90, 100 90 C 150 90, 150 140, 200 140 C 250 140, 250 50, 300 50 C 350 50, 350 110, 400 110 C 450 110, 450 30, 500 30 C 550 30, 550 70, 600 70 L 600 180 Z" fill="url(#casesGrad)" />
                
                {/* Cases Line Curve */}
                <path d="M 0 130 C 50 120, 50 90, 100 90 C 150 90, 150 140, 200 140 C 250 140, 250 50, 300 50 C 350 50, 350 110, 400 110 C 450 110, 450 30, 500 30 C 550 30, 550 70, 600 70" 
                  fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round"
                  style={{ strokeDasharray: 1000, strokeDashoffset: 1000, animation: 'drawChart 2s ease forwards 0.2s' }} />

                {/* Area Under AI Curve */}
                <path d="M 0 180 L 0 150 C 50 140, 50 110, 100 110 C 150 110, 150 80, 200 80 C 250 80, 250 130, 300 130 C 350 130, 350 60, 400 60 C 450 60, 450 20, 500 20 C 550 20, 550 50, 600 50 L 600 180 Z" fill="url(#aiGrad)" />
                
                {/* AI Line Curve */}
                <path d="M 0 150 C 50 140, 50 110, 100 110 C 150 110, 150 80, 200 80 C 250 80, 250 130, 300 130 C 350 130, 350 60, 400 60 C 450 60, 450 20, 500 20 C 550 20, 550 50, 600 50" 
                  fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round"
                  style={{ strokeDasharray: 1000, strokeDashoffset: 1000, animation: 'drawChart 2.4s ease forwards 0.4s' }} />

                {/* Grid Dots */}
                {[
                  { x: 0, yc: 130, ya: 150, day: 'Mon' },
                  { x: 100, yc: 90, ya: 110, day: 'Tue' },
                  { x: 200, yc: 140, ya: 80, day: 'Wed' },
                  { x: 300, yc: 50, ya: 130, day: 'Thu' },
                  { x: 400, yc: 110, ya: 60, day: 'Fri' },
                  { x: 500, yc: 30, ya: 20, day: 'Sat' },
                  { x: 600, yc: 70, ya: 50, day: 'Sun' }
                ].map((pt, index) => (
                  <g key={index} className="chart-dot-group">
                    {/* Vert line */}
                    <line x1={pt.x} y1="0" x2={pt.x} y2="180" stroke="rgba(30,41,59,0.15)" strokeWidth="1" />
                    
                    {/* Cases dot */}
                    <circle cx={pt.x} cy={pt.yc} r="4" fill="#020817" stroke="#60a5fa" strokeWidth="2.5" />
                    <circle cx={pt.x} cy={pt.yc} r="9" fill="#60a5fa" opacity="0" className="glow-ring" style={{ transition: 'opacity 0.2s' }} />

                    {/* AI dot */}
                    <circle cx={pt.x} cy={pt.ya} r="4" fill="#020817" stroke={accent} strokeWidth="2.5" />
                    <circle cx={pt.x} cy={pt.ya} r="9" fill={accent} opacity="0" className="glow-ring" style={{ transition: 'opacity 0.2s' }} />

                    {/* X axis labels */}
                    <text x={pt.x} y="174" fill="#334155" fontSize="8" fontFamily="monospace" textAnchor="middle">{pt.day}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Admin DB summary */}
          {isAdmin && (
            <div style={{
              marginTop: '16px', background: 'rgba(10,17,34,0.8)',
              border: '1px solid rgba(30,41,59,0.8)', borderRadius: '16px', padding: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Database Overview</p>
                  <p style={{ fontSize: '9px', color: '#475569', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Aggregate record checks</p>
                </div>
                <Link to="/admin" style={{ fontSize: '10px', color: '#a78bfa', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Manage <ArrowRight size={10} />
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { label: 'FIR Records', value: stats.total_firs },
                  { label: 'Case Files', value: stats.total_cases },
                  { label: 'Missing', value: stats.missing_persons },
                  { label: 'Criminals', value: stats.criminal_records },
                ].map(item => (
                  <div key={item.label} style={{ background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(30,41,59,0.6)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <p style={{ fontSize: '8px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>{item.label}</p>
                    <p style={{ fontSize: '20px', fontWeight: 900, color: '#f1f5f9', fontFamily: 'monospace', margin: 0 }}>
                      <CountUp target={item.value} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Recent Cases Feed */}
        <div className="main-right-col">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Clock size={14} color={accent} />
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#475569' }}>Live Case Feed</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(30,41,59,0.6)' }} />
            <Link to="/cases" style={{ fontSize: '9px', color: accent, textDecoration: 'none', fontWeight: 700 }}>View All →</Link>
          </div>
          <div style={{
            background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
            borderRadius: '16px', overflow: 'hidden', maxHeight: '550px'
          }}>
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(30,41,59,0.6)', background: 'rgba(2,6,23,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'ping 1.5s ease-in-out infinite', display: 'inline-block' }} />
              <span style={{ fontSize: '10px', color: '#334155', fontFamily: 'monospace', letterSpacing: '0.08em' }}>REAL-TIME UPDATES</span>
            </div>
            {/* List */}
            <div style={{ overflowY: 'auto', maxHeight: '470px' }}>
              {cases.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <FolderOpen size={28} color="#1e293b" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontSize: '12px', color: '#334155', margin: 0 }}>No active cases</p>
                </div>
              ) : cases.slice(0, 10).map((c, i) => (
                <div key={c.id} style={{
                  padding: '12px 16px', borderBottom: '1px solid rgba(30,41,59,0.4)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px',
                  transition: 'background 0.15s', animation: `fadeSlide 0.3s ease ${i * 60}ms both`
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,41,59,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.crime_type}</p>
                    <p style={{ fontSize: '9px', color: '#475569', margin: '2px 0 0', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.fir_number || '—'} · {c.location || 'Unknown'}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes drawChart { to { stroke-dashoffset: 0; } }
        @keyframes ping { 0%{opacity:1} 75%,100%{opacity:0} }
        
        /* Stats Grid Responsiveness */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }
        @media (max-width: 1200px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* Main Layout Grid Responsiveness */
        .main-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
        }

        .main-left-col {
          display: flex;
          flex-direction: column;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 640px) {
          .actions-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-dot-group:hover .glow-ring {
          opacity: 0.15 !important;
        }
      `}</style>
    </div>
  )
}
