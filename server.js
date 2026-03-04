const express = require('express');

const sqlite3 = require('sqlite3').verbose();

const multer = require('multer');

const path = require('path');

const cors = require('cors');

const bodyParser = require('body-parser');

const session = require('express-session');

const bcrypt = require('bcryptjs');

const fs = require('fs');

const helmet = require('helmet');

const rateLimit = require('express-rate-limit');



// Load environment variables

require('dotenv').config();



// Kontrola, zda existuje .env soubor

if (!fs.existsSync(path.join(__dirname, '.env'))) {

    console.log('\n========================================');

    console.log('⚠️ VAROVÁNÍ: Soubor .env neexistuje!');

    console.log('Spusťte nejdříve: npm run setup');

    console.log('========================================\n');

}



const app = express();
const PORT = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV !== 'production';
// ==========================================
// PŘIDEJ TENTO ŘÁDEK SEM:
// ==========================================
app.set('trust proxy', 1);
// ==========================================


// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],

            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://maps.google.com", "https://maps.googleapis.com"],

            scriptSrcAttr: ["'unsafe-inline'"], // Povolíme inline event handlery

            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],

            imgSrc: ["'self'", "data:", "https:", "blob:"],

            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],

            frameSrc: ["'self'", "https://maps.google.com", "https://www.google.com"],

            connectSrc: ["'self'", "https://maps.googleapis.com", "https://auto-hlavacek.cz", "https://www.auto-hlavacek.cz"]

        }

    }

}));



// Rate limiting for API - méně přísný pro admin

const apiLimiter = rateLimit({

    windowMs: 15 * 60 * 1000, // 15 minutes

    max: 500, // zvýšíme limit na 500 požadavků

    message: 'Příliš mnoho požadavků z této IP adresy',

    skip: (req) => {

        // Skip rate limiting pro GET požadavky pokud je uživatel přihlášen

        if (req.method === 'GET' && req.session && req.session.userId) {

            return true;

        }

        return false;

    }

});



// Strict rate limiting for login - pouze pro přihlášení

const loginLimiter = rateLimit({

    windowMs: 15 * 60 * 1000, // 15 minutes

    max: 5, // limit each IP to 5 login attempts per windowMs

    skipSuccessfulRequests: true,

    message: 'Příliš mnoho pokusů o přihlášení. Zkuste to za 15 minut.'

});



app.use('/api/', apiLimiter);



// ==========================================

// ZMĚNA: Upravený CORS pro tvé domény

// ==========================================

const allowedOrigins = [

    'http://localhost:3000',

    'https://web1.lizard-coin.fun',

    'https://auto-hlavacek.cz',

    'https://www.auto-hlavacek.cz'

];



app.use(cors({

    origin: function (origin, callback) {

        // Povolit požadavky bez origin (např. mobilní aplikace nebo curl)

        if (!origin) return callback(null, true);



        if (allowedOrigins.indexOf(origin) !== -1) {

            callback(null, true);

        } else {

            // Pro jistotu povolíme i ostatní, pokud bys přidal další doménu,

            // ale v produkci je lepší být striktní.

            // Pro teď to necháme takto, aby to fungovalo:

            callback(null, true);

        }

    },

    credentials: true, // Důležité pro cookies/sessions

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    allowedHeaders: ['Content-Type', 'Authorization']

}));



// Session konfigurace - MUSÍ BÝT PŘED bodyParser a routes!

const SQLiteStore = require('connect-sqlite3')(session);



// Session konfigurace s lepší bezpečností

const sessionSecret = process.env.SESSION_SECRET || 'auto-hlavacek-super-secret-' + Math.random().toString(36);

if (!process.env.SESSION_SECRET && !isDevelopment) {

    console.log('⚠️ BEZPEČNOSTNÍ VAROVÁNÍ: Používáte výchozí session secret!');

    console.log(' Nastavte SESSION_SECRET v .env souboru!');

}



app.use(session({

    store: new SQLiteStore({

        db: process.env.SESSIONS_PATH || 'sessions.db',

        dir: './'

    }),

    secret: sessionSecret,

    resave: false,

    saveUninitialized: false,

    cookie: {

        maxAge: 24 * 60 * 60 * 1000, // 24 hodin

        httpOnly: true,

        secure: false, // Změněno na false, aby to fungovalo i když je Node za Nginx proxy

        sameSite: 'lax' // Změněno z 'strict' na 'lax' pro lepší kompatibilitu

    },

    name: 'sessionId' // Změnit výchozí název cookie

}));



// Body parser a static files - AŽ PO session middleware

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.use(express.static('public'));



// Admin panel route - musí být až po express.static

app.get('/admin', (req, res) => {

    res.sendFile(path.join(__dirname, 'public', 'admin.html'));

});



// Sitemap.xml generator

