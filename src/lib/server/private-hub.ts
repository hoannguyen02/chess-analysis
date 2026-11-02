/** A single URL segment, configured only on the server. Empty means no hub route. */
export function privateHubPath(): string {
  const value = process.env.PRIVATE_HUB_PATH?.trim() ?? '';
  const segment = value.replace(/^\//, '');
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(segment) ? `/${segment}` : '';
}

export function matchesPrivateHub(segment: unknown): boolean {
  return typeof segment === 'string' && privateHubPath() === `/${segment}`;
}

// Add protected pages here as they become available. Each endpoint must enforce access.
// Set worksheetEndpoint for APIs returning DrawCategory[] to opt into the worksheet builder.
export const privatePages = [
  {
    href: '/underpromotion',
    worksheetEndpoint: '/api/underpromotion-exercises',
    group: 'Phong cấp',
    title: 'Phong cấp thành Xe, Tượng hoặc Mã',
    description: 'Chọn quân khác Hậu để đạt mục tiêu cụ thể.',
  },
  {
    href: '/passed-pawn-simplification',
    worksheetEndpoint: '/api/passed-pawn-simplification-exercises',
    group: 'Phong cấp',
    title: 'Đổi quân khai thác Tốt thông',
    description: 'Đổi quân để Tốt thông phát huy sức mạnh trong tàn cuộc.',
  },
  {
    href: '/promotion-mate',
    worksheetEndpoint: '/api/promotion-mate-exercises',
    group: 'Phong cấp',
    title: 'Phong cấp chiếu hết',
    description: 'Phối hợp quân mới sau phong cấp để chiếu hết.',
  },
  {
    href: '/promotion',
    worksheetEndpoint: '/api/promotion-exercises',
    group: 'Phong cấp',
    title: 'Phong cấp giành vật chất',
    description: 'Phong cấp để giành và giữ lợi thế vật chất.',
  },
  {
    href: '/anastasia-mate',
    worksheetEndpoint: '/api/anastasia-mate-exercises',
    group: 'Chiếu hết',
    title: 'Chiếu hết kiểu Anastasia',
    description:
      'Phối hợp Xe và Mã, khai thác Tốt đối phương chắn đường thoát của Vua.',
  },
  {
    href: '/arabian-mate',
    worksheetEndpoint: '/api/arabian-mate-exercises',
    group: 'Chiếu hết',
    title: 'Chiếu hết kiểu Arabian',
    description: 'Phối hợp Xe và Mã để khóa Vua đối phương ở mép bàn cờ.',
  },
  {
    href: '/rook-bishop-mate',
    worksheetEndpoint: '/api/rook-bishop-mate-exercises',
    group: 'Chiếu hết',
    title: 'Chiếu hết bằng Xe và Tượng',
    description:
      'Phối hợp Xe và Tượng để bảo vệ quân chiếu và khóa các ô thoát.',
  },
  {
    href: '/worksheets',
    group: 'Chiến thuật',
    title: 'Tạo phiếu bài tập',
    description:
      'Chọn chủ đề, mức độ và thứ tự. Tải PDF 6 thế cờ mỗi trang và lời giải riêng.',
  },
  {
    href: '/queen-rook-mate',
    worksheetEndpoint: '/api/queen-rook-mate-exercises',
    group: 'Chiếu hết',
    title: 'Chiếu hết bằng Hậu và Xe',
    description: 'Phối hợp Hậu và Xe để bảo vệ quân chiếu và khóa các ô thoát.',
  },
  {
    href: '/back-rank-mate',
    worksheetEndpoint: '/api/back-rank-mate-exercises',
    group: 'Chiếu hết',
    title: 'Chiếu hết hàng cuối',
    description:
      'Khai thác Vua bị chặn đường thoát để chiếu hết bằng Xe hoặc Hậu.',
  },
  {
    href: '/queen-mate',
    worksheetEndpoint: '/api/queen-mate-exercises',
    group: 'Chiếu hết',
    title: 'Chiếu hết bằng Hậu',
    description: 'Phối hợp Hậu với Vua hoặc quân khác để chiếu hết.',
  },
  {
    href: '/saved-games',
    group: 'Ván đấu',
    title: 'Ván đã lưu',
    description:
      'Những ván đáng nhớ, tìm theo khai cuộc, kỳ thủ và ô quan trọng.',
  },
  {
    href: '/one-rook-mate',
    worksheetEndpoint: '/api/one-rook-mate-exercises',
    group: 'Chiếu hết',
    title: 'Chiếu hết bằng một Xe',
    description:
      'Phối hợp Vua và Xe; mở đường và khai thác quân hỗ trợ để chiếu hết.',
  },
  {
    href: '/two-rook-mate',
    worksheetEndpoint: '/api/two-rook-mate-exercises',
    group: 'Chiếu hết',
    title: 'Chiếu hết bằng hai Xe',
    description:
      'Phối hợp hai Xe: chiếu hết một nước, hai nước và chiếu bậc thang.',
  },
  {
    href: '/simplification',
    worksheetEndpoint: '/api/simplification-exercises',
    group: 'Tàn cuộc & phòng thủ',
    title: 'Đơn giản hóa',
    description: 'Đổi quân có mục đích để chuyển sang tàn cuộc thuận lợi.',
  },
  {
    href: '/discovered-attack',
    worksheetEndpoint: '/api/discovery-exercises',
    group: 'Chiến thuật',
    title: 'Chiếu mở và tấn công mở',
    description:
      'Di chuyển quân chắn đường để khai thác sức tấn công của quân phía sau.',
  },
  {
    href: '/fork',
    worksheetEndpoint: '/api/fork-exercises',
    group: 'Chiến thuật',
    title: 'Tấn công đôi',
    description: 'Tấn công đồng thời nhiều mục tiêu để giành lợi thế vật chất.',
  },
  {
    href: '/pin',
    worksheetEndpoint: '/api/pin-exercises',
    group: 'Chiến thuật',
    title: 'Đòn ghim',
    description: 'Nhận biết và khai thác đòn ghim bằng Xe, Tượng và Hậu.',
  },
  {
    href: '/london',
    group: 'Khai cuộc',
    title: 'London System',
    description:
      'Học khai cuộc từ hai phía: chơi London và đối phó bằng quân Đen.',
  },
  {
    href: '/draw',
    worksheetEndpoint: '/api/draw-exercises',
    group: 'Tàn cuộc & phòng thủ',
    title: 'Hòa cờ',
    description: 'Hoà cờ và kỹ năng phòng thủ.',
  },
  {
    href: '/perpetual-check',
    worksheetEndpoint: '/api/perpetual-check-exercises',
    group: 'Hòa cờ',
    title: 'Chiếu vĩnh viễn',
    description:
      'Tạo chuỗi chiếu để giữ hòa và tính các nước thoát của đối thủ.',
  },
  {
    href: '/stalemate',
    worksheetEndpoint: '/api/stalemate-exercises',
    group: 'Hòa cờ',
    title: 'Bẫy hết nước đi',
    description:
      'Tìm thế hòa khi bên đến lượt không bị chiếu nhưng không còn nước hợp lệ.',
  },
  {
    href: '/insufficient-material',
    worksheetEndpoint: '/api/insufficient-material-exercises',
    group: 'Hòa cờ',
    title: 'Đổi quân về thế không đủ lực chiếu hết',
    description:
      'Chọn cách đổi quân để đạt thế cờ không bên nào có thể chiếu hết bằng chuỗi nước hợp lệ.',
  },
  {
    href: '/repetition-draw',
    worksheetEndpoint: '/api/repetition-draw-exercises',
    group: 'Hòa cờ',
    title: 'Lặp lại thế cờ không cần chiếu',
    description: 'Duy trì thế cờ để có thể yêu cầu hòa do lặp lại ba lần.',
  },
  {
    href: '/fortress-draw',
    worksheetEndpoint: '/api/fortress-draw-exercises',
    group: 'Hòa cờ',
    title: 'Pháo đài giữ hòa',
    description: 'Duy trì vùng phòng thủ để ngăn đối thủ chuyển hóa ưu thế.',
  },
  {
    href: '/chien-thuat',
    group: 'Chiến thuật',
    title: 'Chiến thuật',
    description: 'Bài tập theo chủ đề, từ cơ bản đến nâng cao.',
  },
  {
    href: '/lich-hoc',
    group: 'Lịch học',
    title: 'Lịch học',
    description: 'Lịch lớp học, học phí và thông tin đăng ký.',
  },
  {
    href: '/skewer',
    worksheetEndpoint: '/api/skewer-exercises',
    group: 'Chiến thuật',
    title: 'Đòn xiên',
    description:
      'Nhận biết và khai thác đòn xiên; từ thế cờ nhập môn đến ván đấu của kiện tướng.',
  },
];
