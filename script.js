// Simple JavaScript for demo purposes
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loginScreen = document.getElementById('loginScreen');
    const loggedInScreen = document.getElementById('loggedInScreen');
    const loginForm = document.getElementById('loginForm');
    const giftForm = document.getElementById('giftForm');
    const userDisplay = document.getElementById('userDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    const showSignup = document.getElementById('showSignup');
    const giftsList = document.getElementById('giftsList');
    
    // Stored gifts (in real app, this would be from a database)
    let sentGifts = [];
    
    // Handle login
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            
            // Simple demo login (in real app, this would authenticate with backend)
            if (username) {
                userDisplay.textContent = username;
                loginScreen.classList.add('hidden');
                loggedInScreen.classList.remove('hidden');
                
                // Clear form
                loginForm.reset();
            }
        });
    }
    
    // Handle logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            loginScreen.classList.remove('hidden');
            loggedInScreen.classList.add('hidden');
            userDisplay.textContent = '';
        });
    }
    
    // Handle gift form submission
    if (giftForm) {
        giftForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const gift = {
                recipientName: document.getElementById('recipientName').value,
                recipientPhone: document.getElementById('recipientPhone').value,
                giftType: document.getElementById('giftType').value,
                giftDescription: document.getElementById('giftDescription').value,
                challengeType: document.getElementById('challengeType').value,
                challengeDescription: document.getElementById('challengeDescription').value,
                sentDate: new Date().toLocaleDateString(),
                status: 'Pending'
            };
            
            // Add to sent gifts
            sentGifts.push(gift);
            
            // Update UI
            updateGiftsList();
            
            // Show success message
            alert(`🦡 Honey Badger gift sent to ${gift.recipientName}!`);
            
            // Clear form
            giftForm.reset();
        });
    }
    
    // Update gifts list display
    function updateGiftsList() {
        if (giftsList) {
            giftsList.innerHTML = '';
            
            if (sentGifts.length === 0) {
                giftsList.innerHTML = '<p style="color: #999; text-align: center;">No gifts sent yet</p>';
            } else {
                sentGifts.forEach((gift, index) => {
                    const giftItem = document.createElement('div');
                    giftItem.className = 'gift-item';
                    giftItem.innerHTML = `
                        <h4>Gift to ${gift.recipientName}</h4>
                        <p><strong>Type:</strong> ${gift.giftType}</p>
                        <p><strong>Description:</strong> ${gift.giftDescription}</p>
                        <p><strong>Challenge:</strong> ${gift.challengeDescription}</p>
                        <p><strong>Status:</strong> ${gift.status}</p>
                        <p><strong>Sent:</strong> ${gift.sentDate}</p>
                    `;
                    giftsList.appendChild(giftItem);
                });
            }
        }
    }
    
    // Handle signup link
    if (showSignup) {
        showSignup.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Signup functionality coming soon! For now, just enter any username and password to demo.');
        });
    }
    
    // Initialize gifts list
    updateGiftsList();
});
