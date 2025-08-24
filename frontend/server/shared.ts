import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const __server_dirname = dirname(fileURLToPath(import.meta.url));

export const isProduction = process.env.NODE_ENV === 'production';
