// Main JavaScript for homepage functionality
document.addEventListener('DOMContentLoaded', function() {
    // Site settings variable
    let siteSettings = {};
    
    // Load site settings from database
    async function loadSiteSettings() {
        try {
            const response = await fetch((window.APP_CONFIG?.API_URL || '/api') + '/settings');
            if (response.ok) {
                siteSettings = await response.json();
                updateContactInfo(siteSettings);
                
                // Show announcement popup if enabled
                if (siteSettings.announcement_enabled && siteSettings.announcement) {
                    document.getElementById('announcementText').textContent = siteSettings.announcement;
                    document.getElementById('announcementPopup').style.display = 'flex';
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    // Update all contact information on the page
    function updateContactInfo(settings) {
        // Update emails
        document.querySelectorAll('[data-email]').forEach(el => {
            el.textContent = settings.email || 'auto-hlavacek@seznam.cz';
        });
        document.querySelectorAll('[data-email-link]').forEach(el => {
            el.href = `mailto:${settings.email || 'auto-hlavacek@seznam.cz'}`;
        });
        
        // Update phones
        const phoneDisplay = settings.phone || '+420 602 763 556';
        const phoneNumber = (settings.phone || '+420602763556').replace(/\s/g, '');
        
        document.querySelectorAll('[data-phone-display]').forEach(el => {
            el.textContent = phoneDisplay;
        });
        document.querySelectorAll('[data-phone-link]').forEach(el => {
            el.href = `tel:${phoneNumber}`;
        });
        
        // Update address
        document.querySelectorAll('[data-address]').forEach(el => {
            el.textContent = settings.address || 'Polská 402, 793 76 Zlaté Hory';
        });
        
        // Update opening hours
        document.querySelectorAll('[data-opening-hours]').forEach(el => {
            const hours = settings.opening_hours || 'ÚT-PÁ: 9:00 - 12:00, 13:00 - 16:00';
            el.innerHTML = hours.replace(/\n/g, '<br>');
        });
    }
    
    // Announcement popup functionality
    function closeAnnouncementPopup() {
        const popup = document.getElementById('announcementPopup');
        if (popup) {
            popup.style.display = 'none';
        }
    }
    
    // Event listeners for popup close buttons
    const closeX = document.getElementById('closePopupX');
    if (closeX) {
        closeX.addEventListener('click', function(e) {
            e.preventDefault();
            closeAnnouncementPopup();
        });
    }
    
    const closeBtn = document.getElementById('closePopupBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeAnnouncementPopup();
        });
    }
    
    // Close popup when clicking on background
    const popup = document.getElementById('announcementPopup');
    if (popup) {
        popup.addEventListener('click', function(e) {
            if (e.target === popup) {
                closeAnnouncementPopup();
            }
        });
    }
    
    // Popup button hover effects
    const popupCloseBtn = document.querySelector('.popup-close-btn');
    if (popupCloseBtn) {
        popupCloseBtn.addEventListener('mouseenter', function() {
            this.style.background = '#f0f0f0';
            this.style.transform = 'rotate(90deg)';
        });
        popupCloseBtn.addEventListener('mouseleave', function() {
            this.style.background = 'none';
            this.style.transform = 'rotate(0)';
        });
    }
    
    const popupUnderstandBtn = document.querySelector('.popup-understand-btn');
    if (popupUnderstandBtn) {
        popupUnderstandBtn.addEventListener('mouseenter', function() {
            this.style.background = '#E6C200';
            this.style.transform = 'translateY(-2px)';
        });
        popupUnderstandBtn.addEventListener('mouseleave', function() {
            this.style.background = '#FFD700';
            this.style.transform = 'translateY(0)';
        });
    }
    
    // Cars data
    window.carsData = [];
    let filteredCars = [];
    
    // Load cars
    async function loadCars() {
        try {
            const response = await fetch((window.APP_CONFIG?.API_URL || '/api') + '/cars');
            const cars = await response.json();
            window.carsData = cars.filter(car => car.status === 'active');
            filteredCars = window.carsData;
            displayCars(filteredCars);
            populateFilters();
            updateResultsCount();
            populateCarDropdown();
        } catch (error) {
            console.error('Error loading cars:', error);
        }
    }
    
    // Display cars
    function displayCars(cars) {
        const carsGrid = document.getElementById('carsGrid');
        const noResults = document.getElementById('noResults');
        
        if (!carsGrid) return;
        
        if (cars.length === 0) {
            carsGrid.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        }
        
        if (noResults) noResults.style.display = 'none';
        
        carsGrid.innerHTML = cars.map(car => `
            <div class="car-card" data-car-id="${car.id}">
                <div class="car-image">
                    <img src="${car.main_image || 'https://via.placeholder.com/400x300'}" alt="${car.title}">
                    ${car.featured ? '<div class="car-badge">Doporučujeme</div>' : ''}
                </div>
                <div class="car-details">
                    <h3 class="car-title">${car.title}</h3>
                    <p class="car-subtitle">${car.brand} ${car.model || ''}</p>
                    <div class="car-specs">
                        ${car.year ? `<div class="spec">Rok: ${car.year}</div>` : ''}
                        ${car.mileage ? `<div class="spec">Najeto: ${formatNumber(car.mileage)} km</div>` : ''}
                    </div>
                    <div class="car-price">${formatPrice(car.price)}</div>
                    <div class="car-actions">
                        <button class="btn btn-secondary" data-car-id="${car.id}" data-action="detail">Detail</button>
                        <button class="btn btn-primary" data-car-id="${car.id}" data-car-title="${car.title.replace(/"/g, '&quot;')}" data-action="contact">Mám zájem</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to car cards
        document.querySelectorAll('.car-card').forEach(card => {
            card.addEventListener('click', function(e) {
                if (!e.target.closest('button')) {
                    const carId = parseInt(this.dataset.carId);
                    showCarDetails(carId);
                }
            });
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('[data-action="detail"]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const carId = parseInt(this.dataset.carId);
                showCarDetails(carId);
            });
        });
        
        document.querySelectorAll('[data-action="contact"]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const carId = parseInt(this.dataset.carId);
                const carTitle = this.dataset.carTitle;
                contactAboutCar(carId, carTitle);
            });
        });
    }
    
    // Modal functions
    window.showCarDetails = function(carId) {
        const car = window.carsData.find(c => c.id === carId);
        if (!car) return;
        
        // Use modal system
        if (typeof modalSystem !== 'undefined') {
            modalSystem.showCarDetail(car);
        } else {
            console.error('Modal system not loaded');
        }
    }
    
    window.contactAboutCar = function(carId, carTitle) {
        const select = document.getElementById('carOfInterest');
        if (select) {
            let option = select.querySelector(`option[value="${carId}"]`);
            if (!option) {
                option = document.createElement('option');
                option.value = carId;
                option.textContent = carTitle;
                select.appendChild(option);
            }
            select.value = carId;
        }
        document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
    }
    
    function populateCarDropdown() {
        const select = document.getElementById('carOfInterest');
        if (!select) return;
        
        const defaultOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (defaultOption) select.appendChild(defaultOption);
        
        window.carsData.forEach(car => {
            const option = document.createElement('option');
            option.value = car.id;
            option.textContent = car.title;
            select.appendChild(option);
        });
    }
    
    function populateFilters() {
        const cars = window.carsData;
        
        // Brands
        const brands = [...new Set(cars.map(c => c.brand).filter(Boolean))].sort();
        const brandSelect = document.getElementById('brand');
        if (brandSelect) {
            brandSelect.innerHTML = '<option value="">Všechny značky</option>';
            brands.forEach(brand => {
                brandSelect.innerHTML += `<option value="${brand}">${brand}</option>`;
            });
        }
        
        // Years
        const years = [...new Set(cars.map(c => c.year).filter(Boolean))].sort((a, b) => b - a);
        const yearSelect = document.getElementById('year');
        if (yearSelect) {
            yearSelect.innerHTML = '<option value="">Všechny roky</option>';
            years.forEach(year => {
                yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
            });
        }
        
        // Fuel types
        const fuels = [...new Set(cars.map(c => c.fuel).filter(Boolean))].sort();
        const fuelSelect = document.getElementById('fuel');
        if (fuelSelect) {
            fuelSelect.innerHTML = '<option value="">Všechny typy</option>';
            fuels.forEach(fuel => {
                fuelSelect.innerHTML += `<option value="${fuel}">${fuel}</option>`;
            });
        }
    }
    
    window.applyFilter = function() {
        const brand = document.getElementById('brand')?.value;
        const year = document.getElementById('year')?.value;
        const fuel = document.getElementById('fuel')?.value;
        const priceMin = document.getElementById('priceMin')?.value;
        const priceMax = document.getElementById('priceMax')?.value;
        
        filteredCars = window.carsData.filter(car => {
            if (brand && car.brand !== brand) return false;
            if (year && car.year != year) return false;
            if (fuel && car.fuel !== fuel) return false;
            if (priceMin && car.price < parseInt(priceMin)) return false;
            if (priceMax && car.price > parseInt(priceMax)) return false;
            return true;
        });
        
        displayCars(filteredCars);
        updateResultsCount();
    }
    
    window.resetFilter = function() {
        document.getElementById('brand').value = '';
        document.getElementById('year').value = '';
        document.getElementById('fuel').value = '';
        document.getElementById('priceMin').value = '';
        document.getElementById('priceMax').value = '';
        
        filteredCars = window.carsData;
        displayCars(filteredCars);
        updateResultsCount();
    }
    
    function updateResultsCount() {
        const count = document.getElementById('resultsCount');
        if (count) count.textContent = filteredCars.length;
    }
    
    function formatPrice(price) {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }
    
    function formatNumber(num) {
        return new Intl.NumberFormat('cs-CZ').format(num);
    }
    
    // Initialize everything
    loadSiteSettings();
    loadCars();
    
    // Navigation scroll to sections
    document.getElementById('nav-form-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
    });
});
