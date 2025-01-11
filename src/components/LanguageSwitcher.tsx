import { useRouter } from 'next/router';

const LanguageSwitcher = () => {
  const router = useRouter();
  const { locale, asPath } = router;

  const switchLanguage = (lang: string) => {
    router.push(asPath, asPath, { locale: lang });
  };

  return (
    <div className="flex items-center absolute bottom-[24px] w-full justify-center">
      <button
        className={`${locale === 'en' ? 'text-[var(--s-bg)]' : 'text-white'}`}
        onClick={() => switchLanguage('en')}
        disabled={locale === 'en'}
      >
        English
      </button>
      <button
        className={`ml-4 ${locale === 'vi' ? 'text-[var(--s-bg)]' : 'text-white'}`}
        onClick={() => switchLanguage('vi')}
        disabled={locale === 'vi'}
      >
        Tiếng Việt
      </button>
    </div>
  );
};

export default LanguageSwitcher;
