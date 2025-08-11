import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { ChevronDown } from 'lucide-react'

type Overview = {
  period_days: number
  lead_metrics: {
    total_leads: number
    new_leads_period: number
    active_leads: number
    converted_leads: number
    conversion_rate: number
    status_distribution: Record<string, number>
  }
  engagement_metrics: {
    total_messages_period: number
    ai_responses_period: number
    response_rate: number
  }
  asset_metrics: {
    financial_explainers_created: number
    financial_explainers_accessed: number
    access_rate: number
  }
}

type ActivityItem = {
  id: number
  event_type: string
  details?: string
  severity: string
  created_at: string
  lead?: { id: number; name: string; email: string } | null
}

export default function DashboardPage() {
  const [days, setDays] = useState(30)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [aiPerf, setAiPerf] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      const [ov, act, perf] = await Promise.all([
        api.get(`/dashboard/overview`, { params: { days } }).then(r => r.data),
        api.get(`/dashboard/recent-activity`, { params: { limit: 15 } }).then(r => r.data.recent_activity),
        api.get(`/dashboard/ai-performance`, { params: { hours: Math.min(days * 24, 168) } }).then(r => r.data)
      ])
      setOverview(ov)
      setActivity(act)
      setAiPerf(perf)
    }
    load()
  }, [days])

  // Auto-refresh activity every 30s
  useEffect(() => {
    const id = setInterval(() => {
      api.get(`/dashboard/recent-activity`, { params: { limit: 15 } })
        .then(r => setActivity(r.data.recent_activity))
        .catch(() => {})
    }, 30000)
    return () => clearInterval(id)
  }, [])

  const funnelData = useMemo(() => {
    const dist = overview?.lead_metrics.status_distribution || {}
    const order = ['new','active','at_risk','cold','human_handoff','converted']
    return order.map(k => ({ status: k.replace('_', ' '), count: dist[k] || 0 }))
  }, [overview])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="relative">
          <select className="appearance-none pr-8 pl-3 py-2 rounded-lg border border-slate-200 bg-white shadow-sm text-sm" value={days} onChange={e => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={60}>Last 60 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard title="Leads Converted" value={overview?.lead_metrics.converted_leads ?? 0} suffix="" />
        <StatCard title="Conversion Rate" value={overview?.lead_metrics.conversion_rate ?? 0} suffix="%" />
        <StatCard title="Explainer Access" value={overview?.asset_metrics.access_rate ?? 0} suffix="%" />
        <StatCard title="AI Response Share" value={overview?.engagement_metrics.response_rate ?? 0} suffix="%" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        <div className="rounded-xl bg-white border border-slate-200 p-4 md:col-span-4">
          <div className="font-semibold mb-2">Lead Status Funnel</div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4 md:col-span-3">
          <div className="font-semibold mb-2">Live Activity Feed</div>
          <div style={{maxHeight: 280, overflowY: 'auto'}} className="space-y-2">
            {activity.map(a => (
              <div key={a.id} className="rounded-lg border border-slate-200 p-2">
                <div className="text-sm font-medium">{a.event_type}</div>
                <div className="text-xs text-slate-600">{a.details || ''}</div>
                <div className="text-[11px] text-slate-500">{new Date(a.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4 md:col-span-7">
          <div className="font-semibold mb-2">Strategy Performance</div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiPerf ? Object.entries(aiPerf?.performance_metrics?.interactions_by_type || {}).map(([type, count]) => ({ type, count })) : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Interactions" fill="#10b981" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, suffix }: { title: string; value: number; suffix: string }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col gap-1">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-2xl font-semibold">{Number.isFinite(value) ? value : 0}{suffix}</div>
    </div>
  )
}

