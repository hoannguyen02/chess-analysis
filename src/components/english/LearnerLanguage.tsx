import { changeLanguage } from '@/lib/changeLanguage';
import { createContext, ReactNode, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import vi from '@/lib/english/learner-vi.json';
import s from './EnglishStudio.module.css';

type Language = 'en' | 'vi';
const LanguageContext = createContext<{
  language: Language;
  change: (value: Language) => void;
}>({ language: 'en', change: () => {} });
const LANGUAGE_KEY = 'lima-english-learner-language-v1';
export function LearnerLanguageProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  // The route is the single source of truth for both language pickers.
  const language: Language = router.locale === 'vi' ? 'vi' : 'en';
  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {}
  }, [language]);
  return (
    <LanguageContext.Provider
      value={{
        language,
        change: (value) => {
          if (value !== language) {
            void changeLanguage(router, value);
          }
        },
      }}
    >
      <div lang={language}>{children}</div>
    </LanguageContext.Provider>
  );
}
export function useLearnerText() {
  const { language } = useContext(LanguageContext);
  return (text: string) =>
    language === 'vi' ? (vi as Record<string, string>)[text] || text : text;
}
export function LearnerLanguagePicker() {
  const { language, change } = useContext(LanguageContext);
  return (
    <select
      className={s.learnerLanguage}
      aria-label="Interface language / Ngôn ngữ giao diện"
      value={language}
      onChange={(e) => change(e.target.value as Language)}
    >
      <option value="en">English</option>
      <option value="vi">Tiếng Việt</option>
    </select>
  );
}
