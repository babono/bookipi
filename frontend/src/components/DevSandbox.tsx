import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface DevSandboxProps {
  onConfigSaved: () => void;
}

// Helper to convert an ISO string to a local datetime-local input value
function toLocalDatetime(isoString: string): string {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

// Helper to convert a datetime-local input value back to an ISO string
function fromLocalDatetime(localString: string): string {
  return new Date(localString).toISOString();
}

export default function DevSandbox({ onConfigSaved }: DevSandboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [totalStock, setTotalStock] = useState(100);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [buyers, setBuyers] = useState<string[]>([]);

  // Load config when the panel opens
  useEffect(() => {
    if (!isOpen) return;
    setFeedback('');
    api.getConfig()
      .then(({ data }) => {
        setStartTime(toLocalDatetime(data.startTime));
        setEndTime(toLocalDatetime(data.endTime));
        setTotalStock(data.totalStock);
      })
      .catch(() => setFeedback('Failed to load config'));

    api.getBuyers()
      .then(({ data }) => setBuyers(data || []))
      .catch(() => {});
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setFeedback('');

    try {
      const { ok, data } = await api.setConfig({
        startTime: fromLocalDatetime(startTime),
        endTime: fromLocalDatetime(endTime),
        totalStock,
      });

      if (ok) {
        setFeedback('✅ ' + data.message);
        setBuyers([]); // Clear buyers list locally since save resets it
        onConfigSaved();
      } else {
        setFeedback('❌ ' + (data.error || 'Failed to save'));
      }
    } catch {
      setFeedback('❌ Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Gear button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-[#095ae9] rounded-xl shadow-sm hover:shadow-md hover:opacity-90 transition-all cursor-pointer group flex items-center justify-center"
        aria-label="Developer Sandbox"
        title="Developer Sandbox"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-6 h-6 text-white transition-transform group-hover:rotate-90 duration-300"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      </button>

      {/* Backdrop + panel */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm flex justify-end" onClick={() => setIsOpen(false)}>
          <div
            className="w-full max-w-sm h-full bg-white shadow-2xl border-l border-gray-200 overflow-y-auto animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">🛠 Dev Sandbox</h2>
                <p className="text-xs text-gray-400 mt-0.5">Configure the flash sale</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sale Start Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sale End Time
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Total Stock
                </label>
                <input
                  type="number"
                  min={1}
                  value={totalStock}
                  onChange={(e) => setTotalStock(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-amber-600 mb-4">
                  ⚠️ Saving will reset all stock and clear the buyers list.
                </p>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? 'Saving…' : 'Apply Configuration'}
                </button>
              </div>

              {feedback && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    feedback.startsWith('✅')
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {feedback}
                </div>
              )}

              {/* Buyers Log */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800">Successful Buyers</h3>
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{buyers.length}</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {buyers.length === 0 ? (
                    <p className="text-xs text-gray-500 italic text-center py-2">No buyers yet.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {buyers.map((buyer, idx) => (
                        <li key={idx} className="text-xs text-gray-700 font-mono break-all bg-white px-2 py-1.5 rounded border border-gray-100 shadow-sm flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-green-500 flex-shrink-0">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                          </svg>
                          {buyer}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
