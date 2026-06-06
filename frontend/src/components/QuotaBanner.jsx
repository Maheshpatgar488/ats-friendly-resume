import { useState, useEffect } from "react";
import { API_URL } from "../config";

export default function QuotaBanner({ triggeredExhausted }) {
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Poll quota status every 60s
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/api/quota-status`);
        const data = await res.json();
        if (mounted) setQuotaExhausted(data.anyExhausted);
      } catch {}
    };
    check();
    const id = setInterval(check, 60000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // Also accept external trigger from AI components
  useEffect(() => {
    if (triggeredExhausted) setQuotaExhausted(true);
  }, [triggeredExhausted]);

  if (!quotaExhausted || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-3 flex items-start gap-2">
        <span className="text-amber-600 text-sm flex-1">
          AI API limit reached. Features fall back to local engine.
        </span>
        <button onClick={() => setDismissed(true)} className="text-amber-400 hover:text-amber-600 text-lg leading-none">&times;</button>
      </div>
    </div>
  );
}
