import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { api } from '../api/client'
import dayjs from '../utils/dayjs'
import ConversationDialog from './components/ConversationDialog'

type Lead = {
  id: number
  name: string
  email: string
  phone?: string
  status: 'new'|'active'|'at_risk'|'cold'|'contacted'|'human_handoff'|'converted'|'do_not_contact'
  risk_level: 'low'|'medium'|'high'
  last_contact_at?: string | null
}

export default function LeadsPage() {
  const [status, setStatus] = useState<string>('')
  const [risk, setRisk] = useState<string>('')
  const [search, setSearch] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      const params: any = {}
      if (status) params.status = status
      if (risk) params.risk_level = risk
      if (search) params.search = search
      const data = await api.get('/leads/', { params }).then(r => r.data)
      setLeads(data)
    }
    load()
  }, [status, risk, search])

  const sortedLeads = useMemo(() => {
    return [...leads].sort((a, b) => (new Date(b.last_contact_at || 0).getTime() - new Date(a.last_contact_at || 0).getTime()))
  }, [leads])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Leads</h1>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Search by name, email, or inquiry" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={status} onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {['new','active','at_risk','cold','human_handoff','converted','do_not_contact'].map(s => (
              <option key={s} value={s}>{s.replace('_',' ')}</option>
            ))}
          </select>
          <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={risk} onChange={(e: ChangeEvent<HTMLSelectElement>) => setRisk(e.target.value)}>
            <option value="">All Risks</option>
            {['low','medium','high'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="p-3">Name</th>
                <th className="p-3">Last Contact</th>
                <th className="p-3">Status</th>
                <th className="p-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map(l => (
                <tr key={l.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedLeadId(l.id)}>
                  <td className="p-3">{l.name}</td>
                  <td className="p-3">{l.last_contact_at ? dayjs(l.last_contact_at).format('LLL') : '—'}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${statusBadge(l.status)}`}>{l.status.replace('_',' ')}</span></td>
                  <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${riskBadge(l.risk_level)}`}>{l.risk_level}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConversationDialog leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
    </div>
  )
}

function statusBadge(status: Lead['status']) {
  switch (status) {
    case 'new': return 'bg-sky-100 text-sky-700'
    case 'active': return 'bg-blue-100 text-blue-700'
    case 'at_risk': return 'bg-amber-100 text-amber-800'
    case 'cold': return 'bg-slate-100 text-slate-700'
    case 'human_handoff': return 'bg-purple-100 text-purple-700'
    case 'converted': return 'bg-emerald-100 text-emerald-700'
    case 'do_not_contact': return 'bg-rose-100 text-rose-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function riskBadge(risk: Lead['risk_level']) {
  switch (risk) {
    case 'low': return 'bg-emerald-100 text-emerald-700'
    case 'medium': return 'bg-amber-100 text-amber-800'
    case 'high': return 'bg-rose-100 text-rose-700'
  }
}

