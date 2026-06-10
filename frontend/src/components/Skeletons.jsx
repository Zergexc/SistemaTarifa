import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function TableSkeleton({ columns = 5, rows = 5 }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-20" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, r) => (
          <TableRow key={r}>
            {Array.from({ length: columns }).map((_, c) => (
              <TableCell key={c}>
                <Skeleton className={c === 0 ? 'h-4 w-44 max-w-full' : 'h-4 w-20'} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function StatsCardSkeleton() {
  return (
    <Card className="flex items-center gap-4 p-5">
      <Skeleton className="h-11 w-11 rounded-full shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-12" />
      </div>
    </Card>
  )
}

export function TimelineSkeleton({ items = 4 }) {
  return (
    <ol className="relative border-l border-gray-200 ml-3">
      {Array.from({ length: items }).map((_, i) => (
        <li key={i} className="mb-8 ml-6">
          <span className="absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 ring-4 ring-white">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
          </span>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-56 max-w-full" />
            <Skeleton className="h-3 w-36" />
          </div>
        </li>
      ))}
    </ol>
  )
}
