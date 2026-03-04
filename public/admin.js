// ========== MODERNÍ ADMIN PANEL SYSTÉM ==========
// Kompletně přepsaný admin.js s OOP přístupem a proper event handling

class AdminPanel {
    constructor() {
        this.API_URL = window.location.origin + '/api';
        this.currentEditingCarId = null;
        this.currentEditingRentalId = null;
        this.currentInquiries = [];
        this.init();
    }

    async init() {
        // Inject CSS for gallery management
        const style = document.createElement('style');
        style.textContent = `
            .gallery-item-wrapper { position: relative; display: inline-block; margin: 5px; }
            .gallery-actions { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; opacity: 0; transition: opacity 0.2s; }
            .gallery-item-wrapper:hover .gallery-actions { opacity: 1; }
            .gallery-actions button { background: none; border: none; color: white; padding: 5px; cursor: pointer; font-weight: bold; }
            .gallery-actions button:hover { color: var(--primary); }
            .stat-card.visitor-stats { border-left: 4px solid var(--info); }
        `;
        document.head.appendChild(style);

        console.log('Inicializuji admin panel...');

        // Check authentication
        const isAuth = await this.checkAuth();
        if (isAuth) {
            this.showAdminPanel();
            await this.loadDashboard();
            this.attachEventListeners();
        } else {
            this.showLoginScreen();
        }
    }

    // ========== AUTHENTICATION ==========
    async checkAuth() {
        try {
            const response = await fetch(`${this.API_URL}/check-auth`, {
                credentials: 'include'
            });
            const data = await response.json();
            return data.authenticated;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';

        // Login form handler
        document.getElementById('loginForm').onsubmit = async (e) => {
            e.preventDefault();
            await this.handleLogin(e.target);
        };
    }

    showAdminPanel() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
    }

