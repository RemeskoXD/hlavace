// Main JavaScript for Auto Hlaváček website
console.log('Main.js loaded');

// Global variables
window.carsData = [];
window.filteredCars = [];

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Load cars when page loads
    loadCars();
    
    // Initialize event listeners
    initializeEventListeners();
});

// Initialize all event listeners
function initializeEventListeners() {
    console.log('Initializing event listeners...');
    
    // Filter