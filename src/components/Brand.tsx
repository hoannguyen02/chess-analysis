import Image from 'next/image';
import Link from 'next/link';
import s from './Brand.module.css';

export default function Brand() {
  return (
    <Link href="/" className={s.brand} aria-label="LIMA — Home">
      <Image
        src="/brand/lima-symbol.svg"
        width={50}
        height={42}
        alt=""
        priority
        className={s.symbol}
      />
      <span>LIMA</span>
    </Link>
  );
}

export function BrandHeader() {
  return (
    <header className={s.header}>
      <Brand />
    </header>
  );
}
