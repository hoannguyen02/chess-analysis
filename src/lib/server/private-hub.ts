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
export const privatePages = [
  {
    href: '/london',
    title: 'London System',
    description:
      'Học khai cuộc từ hai phía: chơi London và đối phó bằng quân Đen.',
  },
  {
    href: '/hoa-co',
    title: 'Hòa cờ',
    description: 'Luyện cứu hòa và kỹ năng phòng thủ.',
  },
  {
    href: '/chien-thuat',
    title: 'Chiến thuật',
    description: 'Bài tập theo chủ đề, từ cơ bản đến nâng cao.',
  },
  {
    href: '/lich-hoc',
    title: 'Lịch học',
    description: 'Lịch lớp học, học phí và thông tin đăng ký.',
  },
  {
    href: '/skewer',
    title: 'Đòn xiên',
    description: 'Luyện chiến thuật từ ván đấu của các kiện tướng.',
  },
];