app.get('/sitemap.xml', (req, res) => {

    const baseUrl = 'https://auto-hlavacek.cz';



    // Získáme všechna aktivní vozidla

    db.all("SELECT id, updated_at FROM cars WHERE status = 'active'", (err, cars) => {

        if (err) {

            console.error('Sitemap error:', err);

            return res.status(500).send('Error generating sitemap');

        }



        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

<url>

<loc>${baseUrl}/</loc>

<changefreq>daily</changefreq>

<priority>1.0</priority>

</url>

<url>

<loc>${baseUrl}/pujcovna.html</loc>

<changefreq>weekly</changefreq>

<priority>0.8</priority>

</url>`;



        // Přidáme vozidla (i když zatím nemají vlastní stránky, můžeme odkázat na kotvu nebo modal)

        // Pro lepší SEO by to chtělo samostatné stránky pro každé auto, ale zatím to necháme takto

        // nebo vygenerujeme URL s parametrem, který frontend zpracuje

        cars.forEach(car => {

            const lastMod = new Date(car.updated_at).toISOString().split('T')[0];

            sitemap += `

<url>

<loc>${baseUrl}/?car=${car.id}</loc>

<lastmod>${lastMod}</lastmod>

<changefreq>weekly</changefreq>

<priority>0.6</priority>

</url>`;

        });



        sitemap += `

</urlset>`;



        res.header('Content-Type', 'application/xml');

        res.send(sitemap);

    });

});



// Multer konfigurace pro upload obrázků

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, 'uploads/');

    },

    filename: (req, file, cb) => {

        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);

        cb(null, uniqueName);

    }

});



const upload = multer({

    storage: storage,

    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit

    fileFilter: (req, file, cb) => {

        const allowedTypes = /jpeg|jpg|png|gif|webp/;

        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {

            return cb(null, true);

        } else {

            cb(new Error('Povoleny jsou pouze obrázky!'));

        }

    }

});



// Inicializace databáze

const db = new sqlite3.Database('./database.db');



// Vytvoření tabulek

db.serialize(() => {

    // Tabulka pro uživatele (admin)

    db.run(`CREATE TABLE IF NOT EXISTS users (

id INTEGER PRIMARY KEY AUTOINCREMENT,

username TEXT UNIQUE NOT NULL,

password TEXT NOT NULL,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP

)`);



    // Tabulka pro vozidla

    db.run(`CREATE TABLE IF NOT EXISTS cars (

id INTEGER PRIMARY KEY AUTOINCREMENT,

title TEXT NOT NULL,

brand TEXT NOT NULL,

model TEXT,

year INTEGER,

price INTEGER NOT NULL,

mileage INTEGER,

fuel TEXT,

transmission TEXT,

power TEXT,

description TEXT,

main_image TEXT,

gallery TEXT,

status TEXT DEFAULT 'active',

featured BOOLEAN DEFAULT 0,

display_order INTEGER DEFAULT 999,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

updated_at DATETIME DEFAULT CURRENT_TIMESTAMP

)`);



    // Tabulka pro poptávky

    db.run(`CREATE TABLE IF NOT EXISTS inquiries (

id INTEGER PRIMARY KEY AUTOINCREMENT,

car_id INTEGER,

rental_car_id INTEGER,

inquiry_type TEXT DEFAULT 'sale',

name TEXT NOT NULL,

email TEXT NOT NULL,

phone TEXT,

message TEXT,

status TEXT DEFAULT 'new',

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (car_id) REFERENCES cars (id),

FOREIGN KEY (rental_car_id) REFERENCES rental_cars (id)

)`);



    // Tabulka pro půjčovnu

    db.run(`CREATE TABLE IF NOT EXISTS rental_cars (

id INTEGER PRIMARY KEY AUTOINCREMENT,

vehicle TEXT NOT NULL,

price_per_day INTEGER NOT NULL,

description TEXT,

images TEXT,

status TEXT DEFAULT 'active',

display_order INTEGER DEFAULT 999,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

updated_at DATETIME DEFAULT CURRENT_TIMESTAMP

)`);



    // Tabulka pro nastavení

    db.run(`CREATE TABLE IF NOT EXISTS settings (

id INTEGER PRIMARY KEY AUTOINCREMENT,

company_name TEXT DEFAULT 'Auto Hlaváček',

email TEXT DEFAULT 'auto-hlavacek@seznam.cz',

phone TEXT DEFAULT '+420 602 763 556',

address TEXT DEFAULT 'Polská 402, 793 76 Zlaté Hory',

opening_hours TEXT DEFAULT 'ÚT-PÁ: 9:00 - 12:00, 13:00 - 16:00\nMimo otevírací dobu pouze po telefonické dohodě',

opening_hours_short TEXT DEFAULT 'ÚT-PÁ: 9:00-12:00, 13:00-16:00',

facebook TEXT DEFAULT 'https://www.facebook.com/IngTomasHlavacek',

instagram TEXT DEFAULT '',

whatsapp TEXT DEFAULT '420602763556',

announcement TEXT DEFAULT '',

announcement_enabled BOOLEAN DEFAULT 0,

updated_at DATETIME DEFAULT CURRENT_TIMESTAMP

)`);



    // Vytvoření výchozího admin účtu (pokud neexistuje)

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';

    db.get("SELECT * FROM users WHERE username = ?", [adminUsername], (err, row) => {

        if (!row) {

            // Použít heslo z environment proměnné nebo výchozí SILNÉ heslo

            const defaultPassword = process.env.ADMIN_PASSWORD || 'Admin@Hlavacek2025!';

            const hashedPassword = bcrypt.hashSync(defaultPassword, 12);

            db.run("INSERT INTO users (username, password) VALUES (?, ?)", [adminUsername, hashedPassword], (err) => {

                if (!err) {

                    console.log('\n========================================');

                    console.log('Výchozí admin účet vytvořen!');

                    console.log(`Username: ${adminUsername}`);

                    if (isDevelopment || !process.env.ADMIN_PASSWORD) {

                        console.log(`Password: ${defaultPassword}`);

                        console.log('DůLEŽITÉ: Změňte heslo po prvním přihlášení!');

                    } else {

                        console.log('Password: Nastaveno z .env souboru');

                    }

                    console.log('========================================\n');

                }

            });

        }

    });



    // Vytvoření výchozího záznamu nastavení (pokud neexistuje)

    db.get("SELECT * FROM settings WHERE id = 1", (err, row) => {

        if (!row) {

            db.run("INSERT INTO settings (id) VALUES (1)", (err) => {

                if (!err) {

                    console.log('Výchozí nastavení vytvořeno');

                }

            });

        }

    });



    // Přidání nových sloupců pokud neexistují

    db.all("PRAGMA table_info(settings)", (err, columns) => {

        const hasOpeningHoursShort = columns.some(col => col.name === 'opening_hours_short');

        const hasOwnerName = columns.some(col => col.name === 'owner_name');

        const hasIco = columns.some(col => col.name === 'ico');

        const hasDic = columns.some(col => col.name === 'dic');



        if (!hasOpeningHoursShort) {

            db.run("ALTER TABLE settings ADD COLUMN opening_hours_short TEXT DEFAULT 'ÚT-PÁ: 9:00-12:00, 13:00-16:00'", (err) => {

                if (!err) {

                    console.log('Přidán sloupec opening_hours_short do tabulky settings');

                }

            });

        }



        if (!hasOwnerName) {

            db.run("ALTER TABLE settings ADD COLUMN owner_name TEXT DEFAULT 'Ing. Tomáš Hlaváček'", (err) => {

                if (!err) {

                    console.log('Přidán sloupec owner_name do tabulky settings');

                }

            });

        }



        if (!hasIco) {

            db.run("ALTER TABLE settings ADD COLUMN ico TEXT DEFAULT ''", (err) => {

                if (!err) {

                    console.log('Přidán sloupec ico do tabulky settings');

                }

            });

        }



        if (!hasDic) {

            db.run("ALTER TABLE settings ADD COLUMN dic TEXT DEFAULT ''", (err) => {

                if (!err) {

                    console.log('Přidán sloupec dic do tabulky settings');

                }

            });

        }

    });



    // Přidání nových sloupců do tabulky inquiries pokud neexistují

    db.all("PRAGMA table_info(inquiries)", (err, columns) => {

        const hasRentalCarId = columns.some(col => col.name === 'rental_car_id');

        const hasInquiryType = columns.some(col => col.name === 'inquiry_type');



        if (!hasRentalCarId) {

            db.run("ALTER TABLE inquiries ADD COLUMN rental_car_id INTEGER", (err) => {

                if (!err) {

                    console.log('Přidán sloupec rental_car_id do tabulky inquiries');

                }

            });

        }



        if (!hasInquiryType) {

            db.run("ALTER TABLE inquiries ADD COLUMN inquiry_type TEXT DEFAULT 'sale'", (err) => {

                if (!err) {

                    console.log('Přidán sloupec inquiry_type do tabulky inquiries');

                }

            });

        }

    });



    // Přidání sloupce display_order do tabulky cars pokud neexistuje

    db.all("PRAGMA table_info(cars)", (err, columns) => {

        const hasDisplayOrder = columns.some(col => col.name === 'display_order');



        if (!hasDisplayOrder) {

            db.run("ALTER TABLE cars ADD COLUMN display_order INTEGER DEFAULT 999", (err) => {

                if (!err) {

                    console.log('Přidán sloupec display_order do tabulky cars');

                    // Nastavíme pořadí podle ID (starší vozidla mají vyšší prioritu)

                    db.run("UPDATE cars SET display_order = id WHERE display_order = 999", (err) => {

                        if (!err) console.log('Inicializováno pořadí vozidel');

                    });

                }

            });

        }

    });



    // Přidání sloupce display_order do tabulky rental_cars pokud neexistuje

    db.all("PRAGMA table_info(rental_cars)", (err, columns) => {

        const hasDisplayOrder = columns.some(col => col.name === 'display_order');



        if (!hasDisplayOrder) {

            db.run("ALTER TABLE rental_cars ADD COLUMN display_order INTEGER DEFAULT 999", (err) => {

                if (!err) {

                    console.log('Přidán sloupec display_order do tabulky rental_cars');

                    // Nastavíme pořadí podle ID

                    db.run("UPDATE rental_cars SET display_order = id WHERE display_order = 999", (err) => {

                        if (!err) console.log('Inicializováno pořadí půjčovny');

                    });

                }

            });

        }

    });

});



// Middleware pro kontrolu přihlášení

const requireAuth = (req, res, next) => {

    if (!req.session.userId) {

        return res.status(401).json({ error: 'Nejste přihlášen' });

    }

    next();

};



// ============= API ENDPOINTS =============



// Přihlášení - s rate limiting

app.post('/api/login', loginLimiter, (req, res) => {

    const { username, password } = req.body;



    // Validation

    if (!username || !password) {

        return res.status(400).json({ error: 'Chybí uživatelské jméno nebo heslo' });

    }



    // Sanitize input

    const cleanUsername = username.trim().toLowerCase();



    db.get("SELECT * FROM users WHERE username = ?", [cleanUsername], (err, user) => {

        if (err) {

            console.error('Database error during login:', err);

            return res.status(500).json({ error: 'Chyba databáze' });

        }



        if (!user) {

            // Security: Neměla by být rozdílná odpověď pro neexistujícího uživatele

            return res.status(401).json({ error: 'Nesprávné přihlašovací údaje' });

        }



        // Verify password

        bcrypt.compare(password, user.password, (err, isMatch) => {

            if (err || !isMatch) {

                return res.status(401).json({ error: 'Nesprávné přihlašovací údaje' });

            }



            req.session.userId = user.id;

            req.session.username = user.username;



            // Log successful login (for security audit)

            console.log(`[${new Date().toISOString()}] Successful login for user: ${username} from IP: ${req.ip}`);



            res.json({ success: true, message: 'Přihlášení úspěšné' });

        });

    });

});



// Odhlášení

app.post('/api/logout', (req, res) => {

    req.session.destroy();

    res.json({ success: true });

});



// Kontrola přihlášení

app.get('/api/check-auth', (req, res) => {

    res.json({ authenticated: !!req.session.userId });

});



// ============= VOZIDLA API =============



// Získat všechna vozidla (veřejné)

app.get('/api/cars', (req, res) => {

    const { status = 'active', featured } = req.query;

    let query = "SELECT * FROM cars WHERE status = ?";

    let params = [status];



    if (featured === 'true') {

        query += " AND featured = 1";

    }



    query += " ORDER BY display_order ASC, created_at DESC";



    db.all(query, params, (err, cars) => {

        if (err) {

            return res.status(500).json({ error: 'Chyba při načítání vozidel' });

        }



        // Parse gallery JSON

        cars = cars.map(car => ({

            ...car,

            gallery: car.gallery ? JSON.parse(car.gallery) : []

        }));



        res.json(cars);

    });

});



// Získat jedno vozidlo

app.get('/api/cars/:id', (req, res) => {

    db.get("SELECT * FROM cars WHERE id = ?", [req.params.id], (err, car) => {

        if (err) {

            return res.status(500).json({ error: 'Chyba při načítání vozidla' });

        }

        if (!car) {

            return res.status(404).json({ error: 'Vozidlo nenalezeno' });

        }



        car.gallery = car.gallery ? JSON.parse(car.gallery) : [];

        res.json(car);

    });

});



// Přidat nové vozidlo (vyžaduje přihlášení)

app.post('/api/cars', requireAuth, upload.fields([

    { name: 'main_image', maxCount: 1 },

    { name: 'gallery', maxCount: 20 }

]), (req, res) => {

    const {

        title, brand, model, year, price, mileage,

        fuel, transmission, power, description, featured

    } = req.body;



    const main_image = req.files['main_image'] ? `/uploads/${req.files['main_image'][0].filename}` : null;

    const gallery = req.files['gallery'] ? req.files['gallery'].map(file => `/uploads/${file.filename}`) : [];



    db.run(

        `INSERT INTO cars (title, brand, model, year, price, mileage, fuel, transmission, power, description, main_image, gallery, featured)

VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

        [title, brand, model, year, price, mileage, fuel, transmission, power, description, main_image, JSON.stringify(gallery), featured ? 1 : 0],

        function (err) {

            if (err) {

                return res.status(500).json({ error: 'Chyba při ukládání vozidla' });

            }

            res.json({ success: true, id: this.lastID });

        }

    );

});



// Změnit pořadí vozidla - MUSÍ BÝT PŘED /api/cars/:id endpointem!

app.post('/api/cars/:id/reorder', requireAuth, (req, res) => {

    const { direction } = req.body; // 'up' nebo 'down'

    const carId = parseInt(req.params.id);



    // Získáme aktuální vozidlo

    db.get("SELECT * FROM cars WHERE id = ?", [carId], (err, currentCar) => {

        if (err || !currentCar) {

            return res.status(404).json({ error: 'Vozidlo nenalezeno' });

        }



        // Najdeme sousední vozidlo

        let query;

        if (direction === 'up') {

            // Najdi vozidlo s nižším display_order (vyšší priorita)

            query = "SELECT * FROM cars WHERE display_order < ? ORDER BY display_order DESC LIMIT 1";

        } else {

            // Najdi vozidlo s vyšším display_order (nižší priorita)

            query = "SELECT * FROM cars WHERE display_order > ? ORDER BY display_order ASC LIMIT 1";

        }



        db.get(query, [currentCar.display_order], (err, neighborCar) => {

            if (err || !neighborCar) {

                return res.status(400).json({ error: 'Nelze posunout dále' });

            }



            // Prohodíme display_order

            const currentOrder = currentCar.display_order;

            const neighborOrder = neighborCar.display_order;



            db.run("UPDATE cars SET display_order = ? WHERE id = ?", [neighborOrder, carId], (err) => {

                if (err) {

                    return res.status(500).json({ error: 'Chyba při aktualizaci pořadí' });

                }



                db.run("UPDATE cars SET display_order = ? WHERE id = ?", [currentOrder, neighborCar.id], (err) => {

                    if (err) {

                        return res.status(500).json({ error: 'Chyba při aktualizaci pořadí' });

                    }



                    res.json({ success: true });

                });

            });

        });

    });

});



// Upravit vozidlo

app.put('/api/cars/:id', requireAuth, upload.fields([

    { name: 'main_image', maxCount: 1 },

    { name: 'gallery', maxCount: 20 }

]), (req, res) => {

    const {

        title, brand, model, year, price, mileage,

        fuel, transmission, power, description, featured, status

    } = req.body;



    db.get("SELECT * FROM cars WHERE id = ?", [req.params.id], (err, car) => {

        if (err || !car) {

            return res.status(404).json({ error: 'Vozidlo nenalezeno' });

        }



        let main_image = car.main_image;

        let gallery = JSON.parse(car.gallery || '[]');



        if (req.files['main_image']) {

            main_image = `/uploads/${req.files['main_image'][0].filename}`;

        }



        if (req.files['gallery']) {

            const newImages = req.files['gallery'].map(file => `/uploads/${file.filename}`);

            gallery = [...gallery, ...newImages];

        }



        db.run(

            `UPDATE cars SET title=?, brand=?, model=?, year=?, price=?, mileage=?, fuel=?, transmission=?,

power=?, description=?, main_image=?, gallery=?, featured=?, status=?, updated_at=CURRENT_TIMESTAMP

WHERE id=?`,

            [title, brand, model, year, price, mileage, fuel, transmission, power, description,

                main_image, JSON.stringify(gallery), featured ? 1 : 0, status, req.params.id],

            (err) => {

                if (err) {

                    return res.status(500).json({ error: 'Chyba při aktualizaci vozidla' });

                }

                res.json({ success: true });

            }

        );

    });

});



// Smazat vozidlo

app.delete('/api/cars/:id', requireAuth, (req, res) => {

    // Nejdřív načteme vozidlo aby jsme získali cesty k obrázkům

    db.get("SELECT * FROM cars WHERE id = ?", [req.params.id], (err, car) => {

        if (err) {

            console.error('Chyba při načítání vozidla:', err);

            return res.status(500).json({ error: 'Chyba při mazání vozidla' });

        }



        if (!car) {

            return res.status(404).json({ error: 'Vozidlo nenalezeno' });

        }



        // Smazání fyzických souborů

        const imagesToDelete = [];



        // Přidáme hlavní obrázek

        if (car.main_image) {

            imagesToDelete.push(car.main_image);

        }



        // Přidáme galerii

        if (car.gallery) {

            try {

                const gallery = JSON.parse(car.gallery);

                if (Array.isArray(gallery)) {

                    imagesToDelete.push(...gallery);

                }

            } catch (e) {

                console.error('Chyba při parsování galerie:', e);

            }

        }



        // Smazání souborů z disku

        imagesToDelete.forEach(imagePath => {

            if (imagePath && imagePath.startsWith('/uploads/')) {

                const fullPath = path.join(__dirname, imagePath);

                fs.unlink(fullPath, (err) => {

                    if (err) {

                        console.error('Chyba při mazání souboru:', fullPath, err.message);

                    } else {

                        console.log('Smazán soubor:', fullPath);

                    }

                });

            }

        });



        // Smazání z databáze

        db.run("DELETE FROM cars WHERE id = ?", [req.params.id], (err) => {

            if (err) {

                console.error('Chyba při mazání z databáze:', err);

                return res.status(500).json({ error: 'Chyba při mazání vozidla' });

            }

            console.log(`Vozidlo #${req.params.id} bylo smazáno včetně ${imagesToDelete.length} obrázků`);

            res.json({ success: true });

        });

    });

});



// Alias pro update vozidla (pro zpětnou kompatibilitu s POST)

app.post('/api/cars/:id', requireAuth, upload.fields([

    { name: 'main_image', maxCount: 1 },

    { name: 'gallery', maxCount: 20 }

]), (req, res) => {

    const {

        title, brand, model, year, price, mileage,

        fuel, transmission, power, description, featured, status

    } = req.body;



    db.get("SELECT * FROM cars WHERE id = ?", [req.params.id], (err, car) => {

        if (err || !car) {

            return res.status(404).json({ error: 'Vozidlo nenalezeno' });

        }



        let main_image = car.main_image;

        let gallery = JSON.parse(car.gallery || '[]');



        if (req.files['main_image']) {

            main_image = `/uploads/${req.files['main_image'][0].filename}`;

        }



        if (req.files['gallery']) {

            const newImages = req.files['gallery'].map(file => `/uploads/${file.filename}`);

            gallery = [...gallery, ...newImages];

        }



        db.run(

            `UPDATE cars SET title=?, brand=?, model=?, year=?, price=?, mileage=?, fuel=?, transmission=?,

power=?, description=?, main_image=?, gallery=?, featured=?, status=?, updated_at=CURRENT_TIMESTAMP

WHERE id=?`,

            [title, brand, model, year, price, mileage, fuel, transmission, power, description,

                main_image, JSON.stringify(gallery), featured ? 1 : 0, status, req.params.id],

            (err) => {

                if (err) {

                    return res.status(500).json({ error: 'Chyba při aktualizaci vozidla' });

                }

                res.json({ success: true });

            }

        );

    });

});



// ============= POPTÁVKY API =============



// Odeslat poptávku (veřejné)

app.post('/api/inquiries', (req, res) => {

    const { car_id, rental_car_id, name, email, phone, message } = req.body;



    // Určíme typ poptávky

    let inquiry_type = 'sale'; // výchozí hodnota

    if (rental_car_id) {

        inquiry_type = 'rental';

    }



    // Debug logging

    console.log('Nová poptávka:', {

        car_id: car_id || null,

        rental_car_id: rental_car_id || null,

        inquiry_type,

        name,

        email

    });



    db.run(

        "INSERT INTO inquiries (car_id, rental_car_id, inquiry_type, name, email, phone, message) VALUES (?, ?, ?, ?, ?, ?, ?)",

        [car_id || null, rental_car_id || null, inquiry_type, name, email, phone, message],

        function (err) {

            if (err) {

                console.error('Chyba při ukládání poptávky:', err);

                return res.status(500).json({ error: 'Chyba při odesílání poptávky' });

            }

            console.log('Poptávka úspěšně uložena, ID:', this.lastID);

            res.json({ success: true, id: this.lastID });

        }

    );

});



// Získat všechny poptávky (vyžaduje přihlášení)

app.get('/api/inquiries', requireAuth, (req, res) => {

    db.all(

        `SELECT i.*,

c.title as car_title,

rc.vehicle as rental_car_title

FROM inquiries i

LEFT JOIN cars c ON i.car_id = c.id

LEFT JOIN rental_cars rc ON i.rental_car_id = rc.id

ORDER BY i.created_at DESC`,

        (err, inquiries) => {

            if (err) {

                console.error('Chyba při načítání poptávek:', err);

                return res.status(500).json({ error: 'Chyba při načítání poptávek' });

            }

            // Debug logging - ukazu prvni 2 zaznamy

            if (inquiries.length > 0) {

                console.log('Příklad poptávek:', inquiries.slice(0, 2).map(i => ({

                    id: i.id,

                    inquiry_type: i.inquiry_type,

                    car_id: i.car_id,

                    rental_car_id: i.rental_car_id,

                    car_title: i.car_title,

                    rental_car_title: i.rental_car_title

                })));

            }

            res.json(inquiries);

        }

    );

});



// Změnit status poptávky

app.patch('/api/inquiries/:id/status', requireAuth, (req, res) => {

    const { status } = req.body;



    db.run(

        "UPDATE inquiries SET status = ? WHERE id = ?",

        [status, req.params.id],

        (err) => {

            if (err) {

                return res.status(500).json({ error: 'Chyba při aktualizaci statusu' });

            }

            res.json({ success: true });

        }

    );

});



// Smazat poptávku (chybějící endpoint)

app.delete('/api/inquiries/:id', requireAuth, (req, res) => {

    db.run("DELETE FROM inquiries WHERE id = ?", [req.params.id], (err) => {

        if (err) {

            return res.status(500).json({ error: 'Chyba při mazání poptávky' });

        }

        res.json({ success: true });

    });

});



// ============= NASTAVENÍ API =============



// Získat nastavení (veřejné pro popup)

app.get('/api/settings', (req, res) => {

    db.get("SELECT * FROM settings WHERE id = 1", (err, settings) => {

        if (err) {

            return res.status(500).json({ error: 'Chyba při načítání nastavení' });

        }



        // Pokud nastavení neexistuje, vytvoř výchozí

        if (!settings) {

            db.run("INSERT INTO settings (id) VALUES (1)", (err) => {

                if (err) {

                    return res.status(500).json({ error: 'Chyba při vytváření nastavení' });

                }



                db.get("SELECT * FROM settings WHERE id = 1", (err, newSettings) => {

                    if (err) {

                        return res.status(500).json({ error: 'Chyba při načítání nastavení' });

                    }

                    res.json(newSettings);

                });

            });

        } else {

            res.json(settings);

        }

    });

});



// Změnit heslo (vyžaduje přihlášení)

app.post('/api/change-password', requireAuth, (req, res) => {

    const { currentPassword, newPassword } = req.body;



    // Validace

    if (!currentPassword || !newPassword) {

        return res.status(400).json({ error: 'Vyplňte všechna pole' });

    }



    // Kontrola síly nového hesla

    if (newPassword.length < 8) {

        return res.status(400).json({ error: 'Nové heslo musí mít alespoň 8 znaků' });

    }



    // Získať aktuální heslo uživatele

    db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], (err, user) => {

        if (err || !user) {

            return res.status(500).json({ error: 'Chyba při načítání uživatele' });

        }



        // Ověřit staré heslo

        bcrypt.compare(currentPassword, user.password, (err, isMatch) => {

            if (err || !isMatch) {

                return res.status(401).json({ error: 'Nesprávné aktuální heslo' });

            }



            // Zahashovat nové heslo

            const hashedPassword = bcrypt.hashSync(newPassword, 12);



            // Aktualizovat heslo v databázi

            db.run(

                "UPDATE users SET password = ? WHERE id = ?",

                [hashedPassword, req.session.userId],

                (err) => {

                    if (err) {

                        return res.status(500).json({ error: 'Chyba při změně hesla' });

                    }



                    console.log(`[${new Date().toISOString()}] Password changed for user ID: ${req.session.userId}`);

                    res.json({ success: true, message: 'Heslo bylo úspěšně změněno' });

                }

            );

        });

    });

});



