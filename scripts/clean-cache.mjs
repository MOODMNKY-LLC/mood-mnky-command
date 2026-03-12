import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dirs = ['.next', '.turbo', path.join('node_modules', '.cache')];

for (const dir of dirs) {
  const full = path.join(root, dir);
  try {
    fs.rmSync(full, { recursive: true });
    console.log('Removed:', dir);
  } catch (e) {
    if (e.code !== 'ENOENT') console.warn('Skip', dir, e.message);
  }
}
