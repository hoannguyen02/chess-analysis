export const PDF_EXPORT_TIMEOUT_MS = 20000;

// Dynamic imports cannot be cancelled, and a server may never finish a request.
// Stop waiting promptly and ignore late results after cancellation or timeout.
export function waitForPdfTask<T>(task: Promise<T>, signal: AbortSignal) {
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(signal.reason);
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
    task.then(
      (value) => {
        signal.removeEventListener('abort', abort);
        if (signal.aborted) abort();
        else resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', abort);
        reject(signal.aborted ? signal.reason : error);
      }
    );
  });
}

export function startPdfTask(run: (signal: AbortSignal) => Promise<void>) {
  const controller = new AbortController();
  const timer = setTimeout(
    () =>
      controller.abort(
        new Error(
          'Tải dữ liệu tạo PDF quá 20 giây. Kiểm tra kết nối hoặc máy chủ, rồi thử lại. Nếu vẫn lỗi, hãy tải lại trang.'
        )
      ),
    PDF_EXPORT_TIMEOUT_MS
  );
  const promise = waitForPdfTask(
    Promise.resolve().then(() => {
      controller.signal.throwIfAborted();
      return run(controller.signal);
    }),
    controller.signal
  ).finally(() => clearTimeout(timer));
  return {
    promise,
    cancel: () =>
      controller.abort(new Error('Đã hủy tạo PDF. Có thể thử lại.')),
  };
}
