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

        // Load user's contacts
        loadContacts();
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
// Carousel Functionality - NO LONGER NEEDED
// ===========================
// Carousel removed - now just showing chatbot inline
// TV image moved to "Badgers In the Wild" section

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

// ============================================
// Contact Management
// ============================================

// Show add contact modal
function showAddContactModal() {
    if (!authToken) {
        alert('Please login first!');
        showModal('loginModal');
        return;
    }
    showModal('addContactModal');
}

// Handle add contact form submission
document.getElementById('addContactForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone').value;
    const relationship = document.getElementById('contactRelationship').value;
    const birthday = document.getElementById('contactBirthday').value;

    try {
        const response = await fetch('/api/contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name,
                email: email || null,
                phone: phone || null,
                relationship: relationship || null,
                birthday: birthday || null
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Contact added successfully!');
            closeModal('addContactModal');

            // Reset form
            document.getElementById('addContactForm').reset();

            // Reload contacts
            loadContacts();
        } else {
            alert('Error adding contact: ' + data.message);
        }
    } catch (error) {
        console.error('Error adding contact:', error);
        alert('Error adding contact. Please try again.');
    }
});

// Load and display contacts
async function loadContacts() {
    if (!authToken) return;

    try {
        const response = await fetch('/api/contacts', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            displayContacts(data.contacts);
        } else {
            console.error('Error loading contacts:', data.message);
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

// Display contacts in the network list
function displayContacts(contacts) {
    const networkList = document.getElementById('networkList');

    if (!contacts || contacts.length === 0) {
        networkList.innerHTML = '<p style="color: #aaa; text-align: center; padding: 20px;">No contacts yet. Add your first contact!</p>';
        return;
    }

    // Store contacts globally for modal use
    window.userContacts = contacts;

    networkList.innerHTML = contacts.map(contact => {
        const birthdayDisplay = contact.birthday ? formatBirthdayDisplay(contact.birthday) : '';
        const contactJson = JSON.stringify(contact).replace(/"/g, '&quot;');

        return `
        <div class="contact-card" data-contact-id="${contact.id}">
            <div class="contact-info">
                <div class="contact-name">${escapeHtml(contact.name)}</div>
                ${contact.email ? `<div class="contact-detail">📧 ${escapeHtml(contact.email)}</div>` : ''}
                ${contact.phone ? `<div class="contact-detail">📱 ${escapeHtml(contact.phone)}</div>` : ''}
                ${contact.birthday ? `<div class="contact-detail">🎂 ${birthdayDisplay}</div>` : ''}
                ${contact.relationship ? `<div class="contact-relationship">${escapeHtml(contact.relationship)}</div>` : ''}
            </div>
            <div class="contact-actions">
                <button class="btn-contact-send-badger" onclick='sendBadgerToContact(${contactJson})' title="Send Badger">🎁 Send</button>
                <button class="btn-contact-special-dates" onclick="openSpecialDatesModal(${contact.id}, '${escapeHtml(contact.name)}')" title="Special dates">📅</button>
                <button class="btn-contact-delete" onclick="deleteContact(${contact.id})" title="Delete contact">🗑️</button>
            </div>
        </div>
    `;
    }).join('');
}

// Format birthday for display
function formatBirthdayDisplay(birthday) {
    const date = new Date(birthday + 'T00:00:00');
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Delete a contact
async function deleteContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact?')) {
        return;
    }

    try {
        const response = await fetch(`/api/contacts/${contactId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            // Reload contacts
            loadContacts();
        } else {
            alert('Error deleting contact: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Error deleting contact. Please try again.');
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// Special Dates Management
// ============================================

let currentContactIdForSpecialDates = null;

// Open special dates modal
function openSpecialDatesModal(contactId, contactName) {
    currentContactIdForSpecialDates = contactId;
    document.getElementById('specialDatesContactName').textContent = `For ${contactName}`;

    // Reset form
    document.getElementById('addSpecialDateForm').reset();

    // Load special dates
    loadSpecialDates(contactId);

    showModal('specialDatesModal');
}

// Handle add special date form submission
document.getElementById('addSpecialDateForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dateName = document.getElementById('specialDateName').value;
    const dateValue = document.getElementById('specialDateValue').value;
    const notes = document.getElementById('specialDateNotes').value;

    try {
        const response = await fetch(`/api/contacts/${currentContactIdForSpecialDates}/special-dates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                dateName,
                dateValue,
                notes: notes || null
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Special date added successfully!');

            // Reset form
            document.getElementById('addSpecialDateForm').reset();

            // Reload special dates
            loadSpecialDates(currentContactIdForSpecialDates);
        } else {
            alert('Error adding special date: ' + data.message);
        }
    } catch (error) {
        console.error('Error adding special date:', error);
        alert('Error adding special date. Please try again.');
    }
});

// Load and display special dates for a contact
async function loadSpecialDates(contactId) {
    if (!authToken) return;

    try {
        const response = await fetch(`/api/contacts/${contactId}/special-dates`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            displaySpecialDates(data.specialDates);
        } else {
            console.error('Error loading special dates:', data.message);
        }
    } catch (error) {
        console.error('Error loading special dates:', error);
    }
}

// Display special dates
function displaySpecialDates(specialDates) {
    const specialDatesList = document.getElementById('specialDatesList');

    if (!specialDates || specialDates.length === 0) {
        specialDatesList.innerHTML = '<p style="color: #aaa; text-align: center; padding: 10px;">No special dates yet. Add one above!</p>';
        return;
    }

    specialDatesList.innerHTML = specialDates.map(date => {
        const dateDisplay = formatDateDisplay(date.date_value);

        return `
        <div class="special-date-item">
            <div class="special-date-info">
                <div class="special-date-name">${escapeHtml(date.date_name)}</div>
                <div class="special-date-value">📅 ${dateDisplay}</div>
                ${date.notes ? `<div class="special-date-notes">${escapeHtml(date.notes)}</div>` : ''}
            </div>
            <button class="btn-special-date-delete" onclick="deleteSpecialDate(${date.id})" title="Delete">🗑️</button>
        </div>
        `;
    }).join('');
}

// Format date for display
function formatDateDisplay(dateValue) {
    const date = new Date(dateValue + 'T00:00:00');
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Delete a special date
async function deleteSpecialDate(specialDateId) {
    if (!confirm('Are you sure you want to delete this special date?')) {
        return;
    }

    try {
        const response = await fetch(`/api/special-dates/${specialDateId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            // Reload special dates
            loadSpecialDates(currentContactIdForSpecialDates);
        } else {
            alert('Error deleting special date: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting special date:', error);
        alert('Error deleting special date. Please try again.');
    }
}

// ============================================
// Send Badger Modal & Workflow
// ============================================

let selectedNetworkContact = null;
let currentStep = 1;
const totalSteps = 3;

// Open Send Badger modal
function openSendBadgerModal(preselectedContact = null) {
    if (!authToken) {
        alert('Please login first!');
        showModal('loginModal');
        return;
    }

    // Reset form and step
    document.getElementById('sendBadgerForm').reset();
    selectedNetworkContact = null;
    currentStep = 1;
    showStep(1);

    // Populate network contacts selector
    populateNetworkContactSelector();

    // If a contact was preselected (from contact card button), populate their info
    if (preselectedContact) {
        selectNetworkContact(preselectedContact);
    }

    showModal('sendBadgerModal');
}

// Show specific step
function showStep(stepNumber) {
    currentStep = stepNumber;

    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.style.display = 'none';
        step.classList.remove('active');
    });

    // Show current step
    const activeStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (activeStep) {
        activeStep.style.display = 'block';
        activeStep.classList.add('active');
    }

    // Update step indicator
    document.querySelectorAll('.step-item').forEach(item => {
        const itemStep = parseInt(item.dataset.step);
        if (itemStep < stepNumber) {
            item.classList.add('completed');
            item.classList.remove('active');
        } else if (itemStep === stepNumber) {
            item.classList.add('active');
            item.classList.remove('completed');
        } else {
            item.classList.remove('active', 'completed');
        }
    });

    // Update navigation buttons
    const btnPrev = document.getElementById('btnPrevStep');
    const btnNext = document.getElementById('btnNextStep');
    const btnSubmit = document.getElementById('btnSubmit');

    if (stepNumber === 1) {
        btnPrev.style.display = 'none';
        btnNext.style.display = 'inline-block';
        btnSubmit.style.display = 'none';
    } else if (stepNumber === totalSteps) {
        btnPrev.style.display = 'inline-block';
        btnNext.style.display = 'none';
        btnSubmit.style.display = 'inline-block';
    } else {
        btnPrev.style.display = 'inline-block';
        btnNext.style.display = 'inline-block';
        btnSubmit.style.display = 'none';
    }
}

// Validate current step
function validateStep(stepNumber) {
    if (stepNumber === 1) {
        // Validate recipient info
        const name = document.getElementById('modalRecipientName').value;
        const email = document.getElementById('modalRecipientEmail').value;

        if (!name || !email) {
            alert('Please enter recipient name and email');
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return false;
        }

        return true;
    } else if (stepNumber === 2) {
        // Validate gift type
        const giftType = document.getElementById('modalGiftType').value;

        if (!giftType) {
            alert('Please select a gift type');
            return false;
        }

        return true;
    } else if (stepNumber === 3) {
        // Validate challenge description
        const challengeDesc = document.getElementById('modalChallengeDescription').value;

        if (!challengeDesc) {
            alert('Please enter a challenge description');
            return false;
        }

        return true;
    }

    return true;
}

// Next step
function nextStep() {
    if (!validateStep(currentStep)) {
        return;
    }

    if (currentStep < totalSteps) {
        showStep(currentStep + 1);
    }
}

// Previous step
function previousStep() {
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

// Send badger to a specific contact (from contact card)
function sendBadgerToContact(contact) {
    openSendBadgerModal(contact);
}

// Populate network contacts in the modal
function populateNetworkContactSelector() {
    const selector = document.getElementById('networkContactSelector');

    if (!window.userContacts || window.userContacts.length === 0) {
        selector.innerHTML = '<p style="color: #aaa; text-align: center; padding: 20px;">No contacts in your network yet</p>';
        return;
    }

    selector.innerHTML = window.userContacts.map(contact => `
        <div class="network-contact-quick-btn" onclick='selectNetworkContact(${JSON.stringify(contact).replace(/'/g, "\\'")})'
             data-contact-id="${contact.id}">
            <div class="network-contact-quick-name">${escapeHtml(contact.name)}</div>
            <div class="network-contact-quick-details">
                ${contact.relationship || 'Contact'}
            </div>
        </div>
    `).join('');
}

// Select a network contact to send to
function selectNetworkContact(contact) {
    selectedNetworkContact = contact;

    // Update visual selection
    document.querySelectorAll('.network-contact-quick-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    const btn = document.querySelector(`[data-contact-id="${contact.id}"]`);
    if (btn) {
        btn.classList.add('selected');
    }

    // Populate recipient fields
    document.getElementById('modalRecipientName').value = contact.name || '';
    document.getElementById('modalRecipientEmail').value = contact.email || '';
    document.getElementById('modalRecipientPhone').value = contact.phone || '';

    // Mark fields as readonly if populated from network
    document.getElementById('modalRecipientName').readOnly = true;
    document.getElementById('modalRecipientEmail').readOnly = !!contact.email;
    document.getElementById('modalRecipientPhone').readOnly = !!contact.phone;
}

// Handle gift type change in modal
function handleModalGiftTypeChange() {
    const giftType = document.getElementById('modalGiftType').value;
    const container = document.getElementById('modalGiftDetailsContainer');

    if (!giftType) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    switch(giftType) {
        case 'giftcard':
            html = `
                <div class="form-group">
                    <label for="modalGiftCardBrand">Choose Gift Card:</label>
                    <select id="modalGiftCardBrand" name="giftCardBrand">
                        <option value="">Select brand</option>
                        <option value="amazon">Amazon</option>
                        <option value="starbucks">Starbucks</option>
                        <option value="dunkin">Dunkin'</option>
                        <option value="dicks">Dick's Sporting Goods</option>
                        <option value="fortnite">Fortnite</option>
                        <option value="sephora">Sephora</option>
                        <option value="lululemon">Lululemon</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="modalGiftCardAmount">Amount:</label>
                    <input type="text" id="modalGiftCardAmount" name="giftCardAmount" placeholder="$50">
                </div>
            `;
            break;
        case 'cash':
            html = `
                <div class="form-group">
                    <label for="modalCashPlatform">Payment Platform:</label>
                    <select id="modalCashPlatform" name="cashPlatform">
                        <option value="venmo">Venmo</option>
                        <option value="paypal">PayPal</option>
                        <option value="cashapp">Cash App</option>
                        <option value="zelle">Zelle</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="modalCashAmount">Amount:</label>
                    <input type="text" id="modalCashAmount" name="cashAmount" placeholder="$100">
                </div>
            `;
            break;
        case 'photo':
            html = `
                <div class="form-group">
                    <label for="modalMediaDescription">What are you sharing?</label>
                    <textarea id="modalMediaDescription" name="mediaDescription" placeholder="Describe the photo/video you'll share" rows="2"></textarea>
                </div>
            `;
            break;
        case 'message':
            html = `
                <div class="form-group">
                    <label for="modalCustomMessage">Your Message:</label>
                    <textarea id="modalCustomMessage" name="customMessage" placeholder="Write your special message here" rows="3"></textarea>
                </div>
            `;
            break;
        case 'physical':
            html = `
                <div class="form-group">
                    <label for="modalItemDescription">Item Description:</label>
                    <input type="text" id="modalItemDescription" name="itemDescription" placeholder="e.g., Nintendo Switch, Concert Tickets">
                </div>
                <div class="form-group">
                    <label for="modalItemValue">Estimated Value:</label>
                    <input type="text" id="modalItemValue" name="itemValue" placeholder="$300">
                </div>
            `;
            break;
    }

    container.innerHTML = html;
}

// Update challenge options in modal
function updateModalChallengeOptions() {
    const challengeType = document.getElementById('modalChallengeType').value;
    const durationField = document.getElementById('modalChallengeDuration');

    if (challengeType === 'multiday' || challengeType === 'fitness') {
        durationField.style.display = 'block';
    } else {
        durationField.style.display = 'none';
    }
}

// Handle Send Badger form submission
document.getElementById('sendBadgerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        recipientName: document.getElementById('modalRecipientName').value,
        recipientEmail: document.getElementById('modalRecipientEmail').value,
        recipientPhone: document.getElementById('modalRecipientPhone').value,
        giftType: document.getElementById('modalGiftType').value,
        challengeType: document.getElementById('modalChallengeType').value,
        challengeDescription: document.getElementById('modalChallengeDescription').value,
        reminderFrequency: document.getElementById('modalReminderFrequency').value,
        personalNote: document.getElementById('modalPersonalNote').value,
        notifyOnComplete: document.getElementById('modalNotifyOnComplete').checked
    };

    // Add duration if multiday
    const challengeType = document.getElementById('modalChallengeType').value;
    if (challengeType === 'multiday' || challengeType === 'fitness') {
        formData.duration = document.getElementById('modalDuration').value;
    }

    try {
        const response = await fetch('/api/send-honey-badger', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            alert('Honey Badger sent successfully! 🎁');
            closeModal('sendBadgerModal');
            // Reload honey badgers list
            loadHoneyBadgers();
        } else {
            alert('Error sending Honey Badger: ' + data.message);
        }
    } catch (error) {
        console.error('Error sending Honey Badger:', error);
        alert('Error sending Honey Badger. Please try again.');
    }
});

// Initialize when dashboard is shown
document.addEventListener('DOMContentLoaded', () => {
    // No carousel needed anymore - just one chatbot panel
    const dashboard = document.getElementById('dashboard');
    if (dashboard && dashboard.style.display !== 'none') {
        // Dashboard is visible, user is logged in
        console.log('Dashboard loaded');
        loadContacts();
    }
});
