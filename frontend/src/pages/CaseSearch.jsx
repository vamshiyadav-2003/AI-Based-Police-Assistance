import { useState } from 'react'
import { Search, Sparkles, FolderKanban, Terminal, ArrowRight, CornerDownLeft } from 'lucide-react'
import api from '../api/client.js'

const PRESETS = [
  "robbery cases involving motorcycles",
  "cyber crimes reported in June",
  "missing person cases",
  "solved cases under district zone"
]

export default function CaseSearch() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  async function handleSearch(e, text = query) {
    if (e) e.preventDefault()
    const finalQuery = text.trim()
    if (!finalQuery) return
    
    setLoading(true)
    try {
      const res = await api.post('/search/', { query: finalQuery })
      setResult(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', animation: 'fadeUp 0.4s ease' }}>
        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FolderKanban size={18} color="#fbbf24" />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>Smart Case Search</h1>
          <p style={{ fontSize: '11px', color: '#475569', margin: 0, letterSpacing: '0.04em' }}>Search the criminal database in natural language using semantic match intelligence</p>
        </div>
      </div>

      {/* Semantic Search Box */}
      <div style={{
        background: 'rgba(10,17,34,0.85)', border: '1px solid rgba(30,41,59,0.8)',
        borderRadius: '16px', padding: '24px', marginBottom: '24px',
        animation: 'fadeUp 0.4s ease 0.1s both'
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="e.g. robbery cases involving motorcycles in the last 6 months"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '14px 44px 14px 16px',
                background: focused ? 'rgba(251,191,36,0.04)' : 'rgba(2,6,23,0.7)',
                border: `1px solid ${focused ? 'rgba(251,191,36,0.45)' : 'rgba(30,41,59,0.8)'}`,
                borderRadius: '12px', color: '#f1f5f9', fontSize: '13px', outline: 'none',
                transition: 'all 0.2s'
              }}
            />
            <CornerDownLeft size={12} color="#334155" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button type="submit" disabled={loading || !query.trim()} style={{
            padding: '0 24px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none', color: '#0c0800', fontSize: '11px', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
            transition: 'all 0.2s', opacity: (loading || !query.trim()) ? 0.5 : 1,
            boxShadow: '0 4px 16px rgba(245,158,11,0.2)'
          }}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Preset query suggestion chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.08em' }}>SUGGESTIONS:</span>
          {PRESETS.map((p, idx) => (
            <button key={idx} onClick={() => handleSend(p)} style={{
              padding: '6px 12px', borderRadius: '8px', background: 'rgba(2,6,23,0.5)',
              border: '1px solid rgba(30,41,59,0.6)', color: '#94a3b8', fontSize: '10.5px',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.color = '#fbbf24' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,41,59,0.6)'; e.currentTarget.style.color = '#94a3b8' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Results dossier */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeUp 0.4s ease 0.2s both' }}>
          
          {/* AI Answer Summary */}
          <div style={{
            background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
            borderRadius: '16px', padding: '24px', display: 'flex', gap: '16px'
          }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={14} color="#fbbf24" />
            </div>
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>AI Intelligence synthesis</h3>
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{result.answer}</p>
            </div>
          </div>

          {/* Connected Case Records */}
          {result.cases && result.cases.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '8px 0 0' }}>Matching Database Records ({result.cases.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }} className="form-cols">
                {result.cases.map(c => (
                  <div key={c.id} style={{
                    background: 'rgba(10,17,34,0.8)', border: '1px solid rgba(30,41,59,0.8)',
                    borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden'
                  }} className="case-card">
                    {/* Left folder tab line */}
                    <div style={{ position: 'absolute', left: 0, top: '16px', bottom: '16px', width: '3px', borderRadius: '2px', background: '#fbbf24' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', color: '#64748b' }}>CASE FILE #{c.id}</span>
                      {c.metadata?.crime_type && (
                        <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fbbf24', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                          {c.metadata.crime_type}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        input::placeholder { color:#1e293b !important; }
        
        @media (max-width: 800px) {
          .form-cols {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )

  function handleSend(presetText) {
    setQuery(presetText)
    handleSearch(null, presetText)
  }
}
