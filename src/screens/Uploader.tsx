import { useState } from 'react'
import ImageEditor from '../components/ImageEditor'

export default function Uploader() {
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Upload image</h1>
        <p className="text-sm text-slate-500">
          Crop, rotate, and resize an image, then get a public URL you can paste anywhere.
        </p>
      </div>

      <button
        onClick={() => { setUrl(''); setEditing(true) }}
        className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm"
      >
        Choose image
      </button>

      {url && (
        <div className="space-y-2">
          <label className="block text-xs text-slate-500">Public URL</label>
          <div className="flex gap-2">
            <input readOnly value={url} className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm" />
            <button onClick={copy} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 shrink-0">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <a href={url} target="_blank" rel="noreferrer" className="block">
            <img src={url} alt="uploaded" className="max-h-64 rounded-lg border border-slate-200" />
          </a>
        </div>
      )}

      {editing && (
        <ImageEditor
          onUploaded={(u) => { setUrl(u); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}