// Aktualizovat nastavení (vyžaduje přihlášení)

app.put('/api/settings', requireAuth, (req, res) => {

    const {

        company_name, email, phone, address, opening_hours, opening_hours_short,

        facebook, instagram, whatsapp, announcement, announcement_enabled,

        owner_name, ico, dic

    } = req.body;



    db.run(

        `UPDATE settings SET

company_name = ?, email = ?, phone = ?, address = ?, opening_hours = ?, opening_hours_short = ?,

facebook = ?, instagram = ?, whatsapp = ?, announcement = ?, announcement_enabled = ?,

owner_name = ?, ico = ?, dic = ?,

updated_at = CURRENT_TIMESTAMP

WHERE id = 1`,

        [company_name, email, phone, address, opening_hours, opening_hours_short,

            facebook, instagram, whatsapp, announcement, announcement_enabled ? 1 : 0,

            owner_name, ico, dic],

        (err) => {

            if (err) {

                return res.status(500).json({ error: 'Chyba při aktualizaci nastavení' });

            }

            res.json({ success: true });

        }

    );

});



// ============= PŪJČOVNA API =============



// Získat všechna vozidla z půjčovny (veřejné)

app.get('/api/rental-cars', (req, res) => {

    db.all("SELECT * FROM rental_cars WHERE status = 'active' ORDER BY display_order ASC, created_at DESC", (err, cars) => {

        if (err) {

            return res.status(500).json({ error: 'Chyba při načítání vozidel' });

        }



        // Parse images JSON

        cars = cars.map(car => ({

            ...car,

            images: car.images ? JSON.parse(car.images) : []

        }));



        res.json(cars);

    });

});



