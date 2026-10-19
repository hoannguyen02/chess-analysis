import styles from '@/styles/TournamentNotice.module.css';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

const topicGroups = [
  {
    title: 'Cơ bản · Bắt đầu ở đây',
    topics: [
      ['Chiếu hết 1 nước', 'mateIn1'],
      ['Tấn công quân treo', 'hangingPiece'],
      ['Tấn công đôi', 'fork'],
      ['Ghim quân', 'pin'],
      ['Đòn xiên', 'skewer'],
      ['Chiếu hết hàng ngang cuối', 'backRankMate'],
      ['Chiếu hết 2 nước', 'mateIn2'],
    ],
  },
  {
    title: 'Tiếp theo · Phối hợp quân',
    topics: [
      ['Tấn công mở', 'discoveredAttack'],
      ['Chiếu mở', 'discoveredCheck'],
      ['Chiếu đôi', 'doubleCheck'],
      ['Loại bỏ quân phòng thủ', 'capturingDefender'],
      ['Bẫy quân', 'trappedPiece'],
      ['Thu hút quân', 'attraction'],
      ['Đánh lạc hướng quân', 'deflection'],
      ['Tốt sắp phong cấp', 'advancedPawn'],
      ['Tấn công Vua yếu', 'exposedKing'],
      ['Tấn công f2 / f7', 'attackingF2F7'],
      ['Tấn công cánh Vua', 'kingsideAttack'],
      ['Tấn công cánh Hậu', 'queensideAttack'],
    ],
  },
  {
    title: 'Nâng cao · Tính toán sâu',
    topics: [
      ['Thí quân', 'sacrifice'],
      ['Giải phóng ô / đường', 'clearance'],
      ['Ngắt mối liên kết', 'interference'],
      ['Nước xen giữa (Zwischenzug)', 'intermezzo'],
      ['Nước đi tĩnh', 'quietMove'],
      ['Tấn công xuyên tia (X-ray)', 'xRayAttack'],
      ['Nước phòng thủ', 'defensiveMove'],
      ['Buộc đối thủ phải đi (Zugzwang)', 'zugzwang'],
      ['Di chuyển dọc đường đối công (Collinear move)', 'collinearMove'],
      ['Chiếu hết 3 nước', 'mateIn3'],
      ['Chiếu hết 4 nước', 'mateIn4'],
      ['Chiếu hết từ 5 nước', 'mateIn5'],
    ],
  },
  {
    title: 'Mở rộng · Các mẫu chiếu hết',
    description:
      'Ôn theo số thứ tự: mẫu dễ nhận biết trước, phối hợp phức tạp sau; cuối cùng luyện tổng hợp. Chiếu hết 1–2 nước và hàng ngang cuối nằm ở nhóm cơ bản.',
    topics: [
      ['Chiếu hết hai Xe (Blind Swine)', 'blindSwineMate'],
      ['Chiếu hết Opera', 'operaMate'],
      ['Chiếu hết Pillsbury', 'pillsburysMate'],
      ['Chiếu hết Ả Rập (Arabian)', 'arabianMate'],
      ['Chiếu ngạt', 'smotheredMate'],
      ['Chiếu hết Anastasia', 'anastasiaMate'],
      ['Chiếu hết Morphy', 'morphysMate'],
      ['Chiếu hết hai Tượng', 'doubleBishopMate'],
      ['Chiếu hết Boden', 'bodenMate'],
      ['Chiếu hết Dovetail', 'dovetailMate'],
      ['Chiếu hết Epaulette', 'epauletteMate'],
      ['Chiếu hết ở góc (Corner)', 'cornerMate'],
      ['Chiếu hết Hook', 'hookMate'],
      ['Chiếu hết Triangle', 'triangleMate'],
      ['Chiếu hết Kill Box', 'killBoxMate'],
      ['Chiếu hết Balestra', 'balestraMate'],
      ['Chiếu hết Swallow’s Tail', 'swallowstailMate'],
      ['Chiếu hết Vuković', 'vukovicMate'],
      ['Chiếu hết tổng hợp', 'mate'],
    ],
  },
  {
    title: 'Mở rộng · Nước đi đặc biệt',
    topics: [
      ['Nhập thành', 'castling'],
      ['Bắt Tốt qua đường', 'enPassant'],
      ['Phong cấp', 'promotion'],
      ['Phong cấp thành Xe, Tượng hoặc Mã', 'underPromotion'],
    ],
  },
  {
    title: 'Ôn thêm · Khai cuộc, trung cuộc và tàn cuộc',
    topics: [
      ['Chiến thuật trong khai cuộc', 'opening'],
      ['Chiến thuật trong trung cuộc', 'middlegame'],
      ['Tàn cuộc tổng hợp', 'endgame'],
      ['Tàn cuộc Tốt', 'pawnEndgame'],
      ['Tàn cuộc Xe', 'rookEndgame'],
      ['Tàn cuộc Tượng', 'bishopEndgame'],
      ['Tàn cuộc Mã', 'knightEndgame'],
      ['Tàn cuộc Hậu', 'queenEndgame'],
      ['Tàn cuộc Hậu và Xe', 'queenRookEndgame'],
    ],
  },
];

