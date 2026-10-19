import styles from '@/styles/ClassSchedule.module.css';
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const bankAccountNumber = '6800000963908507';

const sessions = [
  { day: 'Thứ 6', slots: [['Ca chiều', '15:00 – 17:00']] },
  {
    day: 'Thứ 7 và CN',
    slots: [
      ['Ca 1', '07:30 – 09:00'],
      ['Ca 2', '09:30 – 11:00'],
      ['Ca 3', '15:00 – 17:00'],
    ],
  },
];

export default function ClassSchedule() {
  const accountRef = useRef<HTMLSpanElement>(null);
  const [copyStatus, setCopyStatus] = useState('');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copied = copyStatus === 'Đã sao chép số tài khoản';

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    []
  );

  async function copyAccountNumber() {
    if (copyTimer.current) clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(bankAccountNumber);
      setCopyStatus('Đã sao chép số tài khoản');
      copyTimer.current = setTimeout(() => setCopyStatus(''), 2000);
    } catch {
      if (accountRef.current) {
        const range = document.createRange();
        range.selectNodeContents(accountRef.current);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setCopyStatus('Chọn Sao chép hoặc nhấn Ctrl+C / ⌘C để sao chép.');
    }
  }
  return (
    <>
      <Head>
        <title>Lịch học và học phí | LIMA Chess</title>
        <meta
          name="description"
          content="Lịch học cờ vua, lớp nâng cao và chuyên sâu tại LIMA Chess, Đức Trọng. Xem học phí và đăng ký 1 buổi học thử miễn phí."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.page} lang="vi">
        <div className={styles.container}>
          <header className={styles.header}>
            <div>
              <h1>Lịch học và học phí</h1>
              <p>LIMA Chess · Đức Trọng</p>
            </div>
            <a className={styles.trial} href="#dang-ky">
              Đăng ký học thử miễn phí ↗
            </a>
          </header>

          <div className={styles.overview}>
            <section className={styles.panel} aria-labelledby="schedule-title">
              <h2 id="schedule-title">Lịch học chung</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Ngày</th>
                    <th scope="col">Ca</th>
                    <th scope="col">Giờ học</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(({ day, slots }) =>
                    slots.map(([label, time], index) => (
                      <tr key={`${day}-${label}`}>
                        {index === 0 && (
                          <th scope="rowgroup" rowSpan={slots.length}>
                            {day}
                          </th>
                        )}
                        <td>{label}</td>
                        <td className={styles.time}>{time}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className={styles.advancedHeading}>
                <h2>Lớp tăng cường</h2>
                <span>19:00 – 20:30</span>
              </div>
              <dl className={styles.rows}>
                <div>
                  <dt>Nâng cao</dt>
                  <dd>Thứ 2, Thứ 4</dd>
                </div>
                <div>
                  <dt>Chuyên sâu</dt>
                  <dd>Thứ 3, Thứ 5, Thứ 6</dd>
                </div>
              </dl>
              <details className={styles.details}>
                <summary>Xem nội dung học</summary>
                <p>
                  <strong>Nâng cao:</strong> Chiến thuật, thí quân cơ bản, tính
                  toán 2–3 nước.
                </p>
                <p>
                  <strong>Chuyên sâu:</strong> Thí quân phức tạp, tính toán từ
                  4–5 nước trở lên, tư duy chiến lược.
                </p>
                <p>
                  Dành cho học viên muốn nâng cao trình độ hoặc định hướng thi
                  đấu từ cấp trường, xã đến tỉnh và quốc gia.
                </p>
              </details>
            </section>

            <div className={styles.side}>
              <section className={styles.panel} aria-labelledby="fees-title">
                <h2 id="fees-title">Học phí</h2>
                <dl className={styles.rows}>
                  <div>
                    <dt>
                      Học thử <small>1 buổi</small>
                    </dt>
                    <dd>Miễn phí</dd>
                  </div>
                  <div>
                    <dt>
                      8 buổi <small>50.000đ/buổi</small>
                    </dt>
                    <dd>400.000đ</dd>
                  </div>
                  <div>
                    <dt>
                      24 buổi <small>Giảm 200.000đ</small>
                    </dt>
                    <dd>1.000.000đ</dd>
                  </div>
                </dl>
                <aside
                  className={styles.support}
                  aria-labelledby="support-title"
                >
                  <h3 id="support-title">Hỗ trợ học phí</h3>
                  <p>
                    LIMA Chess hỗ trợ miễn, giảm học phí cho trẻ em khuyết tật
                    và trẻ em có hoàn cảnh khó khăn.
                  </p>
                  <p>
                    Phụ huynh vui lòng{' '}
                    <a href="#dang-ky">liên hệ riêng với thầy cô</a> để được tư
                    vấn mức hỗ trợ phù hợp.
                  </p>
                </aside>
                <details className={`${styles.details} ${styles.payment}`}>
                  <summary>Chuyển khoản học phí · Xem tài khoản và QR</summary>
                  <div className={styles.paymentContent}>
                    <dl className={styles.bankDetails}>
                      <div>
                        <dt>Ngân hàng</dt>
                        <dd>Co-opBank · Ngân hàng Hợp tác xã Việt Nam</dd>
                      </div>
                      <div>
                        <dt>Chủ tài khoản</dt>
                        <dd>HO KINH DOANH TRAN THI NGOC SAO</dd>
                      </div>
                      <div>
                        <dt>Số tài khoản</dt>
                        <dd className={styles.accountNumber}>
                          <span ref={accountRef}>{bankAccountNumber}</span>
                          <button
                            type="button"
                            className={styles.copyButton}
                            onClick={copyAccountNumber}
                            aria-label="Sao chép số tài khoản"
                            title={
                              copied ? 'Đã sao chép' : 'Sao chép số tài khoản'
                            }
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              aria-hidden="true"
                            >
                              {copied ? (
                                <path d="m5 12 4 4L19 6" />
                              ) : (
                                <>
                                  <rect
                                    x="8"
                                    y="8"
                                    width="12"
                                    height="13"
                                    rx="2"
                                  />
                                  <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
                                </>
                              )}
                            </svg>
                          </button>
                        </dd>
                        <dd
                          className={
                            copied || !copyStatus
                              ? 'sr-only'
                              : styles.copyStatus
                          }
                          role="status"
                        >
                          {copyStatus}
                        </dd>
                      </div>
                      <div>
                        <dt>Nội dung chuyển khoản</dt>
                        <dd>[Tên Học Sinh] + [Năm Sinh]</dd>
                      </div>
                    </dl>
                    <figure className={styles.bankQr}>
                      <a
                        href="/images/BankQR.svg"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Mở ảnh QR chuyển khoản học phí kích thước đầy đủ"
                      >
                        <Image
                          src="/images/BankQR.svg"
                          alt="Mã QR chuyển khoản học phí LIMA Chess"
                          width={400}
                          height={407}
                          unoptimized
                        />
                      </a>
                      <figcaption>Quét bằng ứng dụng ngân hàng</figcaption>
                      <a
                        className={styles.downloadQr}
                        href="/images/BankQR.svg"
                        download="LIMA-Chess-BankQR.svg"
                      >
                        Tải mã QR
                      </a>
                    </figure>
                  </div>
                </details>
              </section>

              <section
                id="dang-ky"
                className={`${styles.panel} ${styles.contact}`}
                aria-labelledby="contact-title"
              >
                <h2 id="contact-title">Đăng ký qua Zalo</h2>
                <div className={styles.actions}>
                  <a href="https://zalo.me/0912333224">0912 333 224 ↗</a>
                  <a href="https://zalo.me/0963908507">0963 908 507 ↗</a>
                </div>
                <p className={styles.calls}>
                  Gọi: <a href="tel:0912333224">0912 333 224</a> ·{' '}
                  <a href="tel:0963908507">0963 908 507</a>
                </p>
                <address>Hẻm 29, Lê Thị Hồng Gấm, Đức Trọng, Lâm Đồng</address>
                <div className={styles.links}>
                  <a href="https://maps.app.goo.gl/mQCP1vTJWgFwLp3q6">
                    Xem bản đồ ↗
                  </a>
                  <a href="https://www.facebook.com/profile.php?id=61593257410387">
                    Facebook LIMA Chess ↗
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
