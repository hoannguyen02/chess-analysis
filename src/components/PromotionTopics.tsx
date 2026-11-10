import Link from 'next/link';
import styles from '@/styles/PromotionTopics.module.css';
const topics = [
  ['promotion', 'Phong cấp giành vật chất'],
  ['underpromotion', 'Phong cấp khác Hậu'],
  ['passed-pawn-simplification', 'Đổi quân và Tốt thông'],
  ['promotion-mate', 'Phong cấp chiếu hết'],
] as const;
export default function PromotionTopics({ active }: { active: string }) {
  return (
    <nav className={styles.topics} aria-label="Chủ đề Tốt và phong cấp">
      {topics.map(([route, label]) => (
        <Link
          key={route}
          href={`/${route}`}
          aria-current={active === route ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
