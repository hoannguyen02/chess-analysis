export const Footer = () => {
  return (
    <footer
      style={{
        padding: '1rem',
      }}
    >
      <div className="flex justify-center mb-4 mt-8">
        <ul className="flex gap-2">
          <li className="p-0">
            <a className="hover:text-[var(--s-bg)]" href="/privacy-policy">
              Privacy Policy
            </a>
          </li>
          <li className="border-l border-gray-500 pl-2">
            <a className="hover:text-[var(--s-bg)]" href="/terms-of-service">
              Terms of Service
            </a>
          </li>
          <li className="border-l border-gray-500 pl-2">
            <a className="hover:text-[var(--s-bg)]" href="/contact">
              Contact
            </a>
          </li>
          <li className="border-l border-gray-500 pl-2">
            <a className="hover:text-[var(--s-bg)]" href="/about">
              About Us
            </a>
          </li>
        </ul>
      </div>
      <p className="text-center">
        © {new Date().getFullYear()} LIMA Chess. All Rights Reserved.
      </p>
    </footer>
  );
};
