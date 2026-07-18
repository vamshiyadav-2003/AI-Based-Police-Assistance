import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Send, CheckCircle2, AlertCircle, Copy, Loader2, FileText, Zap, Lock, Hash, ChevronDown, ChevronUp, ArrowRight, Eye, EyeOff, Calendar, MapPin, User, Phone, BookOpen, UserCheck, Scale, ArrowLeft } from 'lucide-react'
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
  Low:      { c:'#34d399', bg:'rgba(52,211,153,0.06)',  b:'rgba(52,211,153,0.2)'  },
  Medium:   { c:'#fbbf24', bg:'rgba(251,191,36,0.06)',  b:'rgba(251,191,36,0.2)'  },
  High:     { c:'#f97316', bg:'rgba(249,115,22,0.06)',  b:'rgba(249,115,22,0.2)'  },
  Critical: { c:'#ef4444', bg:'rgba(239,68,68,0.06)',   b:'rgba(239,68,68,0.2)'   },
}

function FormField({ label, icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {Icon && <Icon size={12} style={{ color: '#38bdf8' }} />}
        {label}
      </label>
      {children}
    </div>
  )
}

function StyledInput({ label, name, value, onChange, type='text', placeholder, required, icon: Icon, as: Tag='input', rows }) {
  const [focus, setFocus] = useState(false)
  return (
    <FormField label={label} icon={Icon}>
      <Tag
        type={Tag === 'input' ? type : undefined}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '12px 14px',
          background: focus ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.3)',
          border: `1px solid ${focus ? '#38bdf8' : 'rgba(51, 65, 85, 0.5)'}`,
          borderRadius: '8px',
          color: '#f1f5f9',
          fontSize: '13.5px',
          outline: 'none',
          transition: 'all 0.2s ease',
          boxShadow: focus ? '0 0 0 3px rgba(56, 189, 248, 0.15)' : 'none',
          resize: rows ? 'vertical' : undefined,
          fontFamily: 'inherit'
        }}
      />
    </FormField>
  )
}