    async handleLogin(form) {
        const username = form.username.value;
        const password = form.password.value;

        try {
            const response = await fetch(`${this.API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAdminPanel();
                await this.loadDashboard();
                this.attachEventListeners();
                toast.success('Přihlášení úspěšné');
            } else {
                toast.error(data.error || 'Chyba přihlášení');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Chyba připojení k serveru');
        }
    }

    // ========== EVENT LISTENERS ==========
    attachEventListeners() {
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = () => this.handleLogout();
        }

        // Navigation
        document.querySelectorAll('.sidebar-menu a[data-section]').forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                this.navigateToSection(e.target.dataset.section);
            };
        });

        // Add car button
        const addCarBtn = document.getElementById('addCarBtn');
        if (addCarBtn) {
            addCarBtn.onclick = () => this.showCarModal();
        }

        // Add rental car button
        const addRentalBtn = document.getElementById('addRentalBtn');
        if (addRentalBtn) {
            addRentalBtn.onclick = () => this.showRentalModal();
        }

        // Car form
        const carForm = document.getElementById('carForm');
        if (carForm) {
            carForm.onsubmit = async (e) => {
                e.preventDefault();
                await this.saveCar(e.target);
            };
        }

        // Rental form
        const rentalForm = document.getElementById('rentalForm');
        if (rentalForm) {
            rentalForm.onsubmit = async (e) => {
                e.preventDefault();
                await this.saveRentalCar(e.target);
            };
        }

        // Settings form
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.onsubmit = async (e) => {
                e.preventDefault();
                await this.saveSettings(e.target);
            };
        }

        // Change password button
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.onclick = async () => {
                await this.changePassword();
            };
        }

        // Image previews for cars
        document.getElementById('carMainImage')?.addEventListener('change', (e) => {
            this.previewImage(e.target.files[0], 'mainImagePreview');
        });

        document.getElementById('carGallery')?.addEventListener('change', (e) => {
            this.previewGallery(e.target.files, 'galleryPreview');
        });

        // Image previews for rental cars
        document.getElementById('rentalImages')?.addEventListener('change', (e) => {
            this.previewGallery(e.target.files, 'rentalImagesPreview');
        });

        // View site button
        document.getElementById('viewSite')?.addEventListener('click', () => {
            window.open('/', '_blank');
        });
    }

    async handleLogout() {
        try {
            await fetch(`${this.API_URL}/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            this.showLoginScreen();
            toast.info('Odhlášení úspěšné');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    navigateToSection(section) {
        // Update active menu
        document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

        // Show section
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(section)?.classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            cars: 'Správa vozidel',
            rental: 'Půjčovna vozidel',
            inquiries: 'Poptávky',
            settings: 'Nastavení'
        };
        document.getElementById('pageTitle').textContent = titles[section] || 'Admin';

        // Load section data
        this.loadSectionData(section);
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'cars':
                await this.loadCars();
                break;
            case 'rental':
                await this.loadRentalCars();
                break;
            case 'inquiries':
                await this.loadInquiries();
                break;
            case 'settings':
                await this.loadSettings();
                break;
        }
    }

    // ========== DASHBOARD ==========
    async loadDashboard() {
        try {
            // Load cars
            const carsResponse = await fetch(`${this.API_URL}/cars`);
            const cars = await carsResponse.json();

            // Load inquiries
            const inquiriesResponse = await fetch(`${this.API_URL}/inquiries`, {
                credentials: 'include'
            });

            // Check if response is OK
            if (!inquiriesResponse.ok) {
                console.error('Failed to load inquiries:', inquiriesResponse.status);
                // Set default values for stats
                document.getElementById('totalCars').textContent = Array.isArray(cars) ? cars.length : 0;
                document.getElementById('activeCars').textContent = Array.isArray(cars) ? cars.filter(c => c.status === 'active').length : 0;
                document.getElementById('totalInquiries').textContent = 0;
                document.getElementById('newInquiries').textContent = 0;
                this.displayRecentInquiries([]);
                return;
            }

            const inquiries = await inquiriesResponse.json();

            // Ensure we have arrays
            const carsArray = Array.isArray(cars) ? cars : [];
            const inquiriesArray = Array.isArray(inquiries) ? inquiries : [];

            // Update stats
            document.getElementById('totalCars').textContent = carsArray.length;
            document.getElementById('activeCars').textContent = carsArray.filter(c => c.status === 'active').length;
            document.getElementById('totalInquiries').textContent = inquiriesArray.length;
            document.getElementById('newInquiries').textContent = inquiriesArray.filter(i => i.status === 'new').length;

            // Show recent inquiries
            this.displayRecentInquiries(inquiriesArray.slice(0, 5));

        } catch (error) {
            console.error('Dashboard load error:', error);
            toast.error('Chyba při načítání dashboardu');
        }

        // Load Visitor Stats
        try {
            const statsRes = await fetch(`${this.API_URL}/stats`, { credentials: 'include' });
            if (statsRes.ok) {
                const stats = await statsRes.json();
                this.updateVisitorStats(stats);
            }
        } catch (e) { console.error('Stats error:', e); }
    }

    updateVisitorStats(stats) {
        // Update main dashboard card if it exists
        const valueEl = document.getElementById('visitorStatsValue');
        if (valueEl) {
            valueEl.textContent = stats.total || 0;
        }

        // Update detailed stats grid
        const setStat = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val || 0;
        };

        setStat('statsToday', stats.today);
        setStat('statsWeek', stats.week);
        setStat('statsMonth', stats.month);
        setStat('statsTotal', stats.total);
    }

    displayRecentInquiries(inquiries) {
        const tbody = document.getElementById('recentInquiriesTable');
        if (!tbody) return;

        if (inquiries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Žádné poptávky</td></tr>';
            return;
        }

        tbody.innerHTML = inquiries.map(inquiry => {
            // Určíme typ poptávky - pokud není inquiry_type, zkoušíme podle přítomnosti rental_car_id
            const isRental = inquiry.inquiry_type === 'rental' || (inquiry.rental_car_id && !inquiry.car_id);

            const vehicleTitle = isRental
                ? (inquiry.rental_car_title || 'Půjčovná - Obecná poptávka')
                : (inquiry.car_title || 'Prodej - Obecná poptávka');

            const typeLabel = isRental
                ? '<span class="badge badge-info">🚗 Půjčení</span>'
                : '<span class="badge badge-primary">💰 Prodej</span>';

            return `
                <tr>
                    <td>${new Date(inquiry.created_at).toLocaleDateString('cs-CZ')}</td>
                    <td>${inquiry.name}</td>
                    <td>${inquiry.email}</td>
                    <td>${typeLabel}</td>
                    <td>${vehicleTitle}</td>
                    <td><span class="badge badge-${this.getStatusBadgeClass(inquiry.status)}">${this.getStatusText(inquiry.status)}</span></td>
                </tr>
            `;
        }).join('');
    }

