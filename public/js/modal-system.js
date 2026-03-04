// ========== PROFESIONÁLNÍ MODAL SYSTÉM ==========
// Moderní, responzivní modal komponenta použitelná na frontendu i v adminu

class ModalSystem {
    constructor() {
        this.activeModal = null;
        this.currentImageIndex = 0;
        this.images = [];
        // Počkáme až bude DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // Přidáme CSS pro modal pokud neexistuje
        if (!document.getElementById('modal-styles')) {
            this.injectStyles();
        }

        // ESC zavře modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        });
        
        // Keyboard navigation for gallery
        document.addEventListener('keydown', (e) => {
            if (this.activeModal && this.images.length > 1) {
                if (e.key === 'ArrowLeft') {
                    this.prevImage();
                } else if (e.key === 'ArrowRight') {
                    this.nextImage();
                }
            }
        });
    }

    injectStyles() {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
                padding: 1rem;
                overflow-y: auto;
            }

            .modal-overlay.active {
                opacity: 1;
                visibility: visible;
            }

            .modal-container {
                background: white;
                border-radius: 16px;
                max-width: 900px;
                width: 100%;
                max-height: 90vh;
                overflow: hidden;
                transform: scale(0.9);
                transition: transform 0.3s ease;
                display: flex;
                flex-direction: column;
            }

            .modal-overlay.active .modal-container {
                transform: scale(1);
            }

            .modal-header {
                padding: 1.5rem;
                border-bottom: 1px solid #e5e5e5;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
            }

            .modal-title {
                font-size: 1.5rem;
                font-weight: 600;
                color: #333;
                margin: 0;
            }

            .modal-close {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: none;
                background: transparent;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                font-size: 1.5rem;
                color: #666;
            }

            .modal-close:hover {
                background: #f0f0f0;
                transform: rotate(90deg);
            }

            .modal-body {
                flex: 1;
                overflow-y: auto;
                padding: 1.5rem;
            }

            /* Nová vylepšená galerie */
            .car-modal-gallery {
                position: relative;
                background: #000;
                border-radius: 12px;
                overflow: hidden;
                margin-bottom: 1.5rem;
                height: 500px;
            }

            .car-modal-image {
                width: 100%;
                height: 100%;
                object-fit: contain;
                background: #000;
                display: block;
            }

