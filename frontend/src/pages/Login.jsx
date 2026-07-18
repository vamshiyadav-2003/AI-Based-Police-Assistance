import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Eye, EyeOff, ArrowLeft, Mail, KeyRound,
  User, Building2, MapPin, AlertTriangle, CheckCircle2, Fingerprint
} from 'lucide-react'
import api from '../api/client.js'
import { useUser } from '../contexts/UserContext.jsx'

/* ─────────────────────────────────────────────
   BOOT / SPLASH SCREEN
───────────────────────────────────────────── */
function BootScreen({ onDone }) {
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState(0)
  const steps = [
    'Initialising secure connection...',
    'Loading biometric modules...',
    'Verifying encryption keys...',
    'Establishing command channel...',
    'System ready.',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + Math.random() * 18 + 4
        if (next >= 100) { clearInterval(interval); setTimeout(onDone, 600); return 100 }
        return next
      })
    }, 200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setStep(Math.min(4, Math.floor((progress / 100) * steps.length)))
  }, [progress])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#020817',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, fontFamily: "'Courier New', monospace"
    }}>
      {/* Matrix rain */}
      <MatrixRain />

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        {/* Radar emblem */}
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 32px' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '1px solid rgba(251,191,36,0.2)',
            animation: 'pulse 2s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute', inset: -12, borderRadius: '50%',
            border: '1px solid rgba(251,191,36,0.1)',
            animation: 'pulse 2s ease-in-out infinite 0.4s'
          }} />
          <div style={{
            position: 'absolute', inset: -24, borderRadius: '50%',
            border: '1px solid rgba(251,191,36,0.05)',
            animation: 'pulse 2s ease-in-out infinite 0.8s'
          }} />
          {/* Radar sweep */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: '50%', height: '2px', transformOrigin: '0% 50%',
              background: 'linear-gradient(90deg, rgba(251,191,36,0.8), transparent)',
              animation: 'radarSweep 2s linear infinite',
              boxShadow: '0 0 8px rgba(251,191,36,0.4)'
            }} />
          </div>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'rgba(2,8,23,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(251,191,36,0.4)',
            boxShadow: '0 0 30px rgba(251,191,36,0.15), inset 0 0 20px rgba(251,191,36,0.05)'
          }}>
            <Shield size={44} color="#fbbf24" strokeWidth={1.5} />
          </div>
        </div>

        <p style={{ fontSize: '10px', color: '#fbbf24', letterSpacing: '0.3em', marginBottom: '6px', fontWeight: 700 }}>
          ◈ GVAK POLICE COMMAND ◈
        </p>
        <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#f1f5f9', letterSpacing: '0.05em', marginBottom: '32px' }}>
          IPARTS v2.0
        </h1>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: '4px', background: 'rgba(30,41,59,0.8)',
          borderRadius: '2px', marginBottom: '12px', overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: 'linear-gradient(90deg, #d97706, #fbbf24)',
            borderRadius: '2px', transition: 'width 0.2s ease',
            boxShadow: '0 0 10px rgba(251,191,36,0.5)'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '9px', color: '#475569', letterSpacing: '0.1em' }}>{steps[step]}</span>
          <span style={{ fontSize: '9px', color: '#fbbf24', fontWeight: 700 }}>{Math.round(progress)}%</span>
        </div>

        {/* Boot log */}
        <div style={{
          background: 'rgba(2,6,23,0.9)', border: '1px solid rgba(30,41,59,0.8)',
          borderRadius: '8px', padding: '12px 16px', textAlign: 'left'
        }}>
          {steps.slice(0, step + 1).map((s, i) => (
            <div key={i} style={{ fontSize: '9px', color: i === step ? '#10b981' : '#1e3a5f', marginBottom: '4px', letterSpacing: '0.06em' }}>
              <span style={{ color: '#fbbf24' }}>{'>'}</span> {s}
              {i === step && <span style={{ animation: 'blink 1s step-end infinite', marginLeft: '4px', color: '#fbbf24' }}>█</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MATRIX RAIN (canvas)
───────────────────────────────────────────── */
function MatrixRain() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const cols = Math.floor(canvas.width / 18)
    const drops = Array(cols).fill(1)
    const chars = 'TSPOLICEABCDEF0123456789@#$%&*'
    let raf
    function draw() {
      ctx.fillStyle = 'rgba(2,8,23,0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(251,191,36,0.15)'
      ctx.font = '12px monospace'
      drops.forEach((y, i) => {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 18, y * 18)
        if (y * 18 > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
}

/* ─────────────────────────────────────────────
   PARTICLE NETWORK (login bg)
───────────────────────────────────────────── */
function ParticleNet() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current, ctx = c.getContext('2d')
    c.width = window.innerWidth; c.height = window.innerHeight
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.3, a: Math.random() * 0.4 + 0.1
    }))
    let raf
    function draw() {
      ctx.clearRect(0, 0, c.width, c.height)
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(251,191,36,${p.a})`; ctx.fill()
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > c.width) p.vx *= -1
        if (p.y < 0 || p.y > c.height) p.vy *= -1
      })
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 130) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(251,191,36,${0.07 * (1 - d / 130)})`
            ctx.lineWidth = 0.5; ctx.stroke()
          }
        }
      raf = requestAnimationFrame(draw)
    }
    draw()
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

/* ─────────────────────────────────────────────
   TYPEWRITER
───────────────────────────────────────────── */
function Typewriter({ texts, speed = 80 }) {
  const [display, setDisplay] = useState('')
  const [tIdx, setTIdx] = useState(0)
  const [cIdx, setCIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    const t = texts[tIdx]
    const delay = deleting ? 40 : speed
    const timer = setTimeout(() => {
      if (!deleting) {
        setDisplay(t.slice(0, cIdx + 1))
        if (cIdx + 1 === t.length) setTimeout(() => setDeleting(true), 1800)
        else setCIdx(c => c + 1)
      } else {
        setDisplay(t.slice(0, cIdx - 1))
        if (cIdx - 1 === 0) { setDeleting(false); setTIdx(i => (i + 1) % texts.length); setCIdx(0) }
        else setCIdx(c => c - 1)
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [cIdx, deleting, tIdx])
  return (
    <span>
      {display}
      <span style={{ animation: 'blink 1s step-end infinite', color: '#fbbf24' }}>|</span>
    </span>
  )
}

/* ─────────────────────────────────────────────
   AUTH PROGRESS (login animation)
───────────────────────────────────────────── */
function AuthProgress({ steps, currentStep }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(2,8,23,0.92)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'rgba(10,17,34,0.95)', border: '1px solid rgba(251,191,36,0.2)',
        borderRadius: '20px', padding: '40px', width: '340px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(251,191,36,0.05)'
      }}>
        {/* Spinning shield */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto' }}>
            <div style={{
              position: 'absolute', inset: -8, borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: '#fbbf24', borderRightColor: 'rgba(251,191,36,0.3)',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Shield size={28} color="#fbbf24" />
            </div>
          </div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', margin: '16px 0 4px' }}>Authenticating</p>
          <p style={{ fontSize: '10px', color: '#475569', margin: 0, fontFamily: 'monospace' }}>{steps[currentStep]}</p>
        </div>
        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i < currentStep ? 'rgba(16,185,129,0.15)' : i === currentStep ? 'rgba(251,191,36,0.15)' : 'rgba(30,41,59,0.5)',
                border: `1px solid ${i < currentStep ? 'rgba(16,185,129,0.4)' : i === currentStep ? 'rgba(251,191,36,0.4)' : 'rgba(30,41,59,0.8)'}`,
                transition: 'all 0.3s'
              }}>
                {i < currentStep
                  ? <CheckCircle2 size={10} color="#10b981" />
                  : i === currentStep
                  ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', animation: 'pulse 1s ease-in-out infinite' }} />
                  : <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1e293b' }} />
                }
              </div>
              <span style={{
                fontSize: '10px', fontFamily: 'monospace',
                color: i < currentStep ? '#10b981' : i === currentStep ? '#fbbf24' : '#1e3a5f',
                transition: 'color 0.3s'
              }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   BADGE EMBLEM (with radar)
───────────────────────────────────────────── */
function BadgeEmblem() {
  return (
    <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto 28px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          position: 'absolute', inset: `${-i * 12}px`, borderRadius: '50%',
          border: `1px solid rgba(251,191,36,${0.12 / i})`,
          animation: `spin ${12 + i * 6}s linear infinite ${i % 2 ? '' : 'reverse'}`
        }} />
      ))}
      {/* Radar sweep */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', width: '50%', height: '2px',
          transformOrigin: '0% 50%',
          background: 'linear-gradient(90deg, rgba(251,191,36,0.9), transparent)',
          animation: 'radarSweep 3s linear infinite',
          boxShadow: '0 0 8px rgba(251,191,36,0.5)'
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'conic-gradient(from 0deg, rgba(251,191,36,0.06) 0deg, transparent 60deg)',
          animation: 'radarSweep 3s linear infinite'
        }} />
      </div>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, rgba(251,191,36,0.15), rgba(2,8,23,0.95))',
        border: '2px solid rgba(251,191,36,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 40px rgba(251,191,36,0.25), 0 0 80px rgba(251,191,36,0.08), inset 0 0 30px rgba(251,191,36,0.05)'
      }}>
        <Shield size={46} color="#fbbf24" strokeWidth={1.5} />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   RIPPLE BUTTON