// Získat jedno vozidlo z půjčovny

app.get('/api/rental-cars/:id', (req, res) => {

    db.get("SELECT * FROM rental_cars WHERE id = ?", [req.params.id], (err, car) => {

        if (err) {

            return res.status(500).json({ error: 'Chyba při načítání vozidla' });

        }

        if (!car) {

            return res.status(404).json({ error: 'Vozidlo nenalezeno' });

        }



        car.images = car.images ? JSON.parse(car.images) : [];

        res.json(car);

    });

});



// Přidat vozidlo do půjčovny (vyžaduje přihlášení)

app.post('/api/rental-cars', requireAuth, upload.fields([

    { name: 'images', maxCount: 10 }

]), (req, res) => {

    const { vehicle, price_per_day, description } = req.body;



    const images = req.files['images'] ? req.files['images'].map(file => `/uploads/${file.filename}`) : [];



    db.run(

        `INSERT INTO rental_cars (vehicle, price_per_day, description, images)

VALUES (?, ?, ?, ?)`,

        [vehicle, price_per_day, description, JSON.stringify(images)],

        function (err) {

            if (err) {

                return res.status(500).json({ error: 'Chyba při ukládání vozidla' });

            }

            res.json({ success: true, id: this.lastID });

        }

    );

});



// Upravit vozidlo v půjčovně

