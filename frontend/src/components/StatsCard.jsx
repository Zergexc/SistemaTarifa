import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatsCard({ label, value, icon: Icon, className }) {
  return (
    <Card className={cn('flex items-center gap-4 p-5', className)}>
      {Icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 shrink-0">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-gray-500 truncate">{label}</p>
        <p className="text-3xl font-bold text-blue-700 leading-tight">{value}</p>
      </div>
    </Card>
  )
}