            /* Nové robustní navigační šipky */
            .gallery-nav-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
            }

            .gallery-arrow {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 50px;
                height: 50px;
                background: rgba(255, 255, 255, 0.9);
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
                color: #333;
                transition: all 0.3s ease;
                pointer-events: all;
                border-radius: 50%;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                z-index: 10;
            }

            .gallery-arrow:hover {
                background: #FFD700;
                transform: translateY(-50%) scale(1.1);
                box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            }

            .gallery-arrow:active {
                transform: translateY(-50%) scale(0.95);
            }

            .gallery-arrow.prev {
                left: 20px;
            }

            .gallery-arrow.next {
                right: 20px;
            }

            .gallery-arrow:disabled {
                opacity: 0.3;
                cursor: not-allowed;
                pointer-events: none;
            }

            /* Image counter */
            .gallery-counter {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                z-index: 10;
            }

            /* Dots navigation */
            .gallery-dots {
                position: absolute;
                bottom: 60px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 8px;
                z-index: 10;
            }

            .gallery-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                border: none;
                cursor: pointer;
                transition: all 0.3s;
                padding: 0;
            }

            .gallery-dot.active {
                background: #FFD700;
                width: 30px;
                border-radius: 5px;
            }

            .gallery-dot:hover:not(.active) {
                background: rgba(255, 255, 255, 0.8);
            }

            .car-modal-info {
                display: grid;
                gap: 1.5rem;
            }

            .car-modal-price {
                font-size: 2rem;
                font-weight: 700;
                color: #E6C200;
                margin-bottom: 1rem;
            }

            .car-modal-specs {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 12px;
            }

            .spec-item {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }

            .spec-label {
                font-size: 0.875rem;
                color: #666;
            }

            .spec-value {
                font-size: 1.125rem;
                font-weight: 600;
                color: #333;
            }

            .car-modal-description {
                padding: 1rem;
                background: #fff;
                border: 1px solid #e5e5e5;
                border-radius: 12px;
                line-height: 1.6;
                color: #666;
            }

            .modal-footer {
                padding: 1.5rem;
                border-top: 1px solid #e5e5e5;
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
                flex-shrink: 0;
            }

            .modal-btn {
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
                font-size: 1rem;
            }

            .modal-btn-primary {
                background: #FFD700;
                color: #1a1a1a;
            }

            .modal-btn-primary:hover {
                background: #E6C200;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
            }

            .modal-btn-secondary {
                background: transparent;
                color: #666;
                border: 1px solid #e5e5e5;
            }

            .modal-btn-secondary:hover {
                background: #f8f9fa;
            }

            /* Mobile responsivity */
            @media (max-width: 768px) {
                .modal-container {
                    max-width: 100%;
                    max-height: 100vh;
                    height: 100%;
                    border-radius: 0;
                }

                .car-modal-gallery {
                    height: 300px;
                }

                .car-modal-specs {
                    grid-template-columns: repeat(2, 1fr);
                }

                .modal-header {
                    padding: 1rem;
                }

                .modal-body {
                    padding: 1rem;
                }

                .modal-footer {
                    padding: 1rem;
                    flex-direction: column;
                }

                .modal-btn {
                    width: 100%;
                }
                
                .gallery-arrow {
                    width: 40px;
                    height: 40px;
                    font-size: 20px;
                }
                
                .gallery-arrow.prev {
                    left: 10px;
                }
                
                .gallery-arrow.next {
                    right: 10px;
                }
            }

            /* Toast notifications */
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .toast {
                background: white;
                border-radius: 8px;
                padding: 1rem 1.5rem;
                min-width: 300px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                gap: 1rem;
                animation: slideIn 0.3s ease;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .toast.success {
                border-left: 4px solid #10b981;
            }

            .toast.error {
                border-left: 4px solid #ef4444;
            }

            .toast.warning {
                border-left: 4px solid #FFD700;
            }

            .toast.info {
                border-left: 4px solid #3b82f6;
            }

            .toast-icon {
                font-size: 1.25rem;
            }

            .toast.success .toast-icon { color: #10b981; }
            .toast.error .toast-icon { color: #ef4444; }
            .toast.warning .toast-icon { color: #E6C200; }
            .toast.info .toast-icon { color: #3b82f6; }

            .toast-message {
                flex: 1;
                color: #333;
            }

            .toast-close {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                font-size: 1.25rem;
                padding: 0;
            }

            .toast-close:hover {
                color: #333;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Navigation methods
    prevImage() {
        if (this.images.length > 1) {
            this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
            this.updateGalleryImage();
        }
    }
    
    nextImage() {
        if (this.images.length > 1) {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
            this.updateGalleryImage();
        }
    }
    
    goToImage(index) {
        if (index >= 0 && index < this.images.length) {
            this.currentImageIndex = index;
            this.updateGalleryImage();
        }
    }
    
    updateGalleryImage() {
        const img = document.getElementById('modalImage');
        const counter = document.getElementById('imageCounter');
        const dots = document.querySelectorAll('.gallery-dot');
        
        if (img && this.images[this.currentImageIndex]) {
            img.src = this.images[this.currentImageIndex];
        }
        
        if (counter) {
            counter.textContent = `${this.currentImageIndex + 1} / ${this.images.length}`;
        }
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentImageIndex);
        });
    }

    // Zobrazit car detail modal
    showCarDetail(car) {
        this.images = this.getCarImages(car);
        this.currentImageIndex = 0;

        const modalHtml = `
            <div class="modal-overlay" id="carDetailModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2 class="modal-title">${car.title || 'Detail vozidla'}</h2>
                        <button class="modal-close" id="modalCloseBtn">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="car-modal-gallery">
                            <img class="car-modal-image" id="modalImage" 
                                 src="${this.images[0] || 'https://via.placeholder.com/800x400/f8f9fa/6c757d?text=Bez+fotografie'}" 
                                 alt="${car.title}">
                            ${this.images.length > 1 ? `
                                <div class="gallery-nav-container">
                                    <button class="gallery-arrow prev" id="prevImageBtn">‹</button>
                                    <button class="gallery-arrow next" id="nextImageBtn">›</button>
                                </div>
                                <div class="gallery-counter" id="imageCounter">1 / ${this.images.length}</div>
                                <div class="gallery-dots" id="galleryDots">
                                    ${this.images.map((_, i) => `
                                        <button class="gallery-dot ${i === 0 ? 'active' : ''}" 
                                                data-index="${i}"></button>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="car-modal-info">
                            <div class="car-modal-price">${this.formatPrice(car.price)}</div>
                            
                            <div class="car-modal-specs">
                                ${car.brand ? `
                                    <div class="spec-item">
                                        <span class="spec-label">Značka</span>
                                        <span class="spec-value">${car.brand}</span>
                                    </div>
                                ` : ''}
                                ${car.model ? `
                                    <div class="spec-item">
                                        <span class="spec-label">Model</span>
                                        <span class="spec-value">${car.model}</span>
                                    </div>
                                ` : ''}
                                ${car.year ? `
                                    <div class="spec-item">
                                        <span class="spec-label">Rok výroby</span>
                                        <span class="spec-value">${car.year}</span>
                                    </div>
                                ` : ''}
                                ${car.mileage ? `
                                    <div class="spec-item">
                                        <span class="spec-label">Najeto</span>
                                        <span class="spec-value">${this.formatNumber(car.mileage)} km</span>
                                    </div>
                                ` : ''}
                                ${car.fuel ? `
                                    <div class="spec-item">
                                        <span class="spec-label">Palivo</span>
                                        <span class="spec-value">${this.formatFuel(car.fuel)}</span>
                                    </div>
                                ` : ''}
                                ${car.transmission ? `
                                    <div class="spec-item">
                                        <span class="spec-label">Převodovka</span>
                                        <span class="spec-value">${this.formatTransmission(car.transmission)}</span>
                                    </div>
                                ` : ''}
                                ${car.power ? `
                                    <div class="spec-item">
                                        <span class="spec-label">Výkon</span>
                                        <span class="spec-value">${car.power}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            ${car.description ? `
                                <div class="car-modal-description">
                                    <h3 style="margin-bottom: 0.5rem; color: #333;">Popis vozidla</h3>
                                    ${car.description}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn modal-btn-secondary" id="modalCancelBtn">Zavřít</button>
                        <button class="modal-btn modal-btn-primary" id="modalContactBtn" 
                                data-car-id="${car.id}" data-car-title="${car.title}">
                            <i class="fas fa-envelope"></i> Mám zájem
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Přidáme modal do DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('carDetailModal');
        this.activeModal = modal;

        // Aktivujeme modal s animací
        setTimeout(() => modal.classList.add('active'), 10);

        // Event listeners
        this.attachModalEventListeners(modal, car);
    }
    
    attachModalEventListeners(modal, car) {
        // Close button
        const closeBtn = document.getElementById('modalCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Cancel button
        const cancelBtn = document.getElementById('modalCancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }
        
        // Contact button
        const contactBtn = document.getElementById('modalContactBtn');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => {
                const carId = parseInt(contactBtn.dataset.carId);
                const carTitle = contactBtn.dataset.carTitle;
                this.close();
                if (typeof contactAboutCar === 'function') {
                    contactAboutCar(carId, carTitle);
                }
            });
        }
        
        // Gallery navigation
        if (this.images.length > 1) {
            // Previous button
            const prevBtn = document.getElementById('prevImageBtn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => this.prevImage());
            }
            
            // Next button
            const nextBtn = document.getElementById('nextImageBtn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => this.nextImage());
            }
            
            // Dots
            document.querySelectorAll('.gallery-dot').forEach(dot => {
                dot.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    this.goToImage(index);
                });
            });
        }
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });
    }

    // Zavřít modal
    close() {
        if (this.activeModal) {
            this.activeModal.classList.remove('active');
            setTimeout(() => {
                this.activeModal.remove();
                this.activeModal = null;
                this.currentImageIndex = 0;
                this.images = [];
            }, 300);
        }
    }

    // Obecný modal
    show(title, content, buttons = null) {
        const buttonsHtml = buttons || `
            <button class="modal-btn modal-btn-secondary" onclick="modalSystem.close()">
                Zavřít
            </button>
        `;
        
        const modalHtml = `
            <div class="modal-overlay" id="genericModal">
                <div class="modal-container" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                        <button class="modal-close" id="genericCloseBtn">✕</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${buttons ? `<div class="modal-footer">${buttonsHtml}</div>` : ''}
                </div>
            </div>
        `;

        // Přidáme modal do DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('genericModal');
        this.activeModal = modal;

        // Aktivujeme modal s animací
        setTimeout(() => modal.classList.add('active'), 10);

        // Event listeners
        const closeBtn = document.getElementById('genericCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });
    }

    // Potvrzovací dialog
    confirm(message, onConfirm, onCancel = null) {
        const modalHtml = `
            <div class="modal-overlay" id="confirmModal">
                <div class="modal-container" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2 class="modal-title">Potvrzení</h2>
                        <button class="modal-close" id="confirmCloseBtn">✕</button>
                    </div>
                    <div class="modal-body">
                        <p style="font-size: 1.125rem; color: #333; line-height: 1.6;">${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn modal-btn-secondary" id="confirmCancelBtn">Zrušit</button>
                        <button class="modal-btn modal-btn-primary" id="confirmOkBtn" style="background: #ef4444;">
                            Potvrdit
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Přidáme modal do DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('confirmModal');
        this.activeModal = modal;

        // Aktivujeme modal s animací
        setTimeout(() => modal.classList.add('active'), 10);

        // Event listeners
        const closeHandler = () => {
            this.close();
            if (onCancel) onCancel();
        };

        const confirmHandler = () => {
            this.close();
            if (onConfirm) onConfirm();
        };

        document.getElementById('confirmCloseBtn')?.addEventListener('click', closeHandler);
        document.getElementById('confirmCancelBtn')?.addEventListener('click', closeHandler);
        document.getElementById('confirmOkBtn')?.addEventListener('click', confirmHandler);

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeHandler();
            }
        });
    }

    // Pomocné funkce
    getCarImages(car) {
        const images = [];
        if (car.main_image) images.push(car.main_image);
        if (car.gallery && Array.isArray(car.gallery)) {
            images.push(...car.gallery);
        }
        return images.length > 0 ? images : ['https://via.placeholder.com/800x400/f8f9fa/6c757d?text=Bez+fotografie'];
    }

    formatPrice(price) {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price || 0);
    }

    formatNumber(num) {
        return new Intl.NumberFormat('cs-CZ').format(num || 0);
    }
    
    formatFuel(fuel) {
        const fuelTypes = {
            'benzin': 'Benzín',
            'diesel': 'Diesel',
            'nafta': 'Nafta', 
            'elektro': 'Elektro',
            'hybrid': 'Hybrid',
            'lpg': 'LPG',
            'cng': 'CNG'
        };
        return fuelTypes[fuel?.toLowerCase()] || fuel;
    }
    
    formatTransmission(transmission) {
        const transmissionTypes = {
            'manual': 'Manuální',
            'automatic': 'Automatická',
            'automat': 'Automatická'
        };
        return transmissionTypes[transmission?.toLowerCase()] || transmission;
    }
}

// Toast notification system
class ToastSystem {
    constructor() {
        this.container = null;
        // Počkáme až bude DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            if (document.body) {
                document.body.appendChild(this.container);
            }
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    show(message, type = 'info', duration = 3000) {
        // Ujistíme se že container existuje
        if (!this.container && document.body) {
            this.init();
        }
        
        if (!this.container) {
            console.warn('Toast container not available');
            return;
        }

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">✕</button>
        `;

        this.container.appendChild(toast);
        
        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => toast.remove());
        }

        // Auto remove after duration
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    success(message) {
        this.show(message, 'success');
    }

    error(message) {
        this.show(message, 'error');
    }

    warning(message) {
        this.show(message, 'warning');
    }

    info(message) {
        this.show(message, 'info');
    }
}

// Inicializace systémů
let modalSystem;
let toast;

// Počkáme než bude DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        modalSystem = new ModalSystem();
        toast = new ToastSystem();
        window.modalSystem = modalSystem;
        window.toast = toast;
    });
} else {
    modalSystem = new ModalSystem();
    toast = new ToastSystem();
    window.modalSystem = modalSystem;
    window.toast = toast;
}

// Globální funkce pro zpětnou kompatibilitu
window.showCarDetails = function(carId) {
    const car = window.carsData?.find(c => c.id === carId);
    if (car && window.modalSystem) {
        window.modalSystem.showCarDetail(car);
    } else {
        console.error('Car not found or modal system not ready');
    }
};

console.log('Modal system initialized');
