import { useContext, useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { api, setAgentApiKeyHeader } from '../api/client'
import { ApiKeyContext } from '../context/ApiKeyContext'

export default function AgentsPage() {
  const { apiKey, setApiKey } = useContext(ApiKeyContext)
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    api.get('/agents/status').then(r => setStatus(r.data)).catch(() => {})
  }, [])

  const triggerOutreach = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const resp = await api.post('/agents/trigger-outreach')
      setMessage(resp.data?.message || 'Campaign triggered')
    } catch (e: any) {
      setMessage(e?.response?.data?.detail || 'Failed to run campaign')
    } finally {
      setLoading(false)
    }
  }

  const saveKey = (key: string) => {
    setApiKey(key)
    setAgentApiKeyHeader(key)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Agents</h1>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        <div className="card p-4 md:col-span-4">
          <div className="text-lg font-semibold mb-1">Proactive Outreach Agent</div>
          <p className="text-sm text-slate-600 mb-3">This agent contacts all cold leads with a personalized recall message. It is designed to be run once per day during off-peak hours.</p>
          <div className="flex flex-col md:flex-row gap-2">
            <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-full md:w-64" placeholder="X-API-Key" value={apiKey || ''} onChange={e => saveKey(e.target.value)} />
            <button onClick={triggerOutreach} disabled={loading} className="inline-flex items-center justify-center rounded-lg bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Starting…' : 'Start Outreach Campaign'}
            </button>
          </div>
          {message && (
            <div className={`mt-3 flex items-center gap-2 text-sm ${message.toLowerCase().includes('failed') ? 'text-rose-600' : 'text-emerald-600'}`}>
              {message.toLowerCase().includes('failed') ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>} {message}
            </div>
          )}
        </div>
        <div className="card p-4 md:col-span-3">
          <div className="text-lg font-semibold mb-1">Predictive Risk Analyzer Status</div>
          <div className="text-sm">Active</div>
          <div className="text-xs text-slate-600">Last run: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  )
}

