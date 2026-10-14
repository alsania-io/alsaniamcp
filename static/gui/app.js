class AlsaniaDashboard {
    constructor() {
        this.apiUrl = window.location.origin;
        this.eventSource = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.connectToServer();
        this.loadDashboardData();
        setInterval(() => this.loadDashboardData(), 5000);
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Agent form
        document.getElementById('create-agent-btn').addEventListener('click', () => {
            document.getElementById('create-agent-form').classList.remove('hidden');
        });

        document.getElementById('cancel-agent-form').addEventListener('click', () => {
            document.getElementById('create-agent-form').classList.add('hidden');
        });

        document.getElementById('agent-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAgent();
        });

        // Proxy form
        document.getElementById('connect-proxy-btn').addEventListener('click', () => {
            document.getElementById('connect-proxy-form').classList.remove('hidden');
        });

        document.getElementById('cancel-proxy-form').addEventListener('click', () => {
            document.getElementById('connect-proxy-form').classList.add('hidden');
        });

        document.getElementById('proxy-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.connectProxy();
        });

        // Tool tabs
        document.querySelectorAll('.tool-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchToolTab(e.target.dataset.type));
        });

        // Message tabs
        document.querySelectorAll('.message-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMessageTab(e.target.dataset.msgType));
        });

        // Trigger words
        document.getElementById('add-trigger-btn').addEventListener('click', () => this.addTriggerWord());
        
        // Messages
        document.getElementById('store-msg-btn').addEventListener('click', () => this.storeMessage());
        document.getElementById('message-agent-select').addEventListener('change', () => this.loadAgentTriggersAndMessages());

        // Settings
        document.getElementById('chat-storage-type').addEventListener('change', (e) => this.toggleEmeSettings(e.target.value));
        document.getElementById('save-settings-btn').addEventListener('click', () => this.saveSettings());
        document.getElementById('reset-settings-btn').addEventListener('click', () => this.resetSettings());
        document.getElementById('test-eme-btn').addEventListener('click', () => this.testEmeConnection());
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.getElementById(tabName).classList.add('active');
        event.target.classList.add('active');

        if (tabName === 'agents') this.loadAgents();
        if (tabName === 'messages') this.loadMessagesTab();
        if (tabName === 'tools') this.loadTools();
        if (tabName === 'proxy') this.loadProxyServers();
    }

    switchToolTab(type) {
        if (type === 'tools') {
            document.getElementById('tools-list').classList.remove('hidden');
            document.getElementById('prompts-list').classList.add('hidden');
        } else {
            document.getElementById('tools-list').classList.add('hidden');
            document.getElementById('prompts-list').classList.remove('hidden');
            this.loadPrompts();
        }

        document.querySelectorAll('.tool-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
    }

    async connectToServer() {
        try {
            const response = await fetch(`${this.apiUrl}/health`);
            if (response.ok) {
                this.updateServerStatus(true);
                this.setupSSE();
            }
        } catch (error) {
            console.error('Failed to connect:', error);
            this.updateServerStatus(false);
        }
    }

    updateServerStatus(online) {
        const indicator = document.getElementById('server-status');
        if (online) {
            indicator.textContent = 'Online';
            indicator.classList.remove('offline');
            indicator.classList.add('online');
        } else {
            indicator.textContent = 'Offline';
            indicator.classList.add('offline');
            indicator.classList.remove('online');
        }
    }

    setupSSE() {
        try {
            this.eventSource = new EventSource(`${this.apiUrl}/stream`);
            this.eventSource.onmessage = (e) => {
                const data = JSON.parse(e.data);
                this.logActivity(data.message || 'Activity occurred');
            };
            this.eventSource.onerror = () => {
                this.eventSource.close();
                this.updateServerStatus(false);
            };
        } catch (error) {
            console.error('SSE setup failed:', error);
        }
    }

    async loadDashboardData() {
        try {
            const [agents, tools, prompts, proxies] = await Promise.all([
                fetch(`${this.apiUrl}/agents`).then(r => r.json()).catch(() => ({ agents: [] })),
                fetch(`${this.apiUrl}/tools`).then(r => r.json()).catch(() => ({ tools: [] })),
                fetch(`${this.apiUrl}/prompts`).then(r => r.json()).catch(() => ({ prompts: [] })),
                fetch(`${this.apiUrl}/proxy/servers`).then(r => r.json()).catch(() => ({ servers: [] })),
            ]);

            document.getElementById('stat-agents').textContent = agents.agents?.length || 0;
            document.getElementById('stat-tools').textContent = tools.tools?.length || 0;
            document.getElementById('stat-proxy').textContent = proxies.servers?.length || 0;

            // Calculate total calls from agents stats
            const totalCalls = agents.stats?.totalCalls || 0;
            document.getElementById('stat-calls').textContent = totalCalls;
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    async loadAgents() {
        try {
            const response = await fetch(`${this.apiUrl}/agents`);
            const data = await response.json();
            const agentsList = document.getElementById('agents-list');

            if (!data.agents || data.agents.length === 0) {
                agentsList.innerHTML = '<p class="empty-state">No agents registered yet</p>';
                return;
            }

            agentsList.innerHTML = data.agents.map(agent => `
                <div class="agent-card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">${agent.config.name}</div>
                            <div class="card-badge">${agent.status}</div>
                        </div>
                        <div style="color: var(--text-secondary);">${agent.id}</div>
                    </div>
                    <div class="card-content">
                        <p><strong>Model:</strong> ${agent.config.model}</p>
                        ${agent.config.description ? `<p>${agent.config.description}</p>` : ''}
                        <p><strong>Calls:</strong> ${agent.metadata.totalCalls} | <strong>Errors:</strong> ${agent.metadata.errors}</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-secondary" onclick="dashboard.toggleAgent('${agent.id}', '${agent.status}')">
                            ${agent.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="btn btn-danger" onclick="dashboard.removeAgent('${agent.id}')">Remove</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load agents:', error);
        }
    }

    async loadTools() {
        try {
            const response = await fetch(`${this.apiUrl}/tools`);
            const data = await response.json();
            const toolsList = document.getElementById('tools-list');

            if (!data.tools || data.tools.length === 0) {
                toolsList.innerHTML = '<p class="empty-state">No tools available</p>';
                return;
            }

            toolsList.innerHTML = data.tools.map(tool => `
                <div class="tool-card">
                    <div class="card-header">
                        <div class="card-title">${tool.name}</div>
                        <div class="card-badge">${tool.serverName || 'core'}</div>
                    </div>
                    <div class="card-content">
                        <p>${tool.description || 'No description'}</p>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load tools:', error);
        }
    }

    async loadPrompts() {
        try {
            const response = await fetch(`${this.apiUrl}/prompts`);
            const data = await response.json();
            const promptsList = document.getElementById('prompts-list');

            if (!data.prompts || data.prompts.length === 0) {
                promptsList.innerHTML = '<p class="empty-state">No prompts available</p>';
                return;
            }

            promptsList.innerHTML = data.prompts.map(prompt => `
                <div class="tool-card">
                    <div class="card-header">
                        <div class="card-title">${prompt.name}</div>
                        <div class="card-badge">${prompt.serverName || 'core'}</div>
                    </div>
                    <div class="card-content">
                        <p>${prompt.description || 'No description'}</p>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load prompts:', error);
        }
    }

    async loadProxyServers() {
        try {
            const response = await fetch(`${this.apiUrl}/proxy/servers`);
            const data = await response.json();
            const proxyList = document.getElementById('proxy-list');

            if (!data.servers || data.servers.length === 0) {
                proxyList.innerHTML = '<p class="empty-state">No proxy servers connected</p>';
                return;
            }

            proxyList.innerHTML = data.servers.map(server => `
                <div class="proxy-card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">${server.config.id}</div>
                            <div class="card-badge">${server.status}</div>
                        </div>
                    </div>
                    <div class="card-content">
                        <p><strong>Transport:</strong> ${server.config.transport}</p>
                        <p><strong>Endpoint:</strong> ${server.config.endpoint || server.config.command}</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-danger" onclick="dashboard.disconnectProxy('${server.id}')">Disconnect</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load proxy servers:', error);
        }
    }

    async createAgent() {
        const form = document.getElementById('agent-form');
        const data = {
            name: document.getElementById('agent-name').value,
            description: document.getElementById('agent-description').value,
            model: document.getElementById('agent-model').value,
            memoryDb: document.getElementById('agent-memory').value || undefined,
            systemPrompt: document.getElementById('agent-prompt').value || undefined,
            tools: document.getElementById('agent-tools').value
                ? document.getElementById('agent-tools').value.split(',').map(t => t.trim())
                : [],
            maxTokens: parseInt(document.getElementById('agent-tokens').value) || undefined,
            temperature: parseFloat(document.getElementById('agent-temperature').value) || undefined,
        };

        try {
            const response = await fetch(`${this.apiUrl}/agents/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                this.showToast(`Agent registered: ${result.agent.id}`);
                form.reset();
                document.getElementById('create-agent-form').classList.add('hidden');
                this.loadAgents();
            } else {
                const error = await response.json();
                this.showToast(`Error: ${error.error}`, 'error');
            }
        } catch (error) {
            this.showToast(`Error: ${error.message}`, 'error');
        }
    }

    async connectProxy() {
        const data = {
            id: document.getElementById('proxy-id').value,
            transport: document.getElementById('proxy-transport').value,
            endpoint: document.getElementById('proxy-endpoint').value,
            command: document.getElementById('proxy-endpoint').value,
        };

        try {
            const response = await fetch(`${this.apiUrl}/proxy/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                this.showToast(`Server connected: ${result.serverId}`);
                document.getElementById('proxy-form').reset();
                document.getElementById('connect-proxy-form').classList.add('hidden');
                this.loadProxyServers();
            } else {
                const error = await response.json();
                this.showToast(`Error: ${error.error}`, 'error');
            }
        } catch (error) {
            this.showToast(`Error: ${error.message}`, 'error');
        }
    }

    async toggleAgent(agentId, currentStatus) {
        try {
            const action = currentStatus === 'active' ? 'deactivate' : 'activate';
            const response = await fetch(`${this.apiUrl}/agents/${agentId}/${action}`, {
                method: 'POST',
            });

            if (response.ok) {
                this.showToast(`Agent ${action}d`);
                this.loadAgents();
            }
        } catch (error) {
            this.showToast(`Error: ${error.message}`, 'error');
        }
    }

    async removeAgent(agentId) {
        if (confirm('Are you sure you want to remove this agent?')) {
            try {
                const response = await fetch(`${this.apiUrl}/agents/${agentId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    this.showToast('Agent removed');
                    this.loadAgents();
                }
            } catch (error) {
                this.showToast(`Error: ${error.message}`, 'error');
            }
        }
    }

    async disconnectProxy(serverId) {
        if (confirm('Disconnect this proxy server?')) {
            try {
                const response = await fetch(`${this.apiUrl}/proxy/disconnect/${serverId}`, {
                    method: 'POST',
                });

                if (response.ok) {
                    this.showToast('Server disconnected');
                    this.loadProxyServers();
                }
            } catch (error) {
                this.showToast(`Error: ${error.message}`, 'error');
            }
        }
    }

    logActivity(message) {
        const log = document.getElementById('activity-log');
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        if (log.querySelector('.empty-state')) {
            log.innerHTML = '';
        }
        
        log.prepend(item);
        if (log.children.length > 20) {
            log.removeChild(log.lastChild);
        }
    }

    async loadMessagesTab() {
        try {
            const response = await fetch(`${this.apiUrl}/agents`);
            const data = await response.json();
            const select = document.getElementById('message-agent-select');
            select.innerHTML = '<option value="">Select agent...</option>';
            if (data.agents) {
                data.agents.forEach(agent => {
                    const opt = document.createElement('option');
                    opt.value = agent.id;
                    opt.textContent = `${agent.config.name} (${agent.metadata.unreadCount} unread)`;
                    select.appendChild(opt);
                });
            }
        } catch (error) {
            console.error('Failed to load agents for messages tab:', error);
        }
    }

    async loadAgentTriggersAndMessages() {
        const agentId = document.getElementById('message-agent-select').value;
        if (!agentId) {
            document.getElementById('triggers-list').innerHTML = '<p class="empty-state">Select an agent first</p>';
            document.getElementById('messages-list').innerHTML = '<p class="empty-state">Select an agent first</p>';
            return;
        }
        this.loadTriggerWords(agentId);
        this.loadMessages(agentId);
    }

    async loadTriggerWords(agentId) {
        try {
            const response = await fetch(`${this.apiUrl}/agents/${agentId}/triggers`);
            const data = await response.json();
            const list = document.getElementById('triggers-list');
            
            if (!data.triggers || data.triggers.length === 0) {
                list.innerHTML = '<p class="empty-state">No triggers. Add one above!</p>';
                return;
            }

            list.innerHTML = data.triggers.map(t => `
                <div class="trigger-badge">
                    <span>
                        ${t.phrase} 
                        <span style="font-size: 0.75rem; opacity: 0.7;">(${t.signalType})${t.caseSensitive ? ', CS' : ''}</span>
                    </span>
                    <button onclick="dashboard.removeTrigger('${agentId}', '${t.phrase}')">×</button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load triggers:', error);
        }
    }

    async addTriggerWord() {
        const agentId = document.getElementById('message-agent-select').value;
        if (!agentId) {
            this.showToast('Select an agent first', 'error');
            return;
        }

        const trigger = {
            phrase: document.getElementById('trigger-phrase').value,
            caseSensitive: document.getElementById('trigger-case-sensitive').checked,
            enabled: true,
            signalType: document.getElementById('trigger-signal').value,
        };

        if (!trigger.phrase) {
            this.showToast('Enter a trigger phrase', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/agents/${agentId}/triggers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(trigger),
            });

            if (response.ok) {
                this.showToast(`Trigger "${trigger.phrase}" added!`);
                document.getElementById('trigger-phrase').value = '';
                this.loadTriggerWords(agentId);
            }
        } catch (error) {
            this.showToast(`Error: ${error.message}`, 'error');
        }
    }

    async removeTrigger(agentId, phrase) {
        try {
            const response = await fetch(`${this.apiUrl}/agents/${agentId}/triggers/${encodeURIComponent(phrase)}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                this.showToast('Trigger removed');
                this.loadTriggerWords(agentId);
            }
        } catch (error) {
            this.showToast(`Error: ${error.message}`, 'error');
        }
    }

    async loadMessages(agentId) {
        try {
            const response = await fetch(`${this.apiUrl}/agents/${agentId}/messages`);
            const data = await response.json();
            const list = document.getElementById('messages-list');

            if (!data.messages || data.messages.length === 0) {
                list.innerHTML = '<p class="empty-state">No messages stored</p>';
                return;
            }

            list.innerHTML = data.messages.map(m => `
                <div class="message-item ${m.isPrivate ? 'private' : ''} ${m.isUnread ? 'unread' : ''}">
                    <div style="flex: 1;">
                        <div class="message-header">${m.from}</div>
                        <p>${m.content}</p>
                        <div class="message-meta">
                            ${new Date(m.timestamp).toLocaleString()}
                            <div class="message-badges" style="margin-top: 0.5rem;">
                                ${m.isPrivate ? '<span class="msg-badge private">🔒 Private</span>' : ''}
                                ${m.isUnread ? '<span class="msg-badge">📬 Unread</span>' : ''}
                            </div>
                        </div>
                    </div>
                    ${m.isUnread ? `<button class="btn btn-secondary" onclick="dashboard.markRead('${agentId}', '${m.id}')">Mark Read</button>` : ''}
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    async storeMessage() {
        const agentId = document.getElementById('message-agent-select').value;
        if (!agentId) {
            this.showToast('Select an agent first', 'error');
            return;
        }

        const msgData = {
            from: document.getElementById('msg-sender').value || 'System',
            content: document.getElementById('msg-content').value,
            isPrivate: document.getElementById('msg-private').checked,
            isUnread: document.getElementById('msg-unread').checked,
        };

        if (!msgData.content) {
            this.showToast('Enter message content', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/agents/${agentId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msgData),
            });

            if (response.ok) {
                this.showToast('Message stored!');
                document.getElementById('msg-content').value = '';
                document.getElementById('msg-sender').value = '';
                this.loadMessages(agentId);
            }
        } catch (error) {
            this.showToast(`Error: ${error.message}`, 'error');
        }
    }

    async markRead(agentId, messageId) {
        try {
            const response = await fetch(`${this.apiUrl}/agents/${agentId}/messages/${messageId}/read`, {
                method: 'POST',
            });

            if (response.ok) {
                this.loadMessages(agentId);
            }
        } catch (error) {
            this.showToast(`Error: ${error.message}`, 'error');
        }
    }

    switchMessageTab(type) {
        const agentId = document.getElementById('message-agent-select').value;
        if (!agentId) return;

        document.querySelectorAll('.message-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.msgType === type);
        });

        // Could filter messages by type here
    }

    // Settings Methods
    toggleEmeSettings(storageType) {
        const emeSettings = document.getElementById('eme-settings');
        if (storageType === 'eme') {
            emeSettings.classList.remove('hidden');
        } else {
            emeSettings.classList.add('hidden');
        }
    }

    async loadSettings() {
        try {
            const response = await fetch(`${this.apiUrl}/settings/chat-storage`);
            if (response.ok) {
                const settings = await response.json();
                this.displayCurrentSettings(settings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            // Use defaults
            this.displayCurrentSettings({
                storageType: 'internal',
                emeSettings: null
            });
        }
    }

    displayCurrentSettings(settings) {
        const container = document.getElementById('current-settings');
        const storageType = settings.storageType || 'internal';
        
        container.innerHTML = `
            <div class="settings-item">
                <strong>Storage Type:</strong> ${storageType === 'internal' ? 'Internal Memory' : 'EME Memory Engine'}
            </div>
        `;
        
        if (storageType === 'eme' && settings.emeSettings) {
            container.innerHTML += `
                <div class="settings-item">
                    <strong>EME Transport:</strong> ${settings.emeSettings.transport}
                </div>
                <div class="settings-item">
                    <strong>EME Endpoint:</strong> ${settings.emeSettings.endpoint}
                </div>
                <div class="settings-item">
                    <strong>EME Namespace:</strong> ${settings.emeSettings.namespace}
                </div>
            `;
        }
        
        // Update form
        document.getElementById('chat-storage-type').value = storageType;
        this.toggleEmeSettings(storageType);
        
        if (storageType === 'eme' && settings.emeSettings) {
            document.getElementById('eme-transport').value = settings.emeSettings.transport || 'stdio';
            document.getElementById('eme-endpoint').value = settings.emeSettings.endpoint || '';
            document.getElementById('eme-namespace').value = settings.emeSettings.namespace || 'gchat-conversations';
        }
    }

    async saveSettings() {
        const storageType = document.getElementById('chat-storage-type').value;
        const settings = {
            storageType
        };
        
        if (storageType === 'eme') {
            settings.emeSettings = {
                transport: document.getElementById('eme-transport').value,
                endpoint: document.getElementById('eme-endpoint').value,
                namespace: document.getElementById('eme-namespace').value || 'gchat-conversations'
            };
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/settings/chat-storage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            
            if (response.ok) {
                this.showToast('Settings saved successfully');
                this.loadSettings();
                
                // If EME is selected, try to connect automatically
                if (storageType === 'eme') {
                    this.connectToEme(settings.emeSettings);
                }
            } else {
                const error = await response.json();
                this.showToast(`Error: ${error.error}`, 'error');
            }
        } catch (error) {
            this.showToast(`Error: ${error.message}`, 'error');
        }
    }

    async connectToEme(emeSettings) {
        try {
            const response = await fetch(`${this.apiUrl}/proxy/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: 'eme-memory-engine',
                    transport: emeSettings.transport,
                    endpoint: emeSettings.transport === 'http' ? emeSettings.endpoint : undefined,
                    command: emeSettings.transport === 'stdio' ? emeSettings.endpoint : undefined
                })
            });
            
            if (response.ok) {
                this.showToast('EME connected successfully');
            } else {
                const error = await response.json();
                this.showToast(`EME connection failed: ${error.error}`, 'error');
            }
        } catch (error) {
            this.showToast(`EME connection error: ${error.message}`, 'error');
        }
    }

    async testEmeConnection() {
        const emeSettings = {
            transport: document.getElementById('eme-transport').value,
            endpoint: document.getElementById('eme-endpoint').value,
            namespace: document.getElementById('eme-namespace').value || 'gchat-conversations'
        };
        
        try {
            // Simple test - try to connect via proxy
            const response = await fetch(`${this.apiUrl}/proxy/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: 'eme-test-connection',
                    transport: emeSettings.transport,
                    endpoint: emeSettings.transport === 'http' ? emeSettings.endpoint : undefined,
                    command: emeSettings.transport === 'stdio' ? emeSettings.endpoint : undefined
                })
            });
            
            if (response.ok) {
                this.showToast('EME connection test successful');
                // Clean up test connection
                await fetch(`${this.apiUrl}/proxy/disconnect/eme-test-connection`, {
                    method: 'POST'
                });
            } else {
                const error = await response.json();
                this.showToast(`EME test failed: ${error.error}`, 'error');
            }
        } catch (error) {
            this.showToast(`EME test error: ${error.message}`, 'error');
        }
    }

    async resetSettings() {
        if (confirm('Reset all settings to defaults?')) {
            try {
                const response = await fetch(`${this.apiUrl}/settings/chat-storage`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    this.showToast('Settings reset to defaults');
                    this.loadSettings();
                }
            } catch (error) {
                this.showToast(`Error: ${error.message}`, 'error');
            }
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.style.display = 'block';
        toast.style.borderLeft = type === 'error' ? '4px solid #ff4444' : '4px solid var(--primary)';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

const dashboard = new AlsaniaDashboard();

// Load settings when settings tab is activated
document.addEventListener('DOMContentLoaded', () => {
    const settingsTab = document.querySelector('[data-tab="settings"]');
    if (settingsTab) {
        settingsTab.addEventListener('click', () => {
            setTimeout(() => dashboard.loadSettings(), 100);
        });
    }
});
