import { useState } from 'react'
import { FileText, ShieldAlert, BadgeInfo, CheckCircle2, Copy, Sparkles, Brain, Cpu, AlertTriangle } from 'lucide-react'
import api from '../api/client.js'

function FormField({ label, placeholder, value, onChange, textarea = false, rows = 3 }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{
        display: 'block', fontSize: '9px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        color: focused ? '#fbbf24' : '#475569', marginBottom: '6px', transition: 'color 0.2s'
      }}>{label}</label>
      {textarea ? (
        <textarea
          rows={rows} placeholder={placeholder} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 12px',
            background: focused ? 'rgba(251,191,36,0.04)' : 'rgba(2,6,23,0.7)',
            border: `1px solid ${focused ? 'rgba(251,191,36,0.4)' : 'rgba(30,41,59,0.8)'}`,
            borderRadius: '10px', color: '#f1f5f9', fontSize: '12px', outline: 'none',
            resize: 'vertical', transition: 'all 0.2s', fontFamily: 'inherit',
            boxShadow: focused ? '0 0 0 3px rgba(251,191,36,0.06)' : 'none'
          }}
        />
      ) : (
        <input
          type="text" placeholder={placeholder} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 12px',
            background: focused ? 'rgba(251,191,36,0.04)' : 'rgba(2,6,23,0.7)',
            border: `1px solid ${focused ? 'rgba(251,191,36,0.4)' : 'rgba(30,41,59,0.8)'}`,
            borderRadius: '10px', color: '#f1f5f9', fontSize: '12px', outline: 'none',
            transition: 'all 0.2s',
            boxShadow: focused ? '0 0 0 3px rgba(251,191,36,0.06)' : 'none'
          }}
        />
      )}
    </div>
  )
}

function SummaryField({ label, value }) {
  if (!value) return null
  return (
    <div style={{ background: 'rgba(2,6,23,0.4)', border: '1px solid rgba(30,41,59,0.4)', padding: '10px 12px', borderRadius: '10px' }}>
      <p style={{ fontSize: '8px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9', margin: 0 }}>{value}</p>
    </div>
  )
}

