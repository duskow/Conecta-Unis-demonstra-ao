import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AsyncLocalStorage } from 'node:async_hooks';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const dataDir = path.join(__dirname, '..', 'data');
export const dbFile = path.join(dataDir, 'db.json');
// Cada aba recebe sua própria cópia temporária do banco da demonstração.
const scope = new AsyncLocalStorage();
const demoDir = path.join(os.tmpdir(), 'conecta-unis-sessoes');
export const getDemoSessionId = () => scope.getStore() || null;
export function withDemoSession(sessionId, next) { scope.run(sessionId, next); }
function activeDbFile() {
  const id = getDemoSessionId();
  return id ? path.join(demoDir, `${id}.json`) : dbFile;
}

const emptyDb = {
  users: [],
  companies: [],
  opportunities: [],
  applications: [],
  notifications: [],
  resets: []
};

export function readDb() {
  const sessionFile = activeDbFile();
  // O banco original é apenas modelo: visitantes nunca escrevem nele.
  const file = fs.existsSync(sessionFile) ? sessionFile : dbFile;
  if (!fs.existsSync(file)) return structuredClone(emptyDb);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeDb(db) {
  const file = activeDbFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(db, null, 2), 'utf8');
}

export function mutate(fn) {
  const db = readDb();
  const result = fn(db);
  writeDb(db);
  return result;
}
