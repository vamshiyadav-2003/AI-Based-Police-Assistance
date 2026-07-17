import { useEffect, useState } from 'react'
import { FolderOpen, Plus, X, ChevronDown, Search, Filter, AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react'
import api from '../api/client.js'

const emptyForm = {
  fir_number: '', crime_type: '', complainant_name: '',
  complainant_contact: '', location: '', description: '', vehicle_involved: '',
}

const STATUS_CONFIG = {
  new:          { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  label: 'New',          icon: '🔵' },
  investigating:{ color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', label: 'Investigating', icon: '🟡' },
  chargesheet:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',border: 'rgba(167,139,250,0.25)',label: 'Chargesheet',   icon: '🟣' },
  closed:       { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)', label: 'Closed',        icon: '🟢' },
}

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', label: status, icon: '⚪' }
  return (
    <span style={{
      fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      padding: '3px 10px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '4px'
    }}>
      {s.icon} {s.label}
    </span>
  )
}

function FormField({ label, value, onChange, type = 'text', span = 1 }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={{
        display: 'block', fontSize: '9px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        color: focused ? '#fbbf24' : '#475569', marginBottom: '6px', transition: 'color 0.2s'
      }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '10px 12px',
          background: focused ? 'rgba(251,191,36,0.04)' : 'rgba(2,6,23,0.7)',
          border: `1px solid ${focused ? 'rgba(251,191,36,0.4)' : 'rgba(30,41,59,0.8)'}`,
          borderRadius: '10px', color: '#f1f5f9', fontSize: '12px', outline: 'none',
          transition: 'all 0.2s', boxShadow: focused ? '0 0 0 3px rgba(251,191,36,0.06)' : 'none'
        }}
      />
    </div>
  )
}

