import type { ReactNode } from 'react'

interface DataTableProps {
  headers: ReactNode[]
  children: ReactNode
  minWidth?: number
  caption?: string
}

export default function DataTable({
  headers,
  children,
  minWidth = 760,
  caption,
}: DataTableProps) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table" style={{ minWidth }}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            {headers.map((header, index) => <th key={index}>{header}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
