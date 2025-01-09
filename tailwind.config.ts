import flowbite from 'flowbite-react/tailwind';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/setting-screens/**/*.{js,ts,jsx,tsx,mdx}',
    './src/screens/**/*.{js,ts,jsx,tsx,mdx}',
    './src/src/**/*.{js,ts,jsx,tsx,mdx}',
    flowbite.content(),
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)', // Uses CSS variables
        foreground: 'var(--foreground)', // Uses CSS variables
      },
    },
  },
  plugins: [flowbite.plugin()],
};

export default config;
