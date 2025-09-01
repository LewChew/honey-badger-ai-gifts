class HoneyBadgerApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCarousel();
        this.checkAuthStatus();
        this.addNotificationStyles();
    }

    setupEventListeners() {
        // Auth modal controls
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const authModal = document.getElementById('authModal');
        const giftModal = document.getElementById('giftModal');
        const sendGiftBtn = document.getElementById('sendGiftBtn');
        
        // Modal close buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('show');
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });

        // Auth buttons
        loginBtn?.addEventListener('click', () => this.showAuthModal('login'));
        signupBtn?.addEventListener('click', () => this.showAuthModal('signup'));
        logoutBtn?.addEventListener('click', () => this.logout());
        sendGiftBtn?.addEventListener('click', () => this.showGiftModal());

        // Form switch buttons
        document.getElementById('showSignup')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchAuthForm('signup');
        });

        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchAuthForm('login');
        });

        // Form submissions
        document.getElementById('loginFormElement')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signupFormElement')?.addEventListener('submit', (e) => this.handleSignup(e));
        document.getElementById('giftFormElement')?.addEventListener('submit', (e) => this.handleGiftSubmission(e));
    }

    setupCarousel() {
        const words = document.querySelectorAll('.carousel-word');
        let currentIndex = 0;

        if (words.length === 0) return;

        setInterval(() => {
            words[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % words.length;
            words[currentIndex].classList.add('active');
        }, 3000);
    }

    addNotificationStyles() {
        const styles = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 3000;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification-success {
                background-color: #48BB78;
            }
            .notification-error {
                background-color: #F56565;
            }
            .notification-info {
                background-color: #4299E1;
            }
        `;
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    showAuthModal(type = 'login') {
        const authModal = document.getElementById('authModal');
        this.switchAuthForm(type);
        authModal.classList.add('show');
    }

    switchAuthForm(type) {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');

        if (type === 'login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
        }
    }

    showGiftModal() {
        if (!this.currentUser) {
            this.showAuthModal('login');
            return;
        }
        document.getElementById('giftModal').classList.add('show');
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const loginData = Object.fromEntries(formData);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('token', result.token);
                this.currentUser = result.user;
                this.updateUI();
                document.getElementById('authModal').classList.remove('show');
                this.showSuccess('Welcome back!');
            } else {
                this.showError(result.message || 'Login failed');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const signupData = Object.fromEntries(formData);

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signupData)
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('token', result.token);
                this.currentUser = result.user;
                this.updateUI();
                document.getElementById('authModal').classList.remove('show');
                this.showSuccess('Account created successfully!');
            } else {
                this.showError(result.message || 'Signup failed');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
        }
    }

    async handleGiftSubmission(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const giftData = Object.fromEntries(formData);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/send-honey-badger', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(giftData)
            });

            const result = await response.json();

            if (result.success) {
                document.getElementById('giftModal').classList.remove('show');
                e.target.reset();
                this.showSuccess(`Honey Badger sent! Tracking ID: ${result.trackingId}`);
            } else {
                this.showError(result.message || 'Failed to send gift');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
        }
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.currentUser = result.user;
                this.updateUI();
            } else {
                localStorage.removeItem('token');
            }
        } catch (error) {
            localStorage.removeItem('token');
        }
    }

    logout() {
        localStorage.removeItem('token');
        this.currentUser = null;
        this.updateUI();
        this.showSuccess('Logged out successfully!');
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');

        if (this.currentUser) {
            loginBtn.style.display = 'none';
            signupBtn.style.display = 'none';
            userMenu.classList.remove('hidden');
            userName.textContent = this.currentUser.name;
        } else {
            loginBtn.style.display = 'inline-block';
            signupBtn.style.display = 'inline-block';
            userMenu.classList.add('hidden');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HoneyBadgerApp();
});