import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Eye, EyeOff, ArrowLeft, Mail, KeyRound,
  User, Building2, MapPin, AlertTriangle, CheckCircle2, Fingerprint
} from 'lucide-react'
import api from '../api/client.js'
import { useUser } from '../contexts/UserContext.jsx'

/* ─────────────────────────────────────────────
   BOOT SCREEN (Minimal, Premium Mobile Splash)
   ───────────────────────────────────────────── */
function BootScreen({ onDone }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const duration = 1600 // 1.6 seconds smooth load
    let raf
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setTimeout(onDone, 300)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #050a18 0%, #02040a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, fontFamily: "'Inter', sans-serif",
      color: '#f1f5f9'
    }}>
      {/* Background soft glowing circle */}
      <div style={{
        position: 'absolute', width: '250px', height: '250px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)',
        filter: 'blur(30px)', pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Sleek pulsing shield */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '24px', animation: 'bootPulse 2s ease-in-out infinite',
          boxShadow: '0 8px 32px rgba(251,191,36,0.05)'
        }}>
          <Shield size={36} color="#fbbf24" strokeWidth={1.5} />
        </div>

        <p style={{
          fontSize: '11px', fontWeight: 800, color: '#fbbf24',
          letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: '8px'
        }}>
          GVAK Police Network
        </p>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '32px', fontWeight: 500 }}>
          Securing Connections...
        </p>

        {/* Premium loader line */}
        <div style={{
          width: '180px', height: '3px', background: 'rgba(255,255,255,0.08)',
          borderRadius: '2px', overflow: 'hidden', position: 'relative'
        }}>
          <div style={{
            width: `${progress * 100}%`, height: '100%',
            background: 'linear-gradient(90deg, #d97706, #fbbf24)',
            borderRadius: '2px', transition: 'width 0.1s linear'
          }} />
        </div>
      </div>
      <style>{`
        @keyframes bootPulse {
          0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 8px 32px rgba(251,191,36,0.05); }
          50% { transform: scale(1.05); opacity: 0.85; box-shadow: 0 8px 48px rgba(251,191,36,0.15); }
        }
      `}</style>
    </div>
  )
}

/* ─────────────────────────────────────────────
   AUTH PROGRESS (Clean, Minimalist Spinner)
   ───────────────────────────────────────────── */
function AuthProgress({ steps, currentStep }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(2,6,18,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.25s ease'
    }}>
      <div style={{
        background: '#090d16', border: '1px solid rgba(251,191,36,0.15)',
        borderRadius: '16px', padding: '32px 40px', width: '320px',
        textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
          border: '3px solid rgba(251,191,36,0.1)', borderTopColor: '#fbbf24',
          animation: 'spin 0.8s linear infinite'
        }} />
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>Securing Session</h3>
        <p style={{ fontSize: '11px', color: '#475569', margin: 0, fontFamily: 'monospace' }}>{steps[currentStep]}</p>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   CLEAN FIELD
   ───────────────────────────────────────────── */
function Field({ label, icon: Icon, type = 'text', value, onChange, placeholder, required, disabled }) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontSize: '10px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: focused ? '#fbbf24' : '#64748b',
        transition: 'color 0.2s'
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: '0 auto 0 0', paddingLeft: '14px',
          display: 'flex', alignItems: 'center', pointerEvents: 'none',
          color: focused ? '#fbbf24' : '#475569', transition: 'color 0.2s'
        }}><Icon size={15} /></div>
        <input
          type={isPass ? (show ? 'text' : 'password') : type}
          value={value} onChange={onChange} required={required} disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', boxSizing: 'border-box',
            paddingLeft: '42px', paddingRight: isPass ? '42px' : '14px',
            paddingTop: '12px', paddingBottom: '12px',
            background: 'rgba(2,6,18,0.7)',
            border: `1px solid ${focused ? '#fbbf24' : 'rgba(51,65,85,0.7)'}`,
            borderRadius: '10px', color: '#f1f5f9',
            fontSize: '13px', outline: 'none', transition: 'all 0.2s',
            boxShadow: focused ? '0 0 0 3px rgba(251,191,36,0.06)' : 'none'
          }}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)} style={{
            position: 'absolute', inset: '0 0 0 auto', paddingRight: '14px',
            background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center'
          }}>{show ? <EyeOff size={14} /> : <Eye size={14} />}</button>
        )}
      </div>
    </div>
  )
}

function GhostBtn({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', fontSize: '11px', fontWeight: 600,
      color: '#64748b', cursor: 'pointer', transition: 'color 0.2s'
    }}
      onMouseEnter={e => e.currentTarget.style.color = '#fbbf24'}
      onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
      {children}
    </button>
  )
}

