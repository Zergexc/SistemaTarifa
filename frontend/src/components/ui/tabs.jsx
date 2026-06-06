import { cn } from '@/lib/utils'

export function TabNav({ tabs, active, onChange }) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="-mb-px flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              active === tab.id
                ? 'border-blue-600 text-blue-600'
                : tab.available === false
                ? 'border-transparent text-gray-300 hover:text-gray-400 hover:border-gray-200'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {tab.available === false && (
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" />
            )}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