app.put('/api/rental-cars/:id', requireAuth, upload.fields([

    { name: 'images', maxCount: 10 }

]), (req, res) => {

    const { vehicle, price_per_day, description, status } = req.body;



    db.get("SELECT * FROM rental_cars WHERE id = ?", [req.params.id], (err, car) => {

        if (err || !car) {

            return res.status(404).json({ error: 'Vozidlo nenalezeno' });

        }



        let images = JSON.parse(car.images || '[]');



        if (req.files['images']) {

            const newImages = req.files['images'].map(file => `/uploads/${file.filename}`);

            images = [...images, ...newImages];

        }



        db.run(

            `UPDATE rental_cars SET vehicle=?, price_per_day=?, description=?, images=?, status=?, updated_at=CURRENT_TIMESTAMP

WHERE id=?`,

            [vehicle, price_per_day, description, JSON.stringify(images), status, req.params.id],

            (err) => {

                if (err) {

                    return res.status(500).json({ error: 'Chyba při aktualizaci vozidla' });

                }

                res.json({ success: true });

            }

        );

    });

});



// Smazat vozidlo z půjčovny

app.delete('/api/rental-cars/:id', requireAuth, (req, res) => {

    // Nejdřív načteme vozidlo aby jsme získali cesty k obrázkům

    db.get("SELECT * FROM rental_cars WHERE id = ?", [req.params.id], (err, car) => {

        if (err) {

            console.error('Chyba při načítání vozidla z půjčovny:', err);

            return res.status(500).json({ error: 'Chyba při mazání vozidla' });

        }



        if (!car) {

            return res.status(404).json({ error: 'Vozidlo nenalezeno' });

        }



        // Smazání fyzických souborů

        const imagesToDelete = [];



        // Přidáme všechny obrázky

        if (car.images) {

            try {

                const images = JSON.parse(car.images);

                if (Array.isArray(images)) {

                    imagesToDelete.push(...images);

                }

            } catch (e) {

                console.error('Chyba při parsování obrázků:', e);

            }

        }



        // Smazání souborů z disku

        imagesToDelete.forEach(imagePath => {

            if (imagePath && imagePath.startsWith('/uploads/')) {

                const fullPath = path.join(__dirname, imagePath);

                fs.unlink(fullPath, (err) => {

                    if (err) {

                        console.error('Chyba při mazání souboru:', fullPath, err.message);

                    } else {

                        console.log('Smazán soubor:', fullPath);

                    }

                });

            }

        });



        // Smazání z databáze

        db.run("DELETE FROM rental_cars WHERE id = ?", [req.params.id], (err) => {

            if (err) {

                console.error('Chyba při mazání z databáze:', err);

                return res.status(500).json({ error: 'Chyba při mazání vozidla' });

            }

            console.log(`Vozidlo z půjčovny #${req.params.id} bylo smazáno včetně ${imagesToDelete.length} obrázků`);

            res.json({ success: true });

        });

    });

});



