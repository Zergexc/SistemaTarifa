import { cn } from '@/lib/utils'

export function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-auto rounded-lg border border-gray-200">
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn('bg-gray-50 border-b border-gray-200', className)} {...props} />
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn('divide-y divide-gray-100', className)} {...props} />
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn('hover:bg-gray-50 transition-colors', className)}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
        className
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }) {
  return (
    <td className={cn('px-4 py-3 text-gray-700', className)} {...props} />
  )
}