export default function CitizenPortal() {
  const navigate = useNavigate()
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GROQ_API_KEY || '')
  const [showApiPanel, setShowApiPanel] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [apiKeySet, setApiKeySet] = useState(true)
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
    <div style={{ minHeight:'100vh', background:'#020617', color:'#f1f5f9', fontFamily:"'Inter', system-ui, sans-serif", display:'flex', flexDirection:'column' }}>
      
      {/* ── BACKGROUND GRADIENTS ── */}
      <div style={{ position:'absolute', top:0, left:'15%', width:'70%', height:'450px', borderRadius:'50%', background:'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 80%)', filter:'blur(80px)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'absolute', bottom:0, right:'10%', width:'40%', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 80%)', filter:'blur(80px)', pointerEvents:'none', zIndex:0 }} />

      {/* ── TOPBAR ── */}
      <header style={{
        background:'rgba(10,15,30,0.85)', borderBottom:'1px solid rgba(51,65,85,0.4)',
        padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between',
        backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:50, flexShrink:0
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
          {/* Back Button */}
          <button onClick={() => navigate('/login')} style={{
            background:'rgba(255,255,255,0.03)', border:'1px solid rgba(51,65,85,0.5)',
            borderRadius:'8px', padding:'6px 12px', color:'#cbd5e1', fontSize:'11.5px',
            fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px',
            transition:'all 0.15s'
          }} className="back-btn-hover">
            <ArrowLeft size={13} /> Back
          </button>
          
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{
              width:34, height:34, borderRadius:'9px',
              background:'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(6,182,212,0.05))',
              border:'1px solid rgba(56,189,248,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <Shield size={16} color="#38bdf8" />
            </div>
            <div>
              <p style={{ fontSize:'13px', fontWeight:800, color:'#f1f5f9', margin:0, letterSpacing:'0.05em', textTransform:'uppercase' }}>GVAK Command</p>
              <p style={{ fontSize:'8px', color:'#475569', margin:0, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'monospace' }}>Secure Citizen Portal</p>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap: '8px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 12px', background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:'12px' }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'pulse 1.4s ease-in-out infinite' }} />
            <span style={{ fontSize:'8px', color:'#10b981', fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'monospace' }}>SECURE CHANNEL</span>
          </div>

          <button onClick={()=>setShowApiPanel(v=>!v)} style={{
            display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'10px',
            background: apiKeySet ? 'rgba(56,189,248,0.08)' : 'rgba(251,191,36,0.06)',
            border: `1px solid ${apiKeySet ? 'rgba(56,189,248,0.2)' : 'rgba(251,191,36,0.15)'}`,
            color: apiKeySet ? '#38bdf8' : '#fbbf24', fontSize:'9px', fontWeight:700,
            textTransform:'uppercase', letterSpacing:'0.06em', cursor:'pointer', transition:'all 0.15s'
          }}>
            {apiKeySet ? <CheckCircle2 size={11}/> : <Lock size={11}/>}
            {apiKeySet ? 'AI Active' : 'Set API Key'}
          </button>
        </div>
      </header>

      {/* API Key Config Panel */}
      {showApiPanel && (
        <div style={{ background:'rgba(10,15,30,0.95)', borderBottom:'1px solid rgba(51,65,85,0.4)', padding:'16px 28px', display:'flex', gap:'12px', alignItems:'flex-end', flexWrap:'wrap', zIndex:40, position:'relative', backdropFilter:'blur(20px)' }}>
          <div style={{ flex:1, minWidth:'280px' }}>
            <label style={{ display:'block', fontSize:'9px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#64748b', marginBottom:'6px' }}>Groq API Key</label>
            <div style={{ position:'relative' }}>
              <input
                type={showKey ? 'text' : 'password'} value={apiKey} onChange={e=>setApiKey(e.target.value)}
                placeholder="gsk_xxxxxxxxxxxxxxxx"
                style={{ width:'100%', boxSizing:'border-box', padding:'10px 40px 10px 12px', background:'rgba(15, 23, 42, 0.8)', border:'1px solid rgba(51,65,85,0.6)', borderRadius:'8px', color:'#f1f5f9', fontSize:'13.5px', fontFamily:'monospace', outline:'none' }}
              />
              <button type="button" onClick={()=>setShowKey(v=>!v)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#475569', cursor:'pointer' }}>
                {showKey ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
            {apiKeyError && <p style={{ fontSize:'10px', color:'#ef4444', margin:'4px 0 0' }}>{apiKeyError}</p>}
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={confirmApiKey} style={{ padding:'10px 18px', borderRadius:'8px', background:'linear-gradient(135deg, #0ea5e9, #06b6d4)', border:'none', color:'#fff', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', cursor:'pointer' }}>
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* ── SCROLLABLE CONTAINER ── */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', alignItems:'center', padding: '36px 16px', zIndex:1 }}>
        
        {/* ── HERO INTRODUCTION HEADER ── */}
        {step === 1 && (
          <div style={{ textAlign:'center', maxWidth:'720px', marginBottom:'40px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 12px', borderRadius:'20px', background:'rgba(56,189,248,0.05)', border:'1px solid rgba(56,189,248,0.15)', marginBottom:'18px' }}>
              <Zap size={11} color="#38bdf8" />
              <span style={{ fontSize:'9px', fontWeight:800, color:'#38bdf8', letterSpacing:'0.06em', textTransform:'uppercase' }}>INSTANT ADVANCED CASE ROUTING</span>
            </div>
            <h1 style={{ fontSize:'32px', fontWeight:900, color:'#f1f5f9', margin:'0 0 12px', lineHeight:1.2, letterSpacing:'-0.02em' }}>
              File Official Police Complaint
            </h1>
            <p style={{ fontSize:'13.5px', color:'#94a3b8', lineHeight:1.6, margin:0, maxWidth:'600px', marginLeft:'auto', marginRight:'auto' }}>
              Submit your report directly into the Command Queue. Our automated assistant processes incident details, applies relevant legal codes, and flags high-priority items instantly for officer review.
            </p>

            {/* Quick stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', maxWidth:'480px', margin:'28px auto 0' }}>
              <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(51,65,85,0.3)', borderRadius:'10px', padding:'10px' }}>
                <p style={{ fontSize:'16px', fontWeight:800, color:'#f1f5f9', margin:0, fontFamily:'monospace' }}>2.4 Min</p>
                <p style={{ fontSize:'8px', color:'#64748b', margin:'2px 0 0', textTransform:'uppercase', letterSpacing:'0.05em' }}>Avg AI Classification</p>
              </div>
              <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(51,65,85,0.3)', borderRadius:'10px', padding:'10px' }}>
                <p style={{ fontSize:'16px', fontWeight:800, color:'#10b981', margin:0, fontFamily:'monospace' }}>100%</p>
                <p style={{ fontSize:'8px', color:'#64748b', margin:'2px 0 0', textTransform:'uppercase', letterSpacing:'0.05em' }}>Secure Encryption</p>
              </div>
              <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(51,65,85,0.3)', borderRadius:'10px', padding:'10px' }}>
                <p style={{ fontSize:'16px', fontWeight:800, color:'#3b82f6', margin:0, fontFamily:'monospace' }}>HQ Queue</p>
                <p style={{ fontSize:'8px', color:'#64748b', margin:'2px 0 0', textTransform:'uppercase', letterSpacing:'0.05em' }}>Direct Dispatch</p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: FORM DOCKET ── */}
        {step === 1 && (
          <div style={{ width:'100%', maxWidth:'780px', background:'rgba(10,15,30,0.8)', border:'1px solid rgba(51,65,85,0.4)', borderRadius:'16px', boxShadow:'0 20px 40px rgba(0,0,0,0.5)', overflow:'hidden', backdropFilter:'blur(20px)' }}>
            
            {/* Form Banner Header */}
            <div style={{ padding:'20px 28px', background:'rgba(15, 23, 42, 0.4)', borderBottom:'1px solid rgba(51,65,85,0.4)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <Scale size={16} color="#38bdf8" />
                <span style={{ fontSize:'11px', fontWeight:800, color:'#38bdf8', textTransform:'uppercase', letterSpacing:'0.08em' }}>Official Incident Registry</span>
              </div>
              <span style={{ fontSize:'10px', color:'#64748b', fontFamily:'monospace' }}>FORM-PART-I</span>
            </div>

            {error && (
              <div style={{ margin:'20px 28px 0', padding:'12px 16px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', display:'flex', gap:10, color:'#ef4444', fontSize:'12.5px', alignItems:'center' }}>
                <AlertCircle size={15} style={{flexShrink:0}} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ padding:'28px', display:'flex', flexDirection:'column', gap:'28px' }}>
              
              {/* Complainant Section */}
              <div>
                <p style={{ fontSize:'10px', fontWeight:800, color:'#38bdf8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 16px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ width:16, height:16, borderRadius:'50%', background:'rgba(56,189,248,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', color:'#38bdf8' }}>1</span>
                  Complainant Personal Details
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }} className="grid-responsive">
                  <StyledInput label="Full Name" name="name" value={form.name} onChange={upd} placeholder="e.g. Aman Sharma" required icon={User} />
                  <StyledInput label="Contact Number" name="contact" value={form.contact} onChange={upd} placeholder="e.g. 9876543210" required type="tel" icon={Phone} />
                </div>
              </div>

              <div style={{ height:'1px', background:'rgba(51,65,85,0.2)' }} />

              {/* Incident Details Section */}
              <div>
                <p style={{ fontSize:'10px', fontWeight:800, color:'#38bdf8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 16px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ width:16, height:16, borderRadius:'50%', background:'rgba(56,189,248,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', color:'#38bdf8' }}>2</span>
                  Incident Specifications
                </p>
                
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px' }} className="grid-responsive">
                  <FormField label="Incident Category" icon={BookOpen}>
                    <select name="incidentType" value={form.incidentType} onChange={upd} required
                      style={{
                        width:'100%', boxSizing:'border-box', padding:'12px 14px',
                        background:'rgba(15, 23, 42, 0.3)', border:'1px solid rgba(51, 65, 85, 0.5)',
                        borderRadius:'8px', color: form.incidentType ? '#f1f5f9' : '#94a3b8', fontSize:'13.5px',
                        outline:'none', cursor:'pointer', height:'46px'
                      }}>
                      <option value="">Select type...</option>
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
                  </FormField>
                  <StyledInput label="Incident Date" name="incidentDate" value={form.incidentDate} onChange={upd} type="date" required icon={Calendar} />
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                  <StyledInput label="Exact Address / Location" name="location" value={form.location} onChange={upd} placeholder="e.g. Near HDFC Bank ATM, Madhapur, Hyderabad" required icon={MapPin} />
                  <StyledInput label="Detailed Description of the Event" name="description" as="textarea" rows={4} value={form.description} onChange={upd} placeholder="Provide details like timeline of events, suspect actions, item specifications..." required icon={FileText} />
                </div>
              </div>

              <div style={{ height:'1px', background:'rgba(51,65,85,0.2)' }} />

              {/* Witnesses and Suspects Section */}
              <div>
                <p style={{ fontSize:'10px', fontWeight:800, color:'#38bdf8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 16px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ width:16, height:16, borderRadius:'50%', background:'rgba(56,189,248,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', color:'#38bdf8' }}>3</span>
                  Witnesses & Suspects (Optional)
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }} className="grid-responsive">
                  <StyledInput label="Witnesses Details" name="witnesses" value={form.witnesses} onChange={upd} placeholder="Names, contact info if any" icon={UserCheck} />
                  <StyledInput label="Suspect Description" name="accused" value={form.accused} onChange={upd} placeholder="Name, clothing, vehicle details" icon={User} />
                </div>
              </div>

              {/* Legal Warning Disclaimer */}
              <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.03)', borderRadius:'8px', border:'1px solid rgba(239,68,68,0.15)', display:'flex', gap:'10px', alignItems:'flex-start' }}>
                <span style={{ fontSize:'14px', flexShrink:0 }}>⚠️</span>
                <p style={{ fontSize:'11.5px', color:'#94a3b8', margin:0, lineHeight:1.5 }}>
                  <strong>Legal Notice:</strong> Filing a false complaint or deliberately misrepresenting facts is an offense punishable under Indian Penal Code (IPC) Section 182 / Bharatiya Nyaya Sanhita (BNS) codes.
                </p>
              </div>

              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'14px', borderRadius:'8px',
                background: loading ? 'rgba(51,65,85,0.3)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                border:'none', color:'#fff', fontSize:'13px', fontWeight:750,
                textTransform:'uppercase', letterSpacing:'0.08em', cursor: loading ? 'not-allowed' : 'pointer',
                transition:'transform 0.15s, opacity 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                boxShadow:'0 4px 20px rgba(14,165,233,0.25)'
              }}
              className="submit-button">
                {loading ? (
                  <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }} /> Processing case data with Groq AI...</>
                ) : (
                  <><Send size={13} /> Submit Official Complaint</>
                )}
              </button>

            </form>
          </div>
        )}

        {/* ── STEP 2: STUNNING CASE DOCKET ── */}
        {step === 2 && result && (
          <div style={{ width:'100%', maxWidth:'780px', display:'flex', flexDirection:'column', gap:'20px', animation:'fadeUp 0.4s ease' }}>
            
            {/* Case Success header card */}
            <div style={{ padding:'32px 28px', background:'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.02))', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'16px', textAlign:'center', position:'relative', overflow:'hidden', backdropFilter:'blur(20px)' }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <CheckCircle2 size={20} color="#10b981" />
              </div>
              <h2 style={{ fontSize:'20px', fontWeight:900, color:'#f1f5f9', margin:'0 0 6px', letterSpacing:'-0.01em' }}>Complaint Registered</h2>
              <p style={{ fontSize:'12px', color:'#94a3b8', margin:'0 0 16px' }}>Your complaint has been queued for review and assignment.</p>

              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(15, 23, 42, 0.6)', border:'1px solid rgba(51, 65, 85, 0.5)', padding:'8px 16px', borderRadius:'10px' }}>
                <span style={{ fontSize:'10px', color:'#64748b', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>TRACKING ID:</span>
                <span style={{ fontSize:'16px', fontWeight:900, color:'#f1f5f9', fontFamily:'monospace', letterSpacing:'0.05em' }}>{refNo}</span>
                <button onClick={copyRef} style={{ background:'none', border:'none', color:'#38bdf8', cursor:'pointer', display:'flex', alignItems:'center', padding:'2px', marginLeft:'6px' }}>
                  {copied ? <CheckCircle2 size={13} color="#10b981" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            {/* AI Docket / Legal Case Assessment */}
            <div style={{ background:'rgba(10,15,30,0.8)', border:'1px solid rgba(51,65,85,0.4)', borderRadius:'16px', overflow:'hidden', backdropFilter:'blur(20px)' }}>
              <div style={{ padding:'16px 24px', background:'rgba(15, 23, 42, 0.4)', borderBottom:'1px solid rgba(51,65,85,0.4)', display:'flex', alignItems:'center', gap:'8px' }}>
                <Zap size={14} color="#38bdf8" />
                <span style={{ fontSize:'10px', fontWeight:850, color:'#38bdf8', textTransform:'uppercase', letterSpacing:'0.08em' }}>Legal Case Assessment Docket (GVAK-AI Engine)</span>
              </div>

              <div style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'20px' }}>
                
                {/* Legal Docket Info Grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px' }} className="grid-responsive">
                  <div style={{ background:'rgba(15, 23, 42, 0.3)', border:'1px solid rgba(51,65,85,0.2)', borderRadius:'10px', padding:'12px 16px' }}>
                    <span style={{ display:'block', fontSize:'8.5px', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Crime Classification</span>
                    <span style={{ fontSize:'13.5px', fontWeight:800, color:'#38bdf8', display:'block', marginTop:'4px' }}>🔍 {result.crime_category}</span>
                  </div>
                  <div style={{ background:'rgba(15, 23, 42, 0.3)', border:'1px solid rgba(51,65,85,0.2)', borderRadius:'10px', padding:'12px 16px' }}>
                    <span style={{ display:'block', fontSize:'8.5px', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Severity Matrix</span>
                    <span style={{ fontSize:'13.5px', fontWeight:800, color:sev.c, display:'block', marginTop:'4px' }}>⚡ {result.severity}</span>
                  </div>
                  <div style={{ background:'rgba(15, 23, 42, 0.3)', border:'1px solid rgba(51,65,85,0.2)', borderRadius:'10px', padding:'12px 16px' }}>
                    <span style={{ display:'block', fontSize:'8.5px', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Estimated Dispatch</span>
                    <span style={{ fontSize:'13.5px', fontWeight:800, color:'#c4b5fd', display:'block', marginTop:'4px' }}>⏱ {result.estimated_response_time}</span>
                  </div>
                </div>

                {/* Complaint Summary */}
                <div style={{ padding:'16px', background:'rgba(15, 23, 42, 0.3)', border:'1px solid rgba(51,65,85,0.2)', borderRadius:'10px' }}>
                  <span style={{ display:'block', fontSize:'8.5px', color:'#38bdf8', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px' }}>Official Summary (3rd Person)</span>
                  <p style={{ fontSize:'13px', color:'#e2e8f0', margin:0, lineHeight:1.6 }}>{result.complaint_summary}</p>
                </div>

                {/* IPC / Legal sections */}
                <div>
                  <span style={{ display:'block', fontSize:'8.5px', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px' }}>CITED LEGAL STATUTES</span>
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {result.ipc_sections?.map((section, idx) => (
                      <div key={idx} style={{ display:'flex', gap:'14px', alignItems:'flex-start', padding:'14px', background:'rgba(15, 23, 42, 0.4)', border:'1px solid rgba(51, 65, 85, 0.3)', borderRadius:'10px' }}>
                        <span style={{ fontSize:'11px', fontWeight:900, color:'#fbbf24', fontFamily:'monospace', background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.15)', padding:'3px 8px', borderRadius:'4px', whiteSpace:'nowrap' }}>SEC {section}</span>
                        <p style={{ fontSize:'12.5px', color:'#cbd5e1', margin:0, lineHeight:1.5 }}>{result.ipc_descriptions?.[idx]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended dispatch routing */}
                <div style={{ padding:'14px 16px', background:'rgba(99,102,241,0.04)', border:'1px solid rgba(99,102,241,0.12)', borderRadius:'10px' }}>
                  <span style={{ display:'block', fontSize:'8.5px', color:'#818cf8', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px' }}>Recommended Command Routing</span>
                  <p style={{ fontSize:'12.5px', color:'#c4b5fd', margin:0, lineHeight:1.5 }}>{result.recommended_action}</p>
                </div>

              </div>
            </div>

            {/* Print and new submission buttons */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }} className="grid-responsive">
              <button onClick={() => window.print()} style={{
                padding:'12px 18px', borderRadius:'8px', background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.08)', color:'#cbd5e1', fontSize:'11px',
                fontWeight:800, cursor:'pointer', transition:'all 0.15s', textTransform:'uppercase',
                letterSpacing:'0.05em'
              }} className="print-btn-hover">
                Print Official Receipt
              </button>
              <button onClick={() => { setStep(1); setResult(null); setRefNo(''); setForm({name:'',contact:'',incidentType:'',incidentDate:'',location:'',description:'',witnesses:'',accused:''}) }} style={{
                padding:'12px 18px', borderRadius:'8px', background:'rgba(14,165,233,0.08)',
                border:'1px solid rgba(14,165,233,0.2)', color:'#38bdf8', fontSize:'11px',
                fontWeight:800, cursor:'pointer', transition:'all 0.15s', textTransform:'uppercase',
                letterSpacing:'0.05em'
              }} className="new-btn-hover">
                File Another Complaint
              </button>
            </div>

          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          opacity: 0.95;
        }
        .print-btn-hover:hover {
          background: rgba(255,255,255,0.07) !important;
          border-color: rgba(255,255,255,0.15) !important;
          color: #f1f5f9 !important;
        }
        .back-btn-hover:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
          color: #f1f5f9 !important;
        }
        .new-btn-hover:hover {
          background: rgba(14,165,233,0.15) !important;
          border-color: rgba(14,165,233,0.35) !important;
        }
        select option {
          background: #0f172a;
          color: #f1f5f9;
        }

        @media (max-width: 640px) {
          .grid-responsive {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
        @media print {
          header, button, .print-btn-hover, .new-btn-hover {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

    </div>
  )
}
