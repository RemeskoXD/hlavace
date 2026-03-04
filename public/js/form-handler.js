// Form handler pro homepage
document.addEventListener('DOMContentLoaded', function() {
    // Form submission
    const inquiryForm = document.getElementById('inquiryForm');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                car_id: formData.get('carOfInterest') || null,
                message: formData.get('message')
            };
            
            try {
                const response = await fetch((window.APP_CONFIG?.API_URL || '/api') + '/inquiries', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    // Použití toast notifikace pokud je dostupná
                    if (typeof toast !== 'undefined') {
                        toast.success('Vaše poptávka byla úspěšně odeslána! Brzy se vám ozveme.');
                    } else {
                        alert('Vaše poptávka byla úspěšně odeslána! Brzy se vám ozveme.');
                    }
                    
                    // Reset formuláře
                    inquiryForm.reset();
                    
                    // Scroll nahoru
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    throw new Error('Chyba při odesílání');
                }
            } catch (error) {
                console.error('Error submitting inquiry:', error);
                if (typeof toast !== 'undefined') {
                    toast.error('Omlouváme se, došlo k chybě. Zkuste to prosím později.');
                } else {
                    alert('Omlouváme se, došlo k chybě. Zkuste to prosím později.');
                }
            }
        });
    }
    
    // Form input animations
    const formInputs = document.querySelectorAll('.form-input');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transform = 'scale(1.02)';
            this.style.borderColor = '#FFD700';
        });
        
        input.addEventListener('blur', function() {
            this.style.transform = 'scale(1)';
            this.style.borderColor = '#dee2e6';
        });
    });
    
    // Submit button animation
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.4)';
        });
        
        submitBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 5px 20px rgba(255, 215, 0, 0.3)';
        });
    }
    
    // Preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', function() {
            setTimeout(() => {
                preloader.classList.add('hide');
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 500);
            }, 1000);
        });
    }
    
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
});
