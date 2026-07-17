import { useState, useEffect } from 'react'
import { Shield, Send, CheckCircle2, AlertCircle, Copy, Loader2, FileText, Zap, Lock, Hash, ChevronDown, ChevronUp, ArrowRight, Eye, EyeOff } from 'lucide-react'
import api from '../api/client.js'

// ── Groq AI Call ──────────────────────────────────────────────────────────────
async function analyzeComplaintWithGroq(apiKey, formData) {
  const prompt = `You are a police legal assistant in India. A citizen has filed a complaint. Analyze and respond ONLY in valid JSON (no markdown).

Complaint:
- Name: ${formData.name}
- Contact: ${formData.contact}
- Incident Type: ${formData.incidentType}
- Date: ${formData.incidentDate}
- Location: ${formData.location}
- Description: ${formData.description}
- Witnesses: ${formData.witnesses || 'None'}
- Accused: ${formData.accused || 'Unknown'}

Respond with this exact JSON:
{
  "crime_category": "<Theft|Robbery|Assault|Cybercrime|Fraud|Domestic Violence|Missing Person|Property Dispute|Other>",
  "severity": "<Low|Medium|High|Critical>",
  "ipc_sections": ["<section 1>", "<section 2>"],
  "ipc_descriptions": ["<description 1>", "<description 2>"],
  "recommended_action": "<brief recommended action>",
  "complaint_summary": "<formal 3-4 sentence summary in third person>",
  "estimated_response_time": "<e.g. 24-48 hours>"
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 800 }),
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || 'Groq API error') }
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content.trim())
}

function generateRefNumber() {
  const now = new Date()
  const y = now.getFullYear(), m = String(now.getMonth()+1).padStart(2,'0'), d = String(now.getDate()).padStart(2,'0')
  return `GVAK-${y}${m}${d}-${Math.floor(1000+Math.random()*9000)}`
}

const SEV = {
  Low:      { c:'#34d399', bg:'rgba(52,211,153,0.1)',  b:'rgba(52,211,153,0.3)'  },
  Medium:   { c:'#fbbf24', bg:'rgba(251,191,36,0.1)',  b:'rgba(251,191,36,0.3)'  },
  High:     { c:'#f97316', bg:'rgba(249,115,22,0.1)',  b:'rgba(249,115,22,0.3)'  },
  Critical: { c:'#ef4444', bg:'rgba(239,68,68,0.1)',   b:'rgba(239,68,68,0.3)'   },
}

function StyledInput({ label, name, value, onChange, type='text', placeholder, required, as: Tag='input', rows }) {
  const [f, setF] = useState(false)
  return (
    <div>
      <label style={{ display:'block', fontSize:'9px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', color: f ? '#38bdf8' : '#64748b', marginBottom:'6px', transition:'color 0.2s' }}>
        {label}{required && <span style={{color:'#f87171'}}> *</span>}
      </label>
      <Tag
        type={Tag==='input' ? type : undefined}
        name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        rows={rows}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{
          width:'100%', boxSizing:'border-box', padding: rows ? '12px 14px' : '11px 14px',
          background: f ? 'rgba(56,189,248,0.04)' : 'rgba(2,6,23,0.6)',
          border:`1.5px solid ${f ? 'rgba(56,189,248,0.5)' : 'rgba(51,65,85,0.7)'}`,
          borderRadius:'10px', color:'#f1f5f9', fontSize:'13px', outline:'none',
          transition:'all 0.2s', resize: rows ? 'vertical' : undefined,
          fontFamily:"'Inter', sans-serif",
          boxShadow: f ? '0 0 0 3px rgba(56,189,248,0.07)' : 'none'
        }}
      />
    </div>
  )
}

// Animated counter for hero stats
function Counter({ to, label }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let i = 0; const step = Math.ceil(to / 50)
    const t = setInterval(() => { i += step; if (i >= to) { setVal(to); clearInterval(t) } else setVal(i) }, 25)
    return () => clearInterval(t)
  }, [to])
  return (
    <div style={{ textAlign:'center' }}>
      <p style={{ fontSize:'22px', fontWeight:900, color:'#f1f5f9', margin:0, fontFamily:'monospace' }}>{val.toLocaleString()}+</p>
      <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.4)', margin:'2px 0 0', textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</p>
    </div>
  )
}

export default function CitizenPortal() {
  const [apiKey, setApiKey] = useState('')
  const [showApiPanel, setShowApiPanel] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [apiKeySet, setApiKeySet] = useState(false)
  const [apiKeyError, setApiKeyError] = useState('')

  const [form, setForm] = useState({ name:'', contact:'', incidentType:'', incidentDate:'', location:'', description:'', witnesses:'', accused:'' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [refNo, setRefNo] = useState('')
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState(1) // 1=form, 2=result

  const upd = e => setForm(p => ({...p, [e.target.name]: e.target.value}))

  function confirmApiKey() {
    if (!apiKey.startsWith('gsk_')) { setApiKeyError('Keys start with "gsk_"'); return }
    setApiKeyError(''); setApiKeySet(true); setShowApiPanel(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!apiKeySet) { setError('Please set your Groq API key first (top right button).'); return }
    setError(''); setLoading(true)
    try {
      const analysis = await analyzeComplaintWithGroq(apiKey, form)
      const generatedRef = generateRefNumber()
      
      await api.post('/complaints/', {
        complaint_id: generatedRef,
        citizen_name: form.name,
        phone: form.contact,
        aadhaar: '',
        complaint: form.description + "\n\n[Location: " + form.location + "]",
        category: analysis.crime_category,
        priority: analysis.severity,
        department: analysis.recommended_action,
        date: form.incidentDate
      })

      setResult(analysis); setRefNo(generatedRef); setStep(2)
    } catch (err) { setError(err.message || 'AI analysis failed or DB server is down. Check API key.') }
    finally { setLoading(false) }
  }

  function copyRef() { navigator.clipboard.writeText(refNo); setCopied(true); setTimeout(()=>setCopied(false),2000) }

  const sev = result ? (SEV[result.severity] || SEV.Medium) : null

  return (
    <div style={{ minHeight:'100vh', background:'#020817', fontFamily:"'Inter', system-ui, sans-serif", display:'flex', flexDirection:'column' }}>

      {/* ── TOPBAR ── */}
      <header style={{
        background:'rgba(5,10,25,0.95)', borderBottom:'1px solid rgba(51,65,85,0.5)',
        padding:'12px 32px', display:'flex', alignItems:'center', justifyContent:'space-between',
        backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:50, flexShrink:0
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:34, height:34, borderRadius:'9px', background:'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(6,182,212,0.08))', border:'1px solid rgba(56,189,248,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Shield size={16} color="#38bdf8" />
          </div>
          <div>
            <p style={{ fontSize:'13px', fontWeight:900, color:'#f1f5f9', margin:0, letterSpacing:'0.06em', textTransform:'uppercase' }}>GVAK Police Command</p>
            <p style={{ fontSize:'8px', color:'rgba(56,189,248,0.6)', margin:0, letterSpacing:'0.16em', textTransform:'uppercase', fontFamily:'monospace' }}>Citizen Complaint Portal · Public Access</p>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          {/* Live status pill */}
          <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 10px', background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'20px' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'pulse 1.4s ease-in-out infinite' }} />
            <span style={{ fontSize:'8.5px', color:'#10b981', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>System Online</span>
          </div>
          {/* API Key Button */}
          <button onClick={()=>setShowApiPanel(v=>!v)} style={{
            display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'20px',
            background: apiKeySet ? 'rgba(56,189,248,0.1)' : 'rgba(251,191,36,0.08)',
            border: `1px solid ${apiKeySet ? 'rgba(56,189,248,0.3)' : 'rgba(251,191,36,0.25)'}`,
            color: apiKeySet ? '#38bdf8' : '#fbbf24', fontSize:'10px', fontWeight:700,
            textTransform:'uppercase', letterSpacing:'0.07em', cursor:'pointer', transition:'all 0.2s'
          }}>
            {apiKeySet ? <CheckCircle2 size={12}/> : <Lock size={12}/>}
            {apiKeySet ? 'API Active' : 'Set API Key'}
            {showApiPanel ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
          </button>
        </div>
      </header>

      {/* API Key Panel */}
      {showApiPanel && (
        <div style={{ background:'rgba(5,10,25,0.98)', borderBottom:'1px solid rgba(51,65,85,0.5)', padding:'18px 32px', display:'flex', gap:'12px', alignItems:'flex-end', flexWrap:'wrap', animation:'fadeDown 0.2s ease' }}>
          <div style={{ flex:1, minWidth:'260px' }}>
            <label style={{ display:'block', fontSize:'8.5px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'#64748b', marginBottom:'6px' }}>Groq API Key <span style={{color:'#f87171'}}>*</span></label>
            <div style={{ position:'relative' }}>
              <input
                type={showKey ? 'text' : 'password'} value={apiKey} onChange={e=>setApiKey(e.target.value)}
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                style={{ width:'100%', boxSizing:'border-box', padding:'10px 40px 10px 14px', background:'rgba(2,6,23,0.8)', border:'1px solid rgba(51,65,85,0.7)', borderRadius:'10px', color:'#f1f5f9', fontSize:'13px', fontFamily:'monospace', outline:'none' }}
              />
              <button type="button" onClick={()=>setShowKey(v=>!v)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#475569', cursor:'pointer', display:'flex', alignItems:'center' }}>
                {showKey ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
            {apiKeyError && <p style={{ fontSize:'10px', color:'#f87171', margin:'4px 0 0' }}>{apiKeyError}</p>}
            <p style={{ fontSize:'9px', color:'#334155', margin:'5px 0 0' }}>Free key at <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{color:'#38bdf8'}}>console.groq.com/keys</a> · Never stored on server</p>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={()=>setShowKey(v=>!v)} style={{ padding:'10px 14px', borderRadius:'10px', background:'rgba(30,41,59,0.5)', border:'1px solid rgba(51,65,85,0.7)', color:'#64748b', fontSize:'11px', cursor:'pointer', fontWeight:600 }}>
              {showKey ? 'Hide' : 'Show'}
            </button>
            <button onClick={confirmApiKey} style={{ padding:'10px 20px', borderRadius:'10px', background:'linear-gradient(135deg, #0ea5e9, #06b6d4)', border:'none', color:'#fff', fontSize:'11px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', cursor:'pointer' }}>
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN SPLIT LAYOUT ── */}
      <div style={{ flex:1, display:'flex', minHeight:0 }} className="split-layout">

        {/* ── LEFT HERO PANEL ── */}
        <div style={{
          width:'42%', flexShrink:0, position:'relative', overflow:'hidden',
          background:'linear-gradient(160deg, #070f21 0%, #030814 50%, #060d1e 100%)',
          display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'48px 40px',
          borderRight:'1px solid rgba(255,255,255,0.03)'
        }} className="hero-panel">

          {/* Decorative glows */}
          <div style={{ position:'absolute', top:'-60px', left:'-60px', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)', filter:'blur(55px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'0', right:'-40px', width:'260px', height:'260px', borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:'45%', right:'0', width:'180px', height:'180px', borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }} />

          {/* Grid overlay texture */}
          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(56,189,248,0.06) 1px, transparent 1px)', backgroundSize:'24px 24px', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:1 }}>
            {/* Status chip */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(56,189,248,0.06)', border:'1px solid rgba(56,189,248,0.18)', borderRadius:'20px', padding:'6px 14px', marginBottom:'32px', boxShadow:'0 4px 12px rgba(56,189,248,0.05)' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#38bdf8', display:'inline-block', animation:'pulse 1.4s infinite' }} />
              <span style={{ fontSize:'9px', color:'#38bdf8', fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase' }}>AI-Powered System · 24/7 Active</span>
            </div>

            <h1 style={{ fontSize:'38px', fontWeight:900, color:'#f1f5f9', margin:'0 0 16px', lineHeight:1.15, letterSpacing:'-0.02em' }}>
              Report a Crime<br/>
              <span style={{ background:'linear-gradient(90deg, #38bdf8, #818cf8, #6366f1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Without Leaving Home</span>
            </h1>
            <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.45)', lineHeight:1.7, margin:'0 0 36px', maxWidth:'360px' }}>
              File your police complaint online securely in minutes. Our advanced AI instantly analyzes your case, identifies relevant IPC/BNS sections, and generates a formal summary for administrative approval.
            </p>

            {/* Feature list */}
            <div style={{ display:'flex', flexDirection:'column', gap:'16px', marginBottom:'40px' }}>
              {[
                { icon:Zap, color:'#fbbf24', title:'Instant AI Analysis', sub:'Crime type & severity detected automatically' },
                { icon:FileText, color:'#818cf8', title:'IPC / BNS Sections', sub:'Applicable law sections cited precisely' },
                { icon:Hash, color:'#34d399', title:'Unique Reference ID', sub:'Track your complaint with a secure case number' },
                { icon:Lock, color:'#38bdf8', title:'End-to-End Encrypted', sub:'Your data never stored on external servers' },
              ].map(({ icon:Icon, color, title, sub }) => (
                <div key={title} style={{ display:'flex', alignItems:'flex-start', gap:'14px', transition:'transform 0.2s' }}
                     className="hero-feature-item">
                  <div style={{ width:36, height:36, borderRadius:'10px', background:`${color}12`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, boxShadow:`0 0 15px ${color}08` }}>
                    <Icon size={16} color={color} />
                  </div>
                  <div>
                    <p style={{ fontSize:'13.5px', fontWeight:700, color:'#cbd5e1', margin:0 }}>{title}</p>
                    <p style={{ fontSize:'11.5px', color:'rgba(255,255,255,0.35)', margin:'2px 0 0' }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height:'1px', background:'linear-gradient(90deg, transparent, rgba(56,189,248,0.15), transparent)', marginBottom:'28px' }} />

            {/* Stats row */}
            <div style={{ display:'flex', gap:'36px' }}>
              <Counter to={12840} label="Complaints Filed" />
              <Counter to={94} label="Resolve Rate %" />
              <Counter to={48} label="Avg Hours Response" />
            </div>
          </div>

          {/* Bottom badge */}
          <div style={{ position:'relative', zIndex:1, marginTop:'32px', display:'flex', alignItems:'center', gap:'12px', padding:'12px 18px', background:'rgba(56,189,248,0.04)', border:'1px solid rgba(56,189,248,0.12)', borderRadius:'12px' }}>
            <Shield size={20} color="#38bdf8" />
            <div>
              <p style={{ fontSize:'11.5px', fontWeight:800, color:'#f1f5f9', margin:0 }}>GVAK Police Command</p>
              <p style={{ fontSize:'9.5px', color:'rgba(255,255,255,0.3)', margin:0 }}>Authorized & Secure Public Complaint System</p>
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'40px 48px', background:'#030914' }} className="form-panel">

          {/* STEP 1 — FORM */}
          {step === 1 && (
            <div style={{ maxWidth:'580px', margin:'0 auto', animation:'fadeUp 0.4s ease' }}>
              <div style={{ marginBottom:'28px' }}>
                <h2 style={{ fontSize:'24px', fontWeight:900, color:'#f1f5f9', margin:'0 0 6px', letterSpacing:'-0.02em' }}>File Your Complaint</h2>
                <p style={{ fontSize:'12.5px', color:'#475569', margin:0 }}>All fields marked <span style={{color:'#f87171'}}>*</span> are required. Information is handled with strict confidentiality.</p>
              </div>

              {!apiKeySet && (
                <div style={{ marginBottom:'20px', padding:'13px 16px', background:'rgba(251,191,36,0.04)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:'12px', display:'flex', gap:'10px', alignItems:'center' }}>
                  <AlertCircle size={16} color="#fbbf24" style={{flexShrink:0}} />
                  <p style={{ fontSize:'12px', color:'#fbbf24', margin:0 }}>Set your <strong>Groq API Key</strong> using the top-right button to enable AI analysis.</p>
                </div>
              )}

              {error && (
                <div style={{ marginBottom:'16px', padding:'13px 16px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'12px', display:'flex', gap:'10px', color:'#fca5a5', fontSize:'12.5px' }}>
                  <AlertCircle size={15} style={{flexShrink:0, marginTop:1}} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'20px', background:'rgba(10,18,36,0.4)', padding:'24px', border:'1px solid rgba(255,255,255,0.04)', borderRadius:'16px' }}>

                {/* Section label */}
                <p style={{ fontSize:'9.5px', fontWeight:850, color:'#38bdf8', textTransform:'uppercase', letterSpacing:'0.14em', margin:0, paddingBottom:'8px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>— Personal Information</p>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }} className="form-2col">
                  <StyledInput label="Full Name" name="name" value={form.name} onChange={upd} placeholder="e.g. Rahul Sharma" required />
                  <StyledInput label="Contact Number" name="contact" value={form.contact} onChange={upd} placeholder="9876543210" required type="tel" />
                </div>

                <p style={{ fontSize:'9.5px', fontWeight:850, color:'#38bdf8', textTransform:'uppercase', letterSpacing:'0.14em', margin:0, paddingBottom:'8px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>— Incident Details</p>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }} className="form-2col">
                  <div>
                    <label style={{ display:'block', fontSize:'9px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', color:'#64748b', marginBottom:'6px' }}>Incident Type <span style={{color:'#f87171'}}>*</span></label>
                    <select name="incidentType" value={form.incidentType} onChange={upd} required
                      style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', background:'rgba(2,6,23,0.6)', border:'1.5px solid rgba(51,65,85,0.7)', borderRadius:'10px', color: form.incidentType ? '#f1f5f9' : '#475569', fontSize:'13px', outline:'none', cursor:'pointer' }}>
                      <option value="">— Select type —</option>
                      <option>Theft / Burglary</option>
                      <option>Robbery / Dacoity</option>
                      <option>Assault / Physical Attack</option>
                      <option>Cybercrime / Online Fraud</option>
                      <option>Domestic Violence / Harassment</option>
                      <option>Missing Person</option>
                      <option>Property / Land Dispute</option>
                      <option>Financial Fraud / Cheating</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <StyledInput label="Date of Incident" name="incidentDate" value={form.incidentDate} onChange={upd} type="date" required />
                </div>

                <StyledInput label="Incident Location / Address" name="location" value={form.location} onChange={upd} placeholder="e.g. Near Central Mall, Banjara Hills, Hyderabad" required />
                <StyledInput label="Describe the Incident in Detail" name="description" as="textarea" rows={4} value={form.description} onChange={upd} placeholder="Describe exactly what happened, timeline, how the incident occurred..." required />

                <p style={{ fontSize:'9.5px', fontWeight:850, color:'#38bdf8', textTransform:'uppercase', letterSpacing:'0.14em', margin:0, paddingBottom:'8px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>— Additional Information (Optional)</p>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }} className="form-2col">
                  <StyledInput label="Witnesses" name="witnesses" value={form.witnesses} onChange={upd} placeholder="Names or descriptions" />
                  <StyledInput label="Accused / Suspect" name="accused" value={form.accused} onChange={upd} placeholder="Name, description or vehicle no." />
                </div>

                {/* Disclaimer */}
                <div style={{ padding:'11px 14px', background:'rgba(2,6,23,0.5)', borderRadius:'10px', border:'1px solid rgba(51,65,85,0.3)', fontSize:'10.5px', color:'#475569', lineHeight:1.6 }}>
                  ⚠️ Filing a false complaint is punishable under <strong style={{color:'#64748b'}}>Section 182 IPC</strong>. By submitting, you confirm all information is truthful.
                </div>

                <button type="submit" disabled={loading || !apiKeySet} style={{
                  width:'100%', padding:'15px', borderRadius:'12px',
                  background: (loading || !apiKeySet) ? 'rgba(30,41,59,0.3)' : 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #0891b2 100%)',
                  border:'none', color: (loading || !apiKeySet) ? '#475569' : '#fff',
                  fontSize:'13px', fontWeight:900, letterSpacing:'0.08em', textTransform:'uppercase',
                  cursor: (loading || !apiKeySet) ? 'not-allowed' : 'pointer', transition:'all 0.25s',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                  boxShadow: (!loading && apiKeySet) ? '0 6px 24px rgba(6,182,212,0.25)' : 'none'
                }}
                className="submit-btn">
                  {loading
                    ? <><Loader2 size={16} style={{animation:'spin 1s linear infinite'}} /> Analyzing with Groq AI...</>
                    : <><Send size={14} /> Submit Complaint to GVAK Command</>}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2 — RESULT */}
          {step === 2 && result && (
            <div style={{ maxWidth:'620px', margin:'0 auto', animation:'fadeUp 0.5s ease', display:'flex', flexDirection:'column', gap:'20px' }}>

              {/* Success banner */}
              <div style={{ padding:'24px', borderRadius:'16px', background:'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.03))', border:'1px solid rgba(52,211,153,0.2)', textAlign:'center', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle at 50% 50%, rgba(52,211,153,0.04) 0%, transparent 70%)' }} />
                <div style={{ position:'relative', zIndex:1 }}>
                  <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', boxShadow:'0 0 30px rgba(52,211,153,0.1)' }}>
                    <CheckCircle2 size={24} color="#34d399" />
                  </div>
                  <p style={{ fontSize:'10px', fontWeight:800, color:'#34d399', textTransform:'uppercase', letterSpacing:'0.14em', margin:'0 0 6px' }}>Complaint Submitted Successfully</p>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'14px' }}>
                    <p style={{ fontSize:'24px', fontWeight:900, color:'#f1f5f9', fontFamily:'monospace', letterSpacing:'0.06em', margin:0 }}>{refNo}</p>
                    <button onClick={copyRef} style={{ background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)', borderRadius:'8px', padding:'5px 10px', color:'#34d399', fontSize:'10px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', transition:'all 0.15s' }} className="copy-btn">
                      {copied ? <CheckCircle2 size={11}/> : <Copy size={11}/>} {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  
                  {/* Status Box */}
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:'20px', padding:'6px 16px', margin:'4px 0 12px' }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background:'#fbbf24', display:'inline-block', animation:'pulse 1.2s infinite' }} />
                    <span style={{ fontSize:'9.5px', color:'#fbbf24', fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase' }}>Awaiting Administrative Review & Case Assignment</span>
                  </div>

                  <p style={{ fontSize:'11.5px', color:'rgba(255,255,255,0.35)', margin:0, maxWidth:'460px', marginLeft:'auto', marginRight:'auto', lineHeight:1.6 }}>Your complaint is registered and queued. An administrator at Command Headquarters will review the incident, assign a designated officer, and register it as an official Case.</p>
                </div>
              </div>

              {/* Lifecycle Progress Tracker */}
              <div style={{ padding:'24px', background:'rgba(10,18,36,0.45)', border:'1px solid rgba(255,255,255,0.04)', borderRadius:'16px' }}>
                <p style={{ fontSize:'10px', fontWeight:850, color:'#38bdf8', textTransform:'uppercase', letterSpacing:'0.14em', margin:'0 0 20px' }}>Processing Lifecycle Tracker</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
                  {/* Step 1: Submission */}
                  <div style={{ display:'flex', gap:'14px' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                      <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(16,185,129,0.15)', border:'2px solid #10b981', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:900, color:'#10b981' }}>✓</div>
                      <div style={{ width:2, height:24, background:'#10b981' }} />
                    </div>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:750, color:'#e2e8f0', margin:0 }}>Complaint Filed & AI Classified</p>
                      <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', margin:'2px 0 0' }}>Case details securely scanned and classified by GVAK-AI engine.</p>
                    </div>
                  </div>
                  {/* Step 2: Administrative Review */}
                  <div style={{ display:'flex', gap:'14px' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                      <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(251,191,36,0.15)', border:'2px solid #fbbf24', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:900, color:'#fbbf24', animation:'pulse 1.5s infinite' }}>●</div>
                      <div style={{ width:2, height:24, background:'rgba(255,255,255,0.08)' }} />
                    </div>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:750, color:'#fbbf24', margin:0 }}>Awaiting Administrative Approval</p>
                      <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', margin:'2px 0 0' }}>System administrator must review the AI classification and authorize official Case registration.</p>
                    </div>
                  </div>
                  {/* Step 3: Officer Assignment */}
                  <div style={{ display:'flex', gap:'14px' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                      <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(255,255,255,0.02)', border:'2px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:900, color:'rgba(255,255,255,0.2)' }}>3</div>
                      <div style={{ width:2, height:24, background:'rgba(255,255,255,0.08)' }} />
                    </div>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:750, color:'rgba(255,255,255,0.25)', margin:0 }}>Officer Assignment</p>
                      <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.15)', margin:'2px 0 0' }}>Once approved, an investigating officer will be assigned to coordinate next steps.</p>
                    </div>
                  </div>
                  {/* Step 4: FIR Generation */}
                  <div style={{ display:'flex', gap:'14px' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                      <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(255,255,255,0.02)', border:'2px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:900, color:'rgba(255,255,255,0.2)' }}>4</div>
                    </div>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:750, color:'rgba(255,255,255,0.25)', margin:0 }}>FIR & Investigation Kickoff</p>
                      <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.15)', margin:'2px 0 0' }}>Official FIR generation, tracking links generated, and field dispatch.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis card */}
              <div style={{ background:'rgba(10,18,36,0.45)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'16px', overflow:'hidden' }} className="case-tab">
                {/* Card header */}
                <div style={{ padding:'16px 22px', background:'rgba(2,6,23,0.4)', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', gap:'8px' }}>
                  <Zap size={14} color="#38bdf8" />
                  <h2 style={{ fontSize:'11px', fontWeight:850, textTransform:'uppercase', letterSpacing:'0.1em', color:'#38bdf8', margin:0 }}>AI Scan & Classification — Law Docket</h2>
                </div>

                <div style={{ padding:'22px', display:'flex', flexDirection:'column', gap:'20px' }}>
                  {/* Chips */}
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'11px', fontWeight:800, padding:'5px 14px', borderRadius:'20px', background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.2)', color:'#38bdf8', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      🔍 {result.crime_category}
                    </span>
                    <span style={{ fontSize:'11px', fontWeight:800, padding:'5px 14px', borderRadius:'20px', background:sev.bg, border:`1px solid ${sev.b}`, color:sev.c, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      ⚡ {result.severity} Severity
                    </span>
                    <span style={{ fontSize:'11px', fontWeight:700, padding:'5px 14px', borderRadius:'20px', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', color:'#818cf8' }}>
                      ⏱ {result.estimated_response_time}
                    </span>
                  </div>

                  {/* Summary box */}
                  <div style={{ padding:'16px 18px', background:'rgba(2,6,23,0.4)', borderRadius:'12px', borderLeft:'3px solid #38bdf8', borderTop:'1px solid rgba(255,255,255,0.02)', borderRight:'1px solid rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.02)' }}>
                    <p style={{ fontSize:'8.5px', fontWeight:800, color:'#38bdf8', textTransform:'uppercase', letterSpacing:'0.12em', margin:'0 0 8px' }}>Formal Complaint Summary</p>
                    <p style={{ fontSize:'13.5px', color:'#cbd5e1', lineHeight:1.75, margin:0 }}>{result.complaint_summary}</p>
                  </div>

                  {/* IPC Sections */}
                  <div>
                    <p style={{ fontSize:'8.5px', fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.12em', margin:'0 0 10px' }}>Applicable IPC / BNS Sections</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {result.ipc_sections?.map((sec, i) => (
                        <div key={i} style={{ display:'flex', gap:'12px', alignItems:'flex-start', padding:'13px 14px', background:'rgba(2,6,23,0.3)', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.03)' }}>
                          <span style={{ fontSize:'11.5px', fontWeight:900, color:'#fbbf24', fontFamily:'monospace', background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.15)', padding:'4px 10px', borderRadius:'6px', whiteSpace:'nowrap', flexShrink:0 }}>§ {sec}</span>
                          <p style={{ fontSize:'12.5px', color:'#94a3b8', margin:0, lineHeight:1.55, paddingTop:2 }}>{result.ipc_descriptions?.[i] || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended action */}
                  <div style={{ padding:'14px 16px', background:'rgba(99,102,241,0.04)', border:'1px solid rgba(99,102,241,0.12)', borderRadius:'12px' }}>
                    <p style={{ fontSize:'8.5px', fontWeight:800, color:'#818cf8', textTransform:'uppercase', letterSpacing:'0.12em', margin:'0 0 6px' }}>Recommended Police Action</p>
                    <p style={{ fontSize:'13px', color:'#c4b5fd', lineHeight:1.65, margin:0 }}>{result.recommended_action}</p>
                  </div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <button onClick={() => window.print()} style={{
                  padding:'12px', borderRadius:'12px', background:'rgba(255,255,255,0.03)',
                  border:'1px solid rgba(255,255,255,0.08)', color:'#cbd5e1', fontSize:'12px',
                  fontWeight:700, cursor:'pointer', transition:'all 0.2s', textTransform:'uppercase',
                  letterSpacing:'0.06em', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'
                }} className="print-btn">
                  Print Confirmation Receipt
                </button>
                <button onClick={() => { setResult(null); setStep(1); setForm({name:'',contact:'',incidentType:'',incidentDate:'',location:'',description:'',witnesses:'',accused:''}); setRefNo('') }} style={{
                  padding:'12px', borderRadius:'12px', background:'transparent',
                  border:'1px solid rgba(51,65,85,0.7)', color:'#64748b', fontSize:'12px',
                  fontWeight:700, cursor:'pointer', transition:'all 0.2s', textTransform:'uppercase',
                  letterSpacing:'0.06em', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#38bdf8'; e.currentTarget.style.color='#38bdf8'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(51,65,85,0.7)'; e.currentTarget.style.color='#64748b'}}>
                  <ArrowRight size={13} style={{transform:'rotate(180deg)'}}/> File Another Complaint
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin     { to { transform:rotate(360deg) } }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }

        select option { background:#0f172a; }

        .submit-btn:hover {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
        }

        .copy-btn:hover {
          background: rgba(52,211,153,0.18) !important;
          border-color: #34d399 !important;
        }

        .print-btn:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.2) !important;
          color: #f1f5f9 !important;
        }

        .hero-feature-item:hover {
          transform: translateX(4px);
        }

        @media print {
          header, .hero-panel, .print-btn, button { display: none !important; }
          .split-layout { display: block !important; }
          .form-panel { padding: 0 !important; background: white !important; color: black !important; }
          body { background: white !important; color: black !important; }
          .case-tab { border: 1px solid #ccc !important; color: black !important; }
        }

        @media(max-width:900px) {
          .split-layout { flex-direction: column !important; }
          .hero-panel { width:100% !important; padding:32px 24px !important; }
          .form-panel { padding:32px 24px !important; }
          .form-2col { grid-template-columns:1fr !important; }
        }
      `}</style>
    </div>
  )
}