    // ========== CARS MANAGEMENT ==========
    async loadCars() {
        try {
            const response = await fetch(`${this.API_URL}/cars`);
            const cars = await response.json();
            this.displayCars(cars);
        } catch (error) {
            console.error('Cars load error:', error);
            toast.error('Chyba při načítání vozidel');
        }
    }

    displayCars(cars) {
        const tbody = document.getElementById('carsTable');
        if (!tbody) return;

        if (cars.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Žádná vozidla</td></tr>';
            return;
        }

        tbody.innerHTML = cars.map((car, index) => `
            <tr data-car-id="${car.id}">
                <td>${car.id}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                            <button class="btn btn-primary reorder-car-btn" data-car-id="${car.id}" data-direction="up" 
                                    style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" 
                                    ${index === 0 ? 'disabled' : ''} 
                                    title="Posunout nahoru">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button class="btn btn-primary reorder-car-btn" data-car-id="${car.id}" data-direction="down" 
                                    style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" 
                                    ${index === cars.length - 1 ? 'disabled' : ''} 
                                    title="Posunout dolů">
                                <i class="fas fa-arrow-down"></i>
                            </button>
                        </div>
                        <span>${car.title}</span>
                    </div>
                </td>
                <td>${car.brand}</td>
                <td>${car.year || '-'}</td>
                <td>${this.formatPrice(car.price)}</td>
                <td><span class="badge badge-${car.status === 'active' ? 'success' : 'danger'}">${car.status === 'active' ? 'Aktivní' : 'Neaktivní'}</span></td>
                <td class="actions">
                    <button class="btn btn-primary edit-car-btn" data-car-id="${car.id}">
                        <i class="fas fa-edit"></i> Upravit
                    </button>
                    <button class="btn btn-danger delete-car-btn" data-car-id="${car.id}">
                        <i class="fas fa-trash"></i> Smazat
                    </button>
                </td>
            </tr>
        `).join('');

        // Attach event listeners to buttons
        document.querySelectorAll('.reorder-car-btn').forEach(btn => {
            btn.onclick = () => this.reorderCar(parseInt(btn.dataset.carId), btn.dataset.direction);
        });

        document.querySelectorAll('.edit-car-btn').forEach(btn => {
            btn.onclick = () => this.editCar(parseInt(btn.dataset.carId));
        });

        document.querySelectorAll('.delete-car-btn').forEach(btn => {
            btn.onclick = () => this.deleteCar(parseInt(btn.dataset.carId));
        });
    }

