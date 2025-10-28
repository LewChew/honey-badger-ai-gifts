// Authentication state
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Signup flow data storage
let signupData = {
    email: '',
    name: '',
    phone: '',
    password: ''
};

// Form state for expandable sections
let formState = {
    giftType: '',
    challengeType: '',
    typeSpecificData: {},
    challengeData: {}
};

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

// Toggle expandable sections
function toggleSection(sectionName) {
    const section = document.getElementById(`${sectionName}Section`);
    const content = document.getElementById(`${sectionName}Content`);
    
    if (section.classList.contains('collapsed')) {
        // Expand
        section.classList.remove('collapsed');
        section.classList.add('expanded');
        content.style.display = 'block';
        
        // Animate content expansion
        setTimeout(() => {
            content.style.maxHeight = content.scrollHeight + 'px';
        }, 10);
    } else {
        // Collapse
        section.classList.add('collapsed');
        section.classList.remove('expanded');
        content.style.maxHeight = '0';
        
        setTimeout(() => {
            content.style.display = 'none';
        }, 300);
    }
}

// Toggle Send Form Collapsible Section
function toggleSendForm() {
    const content = document.getElementById('sendFormContent');
    const icon = document.getElementById('sendFormExpandIcon');

    if (content.style.display === 'none' || content.style.display === '') {
        // Expand
        content.style.display = 'block';
        icon.classList.add('expanded');
        icon.textContent = '▲';
    } else {
        // Collapse
        content.style.display = 'none';
        icon.classList.remove('expanded');
        icon.textContent = '▼';
    }
}

// Handle gift type change
function handleGiftTypeChange() {
    const giftType = document.getElementById('giftType').value;
    formState.giftType = giftType;
    
    // Hide all type-specific details
    const typeDetails = document.querySelectorAll('.type-details');
    typeDetails.forEach(detail => {
        detail.style.display = 'none';
    });
    
    // Show relevant type-specific details
    const typeSpecificSection = document.getElementById('typeSpecificSection');
    const typeSpecificTitle = document.getElementById('typeSpecificTitle');
    const typeSpecificStatus = document.getElementById('typeSpecificStatus');
    const sendBtn = document.getElementById('sendBadgerBtn');
    const submitHint = document.getElementById('submitHint');
    
    if (giftType) {
        // Show the type-specific section
        typeSpecificSection.style.display = 'block';
        
        // Show challenge and additional sections
        document.getElementById('challengeSection').style.display = 'block';
        document.getElementById('additionalSection').style.display = 'block';
        
        // Enable submit button
        sendBtn.disabled = false;
        submitHint.textContent = 'Configure your gift details above';
        
        // Update section title based on gift type
        const titles = {
            'giftcard': '🎁 Gift Card Details',
            'cash': '💵 Cash Transfer Details',
            'photo': '📸 Photo/Video Details',
            'message': '💌 Custom Message',
            'physical': '📦 Physical Item Details'
        };
        
        typeSpecificTitle.textContent = titles[giftType] || '🎁 Gift Details';
        typeSpecificStatus.textContent = 'Click to configure';
        
        // Show the relevant details form
        const detailsMap = {
            'giftcard': 'giftCardDetails',
            'cash': 'cashDetails',
            'photo': 'photoDetails',
            'message': 'messageDetails',
            'physical': 'physicalDetails'
        };
        
        const detailsId = detailsMap[giftType];
        if (detailsId) {
            document.getElementById(detailsId).style.display = 'block';
        }
    } else {
        // Hide sections if no gift type selected
        typeSpecificSection.style.display = 'none';
        document.getElementById('challengeSection').style.display = 'none';
        document.getElementById('additionalSection').style.display = 'none';
        
        // Disable submit button
        sendBtn.disabled = true;
        submitHint.textContent = 'Select a gift type to continue';
    }
}

// Update challenge options
function updateChallengeOptions() {
    const challengeType = document.getElementById('challengeType').value;
    const durationDiv = document.getElementById('challengeDuration');
    
    if (challengeType === 'multiday' || challengeType === 'fitness') {
        durationDiv.style.display = 'block';
    } else {
        durationDiv.style.display = 'none';
    }
    
    // Update status text
    const challengeStatus = document.getElementById('challengeStatus');
    if (challengeType) {
        challengeStatus.textContent = `${challengeType.charAt(0).toUpperCase() + challengeType.slice(1)} challenge selected`;
    }
}

