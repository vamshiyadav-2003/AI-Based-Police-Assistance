import { useEffect, useState } from 'react'
import {
  Shield, UserPlus, Users, FolderPlus, Trash2,
  CheckCircle2, ShieldAlert, Activity, Server,
  Cpu, Clock, Bell, ShieldCheck, AlertTriangle,
  ChevronDown, ChevronRight, Lock, Radio,
  FileSearch2, XCircle, ClipboardCheck, Search, X
} from 'lucide-react'
import api from '../api/client.js'

function StyledInput({ label, type = 'text', value, onChange, placeholder, required }) {
  const [f, setF] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontSize: '8.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: f ? '#fbbf24' : '#475569', marginBottom: '5px', transition: 'color 0.2s' }}>{label} {required && '*'}</label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '9px 12px',
          background: f ? 'rgba(251,191,36,0.03)' : 'rgba(2,6,23,0.7)',
          border: `1px solid ${f ? 'rgba(251,191,36,0.45)' : 'rgba(30,41,59,0.8)'}`,
          borderRadius: '9px', color: '#f1f5f9', fontSize: '12px', outline: 'none', transition: 'all 0.2s'
        }}
      />
    </div>
  )
}

function StyledSelect({ label, value, onChange, options, required }) {
  const [f, setF] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontSize: '8.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: f ? '#fbbf24' : '#475569', marginBottom: '5px', transition: 'color 0.2s' }}>{label} {required && '*'}</label>
      <select
        value={value} onChange={onChange} required={required}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '9px 12px',
          background: 'rgba(2,6,23,0.7)',
          border: `1px solid ${f ? 'rgba(251,191,36,0.45)' : 'rgba(30,41,59,0.8)'}`,
          borderRadius: '9px', color: '#f1f5f9', fontSize: '12px', outline: 'none', cursor: 'pointer', transition: 'all 0.2s'
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

const STAT_CARDS = [
  { key: 'total_users', label: 'Total Users', icon: Users, color: '#94a3b8', sub: 'Registered personnel' },
  { key: 'active_complaints', label: 'Active Complaints', icon: AlertTriangle, color: '#fbbf24', sub: 'Requires action' },
  { key: 'ai_requests_today', label: 'AI Requests Today', icon: Cpu, color: '#fbbf24', sub: 'LLM generation load' },
  { key: 'groq_status', label: 'Groq AI Status', icon: Server, color: '#34d399', sub: 'Inference API', isStatus: true, pulse: true },
  { key: 'langsmith_traces', label: 'LangSmith Traces', icon: Activity, color: '#94a3b8', sub: 'Observability runs' },
  { key: 'pending_reviews', label: 'Pending Reviews', icon: Clock, color: '#fbbf24', sub: 'Awaiting signoff' },
  { key: 'emergency_alerts', label: 'Emergency Alerts', icon: Bell, color: '#f87171', sub: 'Immediate response', isAlert: true },
  { key: 'system_health', label: 'System Health', icon: ShieldCheck, color: '#34d399', sub: 'Services status', isStatus: true, pulse: true },
]

const RANKS = [
  'DGP (Director General of Police)', 'ADGP (Additional Director General)',
  'IGP (Inspector General of Police)', 'DIG (Deputy Inspector General)',
  'SP (Superintendent of Police)', 'Addl. SP', 'DSP', 'ASP',
  'CI (Circle Inspector)', 'SI (Sub-Inspector)', 'ASI', 'HC (Head Constable)', 'PC (Police Constable)'
]

export default function AdminPanel() {
  const [officers, setOfficers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('officers')
  const [feedback, setFeedback] = useState({ type: '', msg: '' })
  
  const [complaints, setComplaints] = useState([])
  const [expandedComplaintId, setExpandedComplaintId] = useState(null)
  const [complaintSearch, setComplaintSearch] = useState('')
  const [approvalInputs, setApprovalInputs] = useState({
    assigned_officer_id: '',
    fir_number: '',
    incident_location: ''
  })

  const [newOfficer, setNewOfficer] = useState({
    badge_number: '', full_name: '', email: '', password: '', role: 'officer', station: '', rank: '',
  })
  const [newCriminal, setNewCriminal] = useState({
    name: '', age: '', gender: 'Male', aadhaar: '', phone: '',
    address: '', district: '', previous_firs: '0', arrest_history: 'No', status: 'Active',
  })

  async function loadData() {
    setLoading(true)
    try {
      const [offRes, statsRes, compRes] = await Promise.all([
        api.get('/auth/officers'),
        api.get('/admin/stats'),
        api.get('/complaints/?status=Pending')
      ])
      setOfficers(offRes.data)
      setStats(statsRes.data)
      setComplaints(compRes.data.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  function showFeedback(type, msg) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback({ type: '', msg: '' }), 5000)
  }

  async function handleAddOfficer(e) {
    e.preventDefault()
    try {
      await api.post('/auth/register', newOfficer)
      showFeedback('success', `Officer ${newOfficer.full_name} registered successfully!`)
      setNewOfficer({ badge_number: '', full_name: '', email: '', password: '', role: 'officer', station: '', rank: '' })
      loadData()
    } catch (err) {
      showFeedback('error', err.response?.data?.detail || 'Failed to register officer.')
    }
  }

  async function handleDeleteOfficer(id, name) {
    if (!window.confirm(`Delete Officer ${name}?`)) return
    try {
      await api.delete(`/auth/officers/${id}`)
      showFeedback('success', `Officer ${name} removed from registry.`)
      loadData()
    } catch (err) {
      showFeedback('error', err.response?.data?.detail || 'Failed to delete officer.')
    }
  }

  async function handleAddCriminal(e) {
    e.preventDefault()
    try {
      await api.post('/criminals/', { ...newCriminal, age: parseInt(newCriminal.age), previous_firs: parseInt(newCriminal.previous_firs) })
      showFeedback('success', `Criminal record for ${newCriminal.name} created!`)
      setNewCriminal({ name: '', age: '', gender: 'Male', aadhaar: '', phone: '', address: '', district: '', previous_firs: '0', arrest_history: 'No', status: 'Active' })
    } catch (err) {
      showFeedback('error', err.response?.data?.detail || 'Failed to create criminal record.')
    }
  }

  async function handleApproveComplaint(complaintId, e) {
    if (e) e.preventDefault();
    if (!approvalInputs.assigned_officer_id) {
      alert("Please select an officer to assign the case to.");
      return;
    }
    if (!approvalInputs.fir_number) {
      alert("Please assign a valid FIR number.");
      return;
    }
    try {
      const payload = {
        assigned_officer_id: parseInt(approvalInputs.assigned_officer_id),
        fir_number: approvalInputs.fir_number,
        incident_location: approvalInputs.incident_location || 'Unknown'
      };
      await api.post(`/admin/complaints/${complaintId}/approve`, payload);
      showFeedback('success', `Complaint ${complaintId} has been approved and registered as FIR ${approvalInputs.fir_number}.`);
      setExpandedComplaintId(null);
      loadData();
    } catch (err) {
      showFeedback('error', err.response?.data?.detail || 'Failed to approve complaint.');
    }
  }

  async function handleRejectComplaint(complaintId) {
    if (!window.confirm("Are you sure you want to reject and dismiss this complaint?")) return;
    try {
      await api.post(`/admin/complaints/${complaintId}/reject`);
      showFeedback('success', `Complaint ${complaintId} has been rejected.`);
      setExpandedComplaintId(null);
      loadData();
    } catch (err) {
      showFeedback('error', err.response?.data?.detail || 'Failed to reject complaint.');
    }
  }

  const upd = (setter, prev, key, val) => setter({ ...prev, [key]: val })

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
        <Radio size={28} color="#fbbf24" style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 2s linear infinite' }} />
        <p style={{ color: '#475569', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Loading Administrative Console...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', animation: 'fadeUp 0.4s ease' }}>
        <div style={{ width: 38, height: 38, borderRadius: '11px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={18} color="#fbbf24" />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>Administrative Console</h1>
          <p style={{ fontSize: '11px', color: '#475569', margin: 0, letterSpacing: '0.04em' }}>System configuration, officer management & security policy control</p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.msg && (
        <div style={{
          marginBottom: '20px', padding: '12px 16px', borderRadius: '12px',
          background: feedback.type === 'success' ? 'rgba(52,211,153,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)'}`,
          color: feedback.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '12px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeUp 0.3s ease'
        }}>
          {feedback.type === 'success' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
          {feedback.msg}
        </div>
      )}

      {/* Stat Cards Grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px', animation: 'fadeUp 0.4s ease 0.1s both' }} className="stats-grid-admin">
          {STAT_CARDS.map(({ key, label, icon: Icon, color, sub, isStatus, isAlert, pulse }) => {
            const val = stats[key]
            return (
              <div key={key} style={{
                background: 'rgba(10,17,34,0.85)', border: `1px solid rgba(30,41,59,0.8)`,
                borderRadius: '14px', padding: '18px', position: 'relative', overflow: 'hidden',
                transition: 'all 0.25s', cursor: 'default'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                {/* Accent left border */}
                <div style={{ position: 'absolute', left: 0, top: '14px', bottom: '14px', width: '3px', borderRadius: '0 3px 3px 0', background: color }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <p style={{ fontSize: '8.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', margin: 0 }}>{label}</p>
                  <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(30,41,59,0.6)' }}>
                    <Icon size={14} color={color} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {pulse && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 0 3px ${color}30`, animation: 'ping 1.5s ease infinite' }} />}
                  {isAlert && val > 0 && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color, animation: 'ping 1.2s ease infinite' }} />}
                  <p style={{ fontSize: isStatus ? '16px' : '22px', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>
                    {typeof val === 'number' ? val.toLocaleString() : (val || (isStatus ? 'Online' : '—'))}
                  </p>
                </div>
                <p style={{ fontSize: '9px', color: '#334155', margin: '6px 0 0', letterSpacing: '0.03em' }}>{sub}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', animation: 'fadeUp 0.4s ease 0.15s both', flexWrap: 'wrap' }}>
        {[
          ['officers', Users, 'Officer Registry', null],
          ['criminal', FolderPlus, 'Criminal Database', null],
          ['complaints', FileSearch2, 'Review Complaints', complaints.length]
        ].map(([tab, Icon, lbl, badge]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '9px 20px', borderRadius: '10px', fontSize: '11px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '6px',
            background: activeTab === tab
              ? (tab === 'complaints' ? 'rgba(56,189,248,0.08)' : 'rgba(251,191,36,0.08)')
              : 'rgba(10,17,34,0.7)',
            border: `1px solid ${
              activeTab === tab
                ? (tab === 'complaints' ? '#38bdf8' : '#fbbf24')
                : 'rgba(30,41,59,0.8)'
            }`,
            color: activeTab === tab
              ? (tab === 'complaints' ? '#38bdf8' : '#fbbf24')
              : '#64748b',
            position: 'relative'
          }}>
            <Icon size={13} /> {lbl}
            {badge !== null && badge > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '16px', height: '16px', borderRadius: '8px',
                background: activeTab === tab ? '#38bdf8' : 'rgba(239,68,68,0.8)',
                color: '#fff', fontSize: '8px', fontWeight: 900, padding: '0 4px'
              }}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Officer Registry Tab */}
      {activeTab === 'officers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', animation: 'fadeUp 0.3s ease' }} className="panel-grid">

          {/* Officer List */}
          <div style={{ background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,41,59,0.6)', background: 'rgba(2,6,23,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={13} /> Registered Officers
              </h2>
              <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#475569', background: 'rgba(30,41,59,0.5)', padding: '3px 8px', borderRadius: '4px' }}>{officers.length} Personnel</span>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {officers.map((o, i) => (
                <div key={o.id} style={{
                  padding: '14px 20px', borderBottom: '1px solid rgba(30,41,59,0.4)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: i % 2 === 0 ? 'rgba(2,6,23,0.2)' : 'transparent',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,191,36,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'rgba(2,6,23,0.2)' : 'transparent'}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 750, color: '#e2e8f0', margin: 0 }}>{o.full_name}</p>
                      {o.rank && (
                        <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', color: '#fbbf24', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', padding: '2px 6px', borderRadius: '3px' }}>{o.rank}</span>
                      )}
                    </div>
                    <p style={{ fontSize: '9.5px', color: '#475569', margin: 0, fontFamily: 'monospace' }}>Badge: {o.badge_number} · {o.station || 'HQ'} · <span style={{ textTransform: 'capitalize' }}>{o.role}</span></p>
                  </div>
                  <button onClick={() => handleDeleteOfficer(o.id, o.full_name)} style={{
                    background: 'none', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px',
                    color: '#ef4444', padding: '5px 8px', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = '#ef4444' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {officers.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#334155', fontSize: '11px', fontStyle: 'italic' }}>No officers registered yet.</div>
              )}
            </div>
          </div>

          {/* Add Officer Form */}
          <form onSubmit={handleAddOfficer} style={{ background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,41,59,0.6)', background: 'rgba(2,6,23,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={13} color="#fbbf24" />
              <h2 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24', margin: 0 }}>Register New Officer</h2>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <StyledInput label="Full Name" required value={newOfficer.full_name} onChange={e => upd(setNewOfficer, newOfficer, 'full_name', e.target.value)} placeholder="e.g. Ramesh Kumar" />
                <StyledInput label="Badge ID" required value={newOfficer.badge_number} onChange={e => upd(setNewOfficer, newOfficer, 'badge_number', e.target.value)} placeholder="e.g. GV1001" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <StyledInput label="Email Address" required type="email" value={newOfficer.email} onChange={e => upd(setNewOfficer, newOfficer, 'email', e.target.value)} placeholder="officer@gvak.gov.in" />
                <StyledInput label="Password" required type="password" value={newOfficer.password} onChange={e => upd(setNewOfficer, newOfficer, 'password', e.target.value)} placeholder="Secure password" />
              </div>
              <StyledInput label="Police Station" value={newOfficer.station} onChange={e => upd(setNewOfficer, newOfficer, 'station', e.target.value)} placeholder="e.g. Madhapur PS" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <StyledSelect label="Security Role" required value={newOfficer.role} onChange={e => upd(setNewOfficer, newOfficer, 'role', e.target.value)} options={[
                  { value: 'officer', label: 'Officer' },
                  { value: 'station_head', label: 'Station Head' },
                  { value: 'admin', label: 'Administrator' },
                ]} />
                <StyledSelect label="Officer Rank" required value={newOfficer.rank} onChange={e => upd(setNewOfficer, newOfficer, 'rank', e.target.value)} options={[
                  { value: '', label: '— Select Rank —' },
                  ...RANKS.map(r => ({ value: r.split(' ')[0], label: r }))
                ]} />
              </div>
              <button type="submit" style={{
                width: '100%', padding: '11px', borderRadius: '11px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none', color: '#0c0800', fontSize: '11px', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(245,158,11,0.2)'
              }}>Add Officer to Registry</button>
            </div>
          </form>

        </div>
      )}

      {/* Criminal Database Tab */}
      {activeTab === 'criminal' && (
        <form onSubmit={handleAddCriminal} style={{
          background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
          borderRadius: '16px', overflow: 'hidden', animation: 'fadeUp 0.3s ease'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,41,59,0.6)', background: 'rgba(2,6,23,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={13} color="#fbbf24" />
            <h2 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24', margin: 0 }}>Create Criminal Dossier Record</h2>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }} className="criminal-grid">
              <StyledInput label="Full Name" required value={newCriminal.name} onChange={e => upd(setNewCriminal, newCriminal, 'name', e.target.value)} />
              <StyledInput label="Age" required type="number" value={newCriminal.age} onChange={e => upd(setNewCriminal, newCriminal, 'age', e.target.value)} />
              <StyledSelect label="Gender" value={newCriminal.gender} onChange={e => upd(setNewCriminal, newCriminal, 'gender', e.target.value)} options={[
                { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }
              ]} />
              <StyledInput label="Aadhaar (Demo)" value={newCriminal.aadhaar} onChange={e => upd(setNewCriminal, newCriminal, 'aadhaar', e.target.value)} placeholder="XXXX XXXX 1100" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }} className="criminal-grid">
              <StyledInput label="Phone" value={newCriminal.phone} onChange={e => upd(setNewCriminal, newCriminal, 'phone', e.target.value)} />
              <StyledInput label="District Zone" value={newCriminal.district} onChange={e => upd(setNewCriminal, newCriminal, 'district', e.target.value)} placeholder="e.g. Karimnagar" />
              <StyledInput label="Previous FIRs" type="number" value={newCriminal.previous_firs} onChange={e => upd(setNewCriminal, newCriminal, 'previous_firs', e.target.value)} />
              <StyledSelect label="Arrest History" value={newCriminal.arrest_history} onChange={e => upd(setNewCriminal, newCriminal, 'arrest_history', e.target.value)} options={[
                { value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }
              ]} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '14px' }}>
              <StyledInput label="Resident Address" value={newCriminal.address} onChange={e => upd(setNewCriminal, newCriminal, 'address', e.target.value)} placeholder="Full registered address" />
              <StyledSelect label="Status" value={newCriminal.status} onChange={e => upd(setNewCriminal, newCriminal, 'status', e.target.value)} options={[
                { value: 'Active', label: 'Active' }, { value: 'Arrested', label: 'Arrested' }, { value: 'Absconding', label: 'Absconding' }
              ]} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid rgba(30,41,59,0.5)' }}>
              <button type="submit" style={{
                padding: '10px 28px', borderRadius: '11px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none', color: '#0c0800', fontSize: '11px', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245,158,11,0.2)', transition: 'all 0.2s'
              }}>Register Criminal Record</button>
            </div>
          </div>
        </form>
      )}

      {/* ── Review Complaints Tab ── */}
      {activeTab === 'complaints' && (
        <div style={{ animation: 'fadeUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSearch2 size={15} color="#38bdf8" />
              </div>
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>Citizen Complaint Review Queue</h2>
                <p style={{ fontSize: '10px', color: '#475569', margin: 0 }}>Review, assign, and approve or reject incoming citizen complaints to register them as official cases.</p>
              </div>
            </div>
            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: complaints.length > 0 ? '#fbbf24' : '#334155', background: complaints.length > 0 ? 'rgba(251,191,36,0.08)' : 'rgba(30,41,59,0.5)', border: `1px solid ${complaints.length > 0 ? 'rgba(251,191,36,0.25)' : 'rgba(30,41,59,0.6)'}`, padding: '4px 12px', borderRadius: '6px' }}>
              {complaints.length} Pending
            </span>
          </div>

          {/* Complaints Search Bar */}
          {complaints.length > 0 && (
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type="text"
                value={complaintSearch}
                onChange={e => setComplaintSearch(e.target.value)}
                placeholder="Search complaints by Ref ID (e.g. GVAK-20260718-1268), Citizen Name, or Phone..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 40px 11px 36px',
                  background: 'rgba(2, 6, 23, 0.7)',
                  border: '1px solid rgba(30, 41, 59, 0.8)',
                  borderRadius: '10px',
                  color: '#f1f5f9',
                  fontSize: '12px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}
              />
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              {complaintSearch && (
                <button
                  onClick={() => setComplaintSearch('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {(() => {
            const filtered = complaints.filter(c => 
              c.complaint_id.toLowerCase().includes(complaintSearch.toLowerCase()) ||
              c.citizen_name.toLowerCase().includes(complaintSearch.toLowerCase()) ||
              (c.phone && String(c.phone).includes(complaintSearch))
            )

            if (complaints.length === 0) {
              return (
                <div style={{ padding: '60px 24px', textAlign: 'center', background: 'rgba(10,17,34,0.6)', border: '1px solid rgba(30,41,59,0.6)', borderRadius: '16px' }}>
                  <ClipboardCheck size={36} color="#1e293b" style={{ marginBottom: '14px' }} />
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>All Clear — No Pending Complaints</p>
                  <p style={{ fontSize: '11px', color: '#1e293b', margin: 0 }}>New citizen complaints will appear here once they are submitted through the public portal.</p>
                </div>
              )
            }

            if (filtered.length === 0) {
              return (
                <div style={{ padding: '60px 24px', textAlign: 'center', background: 'rgba(10,17,34,0.6)', border: '1px solid rgba(30,41,59,0.6)', borderRadius: '16px' }}>
                  <Search size={36} color="#475569" style={{ marginBottom: '14px' }} />
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', margin: '0 0 6px' }}>No Matching Complaints</p>
                  <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>We couldn't find any complaints matching "{complaintSearch}".</p>
                </div>
              )
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered.map((c, idx) => {
                  const isExpanded = expandedComplaintId === c.complaint_id
                  const priorityColors = {
                    High: { c: '#f97316', bg: 'rgba(249,115,22,0.08)', b: 'rgba(249,115,22,0.25)' },
                    Critical: { c: '#ef4444', bg: 'rgba(239,68,68,0.08)', b: 'rgba(239,68,68,0.25)' },
                    Medium: { c: '#fbbf24', bg: 'rgba(251,191,36,0.08)', b: 'rgba(251,191,36,0.25)' },
                    Low: { c: '#34d399', bg: 'rgba(52,211,153,0.08)', b: 'rgba(52,211,153,0.25)' },
                  }
                  const pc = priorityColors[c.priority] || priorityColors.Low
                  return (
                    <div key={c.complaint_id} style={{ background: 'rgba(10,17,34,0.8)', border: `1px solid ${isExpanded ? 'rgba(56,189,248,0.3)' : 'rgba(30,41,59,0.8)'}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.2s' }}>

                      {/* Complaint Header Row */}
                      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: isExpanded ? 'rgba(56,189,248,0.03)' : 'transparent', transition: 'background 0.2s' }}
                        onClick={() => {
                          setExpandedComplaintId(isExpanded ? null : c.complaint_id)
                          if (!isExpanded) {
                            setApprovalInputs(prev => ({
                              assigned_officer_id: '',
                              fir_number: c.complaint_id.replace('GVAK-', 'FIR-'),
                              incident_location: c.complaint?.split('[Location:')[1]?.replace(']', '').trim() || ''
                            }))
                          }
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 750, color: '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.citizen_name}</p>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: pc.c, background: pc.bg, border: `1px solid ${pc.b}`, padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.priority}</span>
                            <span style={{ fontSize: '9px', color: '#818cf8', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', padding: '1px 6px', borderRadius: '4px' }}>{c.category}</span>
                          </div>
                          <p style={{ fontSize: '10px', color: '#475569', margin: 0, fontFamily: 'monospace' }}>
                            {c.complaint_id} · {c.phone || 'N/A'} · {c.date || 'No date'}
                          </p>
                        </div>
                        <ChevronDown size={16} color="#475569" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>

                      {/* Complaint Details Drawer */}
                      {isExpanded && (
                        <div style={{ padding: '20px', borderTop: '1px solid rgba(30,41,59,0.8)', background: 'rgba(2,6,23,0.3)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="complaint-detail-grid">
                            
                            {/* Left: Complaint Details */}
                            <div>
                              <p style={{ fontSize: '9px', fontWeight: 750, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Citizen Description</p>
                              <div style={{ padding: '14px', background: 'rgba(10,17,34,0.6)', border: '1px solid rgba(30,41,59,0.6)', borderRadius: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                  {c.complaint?.split('[Location:')[0]?.trim() || c.complaint || '—'}
                                </p>
                              </div>

                              <p style={{ fontSize: '9px', fontWeight: 750, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '14px 0 8px' }}>AI Recommended Dispatch</p>
                              <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '8px' }}>
                                <p style={{ fontSize: '11.5px', color: '#c4b5fd', margin: 0, lineHeight: 1.5 }}>{c.department || '—'}</p>
                              </div>
                            </div>

                            {/* Right: Approval Panel */}
                            <div>
                              <p style={{ fontSize: '9px', fontWeight: 750, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Authorize & Promote to Official Case</p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(10,17,34,0.6)', border: '1px solid rgba(30,41,59,0.6)', padding: '16px', borderRadius: '12px' }}>
                                
                                <div>
                                  <label style={{ display: 'block', fontSize: '8.5px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '5px' }}>Designated Investigating Officer</label>
                                  <select
                                    value={approvalInputs.assigned_officer_id}
                                    onChange={e => setApprovalInputs(p => ({ ...p, assigned_officer_id: e.target.value }))}
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', background: 'rgba(2,6,23,0.7)', border: '1px solid rgba(30,41,59,0.8)', borderRadius: '8px', color: approvalInputs.assigned_officer_id ? '#f1f5f9' : '#475569', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                                  >
                                    <option value="">— Choose Officer —</option>
                                    {officers.map(o => (
                                      <option key={o.id} value={o.id}>{o.full_name} ({o.rank} - {o.badge_number})</option>
                                    ))}
                                  </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                  <StyledInput
                                    label="Generated FIR Number"
                                    value={approvalInputs.fir_number}
                                    onChange={e => setApprovalInputs(p => ({ ...p, fir_number: e.target.value }))}
                                    placeholder="FIR-XXXX"
                                    required
                                  />
                                  <StyledInput
                                    label="Confirmed Location"
                                    value={approvalInputs.incident_location}
                                    onChange={e => setApprovalInputs(p => ({ ...p, incident_location: e.target.value }))}
                                    placeholder="e.g. Madhapur"
                                    required
                                  />
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                  <button
                                    onClick={() => handleApproveComplaint(c.complaint_id)}
                                    disabled={!approvalInputs.assigned_officer_id || !approvalInputs.fir_number}
                                    style={{
                                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                      padding: '9px', borderRadius: '8px', background: (!approvalInputs.assigned_officer_id || !approvalInputs.fir_number) ? 'rgba(56,189,248,0.1)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                      border: 'none', color: (!approvalInputs.assigned_officer_id || !approvalInputs.fir_number) ? '#475569' : '#fff',
                                      fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', cursor: (!approvalInputs.assigned_officer_id || !approvalInputs.fir_number) ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s'
                                    }}
                                    onMouseEnter={e => { if (approvalInputs.assigned_officer_id && approvalInputs.fir_number) e.currentTarget.style.opacity = 0.9 }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = 1 }}
                                  >
                                    <CheckCircle2 size={12} /> Approve & Dispatch
                                  </button>
                                  <button
                                    onClick={() => handleRejectComplaint(c.complaint_id)}
                                    style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                      padding: '9px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)',
                                      border: '1px solid rgba(239,68,68,0.25)', color: '#f87171',
                                      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = '#ef4444' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)' }}
                                  >
                                    <XCircle size={12} /> Reject
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ping { 0%,100%{box-shadow:0 0 0 0 currentColor} 50%{box-shadow:0 0 0 4px transparent} }

        @media(max-width:1100px) {
          .complaint-detail-grid { grid-template-columns: 1fr !important; }
        }
        @media(max-width:900px) {
          .stats-grid-admin { grid-template-columns: repeat(2, 1fr) !important; }
          .panel-grid { grid-template-columns: 1fr !important; }
          .criminal-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media(max-width:600px) {
          .stats-grid-admin { grid-template-columns: 1fr 1fr !important; }
        }

        select option { background:#0f172a; }
      `}</style>

    </div>
  )
}
