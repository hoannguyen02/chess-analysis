import styles from '@/styles/TournamentNotice.module.css';
import type { GetStaticProps } from 'next';
import Head from 'next/head';

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

export default function TacticsPractice() {
  return (
    <>
      <Head>
        <title>Luyện chiến thuật | LIMA Chess</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta
          name="description"
          content="Bài tập chiến thuật cờ vua theo chủ đề, từ cơ bản đến nâng cao trên Lichess."
        />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <header className={styles.hero}>
            <p className={styles.eyebrow}>LIMA CHESS · LUYỆN TẬP</p>
            <h1>Luyện chiến thuật</h1>
            <p className={styles.intro}>Bài tập theo chủ đề trên Lichess</p>
          </header>
          <section
            className={styles.section}
            aria-label="Chủ đề luyện chiến thuật"
          >
            <p className={styles.kicker}>CHỦ ĐỀ LUYỆN TẬP</p>
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
