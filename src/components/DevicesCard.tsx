import type { Device } from '../types'

const PLATFORM_LABEL: Record<Device['platform'], string> = {
  telegram: 'Telegram',
  web: 'Web',
  android: 'Android',
}

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleString() : '—'
}

export default function DevicesCard({ devices }: { devices: Device[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
      <h2 className="text-sm font-medium text-slate-600">Devices</h2>
      {devices.length === 0 ? (
        <p className="text-sm text-slate-400">No devices recorded yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th className="py-1 pr-3 font-normal">Platform</th>
                <th className="py-1 pr-3 font-normal">Version</th>
                <th className="py-1 pr-3 font-normal">Device</th>
                <th className="py-1 pr-3 font-normal">OS</th>
                <th className="py-1 pr-3 font-normal">Push</th>
                <th className="py-1 pr-3 font-normal">First seen</th>
                <th className="py-1 font-normal">Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {devices.map((d) => (
                <tr key={d.deviceId} title={d.userAgent ?? undefined}>
                  <td className="py-2 pr-3">{PLATFORM_LABEL[d.platform] ?? d.platform}</td>
                  <td className="py-2 pr-3">{d.appVersion ?? '—'}</td>
                  <td className="py-2 pr-3">{d.deviceModel ?? '—'}</td>
                  <td className="py-2 pr-3">{d.os ?? '—'}</td>
                  <td className="py-2 pr-3">
                    {d.hasPush ? (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700" title={`Token updated ${fmt(d.pushTokenAt)}`}>
                        Push
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">{fmt(d.firstSeenAt)}</td>
                  <td className="py-2 whitespace-nowrap">{fmt(d.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
