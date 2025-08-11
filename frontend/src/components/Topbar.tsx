import Button from './ui/Button'
import { Link } from 'react-router-dom'

export default function Topbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
      <div className="md:pl-[var(--sidebar-w)]">
        <div className="max-w-7xl mx-auto h-14 px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <Link to="/dashboard" className="font-semibold">AI Patient Advocate</Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Help</Button>
            <Button size="sm">New Lead</Button>
          </div>
        </div>
      </div>
    </header>
  )
}

