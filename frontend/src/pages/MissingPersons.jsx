import { useEffect, useState } from 'react'
import { PlusCircle, Search, User, MapPin, Calendar, CheckCircle2, UserMinus, X, Info } from 'lucide-react'
import api from '../api/client.js'

function FormInput({ label, name, value, onChange, placeholder, type = 'text', required = false }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ flex: 1, minWidth: '120px' }}>
      <label style={{
        display: 'block', fontSize: '9px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        color: focused ? '#fbbf24' : '#475569', marginBottom: '6px', transition: 'color 0.2s'
      }}>{label} {required && '*'}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={placeholder} required={required}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '10px 12px',
          background: focused ? 'rgba(251,191,36,0.04)' : 'rgba(2,6,23,0.7)',
          border: `1px solid ${focused ? 'rgba(251,191,36,0.45)' : 'rgba(30,41,59,0.8)'}`,
          borderRadius: '10px', color: '#f1f5f9', fontSize: '12px', outline: 'none',
          transition: 'all 0.2s'
        }}
      />
    </div>
  )
}

export default function MissingPersons() {
  const [persons, setPersons] = useState([])
  const [filters, setFilters] = useState({ name: '', age: '', city: '' })
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '', age: '', gender: 'Male', last_seen: '',
    location: '', missing_date: '', photo_url: '',
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [focusedSearch, setFocusedSearch] = useState(null)

  async function fetchMissingPersons() {
    setLoading(true)
    try {
      const activeFilters = {}
      if (filters.name) activeFilters.name = filters.name
      if (filters.age) activeFilters.age = filters.age
      if (filters.city) activeFilters.city = filters.city
      
      const res = await api.get('/missing-persons/', { params: activeFilters })
      setPersons(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMissingPersons()
  }, [])

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value })
  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitLoading(true)
    try {
      await api.post('/missing-persons/', {
        ...form,
        age: parseInt(form.age),
      })
      setShowModal(false)
      setForm({ name: '', age: '', gender: 'Male', last_seen: '', location: '', missing_date: '', photo_url: '' })
      fetchMissingPersons()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px', animation: 'fadeUp 0.4s ease' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserMinus size={18} color="#fbbf24" />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>Missing Persons Registry</h1>
          </div>
          <p style={{ fontSize: '11px', color: '#475569', margin: 0, letterSpacing: '0.04em' }}>Register and lookup active tracing details for missing individual cases</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 18px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none', color: '#0c0800', fontSize: '11px', fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
          transition: 'all 0.25s', boxShadow: '0 4px 16px rgba(245,158,11,0.2)'
        }}>
          <PlusCircle size={14} /> Report Missing Person
        </button>
      </div>

      {/* Filter Bar Panel */}
      <div style={{
        background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
        borderRadius: '16px', padding: '20px', marginBottom: '28px',
        display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap',
        animation: 'fadeUp 0.4s ease 0.1s both'
      }}>
        <div style={{ flex: 1, display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
          <FormInput label="Name" name="name" value={filters.name} onChange={handleFilterChange} placeholder="Filter by name..." />
          <FormInput label="Age Limit" name="age" type="number" value={filters.age} onChange={handleFilterChange} placeholder="e.g. 25" />
          <FormInput label="Location Zone" name="city" value={filters.city} onChange={handleFilterChange} placeholder="e.g. Hyderabad" />
        </div>
        <button onClick={fetchMissingPersons} disabled={loading} style={{
          padding: '10px 24px', borderRadius: '10px',
          background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(30,41,59,0.8)',
          color: '#e2e8f0', fontSize: '11px', fontWeight: 700,
          cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px'
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.background = 'rgba(2,6,23,0.8)' }}>
          <Search size={13} /> {loading ? 'Searching...' : 'Search Dossier'}
        </button>
      </div>

      {/* Grid List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', animation: 'fadeUp 0.4s ease 0.2s both' }}>
        {persons.map((p, i) => (
          <div key={p.id} style={{
            background: 'rgba(10,17,34,0.85)', border: '1px solid rgba(30,41,59,0.8)',
            borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            transition: 'all 0.25s', animation: `fadeSlide 0.3s ease ${i * 40}ms both`
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.transform = 'translateY(-3px)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.transform = 'translateY(0)' }}>
            
            {/* Photo Wrap */}
            <div style={{ height: '180px', position: 'relative', background: '#020817', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
              <img
                src={p.photo_url || `https://ui-avatars.com/api/?name=${p.name.replace(' ', '+')}&background=10172a&color=fbbf24&size=150`}
                alt={p.name}
                style={{ height: '100%', width: '100%', objectCover: 'cover' }}
              />
              <span style={{
                position: 'absolute', top: '12px', right: '12px',
                fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: p.status === 'Missing' ? '#f87171' : '#34d399',
                background: p.status === 'Missing' ? 'rgba(239,68,68,0.08)' : 'rgba(52,211,153,0.08)',
                border: `1px solid ${p.status === 'Missing' ? 'rgba(239,68,68,0.25)' : 'rgba(52,211,153,0.25)'}`,
                padding: '3px 8px', borderRadius: '4px'
              }}>{p.status}</span>
            </div>

            {/* Body */}
            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 850, color: '#f1f5f9', margin: '0 0 4px' }}>{p.name}</h3>
                <p style={{ fontSize: '9px', fontFamily: 'monospace', color: '#475569', margin: 0, textTransform: 'uppercase' }}>
                  ID: {p.missing_id} · {p.age} Yrs · {p.gender}
                </p>
                
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#cbd5e1' }}>
                    <MapPin size={11} color="#64748b" style={{ shrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Seen: {p.last_seen || 'N/A'} ({p.location})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#64748b' }}>
                    <Calendar size={11} color="#64748b" style={{ shrink: 0 }} />
                    <span>Missing Since: {p.missing_date ? new Date(p.missing_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ))}

        {persons.length === 0 && !loading && (
          <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '60px 20px', background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)', borderRadius: '16px' }}>
            <User size={32} color="#475569" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>No missing person records found matching search filters.</p>
          </div>
        )}
      </div>

      {/* Modal Dialog Form */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(4px)', padding: '16px'
        }}>
          <div style={{
            background: 'rgba(10,17,34,0.95)', border: '1px solid rgba(30,41,59,0.9)',
            borderRadius: '20px', maxWidth: '500px', width: '100%', overflow: 'hidden',
            boxShadow: '0 30px 70px rgba(0,0,0,0.6)', animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            {/* Modal header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,41,59,0.6)', background: 'rgba(2,6,23,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f1f5f9', margin: 0 }}>Report Missing Tracer</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#475569', fontSize: '18px', cursor: 'pointer', outline: 'none' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="form-cols">
                <FormInput label="Full Name" name="name" required value={form.name} onChange={handleFormChange} />
                <FormInput label="Age" name="age" type="number" required value={form.age} onChange={handleFormChange} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="form-cols">
                <div>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', marginBottom: '6px' }}>Gender</label>
                  <select
                    name="gender" value={form.gender} onChange={handleFormChange}
                    style={{ width: '100%', padding: '10px 10px', background: 'rgba(2,6,23,0.7)', border: '1px solid rgba(30,41,59,0.8)', borderRadius: '10px', color: '#f1f5f9', fontSize: '12px', outline: 'none' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <FormInput label="Missing Date" name="missing_date" type="date" value={form.missing_date} onChange={handleFormChange} />
              </div>

              <FormInput label="Last Seen Area / Landmark" name="last_seen" placeholder="e.g. Near bus terminal" value={form.last_seen} onChange={handleFormChange} />
              <FormInput label="District Zone / City" name="location" required placeholder="e.g. Hyderabad PS limits" value={form.location} onChange={handleFormChange} />
              <FormInput label="Photo URL (Optional)" name="photo_url" placeholder="Link to photo dossier..." value={form.photo_url} onChange={handleFormChange} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(30,41,59,0.5)' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '9px 18px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(30,41,59,0.8)', color: '#94a3b8', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitLoading} style={{
                  padding: '9px 24px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none', color: '#0c0800', fontSize: '11px', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(245,158,11,0.2)'
                }}>{submitLoading ? 'Registering...' : 'Register Tracer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        
        select option { background:#0f172a; }
        
        @media (max-width: 600px) {
          .form-cols {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}
