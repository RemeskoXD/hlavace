const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('\n========================================');
console.log('RESET HESLA ADMINISTRÁTORA');
console.log('========================================\n');

const db = new sqlite3.Database('./database.db');

// Získat heslo z .env
const newPassword = process.env.ADMIN_PASSWORD;
const adminUsername = process.env.ADMIN_USERNAME || 'admin';

if (!newPassword) {
    console.error('❌ Chyba: ADMIN_PASSWORD není nastaveno v .env souboru!');
    process.exit(1);
}

console.log(`Resetuji heslo pro uživatele: ${adminUsername}`);
console.log(`Nové heslo: ${newPassword}`);

// Zahashovat nové heslo
const hashedPassword = bcrypt.hashSync(newPassword, 12);

// Aktualizovat heslo v databázi
db.run(
    "UPDATE users SET password = ? WHERE username = ?",
    [hashedPassword, adminUsername],
    function(err) {
        if (err) {
            console.error('❌ Chyba při aktualizaci hesla:', err);
            process.exit(1);
        }
        
        if (this.changes === 0) {
            console.error(`❌ Uživatel '${adminUsername}' nebyl nalezen!`);
            
            // Pokusit se vytvořit nového uživatele
            console.log('Vytvářím nového admin uživatele...');
            db.run(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                [adminUsername, hashedPassword],
                function(err) {
                    if (err) {
                        console.error('❌ Chyba při vytváření uživatele:', err);
                        process.exit(1);
                    }
                    console.log('✅ Nový admin uživatel vytvořen!');
                    console.log(`\n========================================`);
                    console.log('NOVÉ PŘIHLAŠOVACÍ ÚDAJE:');
                    console.log(`Uživatel: ${adminUsername}`);
                    console.log(`Heslo: ${newPassword}`);
                    console.log('========================================\n');
                    process.exit(0);
                }
            );
        } else {
            console.log('✅ Heslo bylo úspěšně resetováno!');
            console.log(`\n========================================`);
            console.log('NOVÉ PŘIHLAŠOVACÍ ÚDAJE:');
            console.log(`Uživatel: ${adminUsername}`);
            console.log(`Heslo: ${newPassword}`);
            console.log('========================================\n');
            process.exit(0);
        }
    }
);