// Update gift options based on gift type selection (legacy function for compatibility)
function updateGiftOptions() {
    handleGiftTypeChange();
}

// Multi-step signup flow functions
function startSignupFlow() {
    // Reset signup data
    signupData = {
        email: '',
        name: '',
        phone: '',
        password: ''
    };
    showModal('signupStep1Modal');
}

function goToSignupStep(step) {
    // Close all signup modals
    closeModal('signupStep1Modal');
    closeModal('signupStep2Modal');
    closeModal('signupStep3Modal');
    closeModal('signupStep4Modal');
    
    // Show the requested step
    showModal(`signupStep${step}Modal`);
    
    // Pre-fill fields if going back
    if (step === 1 && signupData.email) {
        document.getElementById('signupEmail').value = signupData.email;
    } else if (step === 2) {
        if (signupData.name) document.getElementById('signupName').value = signupData.name;
        if (signupData.phone) document.getElementById('signupPhone').value = signupData.phone;
    } else if (step === 3) {
        if (signupData.password) {
            document.getElementById('signupPassword').value = signupData.password;
            document.getElementById('confirmPassword').value = signupData.password;
        }
    } else if (step === 4) {
        updateReviewInfo();
    }
}

function updateReviewInfo() {
    document.getElementById('reviewEmail').textContent = signupData.email;
    document.getElementById('reviewName').textContent = signupData.name;
    document.getElementById('reviewPhone').textContent = signupData.phone || 'Not provided';
}

// Function called by "Send a Badger" buttons
function showCreateAccountFlow() {
    if (currentUser) {
        // User is already logged in, just scroll to dashboard
        document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
    } else {
        // User not logged in, start signup flow
        startSignupFlow();
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
        
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
            console.log('Authentication failed, clearing token');
            localStorage.removeItem('authToken');
            authToken = null;
            currentUser = null;
            updateAuthState();
        }

        return {
            success: response.ok,
            data: result,
            status: response.status
        };
    } catch (error) {
        console.error('API Request failed:', error);
        return {
            success: false,
            data: { message: 'Network error occurred' },
            status: 0
        };
    }
}

// Authentication functions
async function login(email, password) {
    const result = await makeAPIRequest('/api/login', {
        loginEmail: email,
        loginPassword: password
    });

    if (result.success && result.data.success) {
        authToken = result.data.token;
        currentUser = result.data.user;
        localStorage.setItem('authToken', authToken);
        updateAuthState();
        closeModal('loginModal');
        return true;
    } else {
        throw new Error(result.data.message || 'Login failed');
    }
}

async function signup(userData) {
    const result = await makeAPIRequest('/api/signup', {
        signupName: userData.name,
        signupEmail: userData.email,
        signupPassword: userData.password,
        signupPhone: userData.phone || null
    });

    if (result.success && result.data.success) {
        authToken = result.data.token;
        currentUser = result.data.user;
        localStorage.setItem('authToken', authToken);
        updateAuthState();
        
        // Close all signup modals
        closeModal('signupStep1Modal');
        closeModal('signupStep2Modal');
        closeModal('signupStep3Modal');
        closeModal('signupStep4Modal');
        
        return true;
    } else {
        throw new Error(result.data.message || 'Signup failed');
    }
}

async function logout() {
    if (authToken) {
        await makeAPIRequest('/api/auth/logout', {}, true);
    }
    
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    updateAuthState();
}

function updateAuthState() {
    const landingPage = document.getElementById('landingPage');
    const dashboard = document.getElementById('dashboard');
    const headerButtons = document.querySelector('.nav-buttons');

    if (currentUser) {
        // User is logged in - show dashboard
        landingPage.style.display = 'none';
        dashboard.style.display = 'block';

        // Update header to show logout
        headerButtons.innerHTML = `
            <span style="color: #E2FF00; margin-right: 15px;">Welcome, ${currentUser.name}!</span>
            <button class="btn-secondary" onclick="logout()">
                Logout
            </button>
        `;

        // Load user's honey badgers
        loadHoneyBadgers();

        // Open chatbot by default
        setTimeout(() => openChatbot(), 500);
    } else {
        // User is not logged in - show landing page
        landingPage.style.display = 'block';
        dashboard.style.display = 'none';
        
        // Reset header buttons
        headerButtons.innerHTML = `
            <button class="btn-secondary" onclick="showModal('loginModal')">
                Login
            </button>
            <button class="btn-primary" onclick="showCreateAccountFlow()">
                Send a Badger
            </button>
        `;
    }
}

