import styles from '@/styles/PracticeLibrary.module.css';
import Link from 'next/link';
import { useState } from 'react';
import { FiArrowRight, FiSearch, FiX } from 'react-icons/fi';

export type LibraryPage = {
  worksheetEndpoint?: string;
  href: string;
  title: string;
  description: string;
  group?: string;
};

// Older API responses may omit groups during an app update.
const legacyGroups: Record<string, string> = {
  '/arabian-mate': 'Chiếu hết',
  '/anastasia-mate': 'Chiếu hết',
  '/promotion': 'Phong cấp',
  '/underpromotion': 'Phong cấp',
  '/passed-pawn-simplification': 'Phong cấp',
  '/promotion-mate': 'Phong cấp',
  '/worksheets': 'Chiến thuật',
  '/saved-games': 'Ván đấu',
  '/back-rank-mate': 'Chiếu hết',
  '/rook-bishop-mate': 'Chiếu hết',
  '/queen-rook-mate': 'Chiếu hết',
  '/queen-mate': 'Chiếu hết',
  '/one-rook-mate': 'Chiếu hết',
  '/two-rook-mate': 'Chiếu hết',
  '/simplification': 'Tàn cuộc & phòng thủ',
  '/draw': 'Tàn cuộc & phòng thủ',
  '/perpetual-check': 'Hòa cờ',
  '/stalemate': 'Hòa cờ',
  '/insufficient-material': 'Hòa cờ',
  '/repetition-draw': 'Hòa cờ',
  '/fortress-draw': 'Hòa cờ',
  '/discovered-attack': 'Chiến thuật',
  '/fork': 'Chiến thuật',
  '/pin': 'Chiến thuật',
  '/skewer': 'Chiến thuật',
  '/chien-thuat': 'Chiến thuật',
  '/london': 'Khai cuộc',
  '/lich-hoc': 'Lịch học',
};

function searchable(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export default function PracticeLibrary({ pages }: { pages: LibraryPage[] }) {
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const groupOf = (page: LibraryPage) =>
    page.group || legacyGroups[page.href] || 'Khác';
  const groupOrder = [
    'Chiến thuật',
    'Chiếu hết',
    'Phong cấp',
    'Tàn cuộc & phòng thủ',
    'Khai cuộc',
    'Ván đấu',
    'Lịch học',
  ];
  const groups = Array.from(new Set(pages.map(groupOf))).sort((a, b) => {
    const rank = (group: string) => {
      const index = groupOrder.indexOf(group);
      return index === -1 ? groupOrder.length : index;
    };
    return rank(a) - rank(b);
  });
  const terms = searchable(query).trim().split(/\s+/).filter(Boolean);
  const matches = pages.filter((page) =>
    terms.every((term) =>
      searchable(`${page.title} ${page.description} ${groupOf(page)}`).includes(
        term
      )
    )
  );
  const visible = matches.filter(
    (page) => !selectedGroup || groupOf(page) === selectedGroup
  );

  return (
    <div className={styles.library}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>LIMA CHESS</p>
          <h1>Thư viện học cờ</h1>
          <p>Chọn chủ đề để bắt đầu luyện tập.</p>
        </div>
      </header>
      <div className={styles.search}>
        <FiSearch aria-hidden="true" size={20} />
        <input
          type="search"
          aria-label="Tìm trong thư viện"
          placeholder="Tìm chủ đề, khai cuộc, ván đấu…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Xóa tìm kiếm"
            title="Xóa tìm kiếm"
          >
            <FiX aria-hidden="true" size={18} />
          </button>
        )}
      </div>
      {groups.length > 1 && (
        <nav className={styles.filters} aria-label="Nhóm nội dung">
          {['', ...groups].map((group) => (
            <button
              key={group}
              type="button"
              aria-pressed={selectedGroup === group}
              onClick={() => setSelectedGroup(group)}
            >
              {group || 'Tất cả'}
            </button>
          ))}
        </nav>
      )}
      <p className={styles.resultCount} role="status">
        {visible.length} mục
        {query.trim() ? ` phù hợp với “${query.trim()}”` : ''}
      </p>
      {groups
        .filter((group) => !selectedGroup || group === selectedGroup)
        .map((group) => {
          const items = visible.filter((page) => groupOf(page) === group);
          if (!items.length) return null;
          return (
            <section className={styles.group} key={group} aria-label={group}>
              {groups.length > 1 && !selectedGroup && <h2>{group}</h2>}
              <div className={styles.grid}>
                {items.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    prefetch={false}
                    className={styles.card}
                  >
                    <div>
                      <h3>{page.title}</h3>
                      <p>{page.description}</p>
                    </div>
                    <FiArrowRight aria-hidden="true" size={20} />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      {!visible.length && (
        <div className={styles.empty}>
          <h2>Chưa tìm thấy nội dung</h2>
          <p>Thử từ khóa khác hoặc xem tất cả các nhóm.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedGroup('');
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
