import type { Config } from 'tailwindcss';
import path from 'path';

const frontendDir = path.resolve(__dirname);

const config: Config = {
  darkMode: 'class',
  content: [
    path.join(frontendDir, 'index.html'),
    path.join(frontendDir, 'src/**/*.{ts,tsx}'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