async function loadHoneyBadgers() {
    try {
        const result = await makeAPIRequest('/api/honey-badgers', {}, true);
        
        if (result.success && result.data.success) {
            const honeyBadgers = result.data.honeyBadgers;
            const sentList = document.getElementById('sentBadgersList');
            
            if (honeyBadgers.length === 0) {
                sentList.innerHTML = '<p class="no-badgers">No honey badgers sent yet. Send your first one! 🍯</p>';
            } else {
                sentList.innerHTML = honeyBadgers.map(badger => `
                    <div class="badger-item">
                        <div class="badger-header">
                            <strong>${badger.recipientName}</strong>
                            <span class="badger-status status-${badger.status}">${badger.status}</span>
                        </div>
                        <div class="badger-details">
                            <p><strong>Gift:</strong> ${badger.giftValue}</p>
                            <p><strong>Challenge:</strong> ${badger.challenge}</p>
                            <p><strong>Sent:</strong> ${new Date(badger.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Failed to load honey badgers:', error);
    }
}

async function sendHoneyBadger(formData) {
    // Collect all form data including expanded sections
    const completeData = {
        recipientName: formData.recipientName,
        recipientContact: formData.recipientEmail || formData.recipientPhone,
        giftType: formData.giftType,
        giftValue: '',
        challenge: formData.challengeDescription || 'Complete the challenge',
        message: formData.personalNote || '',
        duration: formData.duration || 'immediate'
    };
    
    // Set gift value based on type
    switch(formData.giftType) {
        case 'giftcard':
            completeData.giftValue = `${formData.giftCardAmount} ${formData.giftCardBrand || 'Gift Card'}`;
            break;
        case 'cash':
            completeData.giftValue = `${formData.cashAmount} via ${formData.cashPlatform}`;
            break;
        case 'photo':
            completeData.giftValue = formData.mediaDescription || 'Photo/Video';
            break;
        case 'message':
            completeData.giftValue = 'Custom Message';
            completeData.message = formData.customMessage;
            break;
        case 'physical':
            completeData.giftValue = `${formData.itemDescription} (${formData.itemValue})`;
            break;
        default:
            completeData.giftValue = 'Mystery Gift';
    }
    
    const result = await makeAPIRequest('/api/send-honey-badger', completeData, true);
    
    if (result.success && result.data.success) {
        alert(`🍯 Honey Badger sent successfully!\nTracking ID: ${result.data.trackingId}`);
        
        // Reset form
        document.getElementById('dashboardSendForm').reset();
        
        // Reset form state
        formState = {
            giftType: '',
            challengeType: '',
            typeSpecificData: {},
            challengeData: {}
        };
        
        // Hide expandable sections
        document.getElementById('typeSpecificSection').style.display = 'none';
        document.getElementById('challengeSection').style.display = 'none';
        document.getElementById('additionalSection').style.display = 'none';
        
        // Reload honey badgers list
        loadHoneyBadgers();
        
        return true;
    } else {
        throw new Error(result.data.message || 'Failed to send Honey Badger');
    }
}

// Word carousel animation
function startWordCarousel() {
    const words = document.querySelectorAll('.carousel-word');
    let currentIndex = 0;
    
    setInterval(() => {
        words[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % words.length;
        words[currentIndex].classList.add('active');
    }, 2000);
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    // Start word carousel animation
    startWordCarousel();
    
    // Check if user is already logged in
    if (authToken) {
        // Verify token is still valid
        fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentUser = data.user;
                updateAuthState();
            } else {
                // Token is invalid
                localStorage.removeItem('authToken');
                authToken = null;
                updateAuthState();
            }
        })
        .catch(() => {
            // Network error or token invalid
            localStorage.removeItem('authToken');
            authToken = null;
            updateAuthState();
        });
    } else {
        updateAuthState();
    }

    // Login form
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        try {
            await login(email, password);
            this.reset();
        } catch (error) {
            alert('Login failed: ' + error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Forgot Password form
    document.getElementById('forgotPasswordForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('resetEmail').value;

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Generating token...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                // Show success message with token (if in development)
                let message = data.message;
                if (data.token) {
                    message += `\n\nYour reset token: ${data.token}\n\nThis token will expire in 15 minutes.`;
                }
                alert(message);

                // Close forgot password modal and open reset password modal
                closeModal('forgotPasswordModal');
                showModal('resetPasswordModal');

                // Pre-fill token if available
                if (data.token) {
                    document.getElementById('resetToken').value = data.token;
                }

                this.reset();
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            alert('Failed to request password reset. Please try again.');
            console.error('Forgot password error:', error);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Reset Password form
    document.getElementById('resetPasswordForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const token = document.getElementById('resetToken').value.trim();
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        // Validate passwords match
        if (newPassword !== confirmNewPassword) {
            alert('Passwords do not match!');
            return;
        }

        // Validate password requirements
        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        const hasUpper = /[A-Z]/.test(newPassword);
        const hasLower = /[a-z]/.test(newPassword);
        const hasNumber = /\d/.test(newPassword);

        if (!hasUpper || !hasLower || !hasNumber) {
            alert('Password must contain at least one uppercase letter, one lowercase letter, and one number');
            return;
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Resetting password...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await response.json();

            if (data.success) {
                alert('Success! ' + data.message);

                // Close reset modal and open login modal
                closeModal('resetPasswordModal');
                this.reset();
                showModal('loginModal');
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            alert('Failed to reset password. Please try again.');
            console.error('Reset password error:', error);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Signup Step 1: Email
    document.getElementById('signupStep1Form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('signupEmail').value.trim();
        
        if (!email) {
            alert('Please enter your email address');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Store email and go to next step
        signupData.email = email;
        goToSignupStep(2);
    });

    // Signup Step 2: Personal Info
    document.getElementById('signupStep2Form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value.trim();
        const phone = document.getElementById('signupPhone').value.trim();
        
        if (!name) {
            alert('Please enter your full name');
            return;
        }
        
        if (name.length < 2) {
            alert('Name must be at least 2 characters long');
            return;
        }
        
        // Store data and go to next step
        signupData.name = name;
        signupData.phone = phone;
        goToSignupStep(3);
    });

    // Signup Step 3: Password
    document.getElementById('signupStep3Form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!password) {
            alert('Please enter a password');
            return;
        }
        
        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }
        
        // Validate password requirements
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        if (!hasUpper || !hasLower || !hasNumber) {
            alert('Password must contain at least one uppercase letter, one lowercase letter, and one number');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        // Store password and go to review step
        signupData.password = password;
        goToSignupStep(4);
    });

    // Signup Step 4: Review & Complete
    document.getElementById('signupStep4Form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const agreeTerms = document.getElementById('agreeTerms').checked;
        
        if (!agreeTerms) {
            alert('Please agree to the Terms of Service and Privacy Policy');
            return;
        }
        
        const submitBtn = document.getElementById('createAccountBtn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating Account...';
        submitBtn.disabled = true;
        
        try {
            await signup(signupData);
            // Reset signup data
            signupData = { email: '', name: '', phone: '', password: '' };
            alert('🍯 Welcome to Honey Badger! Your account has been created successfully.');
        } catch (error) {
            alert('Signup failed: ' + error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Dashboard send honey badger form
    document.getElementById('dashboardSendForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        // Validate required fields
        if (!data.recipientName || !data.recipientEmail || !data.giftType) {
            alert('Please fill in all required fields');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            await sendHoneyBadger(data);
        } catch (error) {
            alert('Failed to send Honey Badger: ' + error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});

// ===========================
// Carousel Functionality
// ===========================

let currentSlide = 0;
let carouselInterval = null;

// Start auto-rotation when dashboard loads
function startCarousel() {
    carouselInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % 2;
        goToSlide(currentSlide);
    }, 5000); // Rotate every 5 seconds
}

// Stop carousel rotation
function stopCarousel() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

// Go to specific slide
function goToSlide(slideIndex) {
    currentSlide = slideIndex;

    // Update slides
    const slides = document.querySelectorAll('.carousel-slide');
    slides.forEach((slide, index) => {
        if (index === slideIndex) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });

    // Update dots
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        if (index === slideIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });

    // Restart auto-rotation timer
    stopCarousel();
    startCarousel();
}

// ===========================
// Chatbot Functionality
// ===========================

// Open chatbot modal
function openChatbot() {
    document.getElementById('chatbotModal').style.display = 'block';
    document.getElementById('chatInput').focus();
}

// Close chatbot modal
function closeChatbot() {
    document.getElementById('chatbotModal').style.display = 'none';
}

// Send message in chatbot
async function sendMessage(event) {
    event.preventDefault();

    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to chat
    addMessage(message, 'user');

    // Clear input
    input.value = '';

    // Add to conversation history
    conversationHistory.push({
        role: 'user',
        content: message
    });

    // Show typing indicator
    const typingIndicator = addMessage('...', 'bot');
    typingIndicator.classList.add('typing-indicator');

    // Get AI response
    const response = await getAIBotResponse(message, conversationHistory);

    // Remove typing indicator
    typingIndicator.remove();

    // Add bot response
    addMessage(response.message, 'bot');

    // Add to conversation history
    conversationHistory.push({
        role: 'assistant',
        content: response.message
    });

    // Log if using fallback
    if (response.fallback) {
        console.log('Using fallback response (AI not available)');
    }
}

// Add message to chat display
function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatbotMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';

    const avatarImg = document.createElement('img');
    if (sender === 'bot') {
        avatarImg.src = '/assets/honeycomb_badger_face.svg';
        avatarImg.alt = 'Bot';
    } else {
        // Use a simple user icon or first letter
        avatarImg.src = '/assets/honeycomb_badger_face.svg'; // Placeholder
        avatarImg.alt = 'You';
    }
    avatarDiv.appendChild(avatarImg);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const textP = document.createElement('p');
    textP.textContent = text;
    contentDiv.appendChild(textP);

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);

    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Conversation history for AI context
let conversationHistory = [];
let inlineConversationHistory = [];

// Get AI bot response from backend
async function getAIBotResponse(userMessage, conversationHistory) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                message: userMessage,
                conversationHistory: conversationHistory
            })
        });

        const data = await response.json();

        if (data.success) {
            return {
                success: true,
                message: data.message,
                model: data.model,
                fallback: data.fallback
            };
        } else {
            // If API returns fallback response
            return {
                success: true,
                message: data.fallbackResponse || "I'm here to help! Ask me about sending gifts or creating challenges.",
                fallback: true
            };
        }
    } catch (error) {
        console.error('AI chat error:', error);
        // Fallback to simple response
        return {
            success: false,
            message: getFallbackResponse(userMessage),
            fallback: true
        };
    }
}

// Fallback responses when AI is unavailable (client-side)
function getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return "Hey there! How can I help you with your Honey Badger experience today?";
    } else if (lowerMessage.includes('help')) {
        return "I can help you with sending gifts, tracking challenges, managing your network, and more. What would you like to know?";
    } else if (lowerMessage.includes('send') || lowerMessage.includes('gift')) {
        return "To send a gift, click on the 'Send a Honey Badger' section on the right. You can choose the gift type, recipient, and challenge!";
    } else if (lowerMessage.includes('challenge')) {
        return "Challenges are fun tasks your recipients complete to unlock their gifts. You can set photo challenges, fitness goals, multi-day tasks, and more!";
    } else if (lowerMessage.includes('thank')) {
        return "You're welcome! Happy to help. Let me know if you need anything else!";
    } else {
        return "That's an interesting question! I'm here to help with your Honey Badger gifts. Feel free to ask me about sending gifts, challenges, or managing your account.";
    }
}

// Send message from inline chat (in carousel)
async function sendInlineMessage(event) {
    event.preventDefault();

    const input = document.getElementById('inlineChatInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to inline chat
    addInlineMessage(message, 'user');

    // Clear input
    input.value = '';

    // Add to conversation history
    inlineConversationHistory.push({
        role: 'user',
        content: message
    });

    // Show typing indicator
    const typingIndicator = addInlineMessage('...', 'bot');
    typingIndicator.classList.add('typing-indicator');

    // Get AI response
    const response = await getAIBotResponse(message, inlineConversationHistory);

    // Remove typing indicator
    typingIndicator.remove();

    // Add bot response
    addInlineMessage(response.message, 'bot');

    // Add to conversation history
    inlineConversationHistory.push({
        role: 'assistant',
        content: response.message
    });

    // Log if using fallback
    if (response.fallback) {
        console.log('Using fallback response (AI not available)');
    }
}

// Add message to inline chat display
function addInlineMessage(text, sender) {
    const messagesContainer = document.getElementById('inlineChatMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const textElement = document.createElement('p');
    textElement.textContent = text;

    contentDiv.appendChild(textElement);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Return the element so it can be manipulated
    return messageDiv;
}

// Initialize carousel when dashboard is shown
document.addEventListener('DOMContentLoaded', () => {
    // Start carousel if dashboard is visible
    const dashboard = document.getElementById('dashboard');
    if (dashboard && dashboard.style.display !== 'none') {
        startCarousel();
        // Open chatbot by default when user is already logged in
        setTimeout(() => openChatbot(), 500);
    }
});
