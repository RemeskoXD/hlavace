const fs = require('fs');
const path = require('path');

const backupsDir = path.join(__dirname, 'backups');
const dbPath = path.join(__dirname, 'database.db');

if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
}

if (!fs.existsSync(dbPath)) {
    console.error('❌ Databáze neexistuje!');
    process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupName = `backup-${timestamp}.db`;
const backupPath = path.join(backupsDir, backupName);

console.log('Vytváření zálohy...');

try {
    fs.copyFileSync(dbPath, backupPath);
    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Záloha vytvořena!');
    console.log(`Soubor: ${backupName}`);
    console.log(`Velikost: ${fileSizeInMB} MB`);
    
    // Ponechat pouze posledních 7 záloh
    const files = fs.readdirSync(backupsDir)
        .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
        .map(f => ({
            name: f,
            path: path.join(backupsDir, f),
            time: fs.statSync(path.join(backupsDir, f)).mtime
        }))
        .sort((a, b) => b.time - a.time);
    
    if (files.length > 7) {
        files.slice(7).forEach(file => {
            fs.unlinkSync(file.path);
            console.log(`Smazána stará záloha: ${file.name}`);
        });
    }
} catch (error) {
    console.error('❌ Chyba:', error.message);
    process.exit(1);
}
