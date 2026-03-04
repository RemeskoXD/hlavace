// Cars management for frontend
let carsData = [];
let filteredCars = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadCars();
    initializeFilters();
});

// Load cars from API
async function loadCars() {
    const loading = document.getElementById('loading');
    const carsGrid = document.getElementById('carsGrid');
    const noResults = document.getElementById('noResults');
    
    if (loading) loading.classList.add('active');
    
    try {
        const response = await fetch((window.APP_CONFIG?.API_URL || '/api') + '/cars');
        const cars = await response.json();
        
        // Store in global variable
        window.carsData = cars.filter(car => car.status === 'active');
        filteredCars = window.carsData;
        
        displayCars(filteredCars);
        populateFilters();
        updateResultsCount();
        
        // Populate form dropdown
        populateCarDropdown();
        
    } catch (error) {
        console.error('Error loading cars:', error);
        if (carsGrid) carsGrid.innerHTML = '<p>Chyba při načítání vozidel</p>';
    } finally {
        if (loading) loading.classList.remove('active');
    }
}

// Display cars in grid
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
        <div class="car-card" onclick="showCarDetails(${car.id})">
            <div class="car-image">
                <img src="${car.main_image || 'https://via.placeholder.com/400x300/f8f9fa/6c757d?text=Bez+fotografie'}" 
                     alt="${car.title}" 
                     onerror="this.src='https://via.placeholder.com/400x300/f8f9fa/6c757d?text=Bez+fotografie'">
                ${car.featured ? '<div class="car-badge">Doporučujeme</div>' : ''}
            </div>
            <div class="car-details">
                <h3 class="car-title">${car.title}</h3>
                <p class="car-subtitle">${car.brand} ${car.model || ''}</p>
                <div class="car-specs">
                    ${car.year ? `<div class="spec"><i class="fas fa-calendar"></i> ${car.year}</div>` : ''}
                    ${car.mileage ? `<div class="spec"><i class="fas fa-tachometer-alt"></i> ${formatNumber(car.mileage)} km</div>` : ''}
                    ${car.fuel ? `<div class="spec"><i class="fas fa-gas-pump"></i> ${car.fuel}</div>` : ''}
                    ${car.transmission ? `<div class="spec"><i class="fas fa-cogs"></i> ${car.transmission}</div>` : ''}
                </div>
                <div class="car-price">${formatPrice(car.price)}</div>
                <div class="car-actions">
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); showCarDetails(${car.id})">
                        <i class="fas fa-info-circle"></i> Detail
                    </button>
                    <button class="btn btn-primary" onclick="event.stopPropagation(); contactAboutCar(${car.id}, '${car.title.replace(/'/g, "\\'")}')">
                        <i class="fas fa-envelope"></i> Mám zájem
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Show car details in modal
function showCarDetails(carId) {
    const car = window.carsData.find(c => c.id === carId);
    if (!car) return;
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('carModal');
    if (!modal) {
        modal = createCarModal();
        document.body.appendChild(modal);
    }
    
    // Update modal content
    document.getElementById('modalCarTitle').textContent = car.title;
    document.getElementById('modalCarPrice').textContent = formatPrice(car.price);
    document.getElementById('modalCarYear').textContent = car.year || '-';
    document.getElementById('modalCarMileage').textContent = car.mileage ? `${formatNumber(car.mileage)} km` : '-';
    document.getElementById('modalCarFuel').textContent = car.fuel || '-';
    document.getElementById('modalCarTransmission').textContent = car.transmission || '-';
    document.getElementById('modalCarPower').textContent = car.power || '-';
    document.getElementById('modalCarDescription').textContent = car.description || 'Popis není k dispozici';
    
    // Update gallery
    const galleryMain = document.getElementById('galleryMain');
    const galleryNav = document.getElementById('galleryNav');
    
    // Combine main image and gallery images
    const allImages = [];
    if (car.main_image) allImages.push(car.main_image);
    if (car.gallery && car.gallery.length > 0) {
        allImages.push(...car.gallery);
    }
    
    if (allImages.length > 0) {
        galleryMain.src = allImages[0];
        galleryMain.dataset.images = JSON.stringify(allImages);
        galleryMain.dataset.currentIndex = '0';
        
        // Create dots
        galleryNav.innerHTML = allImages.map((_, index) => 
            `<button class="gallery-dot ${index === 0 ? 'active' : ''}" onclick="changeImage(${index})"></button>`
        ).join('');
    } else {
        galleryMain.src = 'https://via.placeholder.com/800x500/f8f9fa/6c757d?text=Bez+fotografie';
        galleryNav.innerHTML = '';
    }
    
    // Update contact button
    const contactBtn = document.getElementById('modalContactBtn');
    if (contactBtn) {
        contactBtn.onclick = function() {
            closeModal();
            contactAboutCar(car.id, car.title);
        };
    }
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Create car modal HTML
function createCarModal() {
    const modal = document.createElement('div');
    modal.id = 'carModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">&times;</button>
            <div class="modal-gallery">
                <img id="galleryMain" class="gallery-main" src="" alt="">
                <button class="gallery-arrow gallery-prev" onclick="prevImage()">‹</button>
                <button class="gallery-arrow gallery-next" onclick="nextImage()">›</button>
                <div id="galleryNav" class="gallery-nav"></div>
            </div>
            <div class="modal-body">
                <div class="modal-header">
                    <div class="modal-title">
                        <h3 id="modalCarTitle"></h3>
                    </div>
                    <div class="modal-price" id="modalCarPrice"></div>
                </div>
                <div class="modal-specs">
                    <div class="spec-item">
                        <div class="spec-label">Rok výroby</div>
                        <div class="spec-value" id="modalCarYear">-</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-label">Najeto</div>
                        <div class="spec-value" id="modalCarMileage">-</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-label">Palivo</div>
                        <div class="spec-value" id="modalCarFuel">-</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-label">Převodovka</div>
                        <div class="spec-value" id="modalCarTransmission">-</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-label">Výkon</div>
                        <div class="spec-value" id="modalCarPower">-</div>
                    </div>
                </div>
                <div class="modal-description" id="modalCarDescription"></div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="closeModal()">Zavřít</button>
                    <button class="btn btn-primary" id="modalContactBtn">Mám zájem</button>
                </div>
            </div>
        </div>
    `;
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    return modal;
}

// Close modal
function closeModal() {
    const modal = document.getElementById('carModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Gallery navigation
function changeImage(index) {
    const galleryMain = document.getElementById('galleryMain');
    const images = JSON.parse(galleryMain.dataset.images || '[]');
    
    if (images[index]) {
        galleryMain.src = images[index];
        galleryMain.dataset.currentIndex = index.toString();
        
        // Update dots
        document.querySelectorAll('.gallery-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
}

function nextImage() {
    const galleryMain = document.getElementById('galleryMain');
    const images = JSON.parse(galleryMain.dataset.images || '[]');
    const currentIndex = parseInt(galleryMain.dataset.currentIndex || '0');
    const nextIndex = (currentIndex + 1) % images.length;
    changeImage(nextIndex);
}

function prevImage() {
    const galleryMain = document.getElementById('galleryMain');
    const images = JSON.parse(galleryMain.dataset.images || '[]');
    const currentIndex = parseInt(galleryMain.dataset.currentIndex || '0');
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    changeImage(prevIndex);
}

// Contact about specific car
function contactAboutCar(carId, carTitle) {
    // Select car in form
    const select = document.getElementById('carOfInterest');
    if (select) {
        // Add option if it doesn't exist
        let option = select.querySelector(`option[value="${carId}"]`);
        if (!option) {
            option = document.createElement('option');
            option.value = carId;
            option.textContent = carTitle;
            select.appendChild(option);
        }
        select.value = carId;
    }
    
    // Scroll to form
    document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
}

// Populate car dropdown in form
function populateCarDropdown() {
    const select = document.getElementById('carOfInterest');
    if (!select) return;
    
    // Keep default option
    const defaultOption = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if (defaultOption) {
        select.appendChild(defaultOption);
    }
    
    // Add cars
    window.carsData.forEach(car => {
        const option = document.createElement('option');
        option.value = car.id;
        option.textContent = car.title;
        select.appendChild(option);
    });
}

// Filters
function initializeFilters() {
    // Add event listeners to filter inputs
    document.getElementById('brand')?.addEventListener('change', applyFilter);
    document.getElementById('year')?.addEventListener('change', applyFilter);
    document.getElementById('fuel')?.addEventListener('change', applyFilter);
    document.getElementById('priceMin')?.addEventListener('input', applyFilter);
    document.getElementById('priceMax')?.addEventListener('input', applyFilter);
}

function populateFilters() {
    const cars = window.carsData;
    
    // Brands
    const brands = [...new Set(cars.map(c => c.brand).filter(Boolean))].sort();
    const brandSelect = document.getElementById('brand');
    if (brandSelect) {
        const currentValue = brandSelect.value;
        brandSelect.innerHTML = '<option value="">Všechny značky</option>';
        brands.forEach(brand => {
            brandSelect.innerHTML += `<option value="${brand}">${brand}</option>`;
        });
        brandSelect.value = currentValue;
    }
    
    // Years
    const years = [...new Set(cars.map(c => c.year).filter(Boolean))].sort((a, b) => b - a);
    const yearSelect = document.getElementById('year');
    if (yearSelect) {
        const currentValue = yearSelect.value;
        yearSelect.innerHTML = '<option value="">Všechny roky</option>';
        years.forEach(year => {
            yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
        });
        yearSelect.value = currentValue;
    }
    
    // Fuel types
    const fuels = [...new Set(cars.map(c => c.fuel).filter(Boolean))].sort();
    const fuelSelect = document.getElementById('fuel');
    if (fuelSelect) {
        const currentValue = fuelSelect.value;
        fuelSelect.innerHTML = '<option value="">Všechny typy</option>';
        fuels.forEach(fuel => {
            fuelSelect.innerHTML += `<option value="${fuel}">${fuel}</option>`;
        });
        fuelSelect.value = currentValue;
    }
}

function applyFilter() {
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

function resetFilter() {
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
    if (count) {
        count.textContent = filteredCars.length;
    }
}

// Utility functions
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

// Make functions globally available
window.showCarDetails = showCarDetails;
window.contactAboutCar = contactAboutCar;
window.closeModal = closeModal;
window.changeImage = changeImage;
window.nextImage = nextImage;
window.prevImage = prevImage;
window.applyFilter = applyFilter;
window.resetFilter = resetFilter;