// Změnit pořadí vozidla v půjčovně

app.post('/api/rental-cars/:id/reorder', requireAuth, (req, res) => {

    const { direction } = req.body; // 'up' nebo 'down'

    const carId = parseInt(req.params.id);



    // Získáme aktuální vozidlo

    db.get("SELECT * FROM rental_cars WHERE id = ?", [carId], (err, currentCar) => {

        if (err || !currentCar) {

            return res.status(404).json({ error: 'Vozidlo nenalezeno' });

        }



        // Najdeme sousední vozidlo

        let query;

        if (direction === 'up') {

            query = "SELECT * FROM rental_cars WHERE display_order < ? ORDER BY display_order DESC LIMIT 1";

        } else {

            query = "SELECT * FROM rental_cars WHERE display_order > ? ORDER BY display_order ASC LIMIT 1";

        }



        db.get(query, [currentCar.display_order], (err, neighborCar) => {

            if (err || !neighborCar) {

                return res.status(400).json({ error: 'Nelze posunout dále' });

            }



            // Prohodíme display_order

            const currentOrder = currentCar.display_order;

            const neighborOrder = neighborCar.display_order;



            db.run("UPDATE rental_cars SET display_order = ? WHERE id = ?", [neighborOrder, carId], (err) => {

                if (err) {

                    return res.status(500).json({ error: 'Chyba při aktualizaci pořadí' });

                }



                db.run("UPDATE rental_cars SET display_order = ? WHERE id = ?", [currentOrder, neighborCar.id], (err) => {

                    if (err) {

                        return res.status(500).json({ error: 'Chyba při aktualizaci pořadí' });

                    }



                    res.json({ success: true });

                });

            });

        });

    });

});



