import { useState } from 'react'
import { Car, Search, CheckCircle2, AlertTriangle, HelpCircle, FileText, User, Calendar, ShieldCheck, CornerDownLeft } from 'lucide-react'
import api from '../api/client.js'

function DetailsRow({ icon: Icon, label, value, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: '1px solid rgba(30,41,59,0.4)' }}>
      <Icon size={14} color="#475569" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '8px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px' }}>{label}</p>
        <p style={{ fontSize: '12px', fontWeight: 650, color: highlight ? '#ef4444' : '#f1f5f9', margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}

export default function VehicleSearch() {
  const [plate, setPlate] = useState('')
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)
  const [focused, setFocused] = useState(false)

  async function handleVerify(e) {
    e.preventDefault()
    if (!plate.trim()) return

    setLoading(true)
    setError(null)
    setVehicle(null)
    try {
      const res = await api.get(`/vehicles/verify/${plate.trim().toUpperCase()}`)
      setVehicle(res.data)
      setSearched(true)
    } catch (err) {
      setSearched(true)
      if (err.response && err.response.status === 404) {
        setError("No verification records match this license plate number in the database.")
      } else {
        setError("An error occurred during verification query. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', animation: 'fadeUp 0.4s ease' }}>
        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Car size={18} color="#fbbf24" />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>Vehicle Verification Registry</h1>
          <p style={{ fontSize: '11px', color: '#475569', margin: 0, letterSpacing: '0.04em' }}>Check ownership logs, stolen flags, and incident history of license plate numbers</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px', alignItems: 'start' }} className="vehicle-grid">
        
        {/* Left Form Widget */}
        <div style={{
          background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
          borderRadius: '16px', padding: '24px', animation: 'fadeUp 0.4s ease 0.1s both'
        }}>
          <form onSubmit={handleVerify}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', marginBottom: '6px' }}>Enter Vehicle Plate Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text" required value={plate} onChange={e => setPlate(e.target.value)}
                  onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                  placeholder="e.g. AP09AB1002"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '12px 40px 12px 12px',
                    background: focused ? 'rgba(251,191,36,0.04)' : 'rgba(2,6,23,0.7)',
                    border: `1px solid ${focused ? 'rgba(251,191,36,0.45)' : 'rgba(30,41,59,0.8)'}`,
                    borderRadius: '10px', color: '#f1f5f9', fontSize: '14px', fontFamily: 'monospace',
                    fontWeight: 700, letterSpacing: '0.14em', outline: 'none', transition: 'all 0.2s',
                    textTransform: 'uppercase'
                  }}
                />
                <button type="submit" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
                  <Search size={15} />
                </button>
              </div>
              <p style={{ fontSize: '8px', color: '#334155', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Supports standard formats (e.g. TS09AB1234)</p>
            </div>

            <button
              type="submit" disabled={loading || !plate.trim()}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none', color: '#0c0800', fontSize: '11px', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
                transition: 'all 0.2s', opacity: (loading || !plate.trim()) ? 0.5 : 1,
                boxShadow: '0 4px 16px rgba(245,158,11,0.2)'
              }}>
              {loading ? 'Verifying Registry...' : 'Lookup Vehicle'}
            </button>
          </form>
        </div>

        {/* Right Info Dossier */}
        <div style={{ animation: 'fadeUp 0.4s ease 0.2s both' }}>
          {vehicle ? (
            <div style={{
              background: 'rgba(10,17,34,0.8)', border: `1px solid ${vehicle.status === 'Blacklisted' ? 'rgba(239,68,68,0.3)' : 'rgba(30,41,59,0.8)'}`,
              borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 36px rgba(0,0,0,0.25)'
            }}>
              
              {/* Colored status banner */}
              <div style={{
                padding: '20px 24px', borderBottom: '1px solid rgba(30,41,59,0.6)',
                background: vehicle.status === 'Blacklisted' ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.04)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
              }}>
                <div>
                  <span style={{
                    fontSize: '20px', fontWeight: 900, color: '#f1f5f9', letterSpacing: '0.12em',
                    fontFamily: 'monospace', background: '#020817', border: '1px solid rgba(30,41,59,0.9)',
                    padding: '6px 14px', borderRadius: '8px', display: 'inline-block'
                  }}>{vehicle.vehicle_number}</span>
                  <p style={{ fontSize: '10px', color: '#475569', margin: '8px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Type: {vehicle.vehicle_type} | zone: {vehicle.district}
                  </p>
                </div>
                <div>
                  {vehicle.status === 'Blacklisted' ? (
                    <span style={{
                      fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                      padding: '4px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px',
                      animation: 'pulse 2s infinite ease-in-out'
                    }}><AlertTriangle size={12} /> BLACKLISTED FLAG</span>
                  ) : (
                    <span style={{
                      fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: '#34d399', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                      padding: '4px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px'
                    }}><ShieldCheck size={12} /> VERIFIED REGISTRY</span>
                  )}
                </div>
              </div>

              {/* Vehicle Detail Rows */}
              <div style={{ padding: '8px 24px 24px' }}>
                <DetailsRow icon={User} label="Registered Owner" value={vehicle.owner_name} />
                <DetailsRow icon={Calendar} label="Registration Date" value={vehicle.registration_date || 'N/A'} />
                <DetailsRow icon={FileText} label="Database Offense History" value={`${vehicle.previous_complaints} cases logged`} highlight={vehicle.previous_complaints > 0} />
                
                {/* Warning message box */}
                {vehicle.previous_complaints > 0 && (
                  <div style={{
                    marginTop: '20px', padding: '16px', borderRadius: '12px',
                    background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.15)',
                    display: 'flex', gap: '10px'
                  }}>
                    <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Command Advisory Flag</h4>
                      <p style={{ fontSize: '10px', color: '#64748b', margin: 0, lineHeight: 1.5, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        This vehicle has registered complaints active in criminal records database. Cross-reference cases for charges. Approach vehicle stop intercepts with tactical awareness.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : error ? (
            <div style={{
              background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: '16px', padding: '24px', display: 'flex', gap: '12px'
            }}>
              <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#fca5a5', margin: '0 0 4px' }}>Registry Lookup Failed</h4>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{error}</p>
              </div>
            </div>
          ) : searched ? (
            <div style={{
              background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
              borderRadius: '16px', padding: '40px 20px', textAlign: 'center'
            }}>
              <HelpCircle size={36} color="#475569" style={{ margin: '0 auto 12px', display: 'block' }} />
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#e2e8f0', margin: '0 0 6px' }}>No Registry Match</h3>
              <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>This vehicle plate number was not found in the verified database. Verify character entries.</p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
              borderRadius: '16px', padding: '40px 20px', textAlign: 'center'
            }}>
              <Car size={36} color="#475569" style={{ margin: '0 auto 12px', display: 'block' }} />
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#e2e8f0', margin: '0 0 6px' }}>Awaiting License Input</h3>
              <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>Submit a vehicle plate number on the left panel to request verification credentials.</p>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        
        @media (max-width: 800px) {
          .vehicle-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}
