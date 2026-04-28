import { useEffect, useRef, useState } from 'react'
import DataTable from 'datatables.net-dt'
import 'datatables.net-dt/css/dataTables.dataTables.css'

const pageIcon = (path) => `
  <svg class="dt-page-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="${path}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`

export default function AdminDataTable({ columns, rows, getColumnLabel, getRowId, renderValue, renderActions }) {
  const tableRef = useRef(null)
  const instanceRef = useRef(null)
  const [search, setSearch] = useState('')
  const [pageLength, setPageLength] = useState(10)

  useEffect(() => {
    if (!tableRef.current || rows.length === 0) return undefined

    const instance = new DataTable(tableRef.current, {
      destroy: true,
      pageLength,
      order: [],
      layout: {
        topStart: null,
        topEnd: null,
        bottomStart: 'info',
        bottomEnd: 'paging',
      },
      language: {
        search: '',
        searchPlaceholder: 'Buscar registros...',
        lengthMenu: 'Mostrar _MENU_ registros',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ registros',
        infoEmpty: 'Sin registros',
        infoFiltered: '(filtrado de _MAX_ registros)',
        zeroRecords: 'No se encontraron registros',
        emptyTable: 'No hay registros.',
        paginate: {
          first: pageIcon('M11 17l-5-5 5-5M18 17l-5-5 5-5'),
          previous: pageIcon('M15 18l-6-6 6-6'),
          next: pageIcon('M9 6l6 6-6 6'),
          last: pageIcon('M6 7l5 5-5 5M13 7l5 5-5 5'),
        },
      },
    })
    instanceRef.current = instance

    return () => {
      instance.destroy()
      instanceRef.current = null
    }
  }, [rows, columns, pageLength])

  const handleSearch = (event) => {
    const value = event.target.value
    setSearch(value)
    instanceRef.current?.search(value).draw()
  }

  const handlePageLength = (event) => {
    const value = Number(event.target.value)
    setPageLength(value)
    instanceRef.current?.page.len(value).draw()
  }

  return (
    <div className="admin-datatable overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="admin-table-toolbar">
        <label className="admin-table-length">
          <span>Mostrar</span>
          <select value={pageLength} onChange={handlePageLength}>
            {[5, 10, 25, 50].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <span>registros</span>
        </label>

        <label className="admin-table-search">
          <svg className="admin-table-search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input value={search} onChange={handleSearch} placeholder="Buscar registros..." aria-label="Buscar registros" />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table ref={tableRef} className="min-w-full text-sm text-left text-slate-600 dark:text-slate-300">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="px-6 py-3 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    {getColumnLabel(column)}
                    <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="m8 15 4 4 4-4m0-6-4-4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </span>
                </th>
              ))}
              <th scope="col" className="px-6 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={getRowId(row) || index}>
                {columns.map((column, columnIndex) => (
                  <td key={column} className={columnIndex === 0 ? 'px-6 py-4 font-semibold text-slate-900 whitespace-nowrap dark:text-white' : 'px-6 py-4'}>
                    {renderValue(row, column)}
                  </td>
                ))}
                <td className="px-6 py-4 text-right">
                  {renderActions(row)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
