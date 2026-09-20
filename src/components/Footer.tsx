import { LIMA_CONTACT } from '@/lib/brand/contact';

export const Footer = () => (
  <footer className="mt-auto border-t border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600 print:hidden">
    <p className="font-semibold text-gray-900">{LIMA_CONTACT.name}</p>
    <address className="mt-2 not-italic">
      <p>{LIMA_CONTACT.address}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2">
        <a
          className="break-all hover:underline"
          href={`mailto:${LIMA_CONTACT.email}`}
        >
          {LIMA_CONTACT.email}
        </a>
      </div>
    </address>
    <div className="mt-3 flex justify-center gap-5">
      <a
        href="https://www.facebook.com/profile.php?id=61593257410387"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        Facebook
      </a>
      <a
        href="https://www.youtube.com/@LIMAChess?sub_confirmation=1"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        YouTube
      </a>
    </div>
    <p className="mt-4 text-xs">
      © {new Date().getFullYear()} LIMA Chess
    </p>
  </footer>
);
