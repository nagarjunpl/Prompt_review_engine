class PromptReviewApp {
    constructor() {
        this.graph = null;
        this.animationManager = null;
        this.currentAnalysis = null;
        this.init();
    }

    init() {
        // Initialize components
        this.graph = new PromptGraph(document.getElementById('graphContainer'));
        this.animationManager = new AnimationManager();
        
        // Check authentication status
        this.checkAuthStatus();
        
        // Bind event listeners
        this.bindEvents();
        
        // Load initial stats
        this.loadStats();
        
        console.log('Prompt Review Engine initialized');
    }

    bindEvents() {
        // Review button
        const reviewBtn = document.getElementById('reviewBtn');
        reviewBtn.addEventListener('click', () => this.handlePromptReview());

        // Send to LLM button
        const sendLLMBtn = document.getElementById('sendLLMBtn');
        sendLLMBtn.addEventListener('click', () => this.handleSendToLLM());

        // Input field
        const promptInput = document.getElementById('promptInput');
        promptInput.addEventListener('input', () => this.handleInputChange());
        promptInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.handlePromptReview();
            }
        });

        // Control buttons
        document.getElementById('resetGraphBtn').addEventListener('click', () => {
            this.resetGraph();
        });

        document.getElementById('clearGraphBtn').addEventListener('click', () => {
            this.clearAllPrompts();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('historyBtn').addEventListener('click', () => {
            this.showHistory();
        });

        document.getElementById('refreshStatsBtn').addEventListener('click', () => {
            this.loadStats();
        });

        // History modal events
        document.getElementById('closeHistoryBtn').addEventListener('click', () => {
            this.hideHistory();
        });

        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });

        document.getElementById('historySearch').addEventListener('input', (e) => {
            this.filterHistory();
        });

        document.getElementById('historyFilter').addEventListener('change', (e) => {
            this.filterHistory();
        });

        // Close modal on outside click
        document.getElementById('historyModal').addEventListener('click', (e) => {
            if (e.target.id === 'historyModal') {
                this.hideHistory();
            }
        });

        // Add ripple effect to buttons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.animationManager.createRippleEffect(btn, x, y);
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    checkAuthStatus() {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.updateAuthUI(true);
                console.log('User authenticated:', this.currentUser.email);
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('user');
                this.updateAuthUI(false);
            }
        } else {
            this.updateAuthUI(false);
            console.log('No user authenticated');
        }
    }

    updateAuthUI(isAuthenticated) {
        const userInfo = document.getElementById('userInfo');
        const authButtons = document.getElementById('authButtons');
        const reviewBtn = document.getElementById('reviewBtn');
        const sendLLMBtn = document.getElementById('sendLLMBtn');
        const llmSelect = document.getElementById('llmSelect');
        const promptInput = document.getElementById('promptInput');
        
        if (isAuthenticated && this.currentUser) {
            // Show user info
            userInfo.style.display = 'flex';
            authButtons.style.display = 'none';
            
            // Enable prompt functionality
            promptInput.disabled = false;
            promptInput.placeholder = "Enter your prompt here... Be specific about context, objectives, and desired response format.";
            
            // Update user info
            const userName = document.getElementById('userName');
            const userAvatar = document.getElementById('userAvatar');
            
            userName.textContent = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            
            if (this.currentUser.photoURL) {
                userAvatar.src = this.currentUser.photoURL;
                userAvatar.style.display = 'block';
            } else {
                // Create avatar with initials
                const initials = this.getInitials(this.currentUser.displayName || this.currentUser.email.split('@')[0]);
                userAvatar.style.display = 'none';
                userName.textContent = `${initials} ${this.currentUser.displayName || this.currentUser.email.split('@')[0]}`;
            }
            
            // Update input status
            const inputStatus = document.getElementById('inputStatus');
            this.animationManager.animateStatusUpdate(inputStatus, 'Ready', 'info');
        } else {
            // Show auth buttons
            userInfo.style.display = 'none';
            authButtons.style.display = 'flex';
            
            // Disable prompt functionality
            promptInput.disabled = true;
            promptInput.placeholder = "Please sign in to analyze prompts...";
            reviewBtn.disabled = true;
            sendLLMBtn.disabled = true;
            llmSelect.disabled = true;
            
            // Update input status
            const inputStatus = document.getElementById('inputStatus');
            this.animationManager.animateStatusUpdate(inputStatus, 'Sign in required', 'warning');
        }
    }

    getInitials(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    handleLogout() {
        // Clear user data
        localStorage.removeItem('user');
        this.currentUser = null;
        
        // Update UI
        this.updateAuthUI(false);
        
        // Show success message
        const inputStatus = document.getElementById('inputStatus');
        this.animationManager.animateStatusUpdate(inputStatus, 'Logged out successfully', 'success');
        
        setTimeout(() => {
            this.animationManager.animateStatusUpdate(inputStatus, 'Ready', 'info');
        }, 2000);
    }

    handleInputChange() {
        const promptInput = document.getElementById('promptInput');
        const reviewBtn = document.getElementById('reviewBtn');
        const inputStatus = document.getElementById('inputStatus');
        
        const text = promptInput.value.trim();
        
        // Check authentication status first
        if (!this.currentUser) {
            this.animationManager.animateStatusUpdate(inputStatus, 'Sign in required', 'warning');
            reviewBtn.disabled = true;
            return;
        }
        
        if (text.length === 0) {
            this.animationManager.animateStatusUpdate(inputStatus, 'Ready', 'info');
            reviewBtn.disabled = true;
        } else if (text.length < 10) {
            this.animationManager.animateStatusUpdate(inputStatus, 'Too short', 'warning');
            reviewBtn.disabled = false;
        } else {
            this.animationManager.animateStatusUpdate(inputStatus, 'Ready to analyze', 'success');
            reviewBtn.disabled = false;
        }
    }

    async handlePromptReview() {
        const promptInput = document.getElementById('promptInput');
        const reviewBtn = document.getElementById('reviewBtn');
        const inputStatus = document.getElementById('inputStatus');
        const sendLLMBtn = document.getElementById('sendLLMBtn');
        const llmSelect = document.getElementById('llmSelect');
        
        // Check if user is authenticated
        if (!this.currentUser) {
            this.animationManager.animateStatusUpdate(inputStatus, 'Please sign in to analyze prompts', 'error');
            this.showAuthRequiredModal();
            return;
        }
        
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            this.animationManager.animateStatusUpdate(inputStatus, 'Please enter a prompt', 'error');
            return;
        }

        // Start loading animation
        this.animationManager.animateButton(reviewBtn, 'loading');
        this.animationManager.animateStatusUpdate(inputStatus, 'Analyzing...', 'info');

        try {
            const response = await fetch('/review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.currentAnalysis = data;

            // Update UI based on verdict
            this.updateUIAfterReview(data);
            
            // Add to graph
            const graphNodes = this.graph.addPromptAnalysis({
                original_prompt: prompt,
                costar: data.costar,
                verdict: data.verdict,
                reasons: data.reasons
            });

            this.currentAnalysis.graphNodes = graphNodes;

            // Success animation
            this.animationManager.animateButton(reviewBtn, 'success');
            this.animationManager.animateStatusUpdate(
                inputStatus, 
                `Analysis complete: ${data.verdict}`, 
                data.verdict === 'ALLOW' ? 'success' : 
                data.verdict === 'NEEDS_FIX' ? 'warning' : 'error'
            );

            // Enable LLM sending for ALLOW verdicts
            if (data.verdict === 'ALLOW') {
                sendLLMBtn.disabled = false;
                llmSelect.disabled = false;
                sendLLMBtn.style.animation = 'pulse 1s ease-in-out 3';
            }

            // Refresh stats
            setTimeout(() => this.loadStats(), 500);

        } catch (error) {
            console.error('Error reviewing prompt:', error);
            this.animationManager.animateButton(reviewBtn, 'error');
            this.animationManager.animateStatusUpdate(inputStatus, 'Analysis failed', 'error');
        }
    }

    async handleSendToLLM() {
        // Check if user is authenticated
        if (!this.currentUser) {
            const inputStatus = document.getElementById('inputStatus');
            this.animationManager.animateStatusUpdate(inputStatus, 'Please sign in to send to LLM', 'error');
            this.showAuthRequiredModal();
            return;
        }
        
        if (!this.currentAnalysis || this.currentAnalysis.verdict !== 'ALLOW') {
            return;
        }

        const sendLLMBtn = document.getElementById('sendLLMBtn');
        const llmSelect = document.getElementById('llmSelect');
        const inputStatus = document.getElementById('inputStatus');
        
        const selectedLLM = llmSelect.value;
        const sanitizedPrompt = this.currentAnalysis.sanitized_prompt;

        this.animationManager.animateButton(sendLLMBtn, 'loading');
        this.animationManager.animateStatusUpdate(inputStatus, `Sending to ${selectedLLM}...`, 'info');

        try {
            const response = await fetch('/broker', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: sanitizedPrompt,
                    llm: selectedLLM
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Add LLM response to graph
            const llmNodeId = this.graph.addLLMResponse(
                data, 
                this.currentAnalysis.graphNodes.verdictNodeId
            );

            this.animationManager.animateButton(sendLLMBtn, 'success');
            this.animationManager.animateStatusUpdate(inputStatus, 'Response received', 'success');

        } catch (error) {
            console.error('Error sending to LLM:', error);
            this.animationManager.animateButton(sendLLMBtn, 'error');
            this.animationManager.animateStatusUpdate(inputStatus, 'Failed to get LLM response', 'error');
        }
    }

    updateUIAfterReview(data) {
        // Could add more UI updates here based on the analysis results
        console.log('Analysis results:', data);
    }

    async loadStats() {
        try {
            const response = await fetch('/stats');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const stats = await response.json();
            this.updateStatsDisplay(stats);

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStatsDisplay(stats) {
        const { verdict_counts = {}, total_prompts = 0 } = stats;
        
        // Animate count updates
        this.animationManager.animateCountUp(
            document.getElementById('allowCount'), 
            0, 
            verdict_counts.ALLOW || 0
        );
        
        this.animationManager.animateCountUp(
            document.getElementById('needsFixCount'), 
            0, 
            verdict_counts.NEEDS_FIX || 0
        );
        
        this.animationManager.animateCountUp(
            document.getElementById('blockCount'), 
            0, 
            verdict_counts.BLOCK || 0
        );
        
        this.animationManager.animateCountUp(
            document.getElementById('totalCount'), 
            0, 
            total_prompts
        );

        // Update chart
        const canvas = document.getElementById('statsChart');
        if (canvas && Object.keys(verdict_counts).length > 0) {
            this.animationManager.animateChart(canvas, verdict_counts);
        }
    }

    resetGraph() {
        this.graph.clear();
        this.currentAnalysis = null;
        
        // Reset form
        document.getElementById('promptInput').value = '';
        document.getElementById('sendLLMBtn').disabled = true;
        document.getElementById('llmSelect').disabled = true;
        
        // Reset status
        const inputStatus = document.getElementById('inputStatus');
        this.animationManager.animateStatusUpdate(inputStatus, 'Ready', 'info');
        
        // Reset buttons
        this.animationManager.animateButton(document.getElementById('reviewBtn'), 'reset');
        this.animationManager.animateButton(document.getElementById('sendLLMBtn'), 'reset');
    }

    clearAllPrompts() {
        // Show confirmation
        if (this.graph.nodes.size > 0) {
            const confirmed = confirm('Are you sure you want to clear all prompts from the graph?');
            if (!confirmed) return;
        }
        
        this.resetGraph();
        
        // Show success message
        const inputStatus = document.getElementById('inputStatus');
        this.animationManager.animateStatusUpdate(inputStatus, 'Graph cleared', 'success');
        
        setTimeout(() => {
            this.animationManager.animateStatusUpdate(inputStatus, 'Ready', 'info');
        }, 2000);
    }

    async showHistory() {
        // Check if user is authenticated
        if (!this.currentUser) {
            this.showAuthRequiredModal();
            return;
        }
        
        const modal = document.getElementById('historyModal');
        modal.classList.add('show');
        
        // Load history data
        await this.loadHistoryData();
    }

    hideHistory() {
        const modal = document.getElementById('historyModal');
        modal.classList.remove('show');
    }

    async loadHistoryData() {
        try {
            const response = await fetch('/history');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const history = await response.json();
            this.displayHistory(history.prompts || []);
            
        } catch (error) {
            console.error('Error loading history:', error);
            this.displayHistory([]);
        }
    }

    displayHistory(prompts) {
        const historyList = document.getElementById('historyList');
        
        if (prompts.length === 0) {
            historyList.innerHTML = `
                <div class="history-placeholder">
                    <div class="placeholder-icon">📝</div>
                    <p>No prompts in history yet</p>
                </div>
            `;
            return;
        }
        
        // Store full history for filtering
        this.fullHistory = prompts;
        
        // Sort by timestamp (newest first)
        const sortedPrompts = prompts.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        this.renderHistoryItems(sortedPrompts);
    }

    renderHistoryItems(prompts) {
        const historyList = document.getElementById('historyList');
        
        historyList.innerHTML = prompts.map(prompt => `
            <div class="history-item" data-id="${prompt.id}">
                <div class="history-item-header">
                    <div class="history-verdict ${prompt.verdict.toLowerCase().replace('_', '-')}">
                        ${prompt.verdict}
                    </div>
                    <div class="history-timestamp">
                        ${this.formatTimestamp(prompt.timestamp)}
                    </div>
                </div>
                <div class="history-prompt">
                    ${this.truncateText(prompt.original_prompt, 200)}
                </div>
                ${prompt.reasons && prompt.reasons.length > 0 ? `
                    <div class="history-reasons">
                        ${prompt.reasons.map(reason => 
                            `<span class="history-reason">${reason}</span>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
        
        // Add click handlers to history items
        historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const promptId = item.dataset.id;
                this.loadPromptToGraph(promptId);
            });
        });
    }

    filterHistory() {
        if (!this.fullHistory) return;
        
        const searchTerm = document.getElementById('historySearch').value.toLowerCase();
        const filterVerdict = document.getElementById('historyFilter').value;
        
        let filtered = this.fullHistory;
        
        // Filter by verdict
        if (filterVerdict !== 'all') {
            filtered = filtered.filter(prompt => prompt.verdict === filterVerdict);
        }
        
        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(prompt => 
                prompt.original_prompt.toLowerCase().includes(searchTerm) ||
                (prompt.reasons && prompt.reasons.some(reason => 
                    reason.toLowerCase().includes(searchTerm)
                ))
            );
        }
        
        this.renderHistoryItems(filtered);
    }

    async loadPromptToGraph(promptId) {
        try {
            const response = await fetch(`/history/${promptId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const promptData = await response.json();
            
            // Close history modal
            this.hideHistory();
            
            // Clear current graph
            this.graph.clear();
            
            // Add prompt to graph
            const graphNodes = this.graph.addPromptAnalysis({
                original_prompt: promptData.original_prompt,
                costar: promptData.costar_analysis,
                verdict: promptData.verdict,
                reasons: promptData.reasons
            });
            
            // Update input field
            document.getElementById('promptInput').value = promptData.original_prompt;
            
            // Update status
            const inputStatus = document.getElementById('inputStatus');
            this.animationManager.animateStatusUpdate(
                inputStatus, 
                `Loaded: ${promptData.verdict}`, 
                promptData.verdict === 'ALLOW' ? 'success' : 
                promptData.verdict === 'NEEDS_FIX' ? 'warning' : 'error'
            );
            
        } catch (error) {
            console.error('Error loading prompt:', error);
        }
    }

    async clearHistory() {
        const confirmed = confirm('Are you sure you want to clear all history? This cannot be undone.');
        if (!confirmed) return;
        
        try {
            const response = await fetch('/history', { method: 'DELETE' });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Refresh history display
            this.displayHistory([]);
            
            // Refresh stats
            this.loadStats();
            
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    showAuthRequiredModal() {
        // Create and show authentication required modal
        const modal = document.createElement('div');
        modal.className = 'auth-required-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h2>Authentication Required</h2>
                    <button class="close-auth-modal">&times;</button>
                </div>
                <div class="auth-modal-body">
                    <div class="auth-modal-icon">🔒</div>
                    <p>You need to sign in to analyze prompts and access the full features of the Prompt Review Engine.</p>
                    <div class="auth-modal-actions">
                        <a href="login.html" class="btn btn-primary">Sign In</a>
                        <a href="signup.html" class="btn btn-secondary">Create Account</a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-auth-modal');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (document.body.contains(modal)) {
                modal.remove();
            }
        }, 10000);
    }

    exportData() {
        // Check if user is authenticated
        if (!this.currentUser) {
            this.showAuthRequiredModal();
            return;
        }
        
        const data = {
            graph: this.graph.exportData(),
            currentAnalysis: this.currentAnalysis,
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prompt-analysis-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success message
        const inputStatus = document.getElementById('inputStatus');
        this.animationManager.animateStatusUpdate(inputStatus, 'Data exported successfully', 'success');
        
        setTimeout(() => {
            this.animationManager.animateStatusUpdate(inputStatus, 'Ready', 'info');
        }, 2000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PromptReviewApp();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.app && window.app.animationManager) {
        window.app.animationManager.cleanup();
    }
});