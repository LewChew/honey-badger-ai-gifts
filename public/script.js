// Modal functionality
function showModal(modalId) {
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

// API helper function
async function makeAPIRequest(endpoint, data) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    // Send Honey Badger form
    document.getElementById('sendForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const result = await makeAPIRequest('/api/send-honey-badger', data);
            alert(`🍯 ${result.message}\nTracking ID: ${result.trackingId}`);
            closeModal('sendModal');
            this.reset();
        } catch (error) {
            alert('❌ Failed to send Honey Badger. Please try again.');
        }
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const result = await makeAPIRequest('/api/login', data);
            alert(`Welcome back to Honey Badger! 🍯`);
            closeModal('loginModal');
            this.reset();
            
            // Update UI to show logged in state
            updateUIForLoggedInUser(result.user);
        } catch (error) {
            alert('❌ Login failed. Please check your credentials.');
        }
    });

    // Signup form
    document.getElementById('signupForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const result = await makeAPIRequest('/api/signup', data);
            alert(`Welcome to Honey Badger! Your account has been created. 🍯`);
            closeModal('signupModal');
            this.reset();
            
            // Update UI to show logged in state
            updateUIForLoggedInUser(result.user);
        } catch (error) {
            alert('❌ Signup failed. Please try again.');
        }
    });

    // Initialize animations and scroll effects
    initializeAnimations();
});

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    const navButtons = document.querySelector('.nav-buttons');
    navButtons.innerHTML = `
        <span style="color: #ffeb3b; font-weight: bold;">Welcome, ${user.name || user.email}!</span>
        <button class="btn btn-secondary" onclick="logout()">Logout</button>
    `;
}

// Logout function
function logout() {
    const navButtons = document.querySelector('.nav-buttons');
    navButtons.innerHTML = `
        <button class="btn btn-secondary" onclick="showModal('loginModal')">Login</button>
        <button class="btn" onclick="showModal('signupModal')">Sign Up</button>
    `;
    alert('Logged out successfully! 🍯');
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