───────────────────────────────────────────── */
function RippleBtn({ loading, children, onClick }) {
  const [ripples, setRipples] = useState([])
  function addRipple(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    const id = Date.now()
    setRipples(p => [...p, { x, y, id }])
    setTimeout(() => setRipples(p => p.filter(r => r.id !== id)), 600)
  }
  return (
    <button type="submit" disabled={loading} onClick={addRipple}
      style={{
        position: 'relative', overflow: 'hidden',
        width: '100%', padding: '14px 20px',
        background: loading ? 'rgba(30,41,59,0.5)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        border: 'none', borderRadius: '12px',
        color: loading ? '#475569' : '#0c0800',
        fontSize: '11px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: loading ? 'none' : '0 4px 24px rgba(251,191,36,0.35)',
        transition: 'all 0.2s', marginTop: '6px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(251,191,36,0.5)' }}}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 24px rgba(251,191,36,0.35)' }}>
      {ripples.map(r => (
        <span key={r.id} style={{
          position: 'absolute', left: r.x, top: r.y,
          width: 0, height: 0, borderRadius: '50%',
          background: 'rgba(255,255,255,0.3)',
          transform: 'translate(-50%,-50%)',
          animation: 'ripple 0.6s ease-out forwards'
        }} />
      ))}
      {loading
        ? <><Spinner />Processing...</>
        : children}
    </button>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14, borderRadius: '50%',
      border: '2px solid rgba(71,85,105,0.3)', borderTopColor: '#64748b',
      animation: 'spin 0.7s linear infinite', flexShrink: 0
    }} />
  )
}

