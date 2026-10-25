import {useRef, useState} from 'react';

export function useAsyncAction(action: () => Promise<void>) {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const clearError = () => setError('');
  const run = async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try { await action(); }
    catch (err) { setError((err as {message?: string}).message || 'Could not complete this action. Please try again.'); }
    finally { locked.current = false; setBusy(false); }
  };
  return {run, busy, error, clearError};
}
