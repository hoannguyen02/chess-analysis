import { useEffect, useState } from 'react';
import { MathLessonData } from '@/lib/math/lessons';
import { encodeMathLesson, mathShareUrl } from '@/lib/math/share';
import s from './MathStudio.module.css';
export default function ShareLesson({
  lesson,
  onClose,
}: {
  lesson: MathLessonData;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(''),
    [error, setError] = useState(''),
    [copied, setCopied] = useState(false),
    [local, setLocal] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLocal(['localhost', '127.0.0.1', '[::1]'].includes(location.hostname));
    void encodeMathLesson(lesson)
      .then((token) => {
        if (!cancelled) setUrl(mathShareUrl(location.origin, token));
      })
      .catch((error) => {
        if (!cancelled) setError((error as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [lesson]);
  return (
    <section className={s.panel} aria-label="Chia sẻ bài học">
      <div className={s.toolbar}>
        <h2>Chia sẻ: {lesson.title}</h2>
        <button onClick={onClose}>Đóng chia sẻ</button>
      </div>
      <p>
        Ai có liên kết đều có thể mở và học bản sao này. Ghi chú riêng, hồ sơ và
        kết quả của bạn không được chia sẻ.
      </p>
      <p className={s.muted}>
        Đây là bản sao cố định. Sửa hoặc xóa bài gốc không thay đổi hay thu hồi
        liên kết cũ. Sau khi sửa, hãy tạo liên kết mới.
      </p>
      {local && (
        <p className={s.notice}>
          Đang dùng địa chỉ localhost. Để học sinh mở trên thiết bị khác, hãy
          tạo liên kết từ địa chỉ ứng dụng đã triển khai hoặc địa chỉ mạng mà
          thiết bị đó truy cập được.
        </p>
      )}
      {error ? (
        <p role="alert" className={s.error}>
          {error}
        </p>
      ) : !url ? (
        <p role="status">Đang tạo liên kết…</p>
      ) : (
        <>
          <label>
            Liên kết cho học sinh
            <textarea
              readOnly
              rows={3}
              value={url}
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>
          <div className={s.actions}>
            <button
              className={s.primary}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                } catch {
                  setCopied(false);
                  window.alert(
                    'Không sao chép tự động được. Hãy chọn và sao chép liên kết ở trên.'
                  );
                }
              }}
            >
              Sao chép liên kết
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={s.link}
            >
              Mở trang học sinh ↗
            </a>
          </div>
          {copied && (
            <p role="status">
              Đã sao chép. Bạn có thể gửi qua nhóm lớp hoặc tin nhắn.
            </p>
          )}
        </>
      )}
    </section>
  );
}
