import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Users, Bot } from 'lucide-react'

export default function Sidebar() {
  const { pathname } = useLocation()
  const item = (to: string, label: string, Icon: any) => (
    <Link to={to} className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${pathname.startsWith(to) ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}>
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
  return (
    <aside className="hidden md:flex flex-col gap-2 w-[var(--sidebar-w)] h-screen fixed top-0 left-0 border-r border-slate-200 bg-white/70 backdrop-blur">
      <div className="h-14 flex items-center px-4 font-semibold tracking-tight">🦷 Bright Smile</div>
      <nav className="px-2 flex flex-col gap-1">
        {item('/dashboard','Dashboard', LayoutGrid)}
        {item('/leads','Leads', Users)}
        {item('/agents','Agents', Bot)}
      </nav>
      <div className="mt-auto p-4 text-xs text-slate-500">v1.0</div>
    </aside>
  )
}

