import { useEffect, useRef, useState } from 'react'
import { Send, Bot, User, Sparkles, Terminal, ArrowRight, CornerDownLeft } from 'lucide-react'
import api from '../api/client.js'

const SUGGESTIONS = [
  "What is BNS Section 303 relative to theft?",
  "Draft an FIR template for a chain snatching complaint",
  "Standard operating procedure for vehicle theft recovery",
  "Explain investigation steps for cyber fraud cases"
]

export default function ChatAssistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    api.get('/chat/history').then((res) => setMessages(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e, text = input) {
    if (e) e.preventDefault()
    const query = text.trim()
    if (!query) return
    
    const userMsg = { role: 'user', content: query }
    setMessages((prev) => [...prev, userMsg])
    if (text === input) setInput('')
    
    setLoading(true)
    try {
      const res = await api.post('/chat/', { message: query })
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '32px', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Terminal size={18} color="#fbbf24" />
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>AI Assistant Command Console</h1>
          </div>
          <p style={{ fontSize: '11px', color: '#475569', margin: 0, letterSpacing: '0.04em' }}>Consult legal codes, standard procedures, or draft intelligence summaries</p>
        </div>
      </div>

      {/* Main Chat Terminal */}
      <div style={{
        flex: 1, overflowY: 'auto', background: 'rgba(10,17,34,0.85)',
        border: '1px solid rgba(30,41,59,0.8)', borderRadius: '16px',
        padding: '24px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '16px'
      }}>
        {messages.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '420px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={22} color="#fbbf24" />
            </div>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>GVAK AI Command Assistant</h2>
            <p style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              Enter a query relative to legal guidelines, case processing templates, or search recommendations. Select a preset query prompt to get started:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '10px' }}>
              {SUGGESTIONS.map((s, idx) => (
                <button key={idx} onClick={() => handleSend(null, s)} style={{
                  padding: '10px 14px', borderRadius: '10px', background: 'rgba(2,6,23,0.5)',
                  border: '1px solid rgba(30,41,59,0.6)', color: '#94a3b8', fontSize: '11px',
                  textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.color = '#fbbf24' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,41,59,0.6)'; e.currentTarget.style.color = '#94a3b8' }}>
                  {s} <ArrowRight size={10} />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isUser = m.role === 'user'
          return (
            <div key={i} style={{
              display: 'flex', gap: '12px', justifyContent: isUser ? 'flex-end' : 'flex-start',
              animation: 'fadeUp 0.3s ease'
            }}>
              {!isUser && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={13} color="#fbbf24" />
                </div>
              )}
              <div style={{
                maxWidth: '70%', padding: '12px 16px', borderRadius: '14px',
                background: isUser ? 'rgba(251,191,36,0.06)' : 'rgba(2,6,23,0.7)',
                border: `1px solid ${isUser ? 'rgba(251,191,36,0.25)' : 'rgba(30,41,59,0.7)'}`,
                color: isUser ? '#f1f5f9' : '#cbd5e1', fontSize: '12.5px', lineHeight: 1.6,
                whiteSpace: 'pre-wrap', position: 'relative'
              }}>
                {m.content}
                <span style={{
                  position: 'absolute', bottom: '-14px', right: isUser ? '4px' : 'auto', left: !isUser ? '4px' : 'auto',
                  fontSize: '8px', color: '#334155', fontFamily: 'monospace', textTransform: 'uppercase'
                }}>
                  {isUser ? 'Officer Input' : 'AI Analysis'}
                </span>
              </div>
              {isUser && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(30,41,59,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={13} color="#94a3b8" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', animation: 'fadeUp 0.2s ease' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={13} color="#fbbf24" />
            </div>
            <div style={{ background: 'rgba(2,6,23,0.5)', border: '1px solid rgba(30,41,59,0.6)', padding: '12px 18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24', animation: 'blink 1.2s infinite 0.2s' }} />
              <span className="dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24', animation: 'blink 1.2s infinite 0.4s' }} />
              <span className="dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24', animation: 'blink 1.2s infinite 0.6s' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Query BNS legal codes, request draft outline templates..."
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '14px 44px 14px 16px',
              background: focused ? 'rgba(251,191,36,0.04)' : 'rgba(10,17,34,0.85)',
              border: `1px solid ${focused ? 'rgba(251,191,36,0.45)' : 'rgba(30,41,59,0.8)'}`,
              borderRadius: '12px', color: '#f1f5f9', fontSize: '13px', outline: 'none',
              transition: 'all 0.2s'
            }}
          />
          <CornerDownLeft size={12} color="#334155" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
        <button type="submit" disabled={loading} style={{
          padding: '0 20px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none', color: '#0c0800', cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(245,158,11,0.2)'
        }}>
          <Send size={15} />
        </button>
      </form>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:0.3} 50%{opacity:1} }
        input::placeholder { color:#1e293b !important; }
      `}</style>

    </div>
  )
}