/* ─────────────────────────────────────────────
   FIELD
───────────────────────────────────────────── */
function Field({ label, icon: Icon, type = 'text', value, onChange, placeholder, required, disabled, mono }) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '9px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.14em',
        color: focused ? '#fbbf24' : '#475569',
        marginBottom: '6px', transition: 'color 0.2s'
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: '0 auto 0 0', paddingLeft: '13px',
          display: 'flex', alignItems: 'center', pointerEvents: 'none',
          color: focused ? '#fbbf24' : '#334155', transition: 'color 0.2s'
        }}><Icon size={14} /></div>
        <input
          type={isPass ? (show ? 'text' : 'password') : type}
          value={value} onChange={onChange} required={required} disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', boxSizing: 'border-box',
            paddingLeft: '40px', paddingRight: isPass ? '40px' : '12px',
            paddingTop: '11px', paddingBottom: '11px',
            background: focused ? 'rgba(251,191,36,0.04)' : 'rgba(2,6,23,0.7)',
            border: `1px solid ${focused ? 'rgba(251,191,36,0.45)' : 'rgba(30,41,59,0.8)'}`,
            borderRadius: '10px', color: disabled ? '#334155' : '#f1f5f9',
            fontSize: '13px', fontFamily: mono ? "'Courier New', monospace" : 'inherit',
            outline: 'none', transition: 'all 0.2s',
            boxShadow: focused ? '0 0 0 3px rgba(251,191,36,0.07)' : 'none'
          }}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)} style={{
            position: 'absolute', inset: '0 0 0 auto', paddingRight: '13px',
            background: 'none', border: 'none', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center'
          }}>{show ? <EyeOff size={13} /> : <Eye size={13} />}</button>
        )}
      </div>
    </div>
  )
}

