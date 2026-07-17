import { useEffect, useState } from 'react'
import { Shield, BadgeCheck, Mail, MapPin, KeyRound, Printer, Award, ShieldAlert, Fingerprint } from 'lucide-react'
import api from '../api/client.js'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        setProfile(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(30,41,59,0.5)', borderTopColor: '#fbbf24', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        RETRIEVING SECURITY DOSSIER CREDENTIALS...
        <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ maxWidth: '400px', margin: '60px auto', padding: '24px', textAlign: 'center', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', color: '#fca5a5', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>
        <ShieldAlert size={28} style={{ color: '#ef4444', margin: '0 auto 12px', display: 'block' }} />
        <p style={{ fontWeight: 700, margin: '0 0 6px' }}>CLEARANCE FAILURE</p>
        <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>Error loading secure session credentials. Please log in again.</p>
      </div>
    )
  }

  const isAdmin = profile.role === 'admin'
  const accent = isAdmin ? '#a78bfa' : '#fbbf24'
  const accentGlow = isAdmin ? 'rgba(167,139,250,0.15)' : 'rgba(251,191,36,0.12)'

  return (
    <div className="profile-container" style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }} className="print-hidden">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Shield size={18} color={accent} />
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>Officer Credentials</h1>
          </div>
          <p style={{ fontSize: '11px', color: '#475569', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Verified command network identification profile</p>
        </div>
        <button 
          onClick={() => window.print()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '12px',
            background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
            color: '#e2e8f0', fontSize: '11px', fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.background = 'rgba(10,17,34,0.8)' }}>
          <Printer size={13} /> Print Command ID Card
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="profile-grid">
        
        {/* Left Side: Cyber Police Badge / ID Card */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '100%', maxWidth: '340px', aspectRatio: '1 / 1.6',
            background: 'rgba(10,17,34,0.9)', border: '1px solid rgba(30,41,59,0.9)',
            borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: `0 30px 70px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
            position: 'relative'
          }} className="id-card">
            
            {/* Top gradient status strip */}
            <div style={{ height: '4px', background: `linear-gradient(90deg, ${accent}, #1e3a8a, ${accent})` }} />

            {/* Holographic Seal */}
            <div style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'radial-gradient(circle, #22d3ee, #3b82f6, #f59e0b)',
              opacity: 0.7, mixBlendMode: 'screen', filter: 'blur(0.5px)',
              boxShadow: '0 0 12px rgba(34,211,238,0.4)', animation: 'holoPulse 3s infinite ease-in-out'
            }} />

            {/* Banner Header */}
            <div style={{ textAlign: 'center', padding: '20px 20px 14px', borderBottom: '1px solid rgba(30,41,59,0.5)', background: 'rgba(2,6,23,0.3)' }}>
              <span style={{ display: 'block', fontSize: '9px', fontWeight: 900, letterSpacing: '0.22em', color: '#475569', textTransform: 'uppercase' }}>GVAK Police Command</span>
              <span style={{ display: 'block', fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', color: '#f1f5f9', textTransform: 'uppercase', marginTop: '3px' }}>AI Security Badge</span>
              <span style={{ display: 'inline-block', fontSize: '7px', fontWeight: 700, letterSpacing: '0.08em', color: accent, textTransform: 'uppercase', background: `${accentGlow}`, border: `1px solid ${accent}33`, padding: '2px 8px', borderRadius: '4px', marginTop: '6px' }}>SYSTEM OPERATIONAL</span>
            </div>

            {/* Card Content Profile Avatar Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
              
              {/* Photo Box container */}
              <div style={{ position: 'relative', marginBottom: '18px' }}>
                <div style={{
                  width: '96px', height: '96px', borderRadius: '16px',
                  background: 'rgba(2,6,23,0.8)', border: `2px solid ${accent}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)', overflow: 'hidden', position: 'relative'
                }}>
                  <span style={{ fontSize: '40px', fontWeight: 900, color: '#94a3b8', fontFamily: 'monospace' }}>{profile.full_name[0]}</span>
                  {/* Holographic Laser Sweep */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, top: 0, height: '2px',
                    background: '#22d3ee', boxShadow: '0 0 8px #22d3ee',
                    animation: 'laserScan 3s infinite linear'
                  }} />
                </div>
                {/* Overlay status badge icon */}
                <div style={{
                  position: 'absolute', bottom: '-4px', right: '-4px',
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: '#0a1122', border: '1px solid rgba(30,41,59,0.8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: accent
                }}>
                  <Award size={13} />
                </div>
              </div>

              {/* Identification Titles */}
              <div style={{ textAlign: 'center', width: '100%', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', margin: '0 0 3px' }}>{profile.full_name}</h3>
                <p style={{ fontSize: '9px', fontFamily: 'monospace', color: '#475569', margin: 0, letterSpacing: '0.06em' }}>BADGE ID: {profile.badge_number}</p>
                <div style={{ marginTop: '8px' }}>
                  <span style={{
                    fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: accent, background: accentGlow, border: `1px solid ${accent}33`,
                    padding: '3px 10px', borderRadius: '5px'
                  }}>{profile.rank || (isAdmin ? 'DGP' : 'Officer')}</span>
                </div>
              </div>

              {/* Technical Chip Properties */}
              <div style={{
                width: '100%', background: 'rgba(2,6,23,0.5)', border: '1px solid rgba(30,41,59,0.6)',
                borderRadius: '12px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px'
              }}>
                {[
                  { key: 'STATION:', val: profile.station || 'HQ COMMAND' },
                  { key: 'DISTRICT:', val: profile.district || 'COMMAND ZONE' },
                  { key: 'CLEARANCE:', val: profile.role.toUpperCase(), color: accent }
                ].map(row => (
                  <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', fontFamily: 'monospace' }}>
                    <span style={{ color: '#475569' }}>{row.key}</span>
                    <span style={{ color: row.color || '#94a3b8', fontWeight: 750 }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Encrypted Barcode Strip at bottom */}
            <div style={{
              padding: '16px 20px', borderTop: '1px solid rgba(30,41,59,0.5)',
              background: 'rgba(2,6,23,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
              {/* Render CSS barcode layout */}
              <div style={{ display: 'flex', gap: '2px', height: '24px', width: '100%', justifyContent: 'center', opacity: 0.6 }}>
                {[6, 2, 4, 1, 8, 3, 2, 5, 1, 6, 2, 4, 1, 8, 3, 2, 5, 1, 4, 2, 7].map((w, idx) => (
                  <div key={idx} style={{ width: `${w}px`, background: '#94a3b8', height: '100%', shrink: 0 }} />
                ))}
              </div>
              <span style={{ fontSize: '7px', fontFamily: 'monospace', letterSpacing: '0.12em', color: '#475569', marginTop: '6px', textTransform: 'uppercase' }}>ENCRYPTED RFID DIGITAL SIGNATURE</span>
            </div>

          </div>
        </div>

        {/* Right Side: Security Clearance details */}
        <div className="profile-details-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{
            background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
            borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            {/* Block header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(30,41,59,0.6)', background: 'rgba(2,6,23,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Security Dossier Registry</h3>
                <p style={{ fontSize: '9px', color: '#475569', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Official active credentials verified by GVAK</p>
              </div>
              <Fingerprint size={18} color={accent} />
            </div>

            {/* List Rows */}
            <div style={{ padding: '0 20px' }}>
              {[
                { icon: Award, label: 'Official Rank Designation', val: profile.rank ? `${profile.rank.toUpperCase()} (GVAK)` : 'OFFICER (GVAK)', color: accent },
                { icon: BadgeCheck, label: 'Access Clearance Level', val: profile.role.toUpperCase(), color: accent },
                { icon: Mail, label: 'Official Email Account', val: profile.email || 'N/A' },
                { icon: MapPin, label: 'Designated Police Station', val: profile.station || 'HQ Command Headquarters' },
                { icon: MapPin, label: 'Assigned District Zone', val: profile.district || 'Command Zone' },
                { icon: KeyRound, label: 'Terminal Token Status', val: 'ACTIVE SECURE JWT SESSION', color: '#34d399' }
              ].map((row, index) => {
                const RowIcon = row.icon
                return (
                  <div key={index} style={{
                    padding: '16px 0', borderBottom: index < 5 ? '1px solid rgba(30,41,59,0.4)' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <RowIcon size={14} color="#475569" />
                      <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569' }}>{row.label}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: row.color || '#e2e8f0' }}>{row.val}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Secure Warning Alert Card */}
          <div style={{
            background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: '14px', padding: '16px', display: 'flex', gap: '12px'
          }} className="print-hidden">
            <ShieldAlert size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Classified Access Protocol</h4>
              <p style={{ fontSize: '10px', color: '#475569', margin: 0, lineHeight: 1.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Information contained within this profile portal is restricted to authorized personnel only. Access logging is active. Unauthorized extraction of officer credentials violates cyber security policy framework.
              </p>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes laserScan {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        @keyframes holoPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; filter: hue-rotate(0deg); }
          50% { transform: scale(1.08); opacity: 0.8; filter: hue-rotate(180deg); }
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1.2fr 2fr;
          gap: 32px;
          align-items: start;
        }

        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Printable Media Styles */
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print-hidden {
            display: none !important;
          }
          .profile-grid {
            display: block !important;
          }
          .id-card {
            border: 1px solid #94a3b8 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            margin: 0 auto !important;
          }
          circle, rect, path {
            stroke: black !important;
          }
        }
      `}</style>

    </div>
  )
}
