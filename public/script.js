// Authentication state
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Modal functionality
function showModal(modalId) {
    // Check if user is logged in and trying to send honey badger
    if (modalId === 'sendModal' && !currentUser) {
        alert('Please login first to send a Honey Badger! 🍯');
        showModal('loginModal');
        return;
    }
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Update gift options based on gift type selection
function updateGiftOptions() {
    const giftType = document.getElementById('giftType').value;
    const giftCardOptions = document.getElementById('giftCardOptions');
    
    if (giftType === 'giftcard') {
        giftCardOptions.style.display = 'block';
    } else {
        giftCardOptions.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let i = 0; i < modals.length; i++) {
        if (event.target === modals[i]) {
            modals[i].style.display = 'none';
        }
    }
}

// API helper function with authentication
async function makeAPIRequest(endpoint, data, requiresAuth = false) {
    try {
        const headers = {
            'Content-Type': 'application/json',
        };

        // Add authorization header if token exists
        if (requiresAuth && authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        // Handle token expiration
        if (response.status === 401 || response.status === 403) {
            handleTokenExpiration();
            throw new Error(result.message || 'Authentication failed');
        }
        
        if (!response.ok) {
            throw new Error(result.message || 'Request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Check authentication status on page load
async function checkAuthStatus() {
    if (!authToken) return;

    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            currentUser = result.user;
            updateUIForLoggedInUser(currentUser);
        } else {
            handleTokenExpiration();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        handleTokenExpiration();
    }
}

// Handle token expiration
function handleTokenExpiration() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateUIForLoggedOutUser();
}

// Show loading state
function showLoading(button, text = 'Loading...') {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = text;
}

// Hide loading state
function hideLoading(button) {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
}

// Show error message in form
function showFormError(formId, message) {
    let errorDiv = document.querySelector(`#${formId} .error-message`);
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = 'color: #ff4444; margin-bottom: 15px; padding: 10px; background: rgba(255,68,68,0.1); border-radius: 5px; border: 1px solid #ff4444;';
        document.getElementById(formId).insertBefore(errorDiv, document.querySelector(`#${formId} button`));
    }
    errorDiv.textContent = message;
    setTimeout(() => errorDiv.remove(), 5000);
}

// Show success message in form
function showFormSuccess(formId, message) {
    let successDiv = document.querySelector(`#${formId} .success-message`);
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = 'color: #44ff44; margin-bottom: 15px; padding: 10px; background: rgba(68,255,68,0.1); border-radius: 5px; border: 1px solid #44ff44;';
        document.getElementById(formId).insertBefore(successDiv, document.querySelector(`#${formId} button`));
    }
    successDiv.textContent = message;
    setTimeout(() => successDiv.remove(), 3000);
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    // Check auth status on load
    checkAuthStatus();

    // Send Honey Badger form
    document.getElementById('sendForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Please login first to send a Honey Badger! 🍯');
            closeModal('sendModal');
            showModal('loginModal');
            return;
        }

        const submitButton = this.querySelector('button[type="submit"]');
        showLoading(submitButton, 'Sending Honey Badger...');
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const result = await makeAPIRequest('/api/send-honey-badger', data, true);
            showFormSuccess('sendForm', `🍯 ${result.message}`);
            setTimeout(() => {
                closeModal('sendModal');
                this.reset();
            }, 2000);
        } catch (error) {
            showFormError('sendForm', error.message || 'Failed to send Honey Badger. Please try again.');
        } finally {
            hideLoading(submitButton);
        }
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        showLoading(submitButton, 'Logging in...');
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const result = await makeAPIRequest('/api/login', data);
            
            // Store authentication data
            authToken = result.token;
            currentUser = result.user;
            localStorage.setItem('authToken', authToken);
            
            showFormSuccess('loginForm', `Welcome back, ${result.user.name}! 🍯`);
            
            setTimeout(() => {
                closeModal('loginModal');
                this.reset();
                updateUIForLoggedInUser(result.user);
            }, 1500);
            
        } catch (error) {
            showFormError('loginForm', error.message || 'Login failed. Please check your credentials.');
        } finally {
            hideLoading(submitButton);
        }
    });

    // Signup form
    document.getElementById('signupForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        showLoading(submitButton, 'Creating account...');
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        // Simple password confirmation check
        const password = data.signupPassword;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        if (confirmPassword && password !== confirmPassword) {
            showFormError('signupForm', 'Passwords do not match!');
            hideLoading(submitButton);
            return;
        }
        
        try {
            const result = await makeAPIRequest('/api/signup', data);
            
            // Store authentication data
            authToken = result.token;
            currentUser = result.user;
            localStorage.setItem('authToken', authToken);
            
            showFormSuccess('signupForm', `Welcome to Honey Badger, ${result.user.name}! 🍯`);
            
            setTimeout(() => {
                closeModal('signupModal');
                this.reset();
                updateUIForLoggedInUser(result.user);
            }, 1500);
            
        } catch (error) {
            if (error.message.includes('Validation failed')) {
                showFormError('signupForm', 'Please check your input: Password must contain uppercase, lowercase, and numbers.');
            } else {
                showFormError('signupForm', error.message || 'Signup failed. Please try again.');
            }
        } finally {
            hideLoading(submitButton);
        }
    });

    // Initialize animations and scroll effects
    initializeAnimations();
});

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    const navButtons = document.querySelector('.nav-buttons');
    navButtons.innerHTML = `
        <span style="color: #ffeb3b; font-weight: bold; margin-right: 15px;">👋 ${user.name || user.email}</span>
        <button class="btn btn-secondary" onclick="logout()">Logout</button>
    `;
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    const navButtons = document.querySelector('.nav-buttons');
    navButtons.innerHTML = `
        <button class="btn btn-secondary" onclick="showModal('loginModal')">Login</button>
        <button class="btn" onclick="showModal('signupModal')">Sign Up</button>
    `;
}

