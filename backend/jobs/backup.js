const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const db = require('../database/db');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 7;

function runBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const backupFile = path.join(BACKUP_DIR, `expenses_${timestamp}.db`);

    // VACUUM INTO tira um snapshot completo e consistente pela conexão viva do
    // banco — inclui o conteúdo do WAL, que um copyFileSync do arquivo principal
    // deixaria de fora (bug que deixou backups sem semanas de dados).
    if (fs.existsSync(backupFile)) fs.unlinkSync(backupFile);
    db.prepare('VACUUM INTO ?').run(backupFile);

    // Consolida o WAL no arquivo principal, reduzindo a janela de perda
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');

    console.log(`[Backup] Backup criado: ${backupFile}`);

    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('expenses_') && f.endsWith('.db'))
      .sort()
      .reverse();

    for (const old of backups.slice(MAX_BACKUPS)) {
      fs.unlinkSync(path.join(BACKUP_DIR, old));
      console.log(`[Backup] Backup antigo removido: ${old}`);
    }
  } catch (err) {
    console.error('[Backup] Erro ao criar backup:', err.message);
  }
}

function startBackupJob() {
  cron.schedule('0 2 * * *', runBackup);
  console.log('[Backup] Job de backup diário iniciado (2h da manhã).');
  runBackup();
}

module.exports = { startBackupJob };