export default function FIRGenerator() {
  const [activeTab, setActiveTab] = useState('fir')

  // Tab 1: FIR Generator State
  const [firForm, setFirForm] = useState({
    victim_name: '', incident_location: '', incident_date: '',
    incident_details: '', complaint_text: '',
  })
  const [firDraft, setFirDraft] = useState(null)
  const [firLoading, setFirLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Tab 2: Classifier State
  const [classifierText, setClassifierText] = useState('')
  const [classification, setClassification] = useState(null)
  const [classifyLoading, setClassifyLoading] = useState(false)

  async function handleGenerateFIR() {
    setFirLoading(true)
    setFirDraft(null)
    try {
      const combinedNarrative = `
Victim Name: ${firForm.victim_name || 'N/A'}
Incident Location: ${firForm.incident_location || 'N/A'}
Incident Date: ${firForm.incident_date || 'N/A'}
Incident Details: ${firForm.incident_details || 'N/A'}
Additional Complaint Notes: ${firForm.complaint_text || 'N/A'}
      `.trim()

      const res = await api.post('/fir/draft', { complaint_text: combinedNarrative })
      setFirDraft(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setFirLoading(false)
    }
  }

  async function handleClassify() {
    if (!classifierText.trim()) return
    setClassifyLoading(true)
    setClassification(null)
    try {
      const res = await api.post('/complaints/classify', { complaint_text: classifierText })
      setClassification(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setClassifyLoading(false)
    }
  }

  function copyText(text) {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', animation: 'fadeUp 0.4s ease' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={18} color="#fbbf24" />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>AI Complaint Analyst</h1>
          </div>
          <p style={{ fontSize: '11px', color: '#475569', margin: 0, letterSpacing: '0.04em' }}>Automate structured FIR drafts and intelligent category classification</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(30,41,59,0.8)', marginBottom: '28px', gap: '8px', animation: 'fadeUp 0.4s ease 0.1s both' }}>
        <button
          onClick={() => setActiveTab('fir')}
          style={{
            padding: '12px 20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
            background: activeTab === 'fir' ? 'rgba(251,191,36,0.06)' : 'transparent',
            border: 'none', borderBottom: `2px solid ${activeTab === 'fir' ? '#fbbf24' : 'transparent'}`,
            color: activeTab === 'fir' ? '#f1f5f9' : '#475569', cursor: 'pointer', transition: 'all 0.2s'
          }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Cpu size={12} /> AI FIR Generator</span>
        </button>
        <button
          onClick={() => setActiveTab('classify')}
          style={{
            padding: '12px 20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
            background: activeTab === 'classify' ? 'rgba(251,191,36,0.06)' : 'transparent',
            border: 'none', borderBottom: `2px solid ${activeTab === 'classify' ? '#fbbf24' : 'transparent'}`,
            color: activeTab === 'classify' ? '#f1f5f9' : '#475569', cursor: 'pointer', transition: 'all 0.2s'
          }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={12} /> Complaint Classifier</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'fir' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'start' }} className="fir-grid">
          
          {/* Left Form */}
          <div style={{
            background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
            borderRadius: '16px', padding: '24px', animation: 'fadeUp 0.4s ease 0.2s both'
          }}>
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Incident Entry Logs</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="form-cols">
              <FormField label="Victim / Complainant Name" placeholder="e.g. Ramesh Kumar" value={firForm.victim_name} onChange={e => setFirForm({ ...firForm, victim_name: e.target.value })} />
              <FormField label="Incident Date / Time" placeholder="e.g. Yesterday at 8 PM" value={firForm.incident_date} onChange={e => setFirForm({ ...firForm, incident_date: e.target.value })} />
            </div>

            <FormField label="Incident Location" placeholder="e.g. MG Road, Banjara PS limits" value={firForm.incident_location} onChange={e => setFirForm({ ...firForm, incident_location: e.target.value })} />
            <FormField label="Incident Details (What Happened?)" placeholder="e.g. Motorcycle stolen outside shop. Black Honda Activa." value={firForm.incident_details} textarea rows={3} onChange={e => setFirForm({ ...firForm, incident_details: e.target.value })} />
            <FormField label="Additional Complaint Notes" placeholder="Any secondary description or requests..." value={firForm.complaint_text} textarea rows={2} onChange={e => setFirForm({ ...firForm, complaint_text: e.target.value })} />

            <button
              onClick={handleGenerateFIR}
              disabled={firLoading || (!firForm.victim_name && !firForm.incident_details)}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none', color: '#0c0800', fontSize: '11px', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
                transition: 'all 0.2s', opacity: (firLoading || (!firForm.victim_name && !firForm.incident_details)) ? 0.5 : 1,
                boxShadow: '0 4px 20px rgba(245,158,11,0.2)'
              }}>
              {firLoading ? 'Processing Intelligence...' : 'Generate FIR Draft'}
            </button>
          </div>

          {/* Right Result Display */}
          <div style={{
            background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
            borderRadius: '16px', padding: '24px', minHeight: '400px', display: 'flex', flexDirection: 'column',
            animation: 'fadeUp 0.4s ease 0.3s both'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Structured Draft Output</h2>
              {firDraft && !firDraft.error && (
                <button
                  onClick={() => copyText(firDraft.narrative_summary)}
                  style={{
                    background: 'transparent', border: 'none', color: '#94a3b8',
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fbbf24'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                  {copied ? <CheckCircle2 size={13} color="#10b981" /> : <Copy size={13} />}
                  {copied ? 'Copied to Clipboard' : 'Copy Narrative'}
                </button>
              )}
            </div>

            {!firDraft && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#475569', padding: '40px 0' }}>
                <BadgeInfo size={32} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '12px', margin: 0 }}>Complete the incident log entry on the left to compile AI draft.</p>
              </div>
            )}

            {firDraft?.error && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', padding: '14px', borderRadius: '12px', color: '#fca5a5', fontSize: '12px' }}>
                <AlertTriangle size={14} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} />
                {firDraft.error}
              </div>
            )}

            {firDraft && !firDraft.error && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }} className="form-cols">
                  <SummaryField label="Crime Type" value={firDraft.crime_type} />
                  <SummaryField label="Incident Date" value={firDraft.incident_date} />
                  <SummaryField label="Complainant" value={firDraft.complainant_name} />
                  <SummaryField label="Contact Info" value={firDraft.complainant_contact} />
                  <SummaryField label="Incident Location" value={firDraft.incident_location} />
                  <SummaryField label="Vehicle Involved" value={firDraft.vehicle_involved} />
                </div>

                {/* Legal Sections block */}
                <div style={{ borderTop: '1px solid rgba(30,41,59,0.5)', paddingTop: '14px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '8px' }}>Suggested Law Sections</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {firDraft.suggested_sections?.map((s, i) => (
                      <span key={i} style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Narrative Summary */}
                <div style={{ borderTop: '1px solid rgba(30,41,59,0.5)', paddingTop: '14px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '8px' }}>FIR Narrative Summary</p>
                  <div style={{
                    background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(30,41,59,0.8)',
                    padding: '16px', borderRadius: '12px', color: '#e2e8f0', fontSize: '11px',
                    lineHeight: 1.6, whiteSpace: 'pre-line', fontFamily: 'monospace'
                  }}>{firDraft.narrative_summary}</div>
                </div>

                {/* Missing Information panel */}
                {firDraft.missing_information?.length > 0 && (
                  <div style={{
                    background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)',
                    padding: '14px', borderRadius: '12px'
                  }}>
                    <p style={{ fontSize: '9px', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Missing FIR Attributes</p>
                    <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '10px', color: '#94a3b8', lineHeight: 1.6 }}>
                      {firDraft.missing_information.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      ) : (
        /* Classifier Tab */
        <div style={{
          maxWidth: '640px', margin: '0 auto', background: 'rgba(10,17,34,0.8)',
          border: '1px solid rgba(30,41,59,0.8)', borderRadius: '16px', padding: '28px',
          animation: 'fadeUp 0.4s ease 0.2s both'
        }}>
          <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>AI Complaint Classifier</h2>
          <p style={{ fontSize: '10px', color: '#475569', margin: '0 0 20px' }}>Analyze citizen reports for department routing, priority level, and category classification.</p>

          <textarea
            rows={4}
            placeholder="e.g. Someone stole my wallet containing money and bank cards at the bus stand..."
            value={classifierText}
            onChange={e => setClassifierText(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '14px',
              background: 'rgba(2,6,23,0.7)', border: '1px solid rgba(30,41,59,0.8)',
              borderRadius: '12px', color: '#f1f5f9', fontSize: '12px', outline: 'none',
              resize: 'vertical', fontFamily: 'inherit', marginBottom: '16px'
            }}
          />

          <button
            onClick={handleClassify}
            disabled={classifyLoading || !classifierText.trim()}
            style={{
              width: '100%', padding: '12px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none', color: '#0c0800', fontSize: '11px', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
              transition: 'all 0.2s', opacity: (classifyLoading || !classifierText.trim()) ? 0.5 : 1,
              boxShadow: '0 4px 20px rgba(245,158,11,0.2)', marginBottom: classification ? '24px' : 0
            }}>
            {classifyLoading ? 'Running Classification Engine...' : 'Classify Complaint Report'}
          </button>

          {classification && (
            <div style={{ borderTop: '1px solid rgba(30,41,59,0.5)', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '14px' }}>Analysis Output</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }} className="form-cols">
                <div style={{ background: 'rgba(2,6,23,0.5)', border: '1px solid rgba(30,41,59,0.5)', padding: '14px', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '8px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Crime Category</p>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{classification.category}</p>
                </div>
                <div style={{
                  background: classification.priority === 'High' ? 'rgba(239,68,68,0.04)' : 'rgba(2,6,23,0.5)',
                  border: classification.priority === 'High' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(30,41,59,0.5)',
                  padding: '14px', borderRadius: '12px', textAlign: 'center'
                }}>
                  <p style={{ fontSize: '8px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Priority Level</p>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: classification.priority === 'High' ? '#f87171' : '#fbbf24', margin: 0 }}>{classification.priority}</p>
                </div>
                <div style={{ background: 'rgba(2,6,23,0.5)', border: '1px solid rgba(30,41,59,0.5)', padding: '14px', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '8px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Assigned Dept</p>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{classification.suggested_department}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        textarea::placeholder, input::placeholder { color:#1e293b !important; }
        
        .fir-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 28px;
        }

        @media (max-width: 900px) {
          .fir-grid {
            grid-template-columns: 1fr;
          }
          .form-cols {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}