const sections = [
  ['the-thuc', 'Trước giờ thi'],
  ['trong-tai', 'Luật & trọng tài'],
  ['ghi-nho', 'Cách suy nghĩ'],
  ['tinh-than', 'Thời gian & tinh thần'],
  ['luyen-tap', 'Luyện chiến thuật'],
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
          content="Những điều cần nhớ trước mỗi giải đấu, kèm bài tập chiến thuật từ cơ bản đến nâng cao trên Lichess."
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
              <h3 id="loi-sai-luat">
                Nếu đối thủ đi sai luật:{' '}
                <mark className={styles.highlight}>
                  Gọi trọng tài ngay, trước khi con đi nước tiếp theo!
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
                  Nếu không xác định được thế cờ ngay trước lỗi, trọng tài cho
                  tiếp tục từ thế cờ gần nhất trước đó có thể xác định được.
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
                  Sau mỗi nước đi của đối thủ, con nhìn lại cả bàn cờ, đừng chỉ
                  nhìn quân vừa đi. Ví dụ: đối thủ dời Mã đang chắn trước Xe,
                  khiến Xe có đường bắt Hậu của con.
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

          <section id="tinh-than" className={styles.section}>
            <p className={styles.kicker}>04 · THỜI GIAN & TINH THẦN THI ĐẤU</p>
            <h2>Bình tĩnh đến hết ván</h2>
            <aside className={styles.pitfalls} aria-label="Lỗi đồng hồ hay mắc">
              <h3>Đi xong, nhớ bấm đồng hồ</h3>
              <p>
                Chỉ dùng <strong>một tay</strong> để đi quân, kể cả khi bắt
                quân, nhập thành hoặc phong cấp.{' '}
                <strong>Đi xong, dùng chính tay đó bấm đồng hồ.</strong> Không
                bấm khi chưa đi xong; quên bấm thì thời gian của con vẫn chạy.
              </p>
            </aside>
            <ul className={styles.list}>
              <li>
                Đối thủ đi nhanh, con cũng đừng vội. Nhớ xem thời gian còn lại
                và tranh thủ suy nghĩ khi đối thủ đang tính nước đi.
              </li>
              <li>
                <strong>Giữa các ván:</strong> Uống nước, đi vệ sinh, nghỉ ngơi
                và trở lại đúng giờ.
              </li>
              <li>
                <strong>
                  Dù thắng hay thua, hãy chuẩn bị cho ván tiếp theo.
                </strong>{' '}
                Đừng để sự tiếc nuối ở ván trước ảnh hưởng đến con. Luôn tôn
                trọng và cư xử lịch sự với đối thủ.
              </li>
            </ul>
          </section>

          <section id="luyen-tap" className={styles.section}>
            <aside
              className={`${styles.closing} mb-6`}
              aria-label="Lời nhắc trước khi luyện tập"
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
            <p className={styles.kicker}>05 · ÔN LẠI CÁC CHIẾN THUẬT ĐÃ HỌC</p>
            <p>
              Con ôn nhóm cơ bản trước, rồi chọn thêm chủ đề đã học. Đây là thứ
              tự ôn gợi ý; mỗi chủ đề vẫn có bài dễ và khó.
            </p>
            {topicGroups.map((group, groupIndex) => (
              <details
                key={group.title}
                className={styles.topicGroup}
                open={groupIndex === 0}
              >
                <summary>
                  {group.title}
                  <span className={styles.topicCount}>
                    {' '}
                    · {group.topics.length} chủ đề
                  </span>
                </summary>
                {group.description && (
                  <p className="mt-3 text-sm">{group.description}</p>
                )}
                <div className={styles.topics}>
                  {group.topics.map(([label, theme], topicIndex) => (
                    <a
                      key={theme}
                      href={`https://lichess.org/training/${theme}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className={styles.topicNumber}>
                        {String(topicIndex + 1).padStart(2, '0')}
                      </span>
                      <span>{label}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
              </details>
            ))}
            <p className="mt-5 text-sm">
              Nguồn bài tập:{' '}
              <a
                className="underline"
                href="https://lichess.org/training/themes"
                target="_blank"
                rel="noopener noreferrer"
              >
                Danh mục chủ đề Lichess
              </a>
              {' · '}
              <a
                className="underline"
                href="https://lichess.org/training"
                target="_blank"
                rel="noopener noreferrer"
              >
                Luyện tổng hợp
              </a>
            </p>
          </section>
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
