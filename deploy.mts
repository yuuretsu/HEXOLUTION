import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const DIST_PATH = path.resolve(__dirname, 'dist');

const REMOTE_USER = process.env.REMOTE_USER;
const REMOTE_HOST = process.env.REMOTE_HOST;
const REMOTE_PATH = process.env.REMOTE_PATH;

if (!REMOTE_USER || !REMOTE_HOST || !REMOTE_PATH) {
  console.error('Missing required environment variables:');
  if (!REMOTE_USER) console.error('  REMOTE_USER is not set');
  if (!REMOTE_HOST) console.error('  REMOTE_HOST is not set');
  if (!REMOTE_PATH) console.error('  REMOTE_PATH is not set');
  console.error('\nPlease set these variables or create a .env file based on .env.example');
  process.exit(1);
}

async function deploy() {
  try {
    console.log('Начинаем деплой...');
    await execAsync(`ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_PATH}"`);
    await execAsync(`scp -r ${DIST_PATH}/* ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}`);
    console.log('Деплой завершён успешно!');
  } catch (err) {
    console.error('Ошибка при деплое:', err);
    process.exit(1);
  }
}

deploy();
