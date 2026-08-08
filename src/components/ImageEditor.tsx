import { useEffect, useMemo, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { cropImage } from '../utils/cropImage'
import { api } from '../api'

export interface ImageEditorProps {
  onUploaded: (url: string) => void
  onCancel: () => void
}

export default function ImageEditor({ onUploaded, onCancel }: ImageEditorProps) {
  const [file, setFile] = useState<File | null>(null)
  const imageSrc = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [areaPixels, setAreaPixels] = useState<Area | null>(null)
  const [maxDim, setMaxDim] = useState(1200)
  const [quality, setQuality] = useState(0.85)
  const [progress, setProgress] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => { if (imageSrc) URL.revokeObjectURL(imageSrc) }, [imageSrc])

  async function confirm() {
    if (!file || !areaPixels || busy) return
    setBusy(true)
    setError('')
    setProgress(0)
    try {
      const cropped = await cropImage(file, areaPixels, rotation)
      const url = await api.uploads.upload(cropped, { maxDim, quality }, setProgress)
      onUploaded(url)
    } catch {
      setError('Could not process or upload this image. Please try again.')
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {!file ? (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-medium text-slate-600">Upload image</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => { setError(''); setFile(e.target.files?.[0] ?? null) }}
              className="block w-full text-sm"
            />
            <div className="flex justify-end">
              <button onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative flex-1 min-h-[320px] bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={(_a, pixels) => setAreaPixels(pixels)}
              />
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2 flex-1">
                  Zoom
                  <input type="range" min={1} max={3} step={0.01} value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))} className="flex-1" />
                </label>
                <button type="button" onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-600">
                  Rotate
                </button>
              </div>

              <details className="text-sm text-slate-600">
                <summary className="cursor-pointer select-none">Advanced (size &amp; quality)</summary>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2">
                    Max dimension (px)
                    <input type="number" min={320} max={4000} step={100} value={maxDim}
                      onChange={(e) => setMaxDim(Number(e.target.value))}
                      className="w-28 border border-slate-300 rounded px-2 py-1" />
                  </label>
                  <label className="flex items-center gap-2">
                    JPEG quality
                    <input type="range" min={0.4} max={1} step={0.05} value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))} />
                    <span className="tabular-nums">{quality.toFixed(2)}</span>
                  </label>
                </div>
              </details>

              {progress !== null && (
                <p className="text-sm text-slate-500">Uploading… {progress}%</p>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-between gap-3">
                <button type="button" onClick={onCancel} disabled={busy}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={confirm} disabled={busy || !areaPixels}
                  className="bg-slate-900 text-white rounded-lg px-5 py-2 text-sm disabled:opacity-50">
                  {busy ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
