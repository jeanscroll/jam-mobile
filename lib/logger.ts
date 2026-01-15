// lib/logger.ts
import fs from 'node:fs';
import path from 'node:path';

const logPath = path.resolve(process.cwd(), 'install-log.json');

export const appendLog = (message: string) => {
  let logs: any[] = [];

  try {
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf-8').trim();
      if (content) {
        logs = JSON.parse(content);
      }
    }
  } catch (err) {
    console.error('Erreur lors de la lecture des logs existants :', err);
    logs = [];
  }

  logs.push({ timestamp: new Date().toISOString(), message });
  fs.writeFileSync(logPath, JSON.stringify(logs.slice(-100), null, 2));
};


export const resetLog = () => {
  fs.writeFileSync(logPath, '[]');
};

export const readLastLogs = (count = 4) => {
  try {
    if (!fs.existsSync(logPath)) {
      return [];
    }

    const content = fs.readFileSync(logPath, 'utf-8').trim();

    if (!content) {
      return [];
    }

    const logs = JSON.parse(content);
    return Array.isArray(logs) ? logs.slice(-count) : [];
  } catch (err) {
    console.error('Erreur de lecture du fichier log :', err);
    return [];
  }
};