// Alias pro update vozidla v půjčovně (pro zpětnou kompatibilitu s POST)

app.post('/api/rental-cars/:id', requireAuth, upload.fields([

    { name: 'images', maxCount: 10 }

]), (req, res) => {

    const { vehicle, price_per_day, description, status } = req.body;



    db.get("SELECT * FROM rental_cars WHERE id = ?", [req.params.id], (err, car) => {

        if (err || !car) {

            return res.status(404).json({ error: 'Vozidlo nenalezeno' });

        }



        let images = JSON.parse(car.images || '[]');



        if (req.files['images']) {

            const newImages = req.files['images'].map(file => `/uploads/${file.filename}`);

            images = [...images, ...newImages];

        }



        db.run(

            `UPDATE rental_cars SET vehicle=?, price_per_day=?, description=?, images=?, status=?, updated_at=CURRENT_TIMESTAMP

WHERE id=?`,

            [vehicle, price_per_day, description, JSON.stringify(images), status, req.params.id],

            (err) => {

                if (err) {

                    return res.status(500).json({ error: 'Chyba při aktualizaci vozidla' });

                }

                res.json({ success: true });

            }

        );

    });

});



// Spustit server

app.listen(PORT, () => {

    console.log(`\n========================================`);

    console.log(`CMS Server běží na http://localhost:${PORT}`);

    console.log(`Admin panel: http://localhost:${PORT}/admin`);

    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);



    if (isDevelopment) {

        console.log(`\nPřihlašovací údaje:`);

        console.log(`Username: admin`);

        console.log(`Password: ${process.env.ADMIN_PASSWORD || 'Admin@Hlavacek2025!'}`);

    } else {

        console.log(`\nPřihlašovací údaje jsou nastaveny v environment proměnných`);

    }



    console.log(`\nDůLEŽITÁ BEZPEČNOSTNÍ UPOZORNĚNÍ:`);

    console.log(`1. Před nasazením na produkci změňte heslo!`);

    console.log(`2. Nastavte environment proměnnou SESSION_SECRET`);

    console.log(`3. Používejte HTTPS na produkci`);

    console.log(`========================================\n`);

});

