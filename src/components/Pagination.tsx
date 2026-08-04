export default function Pagination({ page, pageCount, onPage }: {
  page: number
  pageCount: number
  onPage: (p: number) => void
}) {
  if (pageCount <= 1) return null
  return (
    <div className="flex items-center gap-3 mt-4">
      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-slate-600">Page {page} of {pageCount}</span>
      <button
        disabled={page >= pageCount}
        onClick={() => onPage(page + 1)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}