// Logout function
async function logout() {
    try {
        if (authToken) {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    // Clear local state
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateUIForLoggedOutUser();
    
    alert('Logged out successfully! Come back soon! 🍯');
}

// Animation initialization
function initializeAnimations() {
    const cards = document.querySelectorAll('.feature-card, .example-card, .gift-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out';
                entry.target.style.opacity = '1';
            }
        });
    }, {
        threshold: 0.1
    });

    cards.forEach(card => {
        card.style.opacity = '0';
        observer.observe(card);
    });
}

// Add some fun interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add particle effect to hero section
    createParticleEffect();
    
    // Add typing effect to hero text
    setTimeout(() => {
        addTypingEffect();
    }, 1000);
});

function createParticleEffect() {
    const hero = document.querySelector('.hero');
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: #ffeb3b;
            border-radius: 50%;
            pointer-events: none;
            opacity: 0.6;
            animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
        `;
        
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        hero.appendChild(particle);
    }
    
    // Add CSS for particle animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
            50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

function addTypingEffect() {
    const subtitle = document.querySelector('.hero p');
    const originalText = subtitle.textContent;
    subtitle.textContent = '';
    
    let i = 0;
    const typeWriter = () => {
        if (i < originalText.length) {
            subtitle.textContent += originalText.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        }
    };
    
    typeWriter();
}

// Add smooth scrolling for any internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add Easter egg - Konami code
let konamiCode = [];
const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

document.addEventListener('keydown', function(e) {
    konamiCode.push(e.code);
    
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        // Easter egg activated!
        document.body.style.filter = 'hue-rotate(180deg)';
        alert('🍯 SUPER HONEY BADGER MODE ACTIVATED! 🦡');
        setTimeout(() => {
            document.body.style.filter = 'none';
        }, 5000);
        konamiCode = [];
    }
});