const AUTH_STEPS = [
  'Verifying identity...',
  'Checking clearance...',
  'Validating token...',
  'Establishing connection...'
]

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
export default function Login() {
  const { setUser } = useUser()
  const [booting, setBooting] = useState(true)
  const [authStep, setAuthStep] = useState(-1)
  const [mode, setMode] = useState('login')
  const [badgeNumber, setBadgeNumber] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [station, setStation] = useState('')
  const [rank, setRank] = useState('PC')
  const [jurisdiction, setJurisdiction] = useState('Telangana')
  const [district, setDistrict] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState(new Date())
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const navigate = useNavigate()

  useEffect(() => {
    function handleResize() { setIsMobile(window.innerWidth < 640) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])

  const reset = () => { setError(''); setSuccess('') }

  async function runAuthAnimation(fn) {
    setLoading(true); setAuthStep(0)
    const delays = [400, 450, 450, 300]
    for (let i = 0; i < AUTH_STEPS.length; i++) {
      setAuthStep(i)
      await new Promise(r => setTimeout(r, delays[i]))
    }
    try { await fn() }
    catch (e) { throw e }
    finally { setAuthStep(-1); setLoading(false) }
  }

  async function handleLogin(e) {
    e.preventDefault(); reset()
    try {
      await runAuthAnimation(async () => {
        const res = await api.post('/auth/login', { badge_number: badgeNumber, password })
        if (res.data.status === 'otp_required') {
          if (res.data.email) setEmail(res.data.email)
          setMode('verify'); setError('OTP dispatched to your registered email.')
        } else {
          const token = res.data.access_token
          localStorage.setItem('token', token)
          const me = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
          localStorage.setItem('role', me.data.role)
          localStorage.setItem('name', me.data.full_name)
          setUser({ token, role: me.data.role, name: me.data.full_name })
          navigate('/')
        }
      })
    } catch (err) { setError(err.response?.data?.detail || 'Authentication failed.') }
  }

  async function handleRegister(e) {
    e.preventDefault(); reset(); setLoading(true)
    try {
      await api.post('/auth/register', { badge_number: badgeNumber, full_name: fullName, email, password, station, rank, state: jurisdiction, district, role: 'officer' })
      setSuccess('OTP dispatched to your email.'); setMode('verify')
    } catch (err) { setError(err.response?.data?.detail || 'Registration failed.') }
    finally { setLoading(false) }
  }

  async function handleVerify(e) {
    e.preventDefault(); reset(); setLoading(true)
    try {
      await api.post('/auth/verify-otp', { email, otp: otpCode, badge_number: badgeNumber, full_name: fullName, password, station, rank, state: jurisdiction, district })
      setSuccess('Account activated!'); setMode('login'); setPassword('')
    } catch (err) { setError(err.response?.data?.detail || 'Verification failed.') }
    finally { setLoading(false) }
  }

  async function handleForgot(e) {
    e.preventDefault(); reset(); setLoading(true)
    try { await api.post('/auth/forgot-password', { email }); setSuccess('Reset code dispatched.'); setMode('reset') }
    catch (err) { setError(err.response?.data?.detail || 'Failed.') }
    finally { setLoading(false) }
  }

  async function handleReset(e) {
    e.preventDefault(); reset(); setLoading(true)
    try { await api.post('/auth/reset-password', { email, otp: otpCode, new_password: newPassword }); setSuccess('Password updated!'); setMode('login') }
    catch (err) { setError(err.response?.data?.detail || 'Reset failed.') }
    finally { setLoading(false) }
  }

  if (booting) return <BootScreen onDone={() => setBooting(false)} />

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif", position: 'relative', overflow: 'hidden'
    }}>
      {/* GVAK Police Background Image */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'url(/police-bg.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0
      }} />
      
      {/* Sleek, solid Government-style dark blue backdrop filter overlay */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(circle, rgba(5,11,28,0.78) 0%, rgba(2,6,18,0.92) 100%)',
        zIndex: 1
      }} />

      {/* Auth progress overlay */}
      {authStep >= 0 && <AuthProgress steps={AUTH_STEPS} currentStep={authStep} />}

      {/* Top clean status bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '14px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(2,6,18,0.6)', backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="#fbbf24" />
          <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 800, letterSpacing: '0.08em' }}>GVAK SECURE ACCESS</span>
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
          {time.toLocaleTimeString('en-IN', { hour12: false })} IST
        </div>
      </div>

      {/* Center login box wrapper */}
      <div style={{
        position: 'relative', zIndex: 5, width: '100%', maxWidth: '440px',
        margin: isMobile ? '80px 16px 24px' : '90px 24px 24px',
        animation: 'fadeIn 0.4s ease'
      }}>
        
        {/* Main Card (Glassmorphic) */}
        <div style={{
          background: 'rgba(9,15,30,0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', backdropFilter: 'blur(24px)', overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
        }}>
          {/* Subtle top gold highlight */}
          <div style={{ height: '3px', background: 'linear-gradient(90deg, #d97706, #fbbf24, #d97706)' }} />
          
          <div style={{ padding: isMobile ? '28px 24px' : '36px 40px' }}>
            
            {/* Logo and Welcome header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(251,191,36,0.05)'
              }}>
                <Shield size={30} color="#fbbf24" strokeWidth={1.5} />
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                Officer Command Console
              </h1>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                Intelligent Police Assistant & Records System
              </p>
            </div>

            {/* Error & Success alerts */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '11.5px' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, color: '#ef4444' }} />{error}
              </div>
            )}
            {success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#6ee7b7', fontSize: '11.5px' }}>
                <CheckCircle2 size={14} style={{ flexShrink: 0, color: '#10b981' }} />{success}
              </div>
            )}

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Field label="Badge ID" icon={Fingerprint} value={badgeNumber} onChange={e => setBadgeNumber(e.target.value)} placeholder="e.g. TG-1001" required />
                <Field label="Password" icon={KeyRound} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" required />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <GhostBtn onClick={() => { setMode('forgot'); reset() }}>Forgot Password?</GhostBtn>
                  <GhostBtn onClick={() => { setMode('register'); reset(); setBadgeNumber('') }}>Register Account</GhostBtn>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none', borderRadius: '10px', color: '#090d16',
                    padding: '13px 20px', fontSize: '12px', fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 4px 16px rgba(245,158,11,0.2)', transition: 'transform 0.15s'
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
                >
                  <Shield size={14} /> Sign In to Console
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <Field label="Full Name" icon={User} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Srinivas Reddy" required />
                  <Field label="Badge ID" icon={Fingerprint} value={badgeNumber} onChange={e => setBadgeNumber(e.target.value)} placeholder="TG-1002" required />
                </div>
                <Field label="Email Address" icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="officer@tsp.gov.in" required />
                <Field label="Security Password" icon={KeyRound} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose strong password" required />
                
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <Field label="Police Station" icon={Building2} value={station} onChange={e => setStation(e.target.value)} placeholder="Banjara Hills PS" required />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Rank</label>
                    <select value={rank} onChange={e => setRank(e.target.value)} style={{ width: '100%', padding: '12px 10px', background: 'rgba(2,6,18,0.7)', border: '1px solid rgba(51,65,85,0.7)', borderRadius: '10px', color: '#f1f5f9', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                      {['DGP','ADGP','IGP','DIG','SP','Addl. SP','DSP','ASP','CI','SI','ASI','HC','PC'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <Field label="District" icon={MapPin} value={district} onChange={e => setDistrict(e.target.value)} placeholder="Hyderabad" required />
                  <Field label="Jurisdiction" icon={MapPin} value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} placeholder="India" disabled />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '4px' }}>
                  <GhostBtn onClick={() => setMode('login')}>← Back to Sign In</GhostBtn>
                </div>
                
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none', borderRadius: '10px', color: '#090d16',
                    padding: '13px 20px', fontSize: '12px', fontWeight: 800,
                    cursor: 'pointer', letterSpacing: '0.04em', marginTop: '10px'
                  }}
                >
                  Create Account
                </button>
              </form>
            )}

            {/* VERIFY OTP FORM */}
            {mode === 'verify' && (
              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                    Enter verification code dispatched to <span style={{ color: '#fbbf24', fontWeight: 600 }}>{email}</span>
                  </p>
                </div>
                <Field label="6-Digit OTP Code" icon={Mail} value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="------" required />
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none', borderRadius: '10px', color: '#090d16',
                    padding: '13px 20px', fontSize: '12px', fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Verify & Activate
                </button>
                <div style={{ textAlign: 'center' }}>
                  <GhostBtn onClick={() => setMode('login')}>Back to Sign In</GhostBtn>
                </div>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                  Enter your registered email address. We will dispatch a temporary recovery code to verify your identity.
                </p>
                <Field label="Email Address" icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="officer@tsp.gov.in" required />
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none', borderRadius: '10px', color: '#090d16',
                    padding: '13px 20px', fontSize: '12px', fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Send Recovery Code
                </button>
                <div style={{ textAlign: 'center' }}>
                  <GhostBtn onClick={() => setMode('login')}>← Back to Sign In</GhostBtn>
                </div>
              </form>
            )}

            {/* RESET PASSWORD FORM */}
            {mode === 'reset' && (
              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Field label="Recovery Code" icon={Mail} value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="Enter code" required />
                <Field label="New Password" icon={KeyRound} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new strong password" required />
                
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none', borderRadius: '10px', color: '#090d16',
                    padding: '13px 20px', fontSize: '12px', fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Save & Update Password
                </button>
              </form>
            )}

          </div>
        </div>

        {/* Bottom Clean Citizen Portal quick redirect */}
        <div style={{
          marginTop: '20px', padding: '16px 20px',
          background: 'rgba(9,15,30,0.8)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', backdropFilter: 'blur(20px)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px'
        }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 2px' }}>Public Citizen Portal</p>
            <p style={{ fontSize: '9.5px', color: '#64748b', margin: 0 }}>Report incident, check complaint status</p>
          </div>
          <button
            onClick={() => navigate('/citizen')}
            style={{
              padding: '8px 14px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#f1f5f9', fontSize: '10.5px', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          >
            Access Portal →
          </button>
        </div>

        {/* Footer copyright */}
        <p style={{ textAlign: 'center', fontSize: '9.5px', color: '#475569', marginTop: '24px', letterSpacing: '0.05em' }}>
          🔒 SECURE AUTHORISED ACCESS ONLY. ALL CONNECTIONS ARE MONITORED.
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: #334155 !important; }
        select option { background: #090d16; }
      `}</style>
    </div>
  )
}
