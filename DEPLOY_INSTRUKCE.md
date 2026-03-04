# INSTRUKCE PRO NASAZENÍ NA SERVER

## 1. PŘÍPRAVA SOUBORŮ

### Upravit soubory pro produkci:

#### A) V souboru `public/config.js`:
```javascript
// Změnit z:
const API_URL = 'http://localhost:3000/api';

// Na:
const API_URL = 'https://vase-domena.cz/api';
// nebo relativní:
const API_URL = '/api';
```

#### B) V souboru `public/main.js`:
```javascript
// Zkontrolovat, že API_URL je správně:
const API_URL = '/api';  // Pro produkci použít relativní URL
```

## 2. NAHRÁNÍ NA SERVER

### Potřebné soubory/složky:
```
cms/
├── node_modules/     (celá složka)
├── public/           (celá složka)
├── uploads/          (prázdná složka pro obrázky)
├── backups/          (prázdná složka pro zálohy)
├── .env              (DŮLEŽITÉ - obsahuje hesla)
├── server.js
├── package.json
├── database.db       (databáze s daty)
├── sessions.db       (session databáze)
└── reset-password.js (pro reset hesla)
```

### FTP/Upload:
1. Nahrát celou složku `cms` na server
2. Nastavit práva zápisu pro složky:
   - `uploads/` - chmod 755
   - `backups/` - chmod 755
   - `database.db` - chmod 644
   - `sessions.db` - chmod 644

## 3. SPUŠTĚNÍ NA SERVERU

### Možnost A - PM2 (doporučeno):
```bash
# Instalace PM2 globálně
npm install -g pm2

# Spuštění aplikace
pm2 start server.js --name "autohlavacek-cms"

# Automatický restart po restartu serveru
pm2 startup
pm2 save

# Užitečné PM2 příkazy:
pm2 status          # Zobrazit status
pm2 logs            # Zobrazit logy
pm2 restart all     # Restartovat
pm2 stop all        # Zastavit
```

### Možnost B - Systemd service (Linux):
Vytvořit soubor `/etc/systemd/system/autohlavacek.service`:
```ini
[Unit]
Description=Auto Hlavacek CMS
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/cesta/k/cms
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Pak spustit:
```bash
systemctl enable autohlavacek
systemctl start autohlavacek
```

### Možnost C - Screen/Tmux:
```bash
screen -S autohlavacek
cd /cesta/k/cms
npm start
# Ctrl+A pak D pro odpojení
```

## 4. NGINX KONFIGURACE (pokud používáte)

Přidat do nginx konfigurace:
```nginx
server {
    listen 80;
    server_name vase-domena.cz;

    # Přesměrování na HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vase-domena.cz;

    ssl_certificate /cesta/k/certifikatu.crt;
    ssl_certificate_key /cesta/k/private.key;

    # Hlavní web (pokud máte)
    root /cesta/k/hlavni-web;
    index index.html;

    # Proxy pro Node.js CMS
    location /admin {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

## 5. APACHE KONFIGURACE (alternativa)

`.htaccess` nebo virtuální host:
```apache
<VirtualHost *:80>
    ServerName vase-domena.cz
    
    ProxyRequests Off
    ProxyPreserveHost On
    
    ProxyPass /admin http://localhost:3000/admin
    ProxyPassReverse /admin http://localhost:3000/admin
    
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
    
    ProxyPass /uploads http://localhost:3000/uploads
    ProxyPassReverse /uploads http://localhost:3000/uploads
</VirtualHost>
```

## 6. KONTROLA

1. **Test admin panelu:**
   - https://vase-domena.cz/admin

2. **Test API:**
   - https://vase-domena.cz/api/cars
   - https://vase-domena.cz/api/settings

3. **Přihlášení:**
   - Uživatel: admin
   - Heslo: [vaše heslo]

## 7. BEZPEČNOST

### DŮLEŽITÉ - změnit v .env:
```env
NODE_ENV=production
SESSION_SECRET=[vygenerovat nový dlouhý řetězec]
```

### Firewall:
```bash
# Povolit pouze potřebné porty
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp  # SSH
ufw enable
```

## 8. ZÁLOHOVÁNÍ

Nastavit automatické zálohování:
```bash
# Cron pro denní zálohu
0 2 * * * cd /cesta/k/cms && npm run backup
```

## 9. MONITOROVÁNÍ

- Sledovat logy: `pm2 logs`
- Kontrolovat místo na disku pro uploads
- Monitorovat výkon serveru

## PROBLÉMY A ŘEŠENÍ

### Nefunguje upload obrázků:
- Zkontrolovat práva složky uploads/
- Zkontrolovat max_upload_size v nginx/apache

### 502 Bad Gateway:
- Node.js aplikace neběží
- Zkontrolovat: `pm2 status` nebo `systemctl status autohlavacek`

### Session nefunguje:
- Zkontrolovat cookie settings v server.js
- Pro HTTPS musí být secure: true

### Databáze locked:
- Restartovat aplikaci
- Zkontrolovat práva k database.db

## KONTAKT NA PODPORU

Pokud budete mít problémy s nasazením, kontaktujte vývojáře.
