import type { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/ArbiterGuide.module.css';

const laws = 'https://handbook.fide.com/chapter/e012023';
const manual =
  'https://arbiters.fide.com/wp-content/uploads/Publications/Manual/Arbiter-Manual-2026.pdf';

type Situation = {
  title: string;
  action: string;
  scope?: string;
  example?: string;
  reference: string;
};
const topics: { id: string; title: string; cases: Situation[] }[] = [
  {
    id: 'can-thiep',
    title: 'Khi nào trọng tài phải can thiệp?',
    cases: [
      {
        title: 'Trực tiếp thấy nước đi trái luật đã hoàn thành',
        scope: 'Cờ nhanh (A.5) · Cờ chớp (B.3)',
        action:
          'Nếu trực tiếp chứng kiến nước trái luật đã hoàn thành và đối thủ chưa đi nước tiếp theo, phải can thiệp, không chờ khiếu nại. Không có trọng tài riêng từng bàn không có nghĩa là được bỏ qua lỗi đã thấy.',
        example:
          'Mã đi thẳng hai ô, người chơi bấm đồng hồ, đối thủ chưa đi tiếp: dừng ván để xử lý.',
        reference: 'A.5.2; B.3',
      },
      {
        title: 'Đối thủ đã đi tiếp rồi mới phát hiện',
        action:
          'Với cờ nhanh (A.5) hoặc cờ chớp (B.3), nếu trước đó không khiếu nại và trọng tài chưa can thiệp, nước trái luật được giữ nguyên. Không xử lý lại nước đó theo A.5.2. Hai người có thể tự thỏa thuận sửa, không có sự can thiệp của trọng tài; một bên không đồng ý thì tiếp tục. Với cờ tiêu chuẩn, cờ nhanh (A.4) hoặc cờ chớp (B.2), vẫn khôi phục và xử lý khi phát hiện trong ván.',
        reference: '7.5.1; A.4–A.5; B.2–B.3',
      },
      {
        title: 'Không thấy nước sai nhưng người chơi khiếu nại đúng lúc',
        scope: 'Cờ nhanh (A.5) · Cờ chớp (B.3)',
        action:
          'Với cờ nhanh (A.5) hoặc cờ chớp (B.3), nếu đối thủ khiếu nại trước khi đi nước tiếp theo, trọng tài phải xác minh. Nếu xác định có nước trái luật đã hoàn thành, xử lý theo 7.5.5 và A.3; không từ chối chỉ vì mình không trực tiếp chứng kiến. Giữ nguyên thế cờ, kiểm tra diễn biến và chứng cứ trước khi kết luận.',
        reference: 'A.5.2; A.3; Sổ tay trọng tài 2026, chú giải 3.10',
      },
      {
        title:
          'Chỉ thấy thế cờ bất hợp lệ: hai Vua bị chiếu hoặc Tốt ở hàng cuối',
        scope: 'Cờ nhanh (A.5) · Cờ chớp (B.3)',
        action:
          'Trong cờ nhanh (A.5) hoặc cờ chớp (B.3), nếu không có căn cứ xử lý theo A.5.2 từ quan sát trực tiếp hoặc khiếu nại hợp lệ: chờ nước tiếp theo hoàn thành; nếu thế cờ vẫn bất hợp lệ thì tuyên bố hòa theo A.5.4. Nếu có khiếu nại đúng lúc, phải xác minh trước, không bỏ qua để chờ tuyên hòa.',
        reference: 'A.5.4; Sổ tay trọng tài, chú giải Điều 3.10',
      },
      {
        title: 'Người chơi quên bấm đồng hồ hoặc bỏ lỡ nước thắng',
        action:
          'Không nhắc bấm đồng hồ, không nhắc nước đi, không báo đang bị chiếu để hỗ trợ người chơi. Phân biệt tư vấn cách chơi với xử lý vi phạm đã xảy ra theo luật.',
        reference: '12.6',
      },
    ],
  },
  {
    id: 'nuoc-dac-biet',
    title: 'Nhập thành, bắt tốt qua đường, phong cấp',
    cases: [
      {
        title: 'Nhập thành: kiểm tra những gì?',
        action:
          'Vua và Xe dùng nhập thành chưa từng di chuyển; không có quân ở giữa; ô Vua đang đứng, đi qua và đến đều không bị tấn công. Xe bị tấn công không tự làm mất quyền nhập thành. Nhập thành dài: ô b1/b8 phải trống nhưng được phép bị tấn công. Áp dụng cho cờ vua thông thường, không dùng quy trình này cho Chess960.',
        example:
          'Vua đã đi rồi quay về e1 vẫn mất quyền nhập thành. Quân bị ghim vẫn có thể khống chế ô Vua đi qua.',
        reference: '3.1.3; 3.8.2; 3.9.1',
      },
      {
        title: 'Chạm Xe trước rồi mới chạm Vua để nhập thành',
        action:
          'Không cho nhập thành bên đó ở nước này; áp dụng chạm quân với Xe. Nếu chạm Vua rồi Xe nhưng nhập thành không hợp lệ, phải đi một nước Vua hợp lệ, kể cả nhập thành phía còn lại nếu được. Chỉ khi Vua không có nước hợp lệ mới được đi quân khác.',
        reference: '4.3; 4.4.1–4.4.3',
      },
      {
        title: 'Bắt tốt qua đường: có thật sự hợp lệ?',
        action:
          'Chỉ được bắt ngay sau nước Tốt đối phương tiến hai ô từ vị trí ban đầu và đứng cạnh Tốt bắt. Kiểm tra cả thế cờ sau khi bỏ Tốt bị bắt: không được để Vua bên bắt bị chiếu. Đây là quyền lựa chọn, không phải nước bắt bắt buộc.',
        example:
          'Tốt Trắng e5, Đen vừa d7–d5: Trắng có thể e5xd6, bỏ Tốt d5. Nếu Trắng đi nước khác, lượt sau không còn quyền bắt qua đường Tốt đó.',
        reference: '3.7.3.1–3.7.3.2; 3.9.2',
      },
      {
        title: 'Phong cấp thiếu quân hoặc chưa thay Tốt đã bấm đồng hồ',
        action:
          'Thiếu quân cần phong: cho tạm dừng để gọi trọng tài cung cấp. Được chọn Hậu, Xe, Tượng hoặc Mã cùng màu, không phụ thuộc quân đã bị bắt. Nếu để Tốt ở hàng cuối rồi bấm đồng hồ: xử lý nước trái luật và thay bằng Hậu cùng màu khi còn được xử lý theo thể thức áp dụng.',
        example:
          'Không coi Xe úp ngược là Hậu. Khi phong cấp bình thường, lựa chọn được chốt khi quân mới chạm ô phong cấp.',
        reference: '3.7.3.3–3.7.3.5; 4.4.4; 6.11.2; 7.5.2; A.5.2',
      },
    ],
  },
  {
    id: 'cham-quan',
    title: 'Chạm quân và thao tác dễ nhầm',
    cases: [
      {
        title: 'Xếp sai quân, đặt sai bàn hoặc ngồi nhầm màu',
        action:
          'Với cờ tiêu chuẩn, cờ nhanh (A.4) hoặc cờ chớp (B.2): sai vị trí xuất phát thì hủy ván và chơi lại; sai hướng bàn thì chuyển thế hiện tại sang bàn đặt đúng. Với cờ nhanh (A.5) hoặc cờ chớp (B.3), sau mỗi bên hoàn thành 10 nước không còn được khiếu nại về xếp quân/hướng bàn; Vua xếp sai không được nhập thành, Xe xếp sai không được dùng nhập thành. Nhầm màu quân áp dụng riêng Điều 7.3: dưới 10 nước mỗi bên thì chơi lại đúng màu; từ 10 nước trở lên tiếp tục.',
        reference: '7.2–7.3; A.5.1.2; B.3',
      },
      {
        title: 'Chạm quân nhưng chưa bấm đồng hồ',
        action:
          'Chưa bấm không có nghĩa là được đổi ý. Chạm có chủ ý thì phải đi/bắt quân theo Điều 4 nếu hợp lệ; đã thả quân ở ô hợp lệ thì không đổi ô. Chạm vô ý rõ ràng không áp dụng chạm quân. Muốn sửa quân phải báo trước, trong lượt mình.',
        reference: '4.2–4.7',
      },
      {
        title: 'Dùng hai tay khác với đi một tay, bấm một tay khác',
        action:
          'Dùng hai tay thực hiện một nước rồi bấm đồng hồ: xử như nước đi trái luật. Đi quân bằng một tay, bấm bằng tay kia: vi phạm thao tác đồng hồ, xử theo Điều 12.9, không tự động cộng vào số nước đi trái luật. Bấm đồng hồ mà không đi quân thuộc Điều 7.5.3.',
        reference: '6.2.3; 7.5.3–7.5.4; 12.9',
      },
      {
        title: 'Hai bên tranh cãi về việc chạm quân',
        action:
          'Hỏi từng bên thứ tự chạm, ý định sửa quân và thời điểm khiếu nại; đối chiếu quan sát, biên bản và chứng cứ có được. Không kết luận chỉ vì một bên nói to hơn. Quyền khiếu nại vi phạm Điều 4.1–4.7 mất khi người khiếu nại chạm quân để đi hoặc bắt.',
        reference: '4.8; 12.1–12.3',
      },
    ],
  },
  {
    id: 'dong-ho',
    title: 'Đồng hồ, tạm dừng và hết giờ',
    cases: [
      {
        title: 'Tự dừng để nghỉ, uống nước, ghi biên bản hoặc chờ đối thủ',
        action:
          'Không hợp lệ nếu chỉ vì các mục đích này. Xác minh lý do, áp dụng hình phạt Điều 12.9 và cho đồng hồ chạy đúng bên. Không tự động tính một nước đi trái luật. Đi vệ sinh thông thường không được dừng; sự cố sức khỏe cần xem xét riêng.',
        reference: '6.11; 8.1; 12.9',
      },
      {
        title: 'Mức phạt cho việc dừng sai là bao nhiêu?',
        action:
          'FIDE không ấn định số phút cho lỗi này ở cả ba thể thức. Hướng thực hành đề xuất: lần đầu do hiểu nhầm, dừng ngắn và ít ảnh hưởng có thể cảnh cáo; cố tình hoặc tái phạm thì thống nhất mức phạt thời gian với trọng tài trưởng. Ghi rõ quyết định và lý do; không tự lấy mức 1/2 phút của nước đi trái luật áp sang.',
        reference:
          '6.11.4; 12.9 — hướng thực hành không phải thang phạt bắt buộc',
      },
      {
        title: 'Người chơi làm đổ quân',
        action:
          'Yêu cầu người làm đổ đặt lại quân bằng thời gian của mình. Nếu cần trọng tài hỗ trợ, một trong hai người được tạm dừng để gọi. Trọng tài có thể phạt hành vi làm đổ theo Điều 12.9; không tự động tính một nước đi trái luật.',
        reference: '7.4; 12.9',
      },
      {
        title: 'Đồng hồ bị hỏng',
        action:
          'Khi có dấu hiệu hỏng rõ ràng, dừng ván và thay đồng hồ. Ghi lại thời gian hiển thị, bên đến lượt và thông tin liên quan; dùng chứng cứ và nhận định tốt nhất để đặt thời gian trên đồng hồ thay thế, rồi cho chơi tiếp.',
        reference: '6.10.1; 6.11',
      },
      {
        title: 'Đồng hồ cài sai thời gian hoặc giây cộng',
        action:
          'Theo Điều 6.10.2: dừng đồng hồ, cài đúng và điều chỉnh thời gian, bộ đếm nếu cần. Riêng cờ nhanh (A.5) hoặc cờ chớp (B.3): sau mỗi bên hoàn thành 10 nước, không đổi cài đặt trừ khi việc giữ nguyên sẽ ảnh hưởng bất lợi đến lịch trình giải. Phân biệt cài sai với đồng hồ thực sự bị hỏng.',
        reference: '6.10.2; A.5.1.1; B.3',
      },
      {
        title: 'Thấy một bên hết giờ: có phải chờ người chơi báo?',
        action:
          'Không. Trọng tài phải ghi nhận cờ rụng khi thấy, kể cả cờ nhanh (A.5) và cờ chớp (B.3). Trước khi xử thua, kiểm tra ván đã kết thúc chưa và đối thủ có thể chiếu hết bằng bất kỳ chuỗi nước hợp lệ nào không. Nếu không thể thì hòa. Không chỉ đếm quân hoặc xét có ép thắng được hay không.',
        example:
          'Chiếu hết hợp lệ đã xảy ra trước khi hết giờ kết thúc ván ngay, không cần bấm đồng hồ. Nếu cả hai hiển thị 0.00, kiểm tra chỉ báo bên hết giờ trước; không tự mặc định hòa.',
        reference: '5.1–5.2; 6.8–6.9; A.5.5; Sổ tay trọng tài, chú giải A.5.3',
      },
    ],
  },
  {
    id: 'hoa',
    title: 'Hòa: khiếu nại hay tự động kết thúc?',
    cases: [
      {
        title: 'Hết nước đi, thế cờ chết, đề nghị hòa',
        action:
          'Hết nước đi hợp lệ và Vua không bị chiếu: hòa ngay. Thế cờ không bên nào có thể chiếu hết bằng bất kỳ chuỗi nước hợp lệ nào: hòa ngay. Đề nghị hòa là việc khác: kiểm tra điều lệ có cho phép; không bắt đối thủ trả lời ngay và không dừng đồng hồ để chờ.',
        reference: '5.2; 9.1',
      },
      {
        title: 'Lặp thế ba lần hoặc 50 nước',
        action:
          'Cần yêu cầu hợp lệ từ người đến lượt. Nếu dựa vào nước sắp đi, người chơi ghi nước dự định và báo trọng tài trước khi thực hiện. Tạm dừng để kiểm tra. Lặp thế phải cùng bên đến lượt, cùng vị trí quân và cùng quyền đi, gồm nhập thành/bắt qua đường. 50 nước là mỗi bên 50 nước, không đi Tốt và không bắt quân.',
        reference: '9.2–9.5',
      },
      {
        title: 'Đã chạm quân rồi mới yêu cầu hòa theo lặp thế/50 nước',
        action:
          'Chạm quân theo Điều 4.3 làm mất quyền yêu cầu theo 9.2/9.3 ở nước đó. Giải thích và cho tiếp tục; không tự động phạt như yêu cầu hòa sai theo 9.5.3. Nếu gây cản trở, trọng tài có thể cộng thời gian cho đối thủ. Quyền yêu cầu trở lại ở lượt sau nếu lúc đó đủ điều kiện, không hồi tố lượt đã bỏ qua.',
        reference: '9.4; Sổ tay trọng tài 2026, chú giải 9.4–9.5',
      },
      {
        title: 'Yêu cầu hòa đúng thủ tục nhưng kiểm tra không đủ điều kiện',
        action:
          'Theo 9.5.3, cộng đối thủ 2 phút ở cờ tiêu chuẩn hoặc cờ chớp (B.2); 1 phút ở cờ nhanh hoặc cờ chớp (B.3). Cho ván tiếp tục. Nếu yêu cầu dựa trên nước dự định đã ghi, phải thực hiện nước đó nếu hợp lệ; nếu nước đó trái luật, sửa theo Điều 3 và 4. Không tính yêu cầu hòa sai thành một nước đi trái luật.',
        reference: '9.5.3; A.3; B.2–B.3; Sổ tay trọng tài 2026, chú giải 9.5',
      },
      {
        title: 'Lặp thế năm lần hoặc 75 nước',
        action:
          'Khi xác định cùng thế cờ xuất hiện ít nhất năm lần, hoặc mỗi bên đã đi ít nhất 75 nước liên tiếp không đi Tốt và không bắt quân: trọng tài dừng ván, tuyên hòa, không cần người chơi khiếu nại. Lặp thế không cần liên tiếp. Nếu nước thứ 75 tạo chiếu hết thì chiếu hết ưu tiên.',
        reference: '9.6',
      },
    ],
  },
  {
    id: 'phong-thi',
    title: 'Đến muộn, rời bàn, thiết bị và người xem',
    cases: [
      {
        title: 'Đến muộn hoặc đau bụng giữa hai ván',
        action:
          'Kiểm tra thời hạn có mặt đã công bố. Theo FIDE, không quy định thì mặc định 0 phút; đến sau hạn bị xử thua trừ khi trọng tài quyết định khác. Báo ốm không tự được hoãn hoặc bù giờ. Ghi nhận thông tin, chuyển trọng tài trưởng quyết định ngoại lệ và báo rõ cho các bên.',
        reference: '6.6–6.7; 12.2.6',
      },
      {
        title: 'Xin đi vệ sinh trong ván',
        action:
          'Đang đến lượt: cần phép trước khi rời khu vực đặt bàn. Đến lượt đối thủ: xem quy định báo trọng tài của giải. Rời toàn bộ địa điểm thi đấu luôn cần phép. Cho phép đi không đồng nghĩa cho dừng đồng hồ; thời gian vẫn chạy khi đến lượt, trừ quyết định tạm dừng riêng.',
        reference: '11.2; 6.11',
      },
      {
        title: 'Điện thoại, đồng hồ thông minh, phụ huynh nhắc nước',
        action:
          'Thiết bị điện tử không được phép trên người: Điều 11.3.2.2 quy định thua, đối thủ thắng; điều lệ có thể quy định nhẹ hơn. Xác minh trước khi kết luận. Người xem nhắc nước: ngăn can thiệp, ghi nhận và báo trọng tài trưởng; không tự động xử thua kỳ thủ chỉ vì hành vi của người xem.',
        reference: '11.3; 12.7–12.9',
      },
    ],
  },
  {
    id: 'bien-ban',
    title: 'Biên bản, kết quả và khiếu nại',
    cases: [
      {
        title: 'Khi nào phải ghi biên bản?',
        action:
          'Cờ tiêu chuẩn phải ghi. Còn dưới 5 phút và không được cộng ít nhất 30 giây mỗi nước: được miễn ghi đến hết giai đoạn đó. Cờ nhanh không bắt buộc ghi; cờ chớp (B.3) cũng vậy. Cờ chớp (B.2) áp dụng quy định thi đấu đầy đủ. Cần khôi phục biên bản thì theo Điều 8.5, không cho tự dừng chỉ để ghi bù.',
        reference: '8.1; 8.4–8.5; A.2; B.2–B.3',
      },
      {
        title: 'Xác nhận kết quả và tiếp nhận phản đối',
        action:
          'Đối chiếu tên, màu quân, số bàn, kết quả; thu biên bản/phiếu và kiểm tra nhập điểm trước vòng sau. Khi tranh chấp, giữ bàn cờ và đồng hồ, ghi diễn biến và giải thích điều luật áp dụng. Hướng dẫn thủ tục, thời hạn khiếu nại của giải; ký biên bản không tự làm mất quyền khiếu nại, trừ điều lệ quy định khác.',
        reference: '8.7; 11.9–11.10 — kèm quy trình tổ chức đề xuất',
      },
    ],
  },
];

export default function ArbiterGuide() {
  return (
    <>
      <Head>
        <title>Cẩm nang trọng tài cờ vua | LIMA</title>
        <meta
          name="description"
          content="Tài liệu đọc trước giải cho trọng tài: thể thức, can thiệp, nước đi trái luật, đồng hồ, nhập thành, bắt tốt qua đường và xử lý tranh chấp."
        />
        <meta property="og:title" content="Cẩm nang trọng tài cờ vua" />
        <meta
          property="og:description"
          content="Checklist trước giải và cách xử lý những tình huống thường gặp, kèm căn cứ FIDE."
        />
        <meta property="og:type" content="article" />
      </Head>
      <main lang="vi" className={styles.page}>
        <article className={styles.article}>
          <Link href="/goc-hoc-tap/co-vua" className={styles.back}>
            ← Góc học tập · Cờ vua
          </Link>
          <header className={styles.header}>
            <p className={styles.eyebrow}>LIMA CHESS · DÀNH CHO TRỌNG TÀI</p>
            <h1>Cẩm nang trọng tài cờ vua</h1>
            <p>
              Đọc trước giải, tra cứu khi cần xử lý tình huống. Tập trung vào
              công việc trọng tài và những điểm luật dễ nhầm.
            </p>
            <p>
              Áp dụng cho cờ tiêu chuẩn (Classical), cờ nhanh (Rapid) và cờ chớp
              (Blitz). Các điểm khác nhau được ghi rõ ở từng tình huống.
            </p>
            <p className={styles.meta}>
              Căn cứ: Luật FIDE hiệu lực 01/01/2023 và Sổ tay trọng tài 2026 ·
              Đối chiếu ngày 21/10/2026
            </p>
          </header>
          <nav className={styles.navigation} aria-label="Mục lục">
            <p>
              <strong>Mục lục</strong>
              <span>Chọn mục để xem nhanh</span>
            </p>
            <div>
              {[
                ['truoc-giai', 'Trước giải'],
                ['xu-ly-loi', 'Nước đi trái luật'],
                ['giai-phong-trao', 'Giải phong trào quy định 3 lỗi'],
                ...topics.map((t) => [t.id, t.title]),
                ['nguon', 'Nguồn & mẫu ghi nhận'],
              ].map(([id, label]) => (
                <a key={id} href={`#${id}`}>
                  {label}
                  <span aria-hidden="true">↓</span>
                </a>
              ))}
            </div>
          </nav>

          <section id="truoc-giai" className={styles.section}>
            <h2>Trước giải: thống nhất cách làm</h2>
            <p>
              Trọng tài trưởng nên dùng danh sách này để phổ biến trước vòng
              đầu. Điều lệ giải cần được đọc cùng tài liệu này; không tự đặt quy
              định khác luật cho giải tính rating FIDE.
            </p>
            <ul className={styles.checklist}>
              <li>
                Chốt thời gian, giây cộng, số vòng; cờ nhanh áp dụng A.4/A.5, cờ
                chớp áp dụng B.2/B.3; thời hạn đến muộn và thủ tục khiếu nại.
              </li>
              <li>
                Phân công bàn, người hỗ trợ lúc cạn giờ, người ghi lỗi và nhập
                kết quả; thống nhất ai giải quyết tình huống chưa rõ.
              </li>
              <li>
                Trọng tài có quan hệ với VĐV hoặc CLB dự giải nên báo trước để
                trọng tài trưởng bố trí người khác phụ trách khi có thể. Đây là
                biện pháp tổ chức đề xuất để bảo đảm khách quan.
              </li>
              <li>
                Kiểm tra bàn/quân, số bàn, màu quân, đồng hồ; tập thao tác dừng,
                cộng/trừ giờ, đổi lượt và bộ đếm nước trên đúng loại đồng hồ của
                giải.
              </li>
              <li>
                Chuẩn bị quân phong cấp, đồng hồ dự phòng, phiếu kết quả; công
                bố nơi để thiết bị và quy định rời bàn.
              </li>
              <li>
                Thống nhất cách cân nhắc vi phạm theo Điều 12.9, ghi nhận và
                giải thích quyết định nhất quán giữa các bàn.
              </li>
              <li>
                Nếu giải dùng mốc “3 lỗi”, kiểm tra quy định bằng văn bản và phổ
                biến cách tính lỗi trước vòng đầu; xem{' '}
                <a href="#giai-phong-trao">mục dành cho giải phong trào</a>.
              </li>
            </ul>
            <div className={styles.note}>
              <strong>Khi được gọi đến bàn:</strong> Dừng đồng hồ nếu cần → ghi
              thời gian và bên đến lượt → nghe hai bên, xác minh → áp dụng đúng
              thể thức → giải thích, ghi nhận → cho chơi tiếp hoặc xác nhận kết
              quả. Đây là quy trình thực hành đề xuất.
            </div>
          </section>

          <section id="xu-ly-loi" className={styles.section}>
            <h2>Nước đi trái luật: xác định thể thức trước</h2>
            <p>
              <strong>Chưa bấm đồng hồ:</strong> yêu cầu sửa theo luật chạm
              quân; chưa xử phạt như một nước đi trái luật đã hoàn thành.{' '}
              <strong>Đã bấm:</strong> kiểm tra thời điểm phát hiện và số lần vi
              phạm của chính người đó trong ván.
            </p>
            <div
              className={styles.tableWrap}
              tabIndex={0}
              role="region"
              aria-label="Bảng xử lý nước đi trái luật, cuộn ngang trên màn hình nhỏ"
            >
              <table>
                <caption>
                  Theo luật FIDE: nước đi trái luật đã hoàn thành và còn được xử
                  lý
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Thể thức</th>
                    <th scope="col">Đối thủ đã đi tiếp?</th>
                    <th scope="col">Lần đầu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Cờ tiêu chuẩn</th>
                    <td>Vẫn xử lý khi phát hiện trong ván</td>
                    <td>Cộng đối thủ 2 phút</td>
                  </tr>
                  <tr>
                    <th scope="row">Cờ nhanh · A.4</th>
                    <td>Vẫn xử lý khi phát hiện trong ván</td>
                    <td>Cộng đối thủ 1 phút</td>
                  </tr>
                  <tr>
                    <th scope="row">Cờ nhanh · A.5 / Cờ chớp · B.3</th>
                    <td>
                      Không xử lý lại theo A.5.2 nếu trước đó chưa có khiếu nại
                      và trọng tài chưa can thiệp
                    </td>
                    <td>Cộng đối thủ 1 phút</td>
                  </tr>
                  <tr>
                    <th scope="row">Cờ chớp · B.2</th>
                    <td>Vẫn xử lý khi phát hiện trong ván</td>
                    <td>Cộng đối thủ 2 phút</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              <strong>Lần thứ hai của cùng người chơi trong cùng ván:</strong>{' '}
              xử thua; hòa nếu đối thủ không thể chiếu hết bằng bất kỳ chuỗi
              nước đi hợp lệ nào. Không cộng lỗi của hai người vào chung một bộ
              đếm.
            </p>
            <p>
              <strong>
                Nhiều vi phạm trong cùng một nước chỉ tính một lần:
              </strong>{' '}
              ví dụ nhập thành trái luật bằng hai tay rồi bấm đồng hồ không tính
              thành hai lần để xử thua ngay. Sau khi đã xử lý và cho chơi tiếp,
              nếu người đó lại hoàn thành một nước trái luật thì đó là lần tiếp
              theo, kể cả khi đang sửa ở cùng số thứ tự nước đi.
            </p>
            <p>
              <strong>Khi phải sửa:</strong> khôi phục thế trước lỗi; nếu không
              xác định được, dùng thế gần nhất xác định được trước lỗi. Nước
              thay thế vẫn phải tuân thủ chạm quân. Trọng tài quyết định điều
              chỉnh thời gian/bộ đếm, ghi lỗi rồi cho chơi tiếp.
            </p>
            <details className={styles.details}>
              <summary>Chỉnh giây cộng khi sửa nước trái luật</summary>
              <div>
                <p>
                  Thu hồi phần giây cộng người vi phạm đã nhận từ lần bấm hoàn
                  thành nước trái luật, để không được cộng hai lần khi đi lại.
                  Đây là điều chỉnh đồng hồ, không phải hình phạt bổ sung. Kiểm
                  tra thời gian và bộ đếm trước khi cho chơi tiếp.
                </p>
                <p>
                  Ví dụ: đồng hồ vừa cộng 5 giây cho nước sai thì bỏ 5 giây đó
                  khi khôi phục. Khi sửa xong và bấm lại, người chơi nhận giây
                  cộng của nước hợp lệ. Phần cộng phạt cho đối thủ vẫn áp dụng
                  riêng theo bảng trên.
                </p>
                <Source reference="7.1; Sổ tay trọng tài 2026, chú giải 7.5.5–7.6 (trang in 28)" />
              </div>
            </details>
            <details className={styles.details}>
              <summary>A.4, A.5, B.2, B.3 là gì?</summary>
              <div>
                <p>
                  A.4: cờ nhanh có tối đa 3 ván/trọng tài và từng ván được trọng
                  tài hoặc trợ lý ghi lại. B.2: cờ chớp có 1 ván/trọng tài và
                  từng ván được ghi lại. Có camera hoặc có người đứng gần chưa
                  đủ để tự kết luận đáp ứng các điều kiện này.
                </p>
                <p>
                  Không đáp ứng thì dùng A.5 (nhanh) hoặc B.3 (chớp, dẫn chiếu
                  A.2, A.3, A.5). Điều lệ phải nêu cách áp dụng cho toàn giải.
                  A.3 giảm mức phạt 2 phút ở Điều 7 và 9 xuống 1 phút; B.2 không
                  dẫn chiếu A.3.
                </p>
                <p>
                  Phân loại theo thời gian ban đầu + 60 lần giây cộng: chớp ≤ 10
                  phút; nhanh &gt; 10 và &lt; 60 phút. Ví dụ 10+5 là cờ nhanh,
                  3+2 là cờ chớp.
                </p>
              </div>
            </details>
            <Source reference="7.1; 7.5; A.1–A.6; B.1–B.4; Sổ tay trọng tài 2026, chú giải 7.5.5" />
          </section>

          <section id="giai-phong-trao" className={styles.section}>
            <h2>Giải phong trào quy định “3 lỗi bị xử thua”</h2>
            <p>
              <strong>
                Đây là quy định riêng nếu điều lệ giải có nêu, không phải quy
                tắc chung cho giải phong trào tại Việt Nam.
              </strong>{' '}
              Không thay mốc hai nước đi trái luật bằng ba lỗi trong giải tính
              rating FIDE.
            </p>
            <details className={styles.details}>
              <summary>Trước giải cần làm rõ và phổ biến những gì?</summary>
              <div>
                <ul>
                  <li>
                    <strong>“Lỗi” là gì?</strong> Ba nước đi trái luật hay ba
                    lỗi kỹ thuật? Liệt kê vi phạm được tính; không tự gộp chạm
                    quân, bấm khác tay, dừng đồng hồ sai… vào chung một bộ đếm.
                  </li>
                  <li>
                    <strong>Khi nào ghi lỗi, xử lý ra sao?</strong> Nêu mốc hoàn
                    thành lỗi, thời hạn khiếu nại/can thiệp, cách sửa và mức
                    phạt ở lần 1, 2, 3. Ghi rõ có cộng/trừ thời gian không, bao
                    nhiêu; đừng suy ra từ bảng FIDE phía trên.
                  </li>
                  <li>
                    <strong>Đếm và thông báo thế nào?</strong> Nêu rõ lỗi tính
                    riêng cho từng người trong mỗi ván hay phạm vi nào khác;
                    cách tính nhiều vi phạm trong cùng một nước và ngoại lệ khi
                    xử thua. Ghi nhận từng lần, thông báo cho hai bên và bàn
                    giao cho trọng tài tiếp quản.
                  </li>
                </ul>
                <p className={styles.example}>
                  <strong>Ví dụ:</strong> Điều lệ chỉ nói “3 nước đi trái luật”
                  thì không tự tính một lần dừng đồng hồ sai thành một trong ba
                  lần đó.
                </p>
              </div>
            </details>
            <p className={styles.note}>
              Nếu điều lệ chỉ ghi “3 lỗi” mà chưa giải thích: đề nghị ban tổ
              chức và trọng tài trưởng làm rõ bằng văn bản, phổ biến cho người
              chơi trước vòng đầu. Không để mỗi bàn tự hiểu và tự đặt mức phạt.
            </p>
            <p className={styles.meta}>
              Đây là checklist làm rõ điều lệ, không phải thang phạt do FIDE quy
              định. Chưa có điều lệ cụ thể thì chưa thể kết luận giải đó tính
              lỗi và phạt như thế nào.
            </p>
            <Source reference="Lời nói đầu; 7.5.5 — yêu cầu với giải tính rating và mức phạt FIDE" />
          </section>

          {topics.map((topic, index) => (
            <section key={topic.id} id={topic.id} className={styles.section}>
              <p className={styles.eyebrow}>
                TRA CỨU {String(index + 1).padStart(2, '0')}
              </p>
              <h2>{topic.title}</h2>
              {topic.id === 'can-thiep' && (
                <div className={styles.note}>
                  <p>
                    <strong>Một trọng tài phụ trách nhiều bàn:</strong> Không
                    thể thấy mọi lỗi, nhưng phải áp dụng cùng điều kiện xử lý
                    cho mọi người. Thấy rõ vi phạm thì xử lý khi đủ điều kiện
                    theo luật; có khiếu nại hợp lệ thì xác minh. Không suy đoán
                    lỗi, cũng không bỏ qua lỗi đã thấy chỉ vì có thể bỏ sót ở
                    bàn khác.
                  </p>
                  <p>
                    <strong>Phân quyền xử lý (đề xuất tổ chức):</strong> Trọng
                    tài phụ trách chủ động xử lý tình huống rõ ràng trong phạm
                    vi được phân công, không phải chờ tổng trọng tài. Chỉ chuyển
                    cấp khi chưa đủ căn cứ để kết luận, có tranh chấp cần hỗ trợ
                    giải quyết hoặc vượt thẩm quyền. Giải đông người nên bố trí
                    trọng tài trưởng khu vực hỗ trợ tại chỗ, đặc biệt với cờ
                    chớp.
                  </p>
                  <p>
                    <strong>Khi bàn có VĐV liên quan đến CLB mình:</strong> Nên
                    báo trước giải để phân công phù hợp khi có thể. Nếu trực
                    tiếp chứng kiến vi phạm thuộc trường hợp phải can thiệp, vẫn
                    xử lý kịp thời theo luật, ghi nhận sự việc và đề nghị người
                    khác phối hợp nếu phát sinh tranh chấp. Không phải xin ý
                    kiến trước mỗi quyết định chỉ vì có quan hệ CLB; quan hệ này
                    không làm thay đổi điều kiện xử lý hay mức phạt.
                  </p>
                </div>
              )}
              {topic.cases.map((item) => (
                <details key={item.title} className={styles.details}>
                  <summary>{item.title}</summary>
                  <div>
                    <p className={styles.scope}>
                      {item.scope || 'Cả ba thể thức'}
                    </p>
                    <p>{item.action}</p>
                    {item.example && (
                      <p className={styles.example}>
                        <strong>Ví dụ / lưu ý:</strong> {item.example}
                      </p>
                    )}
                    <Source reference={item.reference} />
                  </div>
                </details>
              ))}
            </section>
          ))}

          <section id="nguon" className={styles.section}>
            <h2>Ghi nhận quyết định và nguồn tra cứu</h2>
            <p className={styles.note}>
              Vòng / bàn · Trắng / Đen · Thời gian hai bên · Bên đến lượt · Sự
              việc và chứng cứ · Thể thức, điều luật · Lỗi lần mấy của ai ·
              Quyết định, thời gian trước/sau chỉnh · Trọng tài xử lý.
            </p>
            <p>
              Mẫu giải thích: “Tình huống này áp dụng Điều …, vì …; quyết định
              là …; đồng hồ được chỉnh thành …; ván tiếp tục với bên … đến
              lượt.” Khi chưa đủ chứng cứ hoặc chưa chắc điều luật, giữ nguyên
              dữ liệu và trao đổi trọng tài trưởng trước khi kết luận.
            </p>
            <ul>
              <li>
                <a href={laws} target="_blank" rel="noopener noreferrer">
                  FIDE Laws of Chess — hiệu lực 01/01/2023
                </a>
              </li>
              <li>
                <a href={manual} target="_blank" rel="noopener noreferrer">
                  FIDE Arbiters’ Manual 2026 — luật và chú giải
                </a>
              </li>
            </ul>
            <p className={styles.meta}>
              Bản hướng dẫn tiếng Việt do LIMA biên soạn, không phải bản dịch
              chính thức. Các hướng thực hành được ghi riêng; điều luật bắt buộc
              và quyết định tùy tình huống không được dùng thay cho nhau. Trước
              mỗi giải, kiểm tra phiên bản luật và điều lệ đang áp dụng.
            </p>
            <Link href="/dan-do-truoc-giai-dau">
              Xem thêm cẩm nang dành cho người tham dự giải →
            </Link>
          </section>
        </article>
      </main>
    </>
  );
}

function Source({ reference }: { reference: string }) {
  return (
    <p className={styles.source}>
      <a
        href={reference.includes('Sổ tay') ? manual : laws}
        target="_blank"
        rel="noopener noreferrer"
      >
        Căn cứ: {reference} ↗
      </a>
    </p>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    messages: {
      common: (await import(`@/locales/${locale || 'vi'}/common.json`)).default,
    },
  },
});
