import styles from '@/styles/TournamentNotice.module.css';
import Head from 'next/head';
import Link from 'next/link';
import type { GetStaticProps } from 'next';

const topics = [
  ['Chiếu hết 1 nước', 'mateIn1'],
  ['Tấn công quân treo', 'hangingPiece'],
  ['Tấn công đôi', 'fork'],
  ['Ghim quân', 'pin'],
  ['Đòn xiên', 'skewer'],
  ['Tấn Công Mở', 'discoveredAttack'],
  ['Loại bỏ quân phòng thủ', 'capturingDefender'],
  ['Đòn thu hút quân', 'attraction'],
  ['Đòn đánh lạc hướng quân', 'deflection'],
  ['Chiếu hết hàng ngang cuối', 'backRankMate'],
  ['Chiếu hết 2 nước', 'mateIn2'],
];

const sections = [
  ['the-thuc', 'Trước giờ thi'],
  ['trong-tai', 'Luật & trọng tài'],
  ['ghi-nho', 'Cách suy nghĩ'],
  ['luyen-tap', 'Luyện chiến thuật'],
  ['tinh-than', 'Thời gian & tinh thần'],
];

export default function TournamentGuide() {
  return (
    <>
      <Head>
        <title>Cẩm nang thi đấu cờ vua cho người mới | LIMA</title>
        <meta
          name="description"
          content="Cẩm nang cho kỳ thủ mới: chuẩn bị trước giải, xử lý tình huống với trọng tài, quy trình suy nghĩ trước mỗi nước đi và bài tập chiến thuật."
        />
        <meta
          property="og:title"
          content="♟️ Cẩm nang thi đấu cờ vua cho người mới"
        />
        <meta
          property="og:description"
          content="Những điều cần nhớ trước mỗi giải đấu, kèm 11 chủ đề luyện chiến thuật trên Lichess."
        />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="vi_VN" />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <Link
            href="/goc-hoc-tap/co-vua"
            className="mb-5 inline-block text-sm underline underline-offset-4"
          >
            ← Góc học tập · Cờ vua
          </Link>
          <header className={styles.hero}>
            <p className={styles.eyebrow}>
              LIMA CHESS · CẨM NANG CHO KỲ THỦ MỚI
            </p>
            <h1>
              Tự tin bước vào
              <br />
              bàn thi đấu
            </h1>
            <p className={styles.intro}>
              Chơi đúng luật · Giữ quân an toàn · Suy nghĩ trước khi đi
            </p>
            <nav className={styles.navigation} aria-label="Nội dung hướng dẫn">
              {sections.map(([id, label], index) => (
                <a key={id} href={`#${id}`}>
                  <span>0{index + 1}</span>
                  {label}
                </a>
              ))}
            </nav>
          </header>

          <section id="the-thuc" className={styles.section}>
            <p className={styles.kicker}>01 · CHUẨN BỊ TRƯỚC GIỜ THI</p>
            <h2>Chuẩn bị sẵn sàng</h2>
            <ul className={styles.list}>
              <li>
                <strong>Trước ngày thi:</strong> Ngủ đủ, chuẩn bị nước uống và
                giấy tờ theo yêu cầu.
              </li>
              <li>
                <strong>Trước mỗi ván:</strong>{' '}
                <mark className={styles.highlight}>
                  Đến đúng giờ, ngồi đúng số bàn và đúng bên quân (Trắng/Đen)
                  theo bảng bốc thăm.
                </mark>{' '}
                Kiểm tra tên đối thủ, bàn cờ và quân đã xếp đúng chưa.
              </li>
              <li>
                <strong>Đồng hồ:</strong>{' '}
                <mark className={styles.highlight}>
                  Đúng thời gian, đúng chế độ, sẵn sàng bắt đầu.
                </mark>{' '}
                Kiểm tra giờ hiển thị của cả hai bên và số giây cộng thêm theo
                quy định giải. Nếu sai hoặc chưa rõ, nhờ trọng tài kiểm tra; bắt
                đầu theo hiệu lệnh.
              </li>
              <li>
                <strong>Không có đồng hồ:</strong> Bình tĩnh suy nghĩ. Nếu được
                bổ sung đồng hồ, nghe hướng dẫn của trọng tài.
              </li>
            </ul>
          </section>

          <section id="trong-tai" className={styles.section}>
            <p className={styles.kicker}>02 · LUẬT THI ĐẤU & TRỌNG TÀI</p>
            <h2>Gặp vấn đề, gọi trọng tài</h2>
            <p className="mb-4">Khi có nước đi sai luật hoặc tranh chấp:</p>
            <div className={styles.callout}>
              Dừng đồng hồ (nếu có) → Giơ tay, gọi to và rõ “Trọng tài ơi!”
            </div>
            <p className="mb-4">
              Nếu trọng tài chưa nghe, tiếp tục giơ tay và gọi lại. Giữ nguyên
              bàn cờ, trình bày ngắn gọn khi trọng tài đến. Không tranh cãi, tự
              sửa thế cờ hay tự xử thắng thua.
            </p>
            <aside className={styles.pitfalls} aria-label="Lỗi luật hay mắc">
              <h3>Luật chạm quân (Áp dụng khi đến lượt mình đi)</h3>
              <ul>
                <li>
                  <strong>Chạm quân mình:</strong> Nếu cố ý chạm quân nào thì
                  phải đi quân đó nếu hợp lệ.
                </li>
                <li>
                  <strong>Chạm quân đối phương:</strong> Nếu cố ý chạm quân nào
                  là phải bắt quân đó nếu hợp lệ.
                </li>
                <li>
                  <strong>Đã buông/thả quân:</strong> Khi thực hiện nước đi, đã
                  đặt quân vào ô hợp lệ và buông tay thì không được đổi ý (kể cả
                  chưa bấm đồng hồ).
                </li>
                <li>
                  <strong>Sửa quân:</strong> Chỉ sửa quân trong thời gian của
                  mình và phải nói rõ “Sửa quân” trước khi chạm.
                </li>
              </ul>
            </aside>
            <aside className={styles.pitfalls} aria-labelledby="loi-sai-luat">
              <h3 id="loi-sai-luat">Khi nào tính lỗi đi sai luật?</h3>
              <p>
                <strong>Khi thi đấu có đồng hồ:</strong> Theo Điều 7.5.1 FIDE,{' '}
                <mark className={styles.highlight}>
                  Đi sai luật rồi bấm đồng hồ → bị tính lỗi đi sai luật.
                </mark>
              </p>
              <p className="mt-2">
                <strong>Đi sai luật nhưng chưa bấm đồng hồ:</strong> Con phải đi
                lại cho đúng luật, đồng thời tuân thủ luật chạm quân.
              </p>
              <p className="mt-3">
                <strong>“Bỏ Vua”:</strong> Không được để Vua mình bị tấn công
                (chiếu) sau nước đi: Bỏ qua nước chiếu, đưa Vua vào ô bị tấn
                công hoặc dời quân làm Vua bị tấn công.
              </p>
              <p className="mt-3">
                <strong>Nếu không dùng đồng hồ:</strong> Thấy đối thủ đi sai
                luật, con giữ nguyên bàn cờ, giơ tay và gọi rõ “Trọng tài ơi!”
                trước khi đi tiếp. Trọng tài sẽ hướng dẫn sửa nước đi và tính
                lỗi theo quy định của giải.
              </p>
              <p className="mt-3 font-semibold">Ví dụ cụ thể khi có đồng hồ:</p>
              <ul className="mt-2">
                <li>
                  <strong>Ví dụ 1 — Bỏ Vua rồi bấm đồng hồ:</strong> Vua đang bị
                  chiếu, con đi quân khác hoặc bắt quân mà không thoát khỏi nước
                  chiếu rồi bấm đồng hồ → bị tính lỗi đi sai luật.
                </li>
                <li>
                  <strong>Ví dụ 2 — Đi sai cách rồi bấm đồng hồ:</strong> Con đi
                  Mã thẳng 2 ô rồi bấm đồng hồ → bị tính lỗi đi sai luật.
                </li>
                <li>
                  <strong>Ví dụ 3 — Đi sai nhưng chưa bấm đồng hồ:</strong> Con
                  đi quân Mã sai ô, chưa bấm đồng hồ → chưa bị tính lỗi đi sai
                  luật; phải đi lại quân theo luật chạm quân phía trên.
                </li>
                <li>
                  <strong>
                    Ví dụ 4 — Trọng tài phát hiện trước khi bấm đồng hồ:
                  </strong>{' '}
                  Con đi Mã thẳng 2 ô, đối thủ không khiếu nại nhưng trọng tài
                  nhìn thấy. Chưa bấm đồng hồ thì chưa bị tính lỗi đi sai luật;
                  con phải sửa nước đi (theo luật chạm quân phía trên).
                </li>
                <li>
                  <strong>
                    Ví dụ 5 — Trọng tài phát hiện sau khi bấm đồng hồ:
                  </strong>{' '}
                  Con bỏ Vua rồi bấm đồng hồ. Trọng tài chứng kiến, đối thủ chưa
                  đi tiếp → trọng tài xử lý lỗi, không cần chờ đối thủ khiếu
                  nại.
                </li>
              </ul>
              <p className="mt-3">
                <strong>Con làm gì?</strong> Dừng đồng hồ (nếu có), gọi trọng
                tài trước khi đi tiếp. Trọng tài sẽ hướng dẫn khôi phục thế cờ
                và đi lại đúng luật; không tự xếp lại bàn cờ khi đang tranh
                chấp.
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer font-semibold">
                  Thời điểm trọng tài can thiệp
                </summary>
                <p className="mt-2">
                  Với luật cờ tiêu chuẩn, trọng tài can thiệp khi thấy thế cờ
                  sai luật, nhưng chưa bấm đồng hồ thì chưa phạt như nước sai
                  luật đã hoàn thành. Với cờ nhanh/cờ chớp áp dụng A.5, trọng
                  tài xử lý nước sai luật đã hoàn thành khi đối thủ chưa đi nước
                  tiếp theo. Nếu không ai khiếu nại, trọng tài không can thiệp
                  và đối thủ đã đi tiếp, áp dụng giới hạn sửa lỗi tại A.5.2.
                </p>
                <p className="mt-2">
                  <a
                    className="underline"
                    href="https://arbiters.fide.com/wp-content/uploads/Publications/Manual/Arbiters_Manual_2025.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Sổ tay trọng tài FIDE 2025: Điều 3.10, 7.5.1 và A.5.2
                  </a>
                </p>
              </details>
              <details className="mt-3">
                <summary className="cursor-pointer font-semibold">
                  Nếu không nhớ thế cờ trước lỗi
                </summary>
                <p className="mt-2">
                  Nếu không xác định được thế cờ ngay trước lỗi, trọng tài cho
                  tiếp tục từ thế cờ gần nhất trước đó có thể xác định được.
                </p>
              </details>
            </aside>
            <div className={styles.note}>
              <p>
                <strong>Giải phong trào áp dụng mốc 3 lỗi:</strong> Phạm đủ{' '}
                <strong>3 lỗi kỹ thuật trong một ván sẽ bị xử thua.</strong>
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer font-semibold">
                  Chi tiết & nguồn tham khảo
                </summary>
                <p className="mt-2">
                  Theo FIDE, hoàn thành nước đi không hợp lệ lần thứ 2 trong
                  cùng một ván sẽ bị xử thua; xử hòa nếu đối phương không thể
                  chiếu hết bằng bất kỳ chuỗi nước đi hợp lệ nào. Mốc 3 lỗi là
                  quy định riêng của một số giải phong trào.
                </p>
                <ul className="mt-2 list-disc space-y-2 pl-5">
                  <li>
                    <a
                      className="underline"
                      href="https://handbook.fide.com/chapter/E012023"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Luật FIDE: Điều 3.9, 4.2–4.7, 5.2.1, 6.2 và 7.5.1–7.5.5
                    </a>
                    {' · '}
                    <a
                      className="underline"
                      href="https://medialib.qlgd.edu.vn/Uploads/THU_VIEN/shn/2/37/UserFiles/TT17-a6e61f0f-13bd-4d40-a45b-0085a7a1cc5d.pdf#page=14"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Bản dịch tiếng Việt (2018), Điều 7.5.5
                    </a>
                  </li>
                </ul>
              </details>
            </div>
          </section>

          <section id="ghi-nho" className={styles.section}>
            <p className={styles.kicker}>03 · SUY NGHĨ TRƯỚC MỖI NƯỚC ĐI</p>
            <h2>Quan sát → Tính toán → Kiểm tra</h2>
            <ol className={`${styles.list} ${styles.steps}`}>
              <li>
                <strong>Quan sát:</strong> Vua có bị chiếu? Đối phương đang đe
                dọa gì?
              </li>
              <li>
                <strong>Tính toán:</strong> Tìm nước Chiếu – Bắt quân – Đe dọa.
                Đối phương sẽ đáp lại thế nào?
              </li>
              <li>
                <strong>Kiểm tra:</strong> Nước định đi có làm mất quân hoặc bị
                chiếu hết?{' '}
                <mark className={styles.highlight}>
                  Kiểm tra xong mới chạm quân.
                </mark>
              </li>
            </ol>
            <aside
              className={styles.pitfalls}
              aria-label="Lỗi quan sát hay mắc"
            >
              <h3>Hai điều con cần nhớ</h3>
              <ul>
                <li>
                  Thấy ăn được quân, con đừng vội ăn. Xem đối thủ có bắt lại
                  được không, đổi như vậy mình có bị thiệt quân hay bị chiếu hết
                  không.
                </li>
                <li>
                  Khi đối thủ vừa đi, con nhìn lại cả bàn cờ. Có khi quân vừa đi
                  chỉ để mở đường cho Xe, Tượng hoặc Hậu phía sau tấn công.
                </li>
              </ul>
            </aside>
            <div className={styles.note}>
              <p>
                <strong>Đầu ván,</strong> con đưa Mã và Tượng ra để cùng kiểm
                soát trung tâm, tìm lúc nhập thành cho Vua an toàn rồi đưa hai
                Xe vào phối hợp. Đừng mải đi Hậu hoặc đi lại một quân nhiều lần
                khi các quân khác còn chưa ra, trừ khi cần tránh một đe dọa.
              </p>
              <p className="mt-3">
                <strong>Khi đang hơn quân,</strong> con cứ chơi chắc, giữ quân
                cẩn thận và đổi quân nếu có lợi. Gần cuối ván, nhớ xem đối thủ
                còn nước đi không: nếu đến lượt họ mà không quân nào đi được hợp
                lệ, Vua cũng không bị chiếu thì chỉ hòa (pat), dù con hơn nhiều
                quân.
              </p>
            </div>
          </section>

          <section id="luyen-tap" className={styles.section}>
            <p className={styles.kicker}>04 · ÔN LẠI CÁC CHIẾN THUẬT ĐÃ HỌC</p>
            <div className={styles.topics}>
              {topics.map(([label, theme], index) => (
                <a
                  key={theme}
                  href={`https://lichess.org/training/${theme}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className={styles.topicNumber}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{label}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </section>

          <section id="tinh-than" className={styles.section}>
            <p className={styles.kicker}>05 · THỜI GIAN & TINH THẦN THI ĐẤU</p>
            <h2>Bình tĩnh đến hết ván</h2>
            <aside className={styles.pitfalls} aria-label="Lỗi đồng hồ hay mắc">
              <h3>Đi xong, nhớ bấm đồng hồ</h3>
              <p>
                Quên bấm thì giờ mình vẫn chạy.{' '}
                <strong>Đi quân và bấm đồng hồ bằng cùng một tay.</strong> Không
                bấm trước khi đi quân.
              </p>
            </aside>
            <ul className={styles.list}>
              <li>
                Đối thủ đi nhanh thì con cũng đừng vội đi theo. Nhớ nhìn thời
                gian còn lại; khi đối thủ đang nghĩ, con cũng tranh thủ tính
                nước tiếp theo.
              </li>
              <li>
                <strong>Giữa các ván:</strong> Uống nước, đi vệ sinh, nghỉ ngơi
                và trở lại đúng giờ.
              </li>
              <li>
                Dù thắng hay thua, con hãy tập trung cho ván tiếp theo. Đừng mải
                tiếc nuối ván vừa rồi mà mất tập trung ở ván sau. Đợi thi đấu
                xong mình mới xem lại để rút kinh nghiệm. Nhớ cư xử lịch sự với
                đối thủ nhé.
              </li>
            </ul>
          </section>
          <footer className={styles.closing}>
            <span className={styles.trophy} aria-hidden="true">
              🏆
            </span>
            <h2>Mỗi ván đấu là một cơ hội tiến bộ</h2>
            <p className={styles.reminder}>
              Quan sát kỹ – Suy nghĩ cẩn thận – Kiểm tra trước khi đi quân!
            </p>
          </footer>
        </article>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    messages: {
      common: (await import(`@/locales/${locale || 'vi'}/common.json`)).default,
    },
  },
});
