/** Serializes searches so an old position can never overwrite the current line. */
export function createAnalysisEngine(
  worker: Worker,
  onInfo: (message: string, fen: string) => void,
  onError: () => void
) {
  let ready = false;
  let disposed = false;
  let active: { fen: string; depth: number } | null = null;
  let pending: { fen: string; depth: number } | null = null;
  let stopping = false;

  const fail = () => {
    if (disposed) return;
    dispose();
    onError();
  };
  const timeout = setTimeout(fail, 30000);

  function dispose() {
    disposed = true;
    clearTimeout(timeout);
    worker.onmessage = null;
    worker.onerror = null;
    worker.onmessageerror = null;
    worker.terminate();
  }

  function startPending() {
    if (!ready || active || !pending || disposed) return;
    active = pending;
    pending = null;
    worker.postMessage(`position fen ${active.fen}`);
    worker.postMessage(`go depth ${active.depth}`);
  }

  worker.onerror = fail;
  worker.onmessageerror = fail;
  worker.onmessage = ({ data }) => {
    if (disposed || typeof data !== 'string') return;
    for (const message of data.split('\n')) {
      if (message === 'uciok') {
        worker.postMessage('isready');
      } else if (message === 'readyok') {
        ready = true;
        clearTimeout(timeout);
        startPending();
      } else if (active) {
        if (!stopping) onInfo(message, active.fen);
        if (message.startsWith('bestmove ')) {
          active = null;
          stopping = false;
          startPending();
        }
      }
    }
  };
  worker.postMessage('uci');

  return {
    search(fen: string, depth: number) {
      if (disposed) return;
      pending = { fen, depth };
      if (active && !stopping) {
        stopping = true;
        worker.postMessage('stop');
      }
      startPending();
    },
    dispose,
  };
}
