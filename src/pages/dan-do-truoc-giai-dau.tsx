import styles from '@/styles/TournamentNotice.module.css';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

const sections = [
  ['the-thuc', 'Trước giờ thi'],
  ['trong-tai', 'Luật & trọng tài'],
  ['tam-dung-dong-ho', 'Tạm dừng đồng hồ'],
  ['di-ve-sinh', 'Đi vệ sinh & rời bàn'],
  ['ghi-nho', 'Cách suy nghĩ'],
  ['tinh-than', 'Thời gian & tinh thần'],
  ['ket-thuc-van', 'Kết thúc ván'],
];

export default function TournamentGuide() {
  return (
    <>
      <Head>
        <title>Cẩm nang thi đấu cờ vua | LIMA</title>
        <meta
          name="description"
          content="Cẩm nang dành cho người chơi, phụ huynh, HLV và trọng tài: chuẩn bị trước giải, xử lý tình huống với trọng tài, quy trình suy nghĩ trước mỗi nước đi và quản lý thời gian."
        />
        <meta property="og:title" content="♟️ Cẩm nang thi đấu cờ vua" />
        <meta
          property="og:description"
          content="Những điều cần nhớ trước mỗi giải đấu: luật thi đấu, xử lý tình huống và quản lý thời gian."
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
          <header className={`${styles.hero} ${styles.guideHero}`}>
            <p className={styles.eyebrow}>LIMA Chess · TÀI LIỆU THAM KHẢO</p>
            <h1>Cẩm nang thi đấu cờ vua</h1>
            <p className={styles.intro}>
              Chuẩn bị trước giải, nắm rõ luật và xử lý tình huống tại bàn đấu.
            </p>
          </header>
          <nav
            className={styles.guideNavigation}
            aria-label="Nội dung hướng dẫn"
          >
            <div className={styles.navigationGrid}>
              {sections.map(([id, label]) => (
                <a key={id} href={`#${id}`}>
                  {label}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </nav>

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
                <strong>Điện thoại và đồng hồ thông minh:</strong> Kiểm tra quy
                định thiết bị của giải trước khi vào thi đấu. Không mang thiết
                bị chưa được trọng tài cho phép trên người; chỉ tắt tiếng là
                chưa đủ. Nếu giải cho phép cất trong túi, phải tắt hoàn toàn và
                đặt túi ở nơi được chấp thuận; không tự mở túi trong ván.
              </li>
              <li>
                <strong>Đến muộn hoặc bị ốm giữa hai ván:</strong> Kiểm tra giờ
                bắt đầu và thời gian được phép đến muộn theo điều lệ. Nếu không
                thể về bàn đúng giờ, báo trọng tài sớm; phụ huynh hoặc HLV có
                thể báo giúp.{' '}
                <strong>
                  Đồng hồ vẫn chạy khi đến lượt người chơi vắng mặt
                </strong>
                , trừ khi trọng tài quyết định khác. Việc báo ốm không tự động
                được hoãn ván hoặc bù giờ.{' '}
                <strong>
                  Quá thời gian được phép đến muộn có thể bị xử thua dù đồng hồ
                  chưa hết giờ.
                </strong>
              </li>
              <li>
                <strong>Không có đồng hồ:</strong> Bình tĩnh suy nghĩ. Nếu được
                bổ sung đồng hồ, nghe hướng dẫn của trọng tài.
              </li>
            </ul>
            <details className="mt-3">
              <summary className="cursor-pointer font-semibold">
                Điều lệ cần kiểm tra & nguồn tham khảo
              </summary>
              <p className="mt-2">
                Đến sau thời hạn có mặt sẽ bị xử thua, trừ khi trọng tài quyết
                định khác. Theo FIDE, nếu điều lệ không quy định thời hạn này,
                mặc định là 0 phút. Có thể bị xử thua do đến muộn dù đồng hồ
                chưa hết giờ (6.7.1).
              </p>
              <p className="mt-2">
                Mang thiết bị điện tử không được phép trên người trong địa điểm
                thi đấu có thể dẫn đến xử thua. FIDE quy định xử thua, nhưng
                điều lệ giải có thể quy định mức phạt nhẹ hơn (11.3.2).
              </p>
              <p className="mt-2">
                <a
                  className="underline"
                  href="https://handbook.fide.com/chapter/E012023"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Luật FIDE: Điều 6.6–6.7 và 11.3.2
                </a>
              </p>
            </details>
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
              <h3 id="loi-sai-luat">
                Nếu đối thủ đi sai luật:{' '}
                <mark className={styles.highlight}>
                  Gọi trọng tài ngay, trước khi đi nước tiếp theo!
                </mark>
              </h3>

              <p className="mt-2">
                <strong>Dừng đồng hồ nếu có</strong>, giữ nguyên bàn cờ, rồi giơ
                tay gọi to và rõ “Trọng tài ơi!”. Tiếp tục giơ tay và chờ trọng
                tài đến, không tự đi tiếp.
              </p>
              <p className="mt-3">
                <strong>Ví dụ:</strong> Đối thủ đi Mã thẳng 2 ô, hoặc không giải
                chiếu mà đi quân khác, để Vua vẫn bị chiếu.
              </p>
              <p className="mt-3 font-semibold">Lỗi được xử lý thế nào?</p>
              <ul className="mt-2">
                <li>
                  <strong>Đối thủ chưa bấm đồng hồ:</strong> Phải sửa nước đi
                  theo luật chạm quân phía trên (chưa bị tính là 1 lỗi).
                </li>
                <li>
                  <strong>Đối thủ đã bấm đồng hồ:</strong> Trọng tài xác minh và
                  xử lý theo luật.
                </li>
                <li>
                  <strong>Giải không dùng đồng hồ:</strong> Trọng tài xử lý theo
                  quy định của giải.
                </li>
              </ul>
              <details className="mt-3">
                <summary className="cursor-pointer font-semibold">
                  Nếu trọng tài tự phát hiện thì sao?
                </summary>
                <p className="mt-2">
                  Trọng tài xử lý tùy theo thể thức áp dụng và thời điểm phát
                  hiện lỗi. Các trường hợp dưới đây giải thích cách xử lý theo
                  luật FIDE, áp dụng như nhau cho cả hai người chơi.
                </p>
                <ul className="mt-2">
                  <li>
                    <strong>Người đi sai chưa bấm đồng hồ:</strong> Trọng tài
                    yêu cầu sửa nước đi theo luật chạm quân; chưa tính là một
                    lỗi đã hoàn thành.
                  </li>
                  <li>
                    <strong>Người đi sai đã bấm đồng hồ:</strong>
                    <ul className="mt-2">
                      <li>
                        <strong>Cờ tiêu chuẩn:</strong> Trọng tài phải khôi phục
                        thế cờ, yêu cầu sửa nước đi và xử lý lỗi theo luật,{' '}
                        <strong>kể cả khi bên kia đã đi tiếp</strong>.
                      </li>
                      <li>
                        <strong>Cờ nhanh/cờ chớp áp dụng A.5:</strong> Nếu trọng
                        tài trực tiếp thấy nước đi sai được hoàn thành:
                        <p className="mt-2">
                          <strong>Bên kia chưa đi nước tiếp theo:</strong> Trọng
                          tài phải yêu cầu sửa nước đi và xử lý lỗi, không cần
                          chờ khiếu nại.
                        </p>
                        <p className="mt-2">
                          <strong>Bên kia đã đi nước tiếp theo</strong> mà trước
                          đó chưa khiếu nại và trọng tài chưa can thiệp: trọng
                          tài{' '}
                          <strong>
                            không xử lý lại nước đi trái luật trước đó theo Điều
                            A.5.2
                          </strong>
                          , mà cho ván đấu tiếp tục với nước sai được giữ
                          nguyên.
                        </p>
                      </li>
                    </ul>
                  </li>
                </ul>
                <details className="mt-3">
                  <summary className="cursor-pointer font-semibold">
                    Chi tiết luật & nguồn tham khảo
                  </summary>
                  <p className="mt-2">
                    <strong>Luật FIDE và điều lệ giải:</strong> Với giải phong
                    trào có quy định riêng, cần đọc điều lệ hoặc hỏi trọng tài
                    trưởng trước giải.
                  </p>
                  <p className="mt-2">
                    <strong>Ngoại lệ:</strong> Cờ nhanh/cờ chớp đủ điều kiện
                    giám sát và ghi chép theo Điều A.4/B.2 áp dụng cách xử lý
                    như cờ tiêu chuẩn nêu trên.
                  </p>
                  <p className="mt-2">
                    <strong>Sửa nước sai sau khi đã đi tiếp (A.5.2):</strong>{' '}
                    Chỉ được sửa nếu hai người chơi cùng đồng ý, không có sự can
                    thiệp của trọng tài.{' '}
                    <strong>
                      Nếu một người không đồng ý, nước sai được giữ nguyên và
                      ván đấu tiếp tục.
                    </strong>
                  </p>
                  <p className="mt-2">
                    <strong>Trường hợp đặc biệt (A.5.4):</strong> Nếu trọng tài
                    thấy cả hai Vua cùng bị chiếu hoặc một Tốt còn ở hàng cuối
                    chưa phong cấp, trọng tài chờ nước tiếp theo hoàn thành. Nếu
                    thế cờ vẫn bất hợp lệ, trọng tài tuyên bố hòa.
                  </p>
                  <p className="mt-2">
                    <a
                      className="underline"
                      href="https://arbiters.fide.com/wp-content/uploads/Publications/Manual/Arbiters_Manual_2025.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Sổ tay trọng tài FIDE 2025: Điều 3.10, 7.5.1, A.4–A.5 và
                      B.2–B.3
                    </a>
                  </p>
                </details>
              </details>
              <details className="mt-3">
                <summary className="cursor-pointer font-semibold">
                  Nếu không nhớ thế cờ trước lỗi
                </summary>
                <p className="mt-2">
                  Khi luật cho phép khôi phục thế cờ, nếu không xác định được
                  thế cờ ngay trước lỗi, trọng tài cho tiếp tục từ thế cờ gần
                  nhất trước đó có thể xác định được.
                </p>
              </details>
            </aside>
            <div className={styles.note}>
              <p>
                <strong>Mốc 3 lỗi ở một số giải phong trào:</strong> Loại lỗi
                được tính và cách xử lý theo điều lệ của giải.
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer font-semibold">
                  Chi tiết & nguồn tham khảo
                </summary>
                <p className="mt-2">
                  Theo FIDE, người chơi hoàn thành nước đi không hợp lệ lần thứ
                  2 của mình trong cùng một ván sẽ bị xử thua; xử hòa nếu đối
                  phương không thể chiếu hết bằng bất kỳ chuỗi nước đi hợp lệ
                  nào. Mốc 3 lỗi là quy định riêng của một số giải phong trào.
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
            <aside
              className={styles.pitfalls}
              aria-labelledby="tam-dung-dong-ho"
            >
              <h3 id="tam-dung-dong-ho">Khi nào được tạm dừng đồng hồ?</h3>
              <p className="mt-2">
                Tạm dừng ở đây là dừng cả hai bên đồng hồ, khác với bấm chuyển
                lượt sau khi đi quân. Người chơi có thể tạm dừng để gọi trọng
                tài khi có lý do chính đáng, dù đang chạy thời gian của mình hay
                của đối thủ. Việc dừng khi đang chạy giờ đối thủ không tự động
                dẫn đến xử thua; nếu dừng không chính đáng, trọng tài xử phạt
                theo Điều 12.9, trong đó có thể có hình thức xử thua.
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer font-semibold">
                  Các tình huống thường gặp & nguồn tham khảo
                </summary>

                <p className="mt-3 font-semibold">Được dừng để gọi trọng tài</p>
                <ul className="mt-2">
                  <li>
                    <strong>Thiếu quân phong cấp:</strong> Tốt đến hàng cuối
                    nhưng không có quân cần dùng (6.11.2).
                  </li>
                  <li>
                    <strong>Đồng hồ bị hỏng:</strong> Ví dụ màn hình tắt hoặc
                    đồng hồ không hoạt động; dừng để gọi trọng tài kiểm tra,
                    không tự sửa (6.10.1, 6.11.2).
                  </li>
                  <li>
                    <strong>Đồng hồ cài sai thời gian:</strong> Báo trọng tài
                    ngay, không tự chỉnh (6.10.2). Với cờ nhanh/cờ chớp áp dụng
                    A.5, sau khi mỗi bên hoàn thành 10 nước, không được thay đổi
                    cài đặt, trừ khi việc giữ nguyên sẽ ảnh hưởng bất lợi đến
                    lịch thi đấu của giải (A.5.1.1). Trọng tài quyết định việc
                    điều chỉnh.
                  </li>
                  <li>
                    <strong>Đối thủ đi trái luật:</strong> Dừng để yêu cầu xử
                    lý; với A.5, phải báo trước khi đi nước tiếp theo (A.5.2).
                  </li>
                  <li>
                    <strong>Quân bị xô lệch cần trọng tài hỗ trợ:</strong> Được
                    dừng theo 7.4.2; không bấm chuyển sang giờ đối thủ.
                  </li>
                  <li>
                    <strong>Yêu cầu hòa ba lần lặp lại hoặc 50 nước:</strong>{' '}
                    Người chơi hoặc trọng tài phải dừng đồng hồ khi tiếp nhận
                    yêu cầu theo đúng thủ tục (9.2–9.5). Yêu cầu sai vẫn bị
                    phạt.
                  </li>
                  <li>
                    <strong>Báo đối thủ hết giờ:</strong> Có thể dừng để gọi
                    trọng tài xác nhận; không tự kết luận thắng (6.8–6.9,
                    A.5.3).
                  </li>
                </ul>
                <p className="mt-3 font-semibold">
                  Các tình huống cần trọng tài xem xét cụ thể
                </p>
                <ul className="mt-2">
                  <li>
                    <strong>Bị làm phiền:</strong> Ví dụ đối thủ hoặc khán giả
                    liên tục nói chuyện gây cản trở thi đấu.
                  </li>
                  <li>
                    <strong>Sự cố sức khỏe:</strong> Ví dụ đột ngột bị ốm, cần
                    hỗ trợ. Đi vệ sinh do bệnh hoặc nhu cầu liên quan đến khuyết
                    tật có thể được xem xét riêng.
                  </li>
                </ul>
                <p className="mt-3 font-semibold">
                  Các trường hợp không được tự dừng đồng hồ
                </p>
                <ul className="mt-2">
                  <li>
                    <strong>
                      Dừng để suy nghĩ, nghỉ, uống nước hoặc đi vệ sinh thông
                      thường: Không được.
                    </strong>{' '}
                    Trọng tài xử phạt người tự dừng và cho ván tiếp tục. Sự cố
                    sức khỏe được xem xét riêng.
                  </li>
                  <li>
                    <strong>
                      Dừng để tự nhặt quân mình làm đổ: Không được.
                    </strong>{' '}
                    Trọng tài yêu cầu sửa bằng thời gian của người làm đổ và xử
                    lý việc dừng sai. Nếu cần trọng tài hỗ trợ, được dừng để gọi
                    (7.4.1–7.4.2).
                  </li>
                  <li>
                    <strong>
                      Dừng để chờ trả lời đề nghị hòa: Không được.
                    </strong>{' '}
                    Trọng tài xử phạt việc dừng sai và cho đồng hồ chạy đúng
                    lượt; không buộc đối thủ trả lời ngay.
                  </li>
                  <li>
                    <strong>Dừng để tự ghi bù biên bản: Không được.</strong>{' '}
                    Trọng tài xử phạt và cho đồng hồ chạy lại. Khôi phục biên
                    bản theo Điều 8.5 thực hiện theo hướng dẫn của trọng tài.
                  </li>
                  <li>
                    <strong>
                      Dừng để chờ đối thủ đi vệ sinh về: Không được.
                    </strong>{' '}
                    Trọng tài xử lý người tự dừng và cho đồng hồ chạy đúng lượt;
                    không phạt người vắng mặt chỉ vì đối thủ dừng hộ.
                  </li>
                  <li>
                    <strong>
                      Hai bên tự thỏa thuận dừng để nghỉ: Không được.
                    </strong>{' '}
                    Trọng tài xác định trách nhiệm từng người, xử phạt và cho
                    ván tiếp tục.
                  </li>
                </ul>
                <div className={styles.note}>
                  <p>
                    <strong>Phạt thế nào?</strong> Áp dụng cho cờ tiêu chuẩn,
                    nhanh và chớp: nếu lần đầu dừng sai do hiểu nhầm và ít ảnh
                    hưởng, hướng xử lý đề xuất là cảnh cáo; nếu cố tình hoặc tái
                    phạm, trọng tài thống nhất với trọng tài trưởng về mức phạt
                    thời gian, vì FIDE không quy định số phút cố định cho lỗi
                    này.
                  </p>
                  <p className="mt-2">
                    <a
                      className="underline"
                      href="https://handbook.fide.com/chapter/E012023"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Luật FIDE: Điều 6.11.3–6.11.4 và 12.9
                    </a>
                  </p>
                </div>
                <p className="mt-2">
                  <a
                    className="underline"
                    href="https://arbiters.fide.com/wp-content/uploads/Publications/Manual/Arbiters_Manual_2025.pdf#page=34"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Sổ tay trọng tài FIDE 2025, trang in 25–26: lý do dừng đồng
                    hồ và xử lý quân bị xô lệch
                  </a>
                </p>
              </details>
            </aside>
            <details className={styles.pitfalls}>
              <summary
                id="nguoi-di-cung"
                className="cursor-pointer font-semibold"
              >
                Dành cho phụ huynh và HLV
              </summary>
              <p className="mt-2">
                Trong ván đấu, không nhắc nước, ra hiệu hoặc trao đổi về thế cờ
                với người chơi. Nếu thấy sai phạm, báo riêng cho trọng tài;
                không tự can thiệp vào ván đấu. Phân tích và góp ý sau khi ván
                đã kết thúc, ở nơi không làm phiền các bàn còn thi đấu.
              </p>
              <p className="mt-2">
                <a
                  className="underline"
                  href="https://handbook.fide.com/chapter/E012023"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Luật FIDE: Điều 11.3.1 và 12.7
                </a>
              </p>
            </details>
          </section>

          <aside className={styles.pitfalls} aria-labelledby="di-ve-sinh">
            <h3 id="di-ve-sinh">Đi vệ sinh & rời bàn trong ván đấu</h3>
            <p className="mt-2">
              Áp dụng cho cả cờ tiêu chuẩn, cờ nhanh và cờ chớp; tuân thủ thêm
              quy định riêng của giải.
            </p>
            <ul className="mt-2">
              <li>
                <strong>Đang đến lượt mình:</strong> Phải được trọng tài cho
                phép trước khi rời khu vực đặt bàn thi đấu.
              </li>
              <li>
                <strong>Đang đến lượt đối thủ:</strong> Tuân thủ quy định báo
                trọng tài của giải; nếu chưa rõ, hãy hỏi trước khi đi.
              </li>
              <li>
                <strong>Đồng hồ:</strong> Không tự dừng đồng hồ để đi vệ sinh
                thông thường. Được trọng tài cho phép đi vệ sinh không có nghĩa
                là được dừng đồng hồ. Nếu đến lượt người chơi đang vắng mặt,
                thời gian của người đó vẫn chạy.
              </li>
              <li>
                <strong>Đúng nơi quy định:</strong> Dùng nhà vệ sinh thuộc địa
                điểm thi đấu. Muốn ra ngoài địa điểm thi đấu phải được trọng tài
                cho phép, dù đang đến lượt ai.
              </li>
            </ul>

            <details className="mt-3">
              <summary className="cursor-pointer font-semibold">
                Chi tiết luật & nguồn tham khảo
              </summary>
              <p className="mt-2">
                FIDE phân biệt khu vực đặt bàn thi đấu với toàn bộ địa điểm thi
                đấu, bao gồm nhà vệ sinh được chỉ định. Điều lệ giải có thể yêu
                cầu báo trọng tài cả khi đang đến lượt đối thủ.
              </p>
              <p className="mt-2">
                <a
                  className="underline"
                  href="https://handbook.fide.com/chapter/E012023"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Luật FIDE: Điều 6.2, 6.8–6.11, 7.4, 8.1, 8.5, 9.1–9.5, 11.2,
                  12.9 và A.5
                </a>
              </p>
            </details>
          </aside>

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
              <h3>Hai điểm cần kiểm tra</h3>
              <ul>
                <li>
                  Thấy có thể bắt quân, đừng vội thực hiện. Xem đối thủ có bắt
                  lại được không, đổi như vậy mình có bị thiệt quân hay bị chiếu
                  hết không.
                </li>
                <li>
                  Sau mỗi nước đi của đối thủ, hãy nhìn lại cả bàn cờ, đừng chỉ
                  nhìn quân vừa đi. Ví dụ: đối thủ dời Mã đang chắn trước Xe,
                  khiến Xe có đường bắt Hậu của mình.
                </li>
              </ul>
            </aside>
            <div className={styles.note}>
              <p>
                <strong>Đầu ván,</strong> phát triển Mã và Tượng ra để cùng kiểm
                soát trung tâm, tìm lúc nhập thành cho Vua an toàn rồi đưa hai
                Xe vào phối hợp. Đừng mải đi Hậu hoặc đi lại một quân nhiều lần
                khi các quân khác còn chưa ra, trừ khi cần tránh một đe dọa.
              </p>
              <p className="mt-3">
                <strong>Khi đang hơn quân,</strong> ưu tiên chơi chắc, giữ quân
                cẩn thận và đổi quân nếu có lợi. Gần cuối ván, nhớ xem đối thủ
                còn nước đi không: nếu đến lượt họ mà không quân nào đi được hợp
                lệ, Vua cũng không bị chiếu thì chỉ hòa (pat), dù đang hơn nhiều
                quân.
              </p>
            </div>
          </section>

          <section id="tinh-than" className={styles.section}>
            <p className={styles.kicker}>04 · THỜI GIAN & TINH THẦN THI ĐẤU</p>
            <h2>Bình tĩnh đến hết ván</h2>
            <aside className={styles.pitfalls} aria-label="Lỗi đồng hồ hay mắc">
              <h3>Đi xong, nhớ bấm đồng hồ</h3>
              <p>
                Chỉ dùng <strong>một tay</strong> để đi quân, kể cả khi bắt
                quân, nhập thành hoặc phong cấp.{' '}
                <strong>Đi xong, dùng chính tay đó bấm đồng hồ.</strong> Không
                bấm khi chưa đi xong; quên bấm thì thời gian của mình vẫn chạy.
              </p>
            </aside>
            <ul className={styles.list}>
              <li>
                Không cần đi vội theo tốc độ của đối thủ. Nhớ xem thời gian còn
                lại và tranh thủ suy nghĩ khi đối thủ đang tính nước đi.
              </li>
              <li>
                <strong>Giữa các ván:</strong> Uống nước, đi vệ sinh, nghỉ ngơi
                và trở lại đúng giờ.
              </li>
              <li>
                <strong>
                  Dù thắng hay thua, hãy chuẩn bị cho ván tiếp theo.
                </strong>{' '}
                Tránh để kết quả ván trước ảnh hưởng đến sự tập trung ở ván sau.
                Luôn tôn trọng và cư xử lịch sự với đối thủ.
              </li>
            </ul>
          </section>

          <section id="ket-thuc-van" className={styles.section}>
            <p className={styles.kicker}>05 · KẾT THÚC VÁN</p>
            <h2>Xác nhận kết quả trước khi rời bàn</h2>
            <ul className={styles.list}>
              <li>
                <strong>Nếu chưa thống nhất kết quả:</strong> Giữ nguyên bàn cờ
                và gọi trọng tài. Không vội xếp lại quân khi còn tranh chấp.
              </li>
              <li>
                <strong>Kiểm tra trước khi ký:</strong> Đọc đúng tên, màu quân
                và kết quả trên biên bản hoặc phiếu kết quả nếu giải sử dụng.
                1–0 là Trắng thắng, 0–1 là Đen thắng, ½–½ là hòa. Thấy ghi sai,
                báo để sửa trước khi ký.
              </li>
              <li>
                <strong>Báo kết quả:</strong> Làm theo hướng dẫn của giải, xác
                nhận đã ghi nhận kết quả rồi mới xếp lại quân. Rời bàn nhẹ
                nhàng, kiểm tra giờ và bảng bốc thăm ván tiếp theo.
              </li>
            </ul>
            <details className="mt-3">
              <summary className="cursor-pointer font-semibold">
                Chi tiết luật & nguồn tham khảo
              </summary>
              <p className="mt-2">
                Theo Điều 8.7, kết quả đã ký được giữ nguyên dù ghi sai, trừ khi
                trọng tài quyết định khác. Nếu phát hiện sai sau khi ký, báo
                trọng tài ngay; không tự sửa phiếu đã nộp.
              </p>
              <p className="mt-2">
                <a
                  className="underline"
                  href="https://handbook.fide.com/chapter/E012023"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Luật FIDE: Điều 8.7
                </a>
              </p>
            </details>
          </section>

          <aside
            className={`${styles.closing} mb-6`}
            aria-label="Lời nhắc khi thi đấu"
          >
            <span className={styles.trophy} aria-hidden="true">
              🏆
            </span>
            <h2>Mỗi ván đấu là một cơ hội tiến bộ</h2>
            <p className={styles.reminder}>
              Quan sát cả bàn cờ – Suy nghĩ cẩn thận – Kiểm tra trước khi chạm
              quân!
            </p>
          </aside>
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