function GhostBtn({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', fontSize: '10px', fontWeight: 700,
      color: '#334155', cursor: 'pointer', textTransform: 'uppercase',
      letterSpacing: '0.1em', transition: 'color 0.2s'
    }}
      onMouseEnter={e => e.currentTarget.style.color = '#fbbf24'}
      onMouseLeave={e => e.currentTarget.style.color = '#334155'}>
      {children}
    </button>
  )
}

const AUTH_STEPS = [
  'Verifying Badge ID...',
  'Checking security clearance...',
  'Validating credentials...',
  'Granting access...',
]

/* ─────────────────────────────────────────────
   MAIN
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600)
  const navigate = useNavigate()

  useEffect(() => {
    function handleResize() { setIsMobile(window.innerWidth < 600) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])

  const reset = () => { setError(''); setSuccess('') }

  async function runAuthAnimation(fn) {
    setLoading(true); setAuthStep(0)
    const delays = [600, 700, 700, 500]
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
    <div style={{ minHeight: '100vh', background: '#020817', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative', overflow: 'hidden' }}>
      <ParticleNet />

      {/* Auth progress overlay */}
      {authStep >= 0 && <AuthProgress steps={AUTH_STEPS} currentStep={authStep} />}

      {/* BG glows */}
      <div style={{ position: 'fixed', top: '5%', left: '10%', width: '50vw', height: '50vh', borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '5%', right: '10%', width: '40vw', height: '40vh', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* Top status bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '8px 14px' : '10px 32px',
        borderBottom: '1px solid rgba(30,41,59,0.5)',
        background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'ping 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: '9px', color: '#10b981', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.06em' }}>{isMobile ? 'ONLINE' : 'ALL SYSTEMS OPERATIONAL'}</span>
          </div>
          {!isMobile && <span style={{ fontSize: '9px', color: '#1e293b', fontFamily: 'monospace' }}>IPARTS v2.0 · CLASSIFIED</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isMobile && (
            <span style={{ fontSize: '9px', color: '#334155', fontFamily: 'monospace' }}>
              {time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>
          )}
          <span style={{ fontSize: '11px', color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>
            {time.toLocaleTimeString('en-IN', { hour12: false })} IST
          </span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '460px', margin: isMobile ? '70px 12px 16px' : '80px 20px 20px', animation: 'slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <BadgeEmblem />
          <p style={{ fontSize: '9px', color: '#fbbf24', letterSpacing: '0.28em', fontFamily: 'monospace', fontWeight: 700, marginBottom: '6px' }}>◈ GVAK POLICE COMMAND ◈</p>
          <h1 style={{
            fontSize: '30px', fontWeight: 900, margin: '6px 0 4px',
            background: 'linear-gradient(135deg, #f1f5f9 30%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em', minHeight: '38px'
          }}>
            <Typewriter texts={['Command Console', 'Secure Access Portal', 'IPARTS v2.0', 'Police AI System']} speed={70} />
          </h1>
          <p style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.06em', margin: 0 }}>Intelligent Police Assistant & Records System</p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '12px 16px', color: '#fca5a5', fontSize: '12px', animation: 'shakeX 0.4s ease' }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, color: '#ef4444' }} />{error}
          </div>
        )}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '12px 16px', color: '#6ee7b7', fontSize: '12px' }}>
            <CheckCircle2 size={14} style={{ flexShrink: 0, color: '#10b981' }} />{success}
          </div>
        )}

        {/* Card */}
        <div style={{
          background: 'rgba(10,17,34,0.88)', border: '1px solid rgba(30,41,59,0.8)',
          borderRadius: '20px', backdropFilter: 'blur(30px)', overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04)'
        }}>
          <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #f59e0b 30%, #fbbf24 50%, #d97706 70%, transparent)' }} />
          <div style={{ padding: '32px' }}>

            {/* LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} style={{ animation: 'fadeIn 0.3s ease' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f1f5f9', margin: '0 0 4px' }}>Officer Sign In</h2>
                <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 24px' }}>Enter your credentials to access the command network</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
                  <Field label="Badge ID" icon={Fingerprint} value={badgeNumber} onChange={e => setBadgeNumber(e.target.value)} placeholder="e.g. TG-1001" required mono />
                  <Field label="Password" icon={KeyRound} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" required />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <GhostBtn onClick={() => { setMode('forgot'); reset() }}>Forgot Password?</GhostBtn>
                  <GhostBtn onClick={() => { setMode('register'); reset(); setBadgeNumber('') }}>New Registration</GhostBtn>
                </div>
                <RippleBtn loading={loading}><Shield size={13} />Sign In to Console</RippleBtn>
                <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(2,6,23,0.6)', borderRadius: '8px', border: '1px solid rgba(15,23,42,0.8)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px' }}>🔒</span>
                  <span style={{ fontSize: '9px', color: '#1e3a5f', letterSpacing: '0.04em' }}>
                    Authorised personnel only. All access is monitored &amp; logged.
                  </span>
                </div>
              </form>
            )}

            {/* REGISTER */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px', paddingBottom: '16px', borderBottom: '1px solid rgba(30,41,59,0.7)' }}>
                  <button type="button" onClick={() => setMode('login')} style={{ background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(30,41,59,0.8)', borderRadius: '8px', padding: '7px', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#fbbf24'} onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                    <ArrowLeft size={14} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Officer Registration</h2>
                    <p style={{ fontSize: '9px', color: '#475569', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em' }}>New account creation</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '11px', marginBottom: '11px' }}>
                  <Field label="Full Name" icon={User} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Srinivas Reddy" required />
                  <Field label="Badge ID" icon={Fingerprint} value={badgeNumber} onChange={e => setBadgeNumber(e.target.value)} placeholder="TG-1002" required mono />
                </div>
                <div style={{ marginBottom: '11px' }}><Field label="Email" icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="officer@tsp.gov.in" required /></div>
                <div style={{ marginBottom: '11px' }}><Field label="Password" icon={KeyRound} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Strong password" required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '11px', marginBottom: '11px' }}>
                  <Field label="Police Station" icon={Building2} value={station} onChange={e => setStation(e.target.value)} placeholder="Banjara Hills PS" required />
                  <div>
                    <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#475569', marginBottom: '6px' }}>Rank</label>
                    <select value={rank} onChange={e => setRank(e.target.value)} style={{ width: '100%', padding: '11px 10px', background: 'rgba(2,6,23,0.7)', border: '1px solid rgba(30,41,59,0.8)', borderRadius: '10px', color: '#f1f5f9', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
                      {['DGP','ADGP','IGP','DIG','SP','Addl. SP','DSP','ASP','CI','SI','ASI','HC','PC'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '11px', marginBottom: '20px' }}>
                  <Field label="District" icon={MapPin} value={district} onChange={e => setDistrict(e.target.value)} placeholder="Hyderabad" required />
                  <Field label="Jurisdiction" icon={MapPin} value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} placeholder="India" disabled />
                </div>
                <RippleBtn loading={loading}>Submit Registration</RippleBtn>
              </form>
            )}

            {/* VERIFY OTP */}
            {mode === 'verify' && (
              <form onSubmit={handleVerify} style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(251,191,36,0.12)', animation: 'pulse 2s ease-in-out infinite' }}>
                    <Mail size={28} color="#fbbf24" />
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px' }}>OTP Verification</h2>
                  <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>Code dispatched to <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{email || 'your email'}</span></p>
                </div>
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#475569', marginBottom: '10px', textAlign: 'center' }}>Enter 6-Digit Code</label>
                  <input value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={6} required placeholder="_ _ _ _ _ _"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '16px', textAlign: 'center', background: 'rgba(2,6,23,0.8)', borderRadius: '14px', border: '1px solid rgba(251,191,36,0.35)', color: '#fbbf24', fontSize: '28px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '0.6em', outline: 'none', boxShadow: '0 0 0 3px rgba(251,191,36,0.06)', transition: 'all 0.2s' }}
                  />
                </div>
                <RippleBtn loading={loading}>Verify & Activate</RippleBtn>
                <div style={{ textAlign: 'center', marginTop: '14px' }}><GhostBtn onClick={() => setMode('login')}>Back to Sign In</GhostBtn></div>
              </form>
            )}

            {/* FORGOT */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgot} style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(30,41,59,0.7)' }}>
                  <button type="button" onClick={() => setMode('login')} style={{ background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(30,41,59,0.8)', borderRadius: '8px', padding: '7px', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <ArrowLeft size={14} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Password Recovery</h2>
                    <p style={{ fontSize: '9px', color: '#475569', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Secure reset request</p>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#475569', marginBottom: '20px', lineHeight: 1.6 }}>Enter your registered email. A secure OTP will be dispatched for identity verification.</p>
                <div style={{ marginBottom: '20px' }}><Field label="Registered Email" icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="officer@tsp.gov.in" required /></div>
                <RippleBtn loading={loading}>Dispatch Reset Code</RippleBtn>
              </form>
            )}

            {/* RESET */}
            {mode === 'reset' && (
              <form onSubmit={handleReset} style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px' }}>Set New Password</h2>
                  <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>OTP sent to <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{email}</span></p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#475569', marginBottom: '6px' }}>OTP Code</label>
                    <input value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={6} required placeholder="000000"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '11px', textAlign: 'center', background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', color: '#fbbf24', fontSize: '20px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '0.4em', outline: 'none' }}
                    />
                  </div>
                  <Field label="New Password" icon={KeyRound} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Strong new password" required />
                </div>
                <RippleBtn loading={loading}>Save Password</RippleBtn>
                <div style={{ textAlign: 'center', marginTop: '14px' }}><GhostBtn onClick={() => setMode('login')}>Back to Sign In</GhostBtn></div>
              </form>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '9px', color: '#334155', marginTop: '18px', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
          © Copy Rights to <span style={{ color: '#fbbf24', fontWeight: 700 }}>GVAK Team</span>
        </p>
      </div>

      {/* ── CITIZEN PORTAL SECTION ── */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '460px', margin: isMobile ? '0 12px 40px' : '0 20px 40px', animation: 'slideUp 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' }}>
        <div style={{
          background: 'rgba(10,17,34,0.85)', border: '1px solid rgba(30,41,59,0.7)',
          borderRadius: '16px', backdropFilter: 'blur(20px)', overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
        }}>
          {/* Teal accent top bar */}
          <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #06b6d4 30%, #22d3ee 50%, #0891b2 70%, transparent)' }} />
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <p style={{ fontSize: '8px', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 4px', fontFamily: 'monospace' }}>👥 CITIZEN ACCESS — NO LOGIN REQUIRED</p>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', margin: '0 0 3px' }}>File a Police Complaint</p>
              <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>Report incidents online. AI classifies your complaint & issues IPC sections instantly.</p>
            </div>
            <button
              onClick={() => navigate('/citizen')}
              style={{
                padding: '11px 20px', borderRadius: '12px', flexShrink: 0,
                background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                border: 'none', color: '#fff', fontSize: '11px', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.07em', cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(6,182,212,0.3)',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(6,182,212,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(6,182,212,0.3)' }}
            >File Complaint →</button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes ping { 0%{opacity:1} 75%,100%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.97)} }
        @keyframes radarSweep { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shakeX {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)}
          60%{transform:translateX(-4px)}
          80%{transform:translateX(4px)}
        }
        @keyframes ripple {
          to { width:200px; height:200px; opacity:0; }
        }
        input::placeholder { color:#1e293b !important; }
        select option { background:#0f172a; }
        * { scrollbar-width:thin; scrollbar-color:#1e293b transparent; }
        *::-webkit-scrollbar { width:4px; }
        *::-webkit-scrollbar-thumb { background:#1e293b; border-radius:4px; }
      `}</style>
    </div>
  )
}