    showCarModal(carId = null) {
        this.currentEditingCarId = carId;
        const modal = document.getElementById('carModal');

        if (carId) {
            document.getElementById('modalTitle').textContent = 'Upravit vozidlo';
        } else {
            document.getElementById('modalTitle').textContent = 'Přidat vozidlo';
            document.getElementById('carForm').reset();
            document.getElementById('mainImagePreview').innerHTML = '';
            document.getElementById('galleryPreview').innerHTML = '';
        }

        modal.classList.add('show');

        // Všechny možné způsoby zavření modalu
        const closeButtons = modal.querySelectorAll('.modal-close, .close, [data-dismiss="modal"]');
        closeButtons.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                this.closeCarModal();
            };
        });

        const cancelButtons = modal.querySelectorAll('.btn-secondary, [type="button"]');
        cancelButtons.forEach(btn => {
            if (btn.textContent.includes('Zrušit') || btn.textContent.includes('Cancel')) {
                btn.onclick = (e) => {
                    e.preventDefault();
                    this.closeCarModal();
                };
            }
        });

        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeCarModal();
            }
        };
    }

    closeCarModal() {
        document.getElementById('carModal').classList.remove('show');
    }

    async editCar(id) {
        try {
            const response = await fetch(`${this.API_URL}/cars/${id}`);
            const car = await response.json();

            this.showCarModal(id);

            // Fill form
            document.getElementById('carTitle').value = car.title;
            document.getElementById('carBrand').value = car.brand;
            document.getElementById('carModel').value = car.model || '';
            document.getElementById('carYear').value = car.year || '';
            document.getElementById('carPrice').value = car.price;
            document.getElementById('carMileage').value = car.mileage || '';
            document.getElementById('carFuel').value = car.fuel || '';
            document.getElementById('carTransmission').value = car.transmission || '';
            document.getElementById('carPower').value = car.power || '';
            document.getElementById('carDescription').value = car.description || '';
            document.getElementById('carFeatured').checked = car.featured === 1;
            document.getElementById('carStatus').value = car.status || 'active';

            // Show existing images
            if (car.main_image) {
                document.getElementById('mainImagePreview').innerHTML = `<img src="${car.main_image}" alt="">`;
            }

            if (car.gallery && car.gallery.length > 0) {
                this.currentCarGallery = [...car.gallery];
                this.renderGalleryPreview();
            } else {
                this.currentCarGallery = [];
                document.getElementById('galleryPreview').innerHTML = '';
            }

        } catch (error) {
            console.error('Edit car error:', error);
            toast.error('Chyba při načítání vozidla');
        }
    }

    async deleteCar(id) {
        modalSystem.confirm('Opravdu chcete smazat toto vozidlo?', async () => {
            try {
                const response = await fetch(`${this.API_URL}/cars/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (response.ok) {
                    toast.success('Vozidlo bylo smazáno');
                    await this.loadCars();
                } else {
                    toast.error('Chyba při mazání vozidla');
                }
            } catch (error) {
                console.error('Delete car error:', error);
                toast.error('Chyba při mazání vozidla');
            }
        });
    }

    // ========== GALLERY MANAGEMENT ==========
    renderGalleryPreview() {
        const container = document.getElementById('galleryPreview');
        if (!container || !this.currentCarGallery) return;

        container.innerHTML = this.currentCarGallery.map((img, i) => `
            <div class="gallery-item-wrapper">
                <img src="${img}" alt="" style="width: 100px; height: 100px; object-fit: cover;">
                <div class="gallery-actions">
                    <button type="button" onclick="window.adminPanel.moveGalleryImage(${i}, -1)" title="Doleva">◄</button>
                    <button type="button" onclick="window.adminPanel.removeGalleryImage(${i})" title="Smazat">×</button>
                    <button type="button" onclick="window.adminPanel.moveGalleryImage(${i}, 1)" title="Doprava">►</button>
                </div>
            </div>
        `).join('');
    }

    async moveGalleryImage(index, direction) {
        if (!this.currentCarGallery) return;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.currentCarGallery.length) return;

        // Swap
        [this.currentCarGallery[index], this.currentCarGallery[newIndex]] =
            [this.currentCarGallery[newIndex], this.currentCarGallery[index]];

        this.renderGalleryPreview();
        await this.saveGalleryOrder();
    }

    async removeGalleryImage(index) {
        if (!confirm('Opravdu odstranit tento obrázek?')) return;
        this.currentCarGallery.splice(index, 1);
        this.renderGalleryPreview();
        await this.saveGalleryOrder();
    }

    async saveGalleryOrder() {
        if (!this.currentEditingCarId) return;

        try {
            const response = await fetch(`${this.API_URL}/cars/${this.currentEditingCarId}/gallery/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gallery: this.currentCarGallery })
            });

            if (response.ok) {
                toast.success('Galerie aktualizována');
            } else {
                toast.error('Chyba při ukládání galerie');
            }
        } catch (e) {
            console.error('Gallery save error:', e);
            toast.error('Chyba při ukládání');
        }
    }

    async reorderCar(id, direction) {
        try {
            const response = await fetch(`${this.API_URL}/cars/${id}/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ direction })
            });

            if (response.ok) {
                toast.success('Pořadí bylo změněno');
                await this.loadCars();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Chyba při změně pořadí');
            }
        } catch (error) {
            console.error('Reorder car error:', error);
            toast.error('Chyba při změně pořadí');
        }
    }

    async saveCar(form) {
        const formData = new FormData(form);

        // Přidat status do FormData pokud editujeme
        if (this.currentEditingCarId) {
            if (!formData.has('status')) {
                formData.append('status', 'active');
            }
        }

        try {
            const url = this.currentEditingCarId
                ? `${this.API_URL}/cars/${this.currentEditingCarId}`
                : `${this.API_URL}/cars`;

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (response.ok) {
                toast.success('Vozidlo bylo úspěšně uloženo');
                this.closeCarModal();
                await this.loadCars();
                await this.loadDashboard();
            } else {
                const error = await response.json();
                console.error('Save car error response:', error);
                toast.error(error.error || 'Chyba při ukládání vozidla');
            }
        } catch (error) {
            console.error('Save car error:', error);
            toast.error('Chyba při ukládání vozidla');
        }
    }

    // ========== RENTAL CARS MANAGEMENT ==========
    async loadRentalCars() {
        try {
            const response = await fetch(`${this.API_URL}/rental-cars`);
            const rentalCars = await response.json();
            this.displayRentalCars(rentalCars);
        } catch (error) {
            console.error('Rental cars load error:', error);
            toast.error('Chyba při načítání vozidel z půjčovny');
        }
    }

    displayRentalCars(rentalCars) {
        const tbody = document.getElementById('rentalCarsTable');
        if (!tbody) return;

        if (rentalCars.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Žádná vozidla v půjčovně</td></tr>';
            return;
        }

        tbody.innerHTML = rentalCars.map((car, index) => `
            <tr data-rental-id="${car.id}">
                <td>${car.id}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                            <button class="btn btn-primary reorder-rental-btn" data-rental-id="${car.id}" data-direction="up" 
                                    style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" 
                                    ${index === 0 ? 'disabled' : ''} 
                                    title="Posunout nahoru">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button class="btn btn-primary reorder-rental-btn" data-rental-id="${car.id}" data-direction="down" 
                                    style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" 
                                    ${index === rentalCars.length - 1 ? 'disabled' : ''} 
                                    title="Posunout dolů">
                                <i class="fas fa-arrow-down"></i>
                            </button>
                        </div>
                        <span>${car.vehicle}</span>
                    </div>
                </td>
                <td>${this.formatPrice(car.price_per_day)}/den</td>
                <td><span class="badge badge-${car.status === 'active' ? 'success' : 'danger'}">${car.status === 'active' ? 'Aktivní' : 'Neaktivní'}</span></td>
                <td class="actions">
                    <button class="btn btn-primary edit-rental-btn" data-rental-id="${car.id}">
                        <i class="fas fa-edit"></i> Upravit
                    </button>
                    <button class="btn btn-danger delete-rental-btn" data-rental-id="${car.id}">
                        <i class="fas fa-trash"></i> Smazat
                    </button>
                </td>
            </tr>
        `).join('');

        // Attach event listeners
        document.querySelectorAll('.reorder-rental-btn').forEach(btn => {
            btn.onclick = () => this.reorderRentalCar(parseInt(btn.dataset.rentalId), btn.dataset.direction);
        });

        document.querySelectorAll('.edit-rental-btn').forEach(btn => {
            btn.onclick = () => this.editRentalCar(parseInt(btn.dataset.rentalId));
        });

        document.querySelectorAll('.delete-rental-btn').forEach(btn => {
            btn.onclick = () => this.deleteRentalCar(parseInt(btn.dataset.rentalId));
        });
    }

    showRentalModal(rentalId = null) {
        this.currentEditingRentalId = rentalId;
        const modal = document.getElementById('rentalModal');

        if (rentalId) {
            document.getElementById('rentalModalTitle').textContent = 'Upravit vozidlo';
        } else {
            document.getElementById('rentalModalTitle').textContent = 'Přidat vozidlo do půjčovny';
            document.getElementById('rentalForm').reset();
            document.getElementById('rentalImagesPreview').innerHTML = '';
        }

        modal.classList.add('show');

        // Všechny možné způsoby zavření modalu
        const closeButtons = modal.querySelectorAll('.close-btn, .modal-close');
        closeButtons.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                this.closeRentalModal();
            };
        });

        const cancelButtons = modal.querySelectorAll('.btn-secondary');
        cancelButtons.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                this.closeRentalModal();
            };
        });

        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeRentalModal();
            }
        };
    }

    closeRentalModal() {
        const modal = document.getElementById('rentalModal');
        modal.classList.remove('show');
    }

    async editRentalCar(id) {
        try {
            const response = await fetch(`${this.API_URL}/rental-cars/${id}`);
            const car = await response.json();

            this.showRentalModal(id);

            // Fill form
            document.getElementById('rentalVehicle').value = car.vehicle;
            document.getElementById('rentalPrice').value = car.price_per_day;
            document.getElementById('rentalDescription').value = car.description || '';
            document.getElementById('rentalStatus').value = car.status || 'active';

            // Show existing images
            if (car.images && car.images.length > 0) {
                document.getElementById('rentalImagesPreview').innerHTML = car.images.map(img =>
                    `<img src="${img}" alt="">`
                ).join('');
            }

        } catch (error) {
            console.error('Edit rental car error:', error);
            toast.error('Chyba při načítání vozidla');
        }
    }

    async deleteRentalCar(id) {
        modalSystem.confirm('Opravdu chcete smazat toto vozidlo z půjčovny?', async () => {
            try {
                const response = await fetch(`${this.API_URL}/rental-cars/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (response.ok) {
                    toast.success('Vozidlo bylo smazáno');
                    await this.loadRentalCars();
                } else {
                    toast.error('Chyba při mazání vozidla');
                }
            } catch (error) {
                console.error('Delete rental car error:', error);
                toast.error('Chyba při mazání vozidla');
            }
        });
    }

    async reorderRentalCar(id, direction) {
        try {
            const response = await fetch(`${this.API_URL}/rental-cars/${id}/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ direction })
            });

            if (response.ok) {
                toast.success('Pořadí bylo změněno');
                await this.loadRentalCars();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Chyba při změně pořadí');
            }
        } catch (error) {
            console.error('Reorder rental car error:', error);
            toast.error('Chyba při změně pořadí');
        }
    }

    async saveRentalCar(form) {
        const formData = new FormData(form);

        try {
            const url = this.currentEditingRentalId
                ? `${this.API_URL}/rental-cars/${this.currentEditingRentalId}`
                : `${this.API_URL}/rental-cars`;

            // Vždy použijeme POST (server to zvládne)
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (response.ok) {
                toast.success('Vozidlo bylo úspěšně uloženo');
                this.closeRentalModal();
                await this.loadRentalCars();
            } else {
                const error = await response.json();
                console.error('Save rental car error response:', error);
                toast.error(error.error || 'Chyba při ukládání vozidla');
            }
        } catch (error) {
            console.error('Save rental car error:', error);
            toast.error('Chyba při ukládání vozidla');
        }
    }

    // ========== INQUIRIES MANAGEMENT ==========
    async loadInquiries() {
        try {
            const response = await fetch(`${this.API_URL}/inquiries`, {
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('Failed to load inquiries:', response.status);
                this.currentInquiries = [];
                this.displayInquiries([]);
                if (response.status === 401) {
                    toast.error('Nejste přihlášen - zkuste se přihlásit znovu');
                } else {
                    toast.error('Chyba při načítání poptávek');
                }
                return;
            }

            const inquiries = await response.json();
            const inquiriesArray = Array.isArray(inquiries) ? inquiries : [];
            this.currentInquiries = inquiriesArray; // Uložíme pro pozdější použití
            this.displayInquiries(inquiriesArray);
        } catch (error) {
            console.error('Inquiries load error:', error);
            toast.error('Chyba při načítání poptávek');
            this.currentInquiries = [];
            this.displayInquiries([]);
        }
    }

    displayInquiries(inquiries) {
        const tbody = document.getElementById('inquiriesTable');
        if (!tbody) return;

        if (inquiries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Žádné poptávky</td></tr>';
            return;
        }

        tbody.innerHTML = inquiries.map(inquiry => {
            // Určíme typ poptávky - pokud není inquiry_type, zkoušíme podle přítomnosti rental_car_id
            const isRental = inquiry.inquiry_type === 'rental' || (inquiry.rental_car_id && !inquiry.car_id);

            const vehicleTitle = isRental
                ? (inquiry.rental_car_title || 'Půjčovná - Obecná poptávka')
                : (inquiry.car_title || 'Prodej - Obecná poptávka');

            const typeLabel = isRental
                ? '<span class="badge badge-info">🚗 Půjčení</span>'
                : '<span class="badge badge-primary">💰 Prodej</span>';

            return `
                <tr data-inquiry-id="${inquiry.id}">
                    <td>${new Date(inquiry.created_at).toLocaleDateString('cs-CZ')}</td>
                    <td>${typeLabel}</td>
                    <td>${inquiry.name}</td>
                    <td>${inquiry.email}</td>
                    <td>${inquiry.phone || '-'}</td>
                    <td>${vehicleTitle}</td>
                    <td>${inquiry.message ? inquiry.message.substring(0, 50) + '...' : '-'}</td>
                    <td><span class="badge badge-${this.getStatusBadgeClass(inquiry.status)}">${this.getStatusText(inquiry.status)}</span></td>
                    <td class="actions">
                        <button class="btn btn-primary view-inquiry-btn" data-inquiry-id="${inquiry.id}" title="Zobrazit detail">
                            <i class="fas fa-eye"></i>
                        </button>
                        <select class="status-select" data-inquiry-id="${inquiry.id}" 
                                style="padding: 0.5rem; border: 1px solid #dee2e6; border-radius: 6px; background: white; cursor: pointer; margin-right: 0.5rem;">
                            <option value="new" ${inquiry.status === 'new' ? 'selected' : ''}>Nová</option>
                            <option value="contacted" ${inquiry.status === 'contacted' ? 'selected' : ''}>Kontaktován</option>
                            <option value="completed" ${inquiry.status === 'completed' ? 'selected' : ''}>Vyřízeno</option>
                        </select>
                        <button class="btn btn-danger delete-inquiry-btn" data-inquiry-id="${inquiry.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach event listeners
        document.querySelectorAll('.view-inquiry-btn').forEach(btn => {
            btn.onclick = () => this.viewInquiryDetails(parseInt(btn.dataset.inquiryId));
        });

        document.querySelectorAll('.status-select').forEach(select => {
            select.onchange = () => this.updateInquiryStatus(
                parseInt(select.dataset.inquiryId),
                select.value
            );
        });

        document.querySelectorAll('.delete-inquiry-btn').forEach(btn => {
            btn.onclick = () => this.deleteInquiry(parseInt(btn.dataset.inquiryId));
        });
    }

    viewInquiryDetails(inquiryId) {
        // Najdeme poptavku v datech
        const inquiry = this.currentInquiries?.find(i => i.id === inquiryId);
        if (!inquiry) {
            toast.error('Poptavka nenalezena');
            return;
        }

        // Určíme typ
        const isRental = inquiry.inquiry_type === 'rental' || (inquiry.rental_car_id && !inquiry.car_id);
        const vehicleTitle = isRental
            ? (inquiry.rental_car_title || 'Půjčovná - Obecná poptávka')
            : (inquiry.car_title || 'Prodej - Obecná poptávka');
        const typeLabel = isRental ? '🚗 Půjčení' : '💰 Prodej';

        // Zobrazíme modal s detaily
        const modalContent = `
            <div style="padding: 1.5rem;">
                <h3 style="margin-bottom: 1.5rem; color: var(--dark);">Detail poptávky #${inquiry.id}</h3>
                
                <div style="display: grid; grid-template-columns: 150px 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div style="font-weight: 600; color: var(--gray);">Datum:</div>
                    <div>${new Date(inquiry.created_at).toLocaleString('cs-CZ')}</div>
                    
                    <div style="font-weight: 600; color: var(--gray);">Typ:</div>
                    <div>${typeLabel}</div>
                    
                    <div style="font-weight: 600; color: var(--gray);">Jméno:</div>
                    <div>${inquiry.name}</div>
                    
                    <div style="font-weight: 600; color: var(--gray);">Email:</div>
                    <div><a href="mailto:${inquiry.email}" style="color: var(--primary-dark);">${inquiry.email}</a></div>
                    
                    <div style="font-weight: 600; color: var(--gray);">Telefon:</div>
                    <div><a href="tel:${inquiry.phone}" style="color: var(--primary-dark);">${inquiry.phone || '-'}</a></div>
                    
                    <div style="font-weight: 600; color: var(--gray);">Vozidlo:</div>
                    <div>${vehicleTitle}</div>
                    
                    <div style="font-weight: 600; color: var(--gray);">Status:</div>
                    <div><span class="badge badge-${this.getStatusBadgeClass(inquiry.status)}">${this.getStatusText(inquiry.status)}</span></div>
                </div>
                
                ${inquiry.message ? `
                    <div style="margin-top: 1.5rem;">
                        <div style="font-weight: 600; color: var(--gray); margin-bottom: 0.5rem;">Zpráva od zákazníka:</div>
                        <div style="background: var(--light-gray); padding: 1rem; border-radius: 8px; white-space: pre-wrap;">${inquiry.message}</div>
                    </div>
                ` : ''}
                
                <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="modalSystem.close()">
                        Zavřít
                    </button>
                </div>
            </div>
        `;

        modalSystem.show('Detail poptávky', modalContent);
    }

    async updateInquiryStatus(id, status) {
        try {
            const response = await fetch(`${this.API_URL}/inquiries/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                toast.success('Status poptávky byl aktualizován');
                await this.loadInquiries();
                await this.loadDashboard();
            } else {
                toast.error('Chyba při aktualizaci statusu');
            }
        } catch (error) {
            console.error('Update inquiry status error:', error);
            toast.error('Chyba při aktualizaci statusu');
        }
    }

    async deleteInquiry(id) {
        modalSystem.confirm('Opravdu chcete smazat tuto poptávku?', async () => {
            try {
                const response = await fetch(`${this.API_URL}/inquiries/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (response.ok) {
                    toast.success('Poptávka byla smazána');
                    await this.loadInquiries();
                    await this.loadDashboard();
                } else {
                    toast.error('Chyba při mazání poptávky');
                }
            } catch (error) {
                console.error('Delete inquiry error:', error);
                toast.error('Chyba při mazání poptávky');
            }
        });
    }

    // ========== SETTINGS ==========
    async loadSettings() {
        try {
            const response = await fetch(`${this.API_URL}/settings`);
            const settings = await response.json();

            // Fill form
            document.getElementById('companyName').value = settings.company_name || '';
            document.getElementById('ownerName').value = settings.owner_name || 'Ing. Tomáš Hlaváček';
            document.getElementById('companyIco').value = settings.ico || '';
            document.getElementById('companyDic').value = settings.dic || '';
            document.getElementById('email').value = settings.email || '';
            document.getElementById('phone').value = settings.phone || '';
            document.getElementById('address').value = settings.address || '';
            document.getElementById('openingHours').value = settings.opening_hours || '';
            document.getElementById('openingHoursShort').value = settings.opening_hours_short || '';
            document.getElementById('facebook').value = settings.facebook || '';
            document.getElementById('instagram').value = settings.instagram || '';
            document.getElementById('whatsapp').value = settings.whatsapp || '';
            document.getElementById('announcement').value = settings.announcement || '';
            document.getElementById('announcementEnabled').checked = settings.announcement_enabled === 1;

        } catch (error) {
            console.error('Settings load error:', error);
            toast.error('Chyba při načítání nastavení');
        }
    }

    async saveSettings(form) {
        const formData = new FormData(form);
        const settings = Object.fromEntries(formData);
        settings.announcement_enabled = document.getElementById('announcementEnabled').checked;

        try {
            const response = await fetch(`${this.API_URL}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                toast.success('Nastavení bylo úspěšně uloženo');
            } else {
                toast.error('Chyba při ukládání nastavení');
            }
        } catch (error) {
            console.error('Save settings error:', error);
            toast.error('Chyba při ukládání nastavení');
        }
    }

    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validace
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Vyplňte všechna pole pro změnu hesla');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Nové heslo musí mít alespoň 8 znaků');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Nová hesla se neshodují');
            return;
        }

        try {
            const response = await fetch(`${this.API_URL}/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Heslo bylo úspěšně změněno');
                // Vyčistit formulář
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } else {
                toast.error(data.error || 'Chyba při změně hesla');
            }
        } catch (error) {
            console.error('Change password error:', error);
            toast.error('Chyba při změně hesla');
        }
    }

    // ========== HELPERS ==========
    previewImage(file, previewId) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById(previewId).innerHTML = `<img src="${e.target.result}" alt="">`;
        };
        reader.readAsDataURL(file);
    }

    previewGallery(files, previewId) {
        const preview = document.getElementById(previewId);
        if (!preview) return;

        preview.innerHTML = '';

        for (let i = 0; i < files.length && i < 10; i++) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML += `<img src="${e.target.result}" alt="">`;
            };
            reader.readAsDataURL(files[i]);
        }
    }

    formatPrice(price) {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    getStatusBadgeClass(status) {
        const classes = {
            'new': 'info',
            'contacted': 'warning',
            'completed': 'success'
        };
        return classes[status] || 'secondary';
    }

    getStatusText(status) {
        const texts = {
            'new': 'Nová',
            'contacted': 'Kontaktován',
            'completed': 'Vyřízeno'
        };
        return texts[status] || status;
    }
}

// ========== GLOBAL FUNKCE PRO ZAVÍRÁNÍ MODÁLŮ ==========
// Tyto funkce jsou volány z HTML atributů onclick
function closeRentalModal() {
    if (window.adminPanel) {
        window.adminPanel.closeRentalModal();
    }
}

function closeCarModal() {
    if (window.adminPanel) {
        window.adminPanel.closeCarModal();
    }
}

// ========== INICIALIZACE ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('Starting admin panel initialization...');

    // Načteme modal system pokud neexistuje
    if (typeof modalSystem === 'undefined' || typeof toast === 'undefined') {
        const script = document.createElement('script');
        script.src = 'js/modal-system.js';
        script.onload = () => {
            window.adminPanel = new AdminPanel();
        };
        document.head.appendChild(script);
    } else {
        window.adminPanel = new AdminPanel();
    }
});

console.log('Admin panel script loaded');

