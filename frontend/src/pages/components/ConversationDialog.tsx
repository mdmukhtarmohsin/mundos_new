import { useEffect, useMemo, useState } from 'react'
import { X, Bot, User, Smile } from 'lucide-react'
import { api } from '../../api/client'

type Message = {
  id: number
  lead_id: number
  content: string
  sender: 'lead'|'ai'|'human'
  created_at: string
}

type LeadLite = {
  id: number
  name: string
  email: string
  phone?: string
  status: string
  risk_level: string
}

export default function ConversationDialog({ leadId, onClose }: { leadId: number | null, onClose: () => void }) {
  const open = Boolean(leadId)
  const [lead, setLead] = useState<LeadLite | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [composer, setComposer] = useState('')
  const [sendAs, setSendAs] = useState<'human'|'ai'>('human')
  const [demoInput, setDemoInput] = useState('')
  const [status, setStatus] = useState<string>('')
  const [coldReason, setColdReason] = useState('')

  useEffect(() => {
    if (!leadId) return
    const load = async () => {
      const data = await api.get(`/leads/${leadId}`, { params: { include_messages: true } }).then(r => r.data)
      setLead(data)
      setStatus(data.status)
      setMessages(data.messages || [])
    }
    load()
  }, [leadId])

  // Periodic refresh of messages (MVP polling)
  useEffect(() => {
    if (!leadId) return
    const id = setInterval(() => {
      api.get(`/leads/${leadId}`, { params: { include_messages: true } })
        .then(r => setMessages(r.data?.messages || []))
        .catch(() => {})
    }, 15000)
    return () => clearInterval(id)
  }, [leadId])

  const handleSend = async () => {
    if (!leadId || !composer.trim()) return
    const optimistic: Message = { id: Date.now(), lead_id: leadId, content: composer, sender: sendAs, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, optimistic])
    setComposer('')
    try {
      await api.post('/messages/', { lead_id: leadId, content: optimistic.content, sender: sendAs })
    } catch {}
  }

  const handleDemoAsLead = async () => {
    if (!leadId || !demoInput.trim()) return
    const optimistic: Message = { id: Date.now(), lead_id: leadId, content: demoInput, sender: 'lead', created_at: new Date().toISOString() }
    setMessages(prev => [...prev, optimistic])
    setDemoInput('')
    try {
      const resp = await api.post(`/messages/from-lead`, { content: optimistic.content, sender_type: 'lead' }, { params: { lead_id: leadId } }).then(r => r.data)
      if (resp?.ai_response?.response) {
        const aiMsg: Message = { id: Date.now() + 1, lead_id: leadId, content: resp.ai_response.response, sender: 'ai', created_at: new Date().toISOString() }
        setMessages(prev => [...prev, aiMsg])
      }
    } catch {}
  }

  const saveStatus = async () => {
    if (!leadId) return
    await api.patch(`/leads/${leadId}/status`, { status, reason: status === 'cold' ? coldReason : undefined })
    setLead(prev => prev ? { ...prev, status } : prev)
  }

  const header = useMemo(() => (
    <div className="flex items-center justify-between gap-2">
      <div>
        <div className="text-lg font-semibold">{lead?.name || 'Conversation'}</div>
        <div className="text-xs text-slate-600">{lead?.email}{lead?.phone ? ` · ${lead.phone}` : ''}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs">Status: {lead?.status || ''}</span>
        <span className="px-2 py-1 rounded border text-xs">Risk: {lead?.risk_level || ''}</span>
        <select className="rounded-lg border border-slate-200 px-2 py-1 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
          {['new','active','at_risk','cold','human_handoff','converted','do_not_contact'].map(s => (
            <option key={s} value={s}>{s.replace('_',' ')}</option>
          ))}
        </select>
        {status === 'cold' && (
          <input className="rounded-lg border border-slate-200 px-2 py-1 text-sm" placeholder="Reason for cold" value={coldReason} onChange={e => setColdReason(e.target.value)} />
        )}
        <button onClick={saveStatus} className="rounded-lg border px-3 py-1 text-sm">Save</button>
        <button onClick={onClose} className="rounded-lg border px-2 py-1"><X size={16}/></button>
      </div>
    </div>
  ), [lead, status, coldReason])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg">
        <div className="p-4 border-b">{header}</div>
        <div className="p-4">
          <div className="h-[360px] overflow-y-auto border rounded-lg p-3 mb-3">
            {messages.map(m => (
              <div key={m.id} className={`mb-2 flex ${m.sender === 'lead' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[75%] rounded-lg p-2 ${m.sender === 'ai' ? 'bg-slate-100' : (m.sender === 'human' ? 'bg-slate-900 text-white' : 'bg-white border')}`}>
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-500">
                    {m.sender === 'ai' && <Bot size={14} />}
                    {m.sender === 'human' && <User size={14} />}
                    {m.sender === 'lead' && <Smile size={14} />}
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                  <div className="text-sm">{m.content}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs font-medium mb-1">Compose</div>
          <div className="grid grid-cols-12 gap-2 items-center">
            <input className="col-span-9 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Type a message" value={composer} onChange={e => setComposer(e.target.value)} />
            <div className="col-span-2">
              <div className="grid grid-cols-2 rounded-lg border overflow-hidden">
                <button onClick={() => setSendAs('human')} className={`px-2 py-1 text-sm ${sendAs==='human' ? 'bg-slate-900 text-white' : 'bg-white'}`}>Human</button>
                <button onClick={() => setSendAs('ai')} className={`px-2 py-1 text-sm ${sendAs==='ai' ? 'bg-slate-900 text-white' : 'bg-white'}`}>AI</button>
              </div>
            </div>
            <div className="col-span-1">
              <button onClick={handleSend} className="w-full rounded-lg bg-slate-900 text-white px-3 py-2 text-sm">Send</button>
            </div>
          </div>

          <div className="my-3 border-t" />
          <div>
            <div className="flex items-center gap-2 mb-1 text-sm">
              Demonstration Mode: Send as Lead <Bot size={14} className="text-slate-500" />
            </div>
            <div className="grid grid-cols-12 gap-2 items-center">
              <input className="col-span-10 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Type a demo message as the lead" value={demoInput} onChange={e => setDemoInput(e.target.value)} />
              <div className="col-span-2">
                <button onClick={handleDemoAsLead} className="w-full rounded-lg border px-3 py-2 text-sm">Send as Lead</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