// ==========================================
// STATISTIKY API
// ==========================================

// Zaznamenat návštěvu
app.post('/api/stats/visit', (req, res) => {
    const today = new Date().toISOString().split('T')[0];

    // Zkusíme vložit nový záznam pro dnešek nebo aktualizovat existující
    db.run(
        `INSERT INTO visitor_stats (date, count) VALUES (?, 1)
         ON CONFLICT(date) DO UPDATE SET count = count + 1, updated_at = CURRENT_TIMESTAMP`,
        [today],
        function (err) {
            if (err) {
                console.error('Chyba při aktualizaci statistik:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ success: true, count: 1 });
        }
    );
});

// Získat statistiky
app.get('/api/stats', requireAuth, (req, res) => {
    console.log('📊 [STATS] Načítám statistiky...');
    const today = new Date().toISOString().split('T')[0];
    const msInDay = 24 * 60 * 60 * 1000;
    const weekAgo = new Date(Date.now() - 6 * msInDay).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 29 * msInDay).toISOString().split('T')[0];

    console.log('📅 [STATS] Dnešní datum:', today);
    console.log('📅 [STATS] Týden od:', weekAgo);
    console.log('📅 [STATS] Měsíc od:', monthAgo);

    const query = `
        SELECT 
            (SELECT COALESCE(SUM(count), 0) FROM visitor_stats) as total,
            (SELECT COALESCE(count, 0) FROM visitor_stats WHERE date = ?) as today,
            (SELECT COALESCE(SUM(count), 0) FROM visitor_stats WHERE date >= ?) as week,
            (SELECT COALESCE(SUM(count), 0) FROM visitor_stats WHERE date >= ?) as month
    `;

    db.get(query, [today, weekAgo, monthAgo], (err, row) => {
        if (err) {
            console.error('❌ [STATS] Chyba při načítání statistik:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('✅ [STATS] Načtená data:', row);
        const result = {
            total: row.total || 0,
            today: row.today || 0,
            week: row.week || 0,
            month: row.month || 0
        };
        console.log('📤 [STATS] Odesílám:', result);
        res.json(result);
    });
});

// Změnit pořadí fotek v galerii
app.post('/api/cars/:id/gallery/reorder', requireAuth, (req, res) => {
    const carId = req.params.id;
    const { gallery } = req.body;

    if (!Array.isArray(gallery)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    db.run(
        `UPDATE cars SET gallery = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [JSON.stringify(gallery), carId],
        function (err) {
            if (err) {
                console.error('Chyba při aktualizaci galerie:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ success: true });
        }
    );
});

// Tabulka pro statistiky návštěvnosti
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS visitor_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE,
        count INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

