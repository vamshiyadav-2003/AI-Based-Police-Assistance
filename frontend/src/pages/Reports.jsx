import { useEffect, useState } from 'react'
import { FileText, FileSpreadsheet, Upload, AlertCircle, Copy, CheckCircle2, ChevronRight, Sparkles, FolderOpen, AlertTriangle } from 'lucide-react'
import api from '../api/client.js'

function FormSelect({ label, value, onChange, options }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{
        display: 'block', fontSize: '9px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        color: focused ? '#fbbf24' : '#475569', marginBottom: '6px', transition: 'color 0.2s'
      }}>{label}</label>
      <select
        value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '10px 12px',
          background: 'rgba(2,6,23,0.7)',
          border: `1px solid ${focused ? 'rgba(251,191,36,0.45)' : 'rgba(30,41,59,0.8)'}`,
          borderRadius: '10px', color: '#f1f5f9', fontSize: '12px', outline: 'none',
          cursor: 'pointer', transition: 'all 0.2s'
        }}
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  )
}

export default function Reports() {
  // Report Generator State
  const [reportType, setReportType] = useState('Daily')
  const [caseId, setCaseId] = useState('')
  const [generatedReport, setGeneratedReport] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [focusedCase, setFocusedCase] = useState(false)

  // Evidence Summarizer State
  const [file, setFile] = useState(null)
  const [summaryResult, setSummaryResult] = useState(null)
  const [summarizing, setSummarizing] = useState(false)
  const [summarizerError, setSummarizerError] = useState(null)

  // Archive State
  const [reportsList, setReportsList] = useState([])
  const [selectedArchiveReport, setSelectedArchiveReport] = useState(null)
  const [copied, setCopied] = useState(false)

  async function fetchReportsList() {
    try {
      const res = await api.get('/reports/')
      setReportsList(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchReportsList()
  }, [])

  async function handleGenerateReport(e) {
    e.preventDefault()
    setGenerating(true)
    setGeneratedReport(null)
    try {
      const payload = { report_type: reportType }
      if (reportType === 'Case Summary') {
        payload.case_id = parseInt(caseId)
      }
      const res = await api.post('/reports/generate', payload)
      setGeneratedReport(res.data)
      fetchReportsList()
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setSummaryResult(null)
      setSummarizerError(null)
    }
  }

  async function handleSummarizeEvidence(e) {
    e.preventDefault()
    if (!file) return

    setSummarizing(true)
    setSummarizerError(null)
    setSummaryResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('/evidence/summarize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setSummaryResult(res.data)
    } catch (err) {
      console.error(err)
      if (err.response && err.response.data && err.response.data.detail) {
        setSummarizerError(err.response.data.detail)
      } else {
        setSummarizerError("An error occurred during AI analysis. Ensure the file is a text or PDF format.")
      }
    } finally {
      setSummarizing(false)
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', animation: 'fadeUp 0.4s ease' }}>
        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={18} color="#fbbf24" />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>AI Crime Reports & Forensics</h1>
          <p style={{ fontSize: '11px', color: '#475569', margin: 0, letterSpacing: '0.04em' }}>Compile summaries and extract forensic intelligence from evidence documents</p>
        </div>
      </div>

      {/* Grid panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px', animation: 'fadeUp 0.4s ease 0.1s both' }} className="grid-cols">
        
        {/* Section 1: AI Report Compiler */}
        <div style={{
          background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
          borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileSpreadsheet size={14} /> AI Report Generator
            </h2>
            <form onSubmit={handleGenerateReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <FormSelect
                label="Report Type" value={reportType} onChange={e => setReportType(e.target.value)}
                options={[
                  { value: 'Daily', label: 'Daily Activity Report' },
                  { value: 'Weekly', label: 'Weekly Crime Analytics' },
                  { value: 'Case Summary', label: 'Specific Case Summary' }
                ]}
              />

              {reportType === 'Case Summary' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', marginBottom: '6px' }}>Database Case ID *</label>
                  <input
                    type="number" required value={caseId} onChange={e => setCaseId(e.target.value)}
                    onFocus={() => setFocusedCase(true)} onBlur={() => setFocusedCase(false)}
                    placeholder="e.g. 1"
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                      background: 'rgba(2,6,23,0.7)',
                      border: `1px solid ${focusedCase ? 'rgba(251,191,36,0.45)' : 'rgba(30,41,59,0.8)'}`,
                      borderRadius: '10px', color: '#f1f5f9', fontSize: '12px', outline: 'none'
                    }}
                  />
                </div>
              )}

              <button type="submit" disabled={generating} style={{
                padding: '12px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none', color: '#0c0800', fontSize: '11px', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
                transition: 'all 0.2s', opacity: generating ? 0.5 : 1,
                boxShadow: '0 4px 16px rgba(245,158,11,0.2)'
              }}>
                {generating ? 'Drafting AI Summary...' : 'Compile AI Report'}
              </button>
            </form>
          </div>

          {generatedReport && (
            <div style={{
              marginTop: '20px', background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(30,41,59,0.8)',
              padding: '16px', borderRadius: '12px', position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(30,41,59,0.4)', marginBottom: '10px' }}>
                <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#64748b' }}>Reference: {generatedReport.report_id} | Date: {generatedReport.report_date}</span>
                <button onClick={() => copyToClipboard(generatedReport.summary)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {copied ? <CheckCircle2 size={11} color="#34d399" /> : <Copy size={11} />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{generatedReport.summary}</div>
            </div>
          )}
        </div>

        {/* Section 2: Evidence Summarizer */}
        <div style={{
          background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
          borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={14} /> Evidence Document Analyzer
            </h2>
            <form onSubmit={handleSummarizeEvidence} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{
                border: '2px dashed rgba(30,41,59,0.8)', borderRadius: '12px', padding: '24px 16px',
                textAlign: 'center', position: 'relative', cursor: 'pointer', background: 'rgba(2,6,23,0.5)',
                transition: 'border 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#fbbf24'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(30,41,59,0.8)'}>
                <input type="file" accept=".pdf,.txt" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                <Upload size={22} color="#64748b" style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 700, margin: '0 0 4px' }}>
                  {file ? file.name : 'Select or drop forensic report file'}
                </p>
                <p style={{ fontSize: '8px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>PDF or TXT formats (Max 5MB)</p>
              </div>

              <button type="submit" disabled={summarizing || !file} style={{
                padding: '12px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none', color: '#0c0800', fontSize: '11px', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
                transition: 'all 0.2s', opacity: (summarizing || !file) ? 0.5 : 1,
                boxShadow: '0 4px 16px rgba(245,158,11,0.2)'
              }}>
                {summarizing ? 'Analyzing Forensic File...' : 'Extract Intelligence Findings'}
              </button>
            </form>
          </div>

          {summarizerError && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#fca5a5', fontSize: '11px', display: 'flex', gap: '8px' }}>
              <AlertCircle size={14} color="#ef4444" style={{ shrink: 0 }} />
              <span>{summarizerError}</span>
            </div>
          )}

          {summaryResult && (
            <div style={{ marginTop: '20px', background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(30,41,59,0.8)', padding: '18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h4 style={{ fontSize: '9px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>AI Executive Summary</h4>
                <p style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>{summaryResult.summary}</p>
              </div>

              {summaryResult.important_points?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '9px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Key Findings</h4>
                  <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
                    {summaryResult.important_points.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}

              {/* Suspect / Location Meta columns */}
              <div style={{ borderTop: '1px solid rgba(30,41,59,0.5)', paddingTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }} className="grid-cols">
                <div>
                  <span style={{ fontSize: '8px', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Suspects</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {summaryResult.suspects?.length > 0 ? summaryResult.suspects.map((s, i) => (
                      <span key={i} style={{ fontSize: '8.5px', fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{s}</span>
                    )) : <span style={{ fontSize: '10px', color: '#334155', fontStyle: 'italic' }}>None detected</span>}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '8px', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Locations</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {summaryResult.locations?.length > 0 ? summaryResult.locations.map((l, i) => (
                      <span key={i} style={{ fontSize: '8.5px', fontWeight: 700, color: '#e2e8f0', background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(30,41,59,0.8)', padding: '2px 6px', borderRadius: '4px' }}>{l}</span>
                    )) : <span style={{ fontSize: '10px', color: '#334155', fontStyle: 'italic' }}>None detected</span>}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '8px', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Dates Detected</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {summaryResult.dates?.length > 0 ? summaryResult.dates.map((d, i) => (
                      <span key={i} style={{ fontSize: '8.5px', fontWeight: 700, color: '#cbd5e1', background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(30,41,59,0.8)', padding: '2px 6px', borderRadius: '4px' }}>{d}</span>
                    )) : <span style={{ fontSize: '10px', color: '#334155', fontStyle: 'italic' }}>None detected</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Archive Logs Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', animation: 'fadeUp 0.4s ease 0.2s both' }} className="grid-cols">
        
        {/* Archive Selector */}
        <div style={{
          background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
          borderRadius: '16px', padding: '20px'
        }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24', marginBottom: '14px' }}>Archived Reports Log</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
            {reportsList.map(r => (
              <button
                key={r.report_id} onClick={() => setSelectedArchiveReport(r)}
                style={{
                  width: '100%', boxSizing: 'border-box', textAlign: 'left', padding: '12px 14px', borderRadius: '12px',
                  background: selectedArchiveReport?.report_id === r.report_id ? 'rgba(251,191,36,0.06)' : 'rgba(2,6,23,0.5)',
                  border: `1px solid ${selectedArchiveReport?.report_id === r.report_id ? '#fbbf24' : 'rgba(30,41,59,0.6)'}`,
                  color: '#f1f5f9', cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
                onMouseEnter={e => { if (selectedArchiveReport?.report_id !== r.report_id) e.currentTarget.style.borderColor = 'rgba(30,41,59,0.9)' }}
                onMouseLeave={e => { if (selectedArchiveReport?.report_id !== r.report_id) e.currentTarget.style.borderColor = 'rgba(30,41,59,0.6)' }}>
                <div>
                  <p style={{ fontSize: '11.5px', fontWeight: 750, margin: 0 }}>{r.report_type} Report</p>
                  <p style={{ fontSize: '9px', fontFamily: 'monospace', color: '#475569', margin: '2px 0 0' }}>Ref: {r.report_id} · Cases: {r.cases_covered}</p>
                </div>
                <ChevronRight size={13} color="#475569" />
              </button>
            ))}

            {reportsList.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#334155' }}>
                <FolderOpen size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                <span style={{ fontSize: '11px' }}>No reports archived yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* Detailed archive summary panel */}
        <div>
          {selectedArchiveReport ? (
            <div style={{
              background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
              borderRadius: '16px', padding: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(30,41,59,0.6)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 850, color: '#f1f5f9', margin: '0 0 3px' }}>{selectedArchiveReport.report_type} Summary</h3>
                  <p style={{ fontSize: '9.5px', color: '#475569', margin: 0, fontFamily: 'monospace' }}>
                    Reference ID: {selectedArchiveReport.report_id} · Compiled: {selectedArchiveReport.report_date} · Officer Badge: {selectedArchiveReport.generated_by}
                  </p>
                </div>
                <button onClick={() => copyToClipboard(selectedArchiveReport.summary)} style={{
                  background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(30,41,59,0.8)', color: '#94a3b8',
                  fontSize: '10px', fontWeight: 700, cursor: 'pointer', padding: '5px 12px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fbbf24'; e.currentTarget.style.borderColor = '#fbbf24' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(30,41,59,0.8)' }}>
                  {copied ? <CheckCircle2 size={12} color="#34d399" /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy Text'}
                </button>
              </div>

              <div style={{
                fontSize: '12px', color: '#cbd5e1', lineHeight: 1.7,
                maxHeight: '340px', overflowY: 'auto', whiteSpace: 'pre-line'
              }}>{selectedArchiveReport.summary}</div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
              borderRadius: '16px', padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '220px'
            }}>
              <FileText size={36} color="#475569" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#cbd5e1', margin: '0 0 6px' }}>No Dossier Selected</h3>
              <p style={{ fontSize: '11px', color: '#475569', margin: 0, maxWidth: '280px', lineHeight: 1.5 }}>Select a generated archive report item from the log list to read summaries.</p>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        
        @media (max-width: 900px) {
          .grid-cols {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}
