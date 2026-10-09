import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MathLessonData } from '@/lib/math/lessons';
import { decodeMathLesson } from '@/lib/math/share';
import MathLesson from './MathLesson';
import s from './MathStudio.module.css';
const HISTORY_KEY = 'lima-math-shared-history-v1';
type Bookmark = { id: string; title: string; token: string; opened: string };
function readHistory(): Bookmark[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || value.length > 50)
    throw new Error('Invalid history');
  return value.filter(
    (b): b is Bookmark =>
      !!b &&
      typeof b === 'object' &&
      typeof b.id === 'string' &&
      /^[a-zA-Z0-9_-]{1,100}$/.test(b.id) &&
      typeof b.title === 'string' &&
      b.title.length <= 200 &&
      typeof b.token === 'string' &&
      b.token.length <= 16000 &&
      /^m1\.[A-Za-z0-9_-]+$/.test(b.token) &&
      typeof b.opened === 'string'
  );
}
export default function SharedMathLesson() {
  const [lesson, setLesson] = useState<MathLessonData | null>(null),
    [history, setHistory] = useState<Bookmark[]>([]),
    [showHistory, setShowHistory] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  useEffect(() => {
    let generation = 0;
    const load = async () => {
      const current = ++generation;
      setLoading(true);
      setLesson(null);
      setError('');
      setNotice('');
      setShowHistory(!location.hash);
      try {
        setHistory(readHistory());
      } catch {
        setNotice('Không đọc được lịch sử. Dữ liệu đã lưu chưa thay đổi.');
      }
      if (!location.hash) {
        setLoading(false);
        return;
      }
      try {
        const token = location.hash.startsWith('#lesson=')
          ? location.hash.slice(8)
          : '';
        const next = await decodeMathLesson(token);
        if (current !== generation) return;
        setLesson(next);
        try {
          const entries = [
            {
              id: next.id,
              title: next.title,
              token,
              opened: new Date().toISOString(),
            },
            ...readHistory().filter((b) => b.token !== token),
          ].slice(0, 50);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
          setHistory(entries);
        } catch {
          setNotice(
            'Bài học đã mở nhưng không lưu được lịch sử. Giữ lại liên kết gốc để mở lại.'
          );
        }
      } catch (error) {
        if (current === generation) setError((error as Error).message);
      } finally {
        if (current === generation) setLoading(false);
      }
    };
    void load();
    window.addEventListener('hashchange', load);
    return () => {
      generation++;
      window.removeEventListener('hashchange', load);
    };
  }, []);
  return (
    <main className={`${s.studio} ${s.shared}`} lang="vi">
      <div className={s.toolbar}>
        <Link className={s.link} href="/math-practice">
          LIMA
        </Link>
        <a className={s.link} href="#" onClick={() => setShowHistory(true)}>
          Bài học đã nhận
        </a>
      </div>
      {notice && (
        <p role="status" className={s.notice}>
          {notice}
        </p>
      )}
      {loading ? (
        <p role="status">Đang mở bài học…</p>
      ) : error ? (
        <section className={s.panel}>
          <h1>Không mở được bài học</h1>
          <p role="alert" className={s.error}>
            {error}
          </p>
          <a className={s.link} href="#">
            Về bài học đã nhận
          </a>
        </section>
      ) : showHistory ? (
        <>
          <h1>Bài học đã nhận</h1>
          <p className={s.muted}>
            Các liên kết đã mở được lưu trong trình duyệt này. Mỗi liên kết là
            một bản sao riêng.
          </p>
          <div className={s.history}>
            {history.map((entry) => (
              <article className={s.panel} key={entry.token}>
                <h2>
                  <a
                    href={`#lesson=${entry.token}`}
                    onClick={() => setShowHistory(false)}
                  >
                    {entry.title}
                  </a>
                </h2>
                <p className={s.muted}>
                  Mở lần cuối:{' '}
                  {new Date(entry.opened).toLocaleDateString('vi-VN')}
                </p>
                <button
                  onClick={() => {
                    try {
                      const next = readHistory().filter(
                        (b) => b.token !== entry.token
                      );
                      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
                      setHistory(next);
                    } catch {
                      setNotice(
                        'Không xóa được dấu trang. Dữ liệu chưa thay đổi.'
                      );
                    }
                  }}
                >
                  Bỏ khỏi lịch sử
                </button>
              </article>
            ))}
          </div>
          {!history.length && (
            <div className={s.empty}>
              <p>Chưa có bài học nào. Mở liên kết giáo viên gửi để bắt đầu.</p>
            </div>
          )}
        </>
      ) : lesson ? (
        <MathLesson
          key={JSON.stringify(lesson)}
          lesson={lesson}
          onBack={() => {
            location.hash = '';
            setShowHistory(true);
          }}
        />
      ) : null}
    </main>
  );
}