export default function Cases() {
  const [cases, setCases] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [focusedSearch, setFocusedSearch] = useState(false)

  function loadCases() {
    api.get('/cases/').then(r => { setCases(r.data); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(loadCases, [])

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true)
    await api.post('/cases/', form)
    setForm(emptyForm); setShowForm(false); loadCases(); setSaving(false)
  }

  async function updateStatus(id, status) {
    await api.patch(`/cases/${id}/status`, { status })
    loadCases()
  }

  const filtered = cases.filter(c => {
    const matchFilter = filter === 'all' || c.status === filter
    const matchSearch = !search || [c.crime_type, c.fir_number, c.location, c.complainant_name]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    return matchFilter && matchSearch
  })

  const statusCounts = Object.fromEntries(
    Object.keys(STATUS_CONFIG).map(k => [k, cases.filter(c => c.status === k).length])
  )

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', animation: 'fadeUp 0.4s ease' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderOpen size={18} color="#fbbf24" />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>Case Management</h1>
          </div>
          <p style={{ fontSize: '11px', color: '#475569', margin: 0, letterSpacing: '0.04em' }}>Track, update, and manage all investigation case files</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '10px 18px', borderRadius: '12px',
          background: showForm ? 'rgba(30,41,59,0.6)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: `1px solid ${showForm ? 'rgba(30,41,59,0.8)' : 'transparent'}`,
          color: showForm ? '#64748b' : '#0c0800',
          fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
          cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: showForm ? 'none' : '0 4px 20px rgba(245,158,11,0.3)'
        }}>
          {showForm ? <><X size={13} />Cancel</> : <><Plus size={13} />New Case</>}
        </button>
      </div>

      {/* Status summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px', animation: 'fadeUp 0.4s ease 0.1s both' }}>
        {Object.entries(STATUS_CONFIG).map(([key, s]) => (
          <button key={key} onClick={() => setFilter(filter === key ? 'all' : key)} style={{
            background: filter === key ? s.bg : 'rgba(10,17,34,0.6)',
            border: `1px solid ${filter === key ? s.border : 'rgba(30,41,59,0.7)'}`,
            borderRadius: '12px', padding: '12px 16px', cursor: 'pointer',
            transition: 'all 0.2s', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: filter === key ? `0 4px 20px ${s.bg}` : 'none'
          }}>
            <div>
              <p style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 4px' }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 900, color: filter === key ? s.color : '#64748b', fontFamily: 'monospace', margin: 0, transition: 'color 0.2s' }}>{statusCounts[key] || 0}</p>
            </div>
            <span style={{ fontSize: '18px' }}>{s.icon}</span>
          </button>
        ))}
      </div>

      {/* New Case Form */}
      {showForm && (
        <div style={{
          background: 'rgba(10,17,34,0.9)', border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: '16px', padding: '24px', marginBottom: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02)',
          animation: 'slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1)'
        }}>
          <div style={{ height: '2px', background: 'linear-gradient(90deg, #f59e0b, #d97706, transparent)', borderRadius: '2px', marginBottom: '20px' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px' }}>Register New Case</h3>
          <p style={{ fontSize: '10px', color: '#475569', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fill in case details below</p>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <FormField label="FIR Number"         value={form.fir_number}          onChange={e => setForm({...form, fir_number: e.target.value})} />
              <FormField label="Crime Type"          value={form.crime_type}          onChange={e => setForm({...form, crime_type: e.target.value})} />
              <FormField label="Location"            value={form.location}            onChange={e => setForm({...form, location: e.target.value})} />
              <FormField label="Complainant Name"    value={form.complainant_name}    onChange={e => setForm({...form, complainant_name: e.target.value})} />
              <FormField label="Complainant Contact" value={form.complainant_contact} onChange={e => setForm({...form, complainant_contact: e.target.value})} />
              <FormField label="Vehicle Involved"    value={form.vehicle_involved}    onChange={e => setForm({...form, vehicle_involved: e.target.value})} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', marginBottom: '6px' }}>Description</label>
              <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'rgba(2,6,23,0.7)', border: '1px solid rgba(30,41,59,0.8)', borderRadius: '10px', color: '#f1f5f9', fontSize: '12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <button type="submit" disabled={saving} style={{
              padding: '11px 28px', borderRadius: '10px',
              background: saving ? 'rgba(30,41,59,0.6)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none', color: saving ? '#475569' : '#0c0800',
              fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(245,158,11,0.3)'
            }}>
              {saving ? 'Saving...' : '✓ Save Case Record'}
            </button>
          </form>
        </div>
      )}

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', animation: 'fadeUp 0.4s ease 0.2s both' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={13} color="#475569" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocusedSearch(true)} onBlur={() => setFocusedSearch(false)}
            placeholder="Search by crime type, FIR, location..."
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 36px',
              background: focusedSearch ? 'rgba(251,191,36,0.04)' : 'rgba(10,17,34,0.8)',
              border: `1px solid ${focusedSearch ? 'rgba(251,191,36,0.4)' : 'rgba(30,41,59,0.8)'}`,
              borderRadius: '10px', color: '#f1f5f9', fontSize: '12px', outline: 'none',
              transition: 'all 0.2s', fontFamily: 'inherit'
            }}
          />
        </div>
        <button onClick={() => setFilter('all')} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
          background: filter === 'all' ? 'rgba(251,191,36,0.1)' : 'rgba(10,17,34,0.8)',
          border: `1px solid ${filter === 'all' ? 'rgba(251,191,36,0.3)' : 'rgba(30,41,59,0.8)'}`,
          borderRadius: '10px', color: filter === 'all' ? '#fbbf24' : '#475569',
          fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
        }}>
          <Filter size={12} />All Cases ({cases.length})
        </button>
      </div>

      {/* Cases list */}
      <div style={{
        background: 'rgba(10,17,34,0.7)', border: '1px solid rgba(30,41,59,0.7)',
        borderRadius: '16px', overflow: 'hidden', animation: 'fadeUp 0.4s ease 0.3s both'
      }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 120px', gap: '0', padding: '10px 20px', borderBottom: '1px solid rgba(30,41,59,0.6)', background: 'rgba(2,6,23,0.5)' }}>
          {['Crime Type / FIR', 'Complainant', 'Location', 'Date', 'Status'].map(h => (
            <span key={h} style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#334155' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(30,41,59,0.5)', borderTopColor: '#fbbf24', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '12px', color: '#334155', margin: 0 }}>Loading case files...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <FolderOpen size={32} color="#1e293b" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: '12px', color: '#334155', margin: 0 }}>{search || filter !== 'all' ? 'No cases match your filter.' : 'No cases recorded yet.'}</p>
          </div>
        ) : filtered.map((c, i) => (
          <div key={c.id} style={{
            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 120px',
            gap: '0', padding: '14px 20px',
            borderBottom: '1px solid rgba(30,41,59,0.4)',
            transition: 'background 0.15s',
            animation: `fadeSlide 0.25s ease ${Math.min(i, 5) * 50}ms both`
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,41,59,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{c.crime_type || '—'}</p>
              <p style={{ fontSize: '9px', color: '#475569', fontFamily: 'monospace', margin: '2px 0 0' }}>{c.fir_number || 'No FIR Number'}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{c.complainant_name || '—'}</p>
              <p style={{ fontSize: '9px', color: '#334155', margin: '2px 0 0', fontFamily: 'monospace' }}>{c.complainant_contact || ''}</p>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 'auto 0' }}>{c.location || '—'}</p>
            <p style={{ fontSize: '9px', color: '#334155', fontFamily: 'monospace', margin: 'auto 0' }}>
              {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <select value={c.status} onChange={e => updateStatus(c.id, e.target.value)} style={{
                  appearance: 'none', background: STATUS_CONFIG[c.status]?.bg || 'rgba(30,41,59,0.4)',
                  border: `1px solid ${STATUS_CONFIG[c.status]?.border || 'rgba(30,41,59,0.6)'}`,
                  borderRadius: '6px', padding: '4px 24px 4px 8px',
                  color: STATUS_CONFIG[c.status]?.color || '#94a3b8',
                  fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  cursor: 'pointer', outline: 'none'
                }}>
                  {Object.entries(STATUS_CONFIG).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                </select>
                <ChevronDown size={9} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: STATUS_CONFIG[c.status]?.color || '#94a3b8' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        input::placeholder, textarea::placeholder { color:#1e293b !important; }
        select option { background:#0f172a; }
      `}</style>
    </div>
  )
}
