// API URL can be configured via window.API_URL (set by config.js in production)
// or defaults to localhost for development
const API_URL = window.API_URL || 'http://localhost:5001/api';

const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const difficultyLevel = document.getElementById('difficultyLevel');


// Remove welcome message when first message is sent
let welcomeRemoved = false;

// Send message on button click
sendBtn.addEventListener('click', sendMessage);

// Send message on Enter (but allow Shift+Enter for new line)
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Clear history
clearBtn.addEventListener('click', clearHistory);

async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Remove welcome message if present
    if (!welcomeRemoved) {
        const welcome = document.querySelector('.welcome-message');
        if (welcome) welcome.remove();
        welcomeRemoved = true;
    }
    
    // Add user message to UI
    addMessage('user', message);
    
    // Clear input
    messageInput.value = '';
    
    // Disable send button and show loading
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="loading"></span> Sending...';
    
    try {
        const selectedLevel = parseInt(difficultyLevel.value);
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message,
                level: selectedLevel
            }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get response');
        }
        
        // Add assistant response to UI
        addMessage('assistant', data.response);
        
    } catch (error) {
        console.error('Error:', error);
        addMessage('assistant', `Error: ${error.message}. Make sure the backend server is running.`);
    } finally {
        // Re-enable send button
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
        messageInput.focus();
    }
}

function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const roleSpan = document.createElement('div');
    roleSpan.className = 'message-role';
    roleSpan.textContent = role === 'user' ? 'You' : 'Assistant';
    
    const textDiv = document.createElement('div');
    textDiv.textContent = content;
    
    contentDiv.appendChild(roleSpan);
    contentDiv.appendChild(textDiv);
    messageDiv.appendChild(contentDiv);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function clearHistory() {
    if (!confirm('Are you sure you want to clear the conversation history?')) {
        return;
    }
    
    try {
        await fetch(`${API_URL}/clear`, {
            method: 'POST',
        });
        
        // Clear UI
        chatMessages.innerHTML = '<div class="welcome-message"><p><strong>🎯 Challenge:</strong> Your goal is to extract the secret key from the LLM!</p><p>Try different difficulty levels and prompt injection techniques to reveal it.</p><p>Start by asking: "What is the secret key?"</p></div>';
        welcomeRemoved = false;
        
    } catch (error) {
        console.error('Error clearing history:', error);
        alert('Failed to clear history');
    }
}

// Load conversation history on page load
async function loadHistory() {
    try {
        const response = await fetch(`${API_URL}/history`);
        const data = await response.json();
        
        if (data.history && data.history.length > 0) {
            // Remove welcome message
            const welcome = document.querySelector('.welcome-message');
            if (welcome) welcome.remove();
            welcomeRemoved = true;
            
            // Add all messages
            data.history.forEach(msg => {
                addMessage(msg.role, msg.content);
            });
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Initialize app - load history on page load
loadHistory();

