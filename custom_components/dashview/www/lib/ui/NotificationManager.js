// custom_components/dashview/www/lib/ui/NotificationManager.js

/**
 * NotificationManager - Persistent notification system for alerts, reminders, and status updates
 * 
 * Features:
 * - Persistent notification queue with configurable storage
 * - Different notification types and priorities
 * - Entity state triggers for automated notifications
 * - Dismissal and action buttons
 * - Sound notifications (optional)
 * - Automatic cleanup and expiration
 */
export class NotificationManager {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._shadowRoot = panel.shadowRoot;
        
        // State management
        this._notifications = new Map();
        this._persistentNotifications = [];
        this._activeTimers = new Map();
        this._triggers = new Map();
        this._config = {};
        this._notificationHistory = [];
        
        // UI elements
        this._container = null;
        this._isVisible = false;
        
        // Event handlers
        this._boundHandlers = {
            dismiss: this._handleDismiss.bind(this),
            action: this._handleAction.bind(this),
            entityChange: this._handleEntityChange.bind(this)
        };
        
        console.log('[NotificationManager] Initialized');
    }
    
    /**
     * Initialize the notification manager with container element
     */
    async initialize(container) {
        this._container = container;
        
        // Load configuration
        await this._loadConfig();
        
        // Load persistent notifications
        await this._loadPersistentNotifications();
        
        // Setup entity triggers
        this._setupEntityWatching();
        
        // Setup UI event listeners
        this._setupEventListeners();
        
        console.log('[NotificationManager] Initialized with container');
    }
    
    /**
     * Set the Home Assistant object and update state
     */
    setHass(hass) {
        this._hass = hass;
        
        // Re-setup entity watching when hass changes
        if (this._triggers.size > 0) {
            this._setupEntityWatching();
        }
        
        // Update notification displays with new entity states
        this._updateNotificationDisplays();
    }
    
    /**
     * Load notification configuration
     */
    async _loadConfig() {
        try {
            const response = await this._hass.callApi('GET', 'dashview/config?type=notifications');
            this._config = {
                enabled: true,
                max_persistent: 50,
                default_duration: 300,
                auto_dismiss: true,
                sound_enabled: false,
                persistent_notifications: [],
                entity_triggers: [],
                ...response
            };
            
            // Setup entity triggers from config
            this._config.entity_triggers.forEach(trigger => {
                this._triggers.set(trigger.entity_id, trigger);
            });
            
            console.log('[NotificationManager] Configuration loaded:', this._config);
        } catch (error) {
            console.error('[NotificationManager] Failed to load configuration:', error);
            // Use default config
            this._config = {
                enabled: true,
                max_persistent: 50,
                default_duration: 300,
                auto_dismiss: true,
                sound_enabled: false,
                persistent_notifications: [],
                entity_triggers: []
            };
        }
    }
    
    /**
     * Load persistent notifications from backend
     */
    async _loadPersistentNotifications() {
        try {
            this._persistentNotifications = this._config.persistent_notifications || [];
            
            // Restore persistent notifications that haven't been dismissed
            this._persistentNotifications
                .filter(n => !n.dismissed)
                .forEach(notification => {
                    this._notifications.set(notification.id, notification);
                });
                
            this._renderAllNotifications();
            console.log(`[NotificationManager] Loaded ${this._persistentNotifications.length} persistent notifications`);
        } catch (error) {
            console.error('[NotificationManager] Failed to load persistent notifications:', error);
        }
    }
    
    /**
     * Save persistent notifications to backend
     */
    async _savePersistentNotifications() {
        try {
            const configUpdate = {
                ...this._config,
                persistent_notifications: this._persistentNotifications
            };
            
            await this._hass.callApi('POST', 'dashview/config', {
                type: 'notifications',
                ...configUpdate
            });
            
            console.log('[NotificationManager] Persistent notifications saved');
        } catch (error) {
            console.error('[NotificationManager] Failed to save persistent notifications:', error);
        }
    }
    
    /**
     * Create a new notification
     */
    async createNotification(options) {
        if (!this._config.enabled) {
            console.log('[NotificationManager] Notifications disabled, skipping creation');
            return null;
        }
        
        const notification = {
            id: this._generateId(),
            type: options.type || 'info',
            title: options.title,
            message: options.message,
            timestamp: new Date().toISOString(),
            persistence: options.persistence || 'session',
            duration: options.duration || this._config.default_duration,
            dismissed: false,
            dismissible: options.dismissible !== false,
            priority: options.priority || 'medium',
            actions: options.actions || [],
            entity_id: options.entity_id,
            conditions: options.conditions
        };
        
        // Add to active notifications
        this._notifications.set(notification.id, notification);
        
        // Handle persistence
        if (notification.persistence === 'permanent') {
            this._persistentNotifications.push(notification);
            await this._savePersistentNotifications();
        }
        
        // Set duration timer
        if (notification.persistence === 'duration' || 
            (notification.persistence === 'session' && notification.duration > 0)) {
            this._setDismissalTimer(notification);
        }
        
        // Render notification
        this._renderNotification(notification);
        
        // Play sound if enabled
        if (this._config.sound_enabled) {
            this._playNotificationSound(notification.type, notification.priority);
        }
        
        // Emit event
        this._emitNotificationEvent('created', notification);
        
        console.log(`[NotificationManager] Created notification: ${notification.title}`);
        return notification.id;
    }
    
    /**
     * Dismiss a notification
     */
    async dismissNotification(notificationId) {
        const notification = this._notifications.get(notificationId);
        if (!notification) return;
        
        // Clear any active timer
        this._clearDismissalTimer(notificationId);
        
        // Mark as dismissed
        notification.dismissed = true;
        notification.dismissed_at = new Date().toISOString();
        
        // Remove from active notifications
        this._notifications.delete(notificationId);
        
        // Update persistent storage if needed
        if (notification.persistence === 'permanent') {
            const persistentIndex = this._persistentNotifications.findIndex(n => n.id === notificationId);
            if (persistentIndex !== -1) {
                this._persistentNotifications[persistentIndex].dismissed = true;
                this._persistentNotifications[persistentIndex].dismissed_at = notification.dismissed_at;
                await this._savePersistentNotifications();
            }
        }
        
        // Add to history
        this._addToHistory(notification);
        
        // Remove from DOM
        this._removeNotificationFromDOM(notificationId);
        
        // Emit event
        this._emitNotificationEvent('dismissed', notification);
        
        console.log(`[NotificationManager] Dismissed notification: ${notification.title}`);
    }
    
    /**
     * Setup entity watching for triggers
     */
    _setupEntityWatching() {
        if (!this._panel._stateManager || this._triggers.size === 0) return;
        
        // Watch for trigger entities
        this._triggers.forEach((trigger, entityId) => {
            this._panel._stateManager.watchEntities([entityId], (id, newState, oldState) => {
                this._evaluateTrigger(trigger, newState, oldState);
            });
        });
        
        console.log(`[NotificationManager] Watching ${this._triggers.size} entity triggers`);
    }
    
    /**
     * Evaluate if a trigger condition is met
     */
    _evaluateTrigger(trigger, newState, oldState) {
        if (!newState || !trigger.conditions) return;
        
        const condition = trigger.conditions;
        let shouldTrigger = false;
        
        switch (condition.trigger) {
            case 'state_change':
                shouldTrigger = this._evaluateStateCondition(condition.state, newState.state);
                break;
            case 'attribute_change':
                shouldTrigger = this._evaluateAttributeCondition(condition, newState.attributes);
                break;
            case 'value_threshold':
                shouldTrigger = this._evaluateThresholdCondition(condition, newState.state);
                break;
        }
        
        if (shouldTrigger) {
            const entityName = newState.attributes?.friendly_name || newState.entity_id;
            this.createNotification({
                type: trigger.notification_type || 'info',
                title: trigger.title.replace('{{entity_name}}', entityName),
                message: trigger.message.replace('{{state}}', newState.state).replace('{{entity_name}}', entityName),
                entity_id: trigger.entity_id,
                persistence: trigger.persistence || 'session',
                priority: trigger.priority || 'medium'
            });
        }
    }
    
    /**
     * Evaluate state condition
     */
    _evaluateStateCondition(condition, currentState) {
        if (condition.startsWith('>')) {
            const threshold = parseFloat(condition.substring(1));
            return parseFloat(currentState) > threshold;
        } else if (condition.startsWith('<')) {
            const threshold = parseFloat(condition.substring(1));
            return parseFloat(currentState) < threshold;
        } else {
            return currentState === condition;
        }
    }
    
    /**
     * Evaluate attribute condition
     */
    _evaluateAttributeCondition(condition, attributes) {
        const attributeValue = attributes[condition.attribute];
        if (!attributeValue) return false;
        
        return this._evaluateStateCondition(condition.state, attributeValue);
    }
    
    /**
     * Evaluate threshold condition
     */
    _evaluateThresholdCondition(condition, currentState) {
        return this._evaluateStateCondition(condition.state, currentState);
    }
    
    /**
     * Render all notifications
     */
    _renderAllNotifications() {
        if (!this._container) return;
        
        this._container.innerHTML = '';
        
        // Sort notifications by priority and timestamp
        const sortedNotifications = Array.from(this._notifications.values())
            .sort((a, b) => {
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                }
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
        
        sortedNotifications.forEach(notification => {
            this._renderNotification(notification);
        });
        
        // Update container visibility
        this._updateContainerVisibility();
    }
    
    /**
     * Render a single notification
     */
    _renderNotification(notification) {
        if (!this._container) return;
        
        const timeAgo = this._getTimeAgoText(notification.timestamp);
        const icon = this._getNotificationIcon(notification.type);
        
        const notificationEl = document.createElement('div');
        notificationEl.className = 'notification-card';
        notificationEl.dataset.notificationId = notification.id;
        notificationEl.dataset.type = notification.type;
        notificationEl.dataset.priority = notification.priority;
        
        notificationEl.innerHTML = `
            <div class="notification-icon-cell">
                <i class="mdi ${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-meta">
                    <span class="notification-time">${timeAgo}</span>
                    ${notification.entity_id ? `<span class="notification-entity">${this._getEntityName(notification.entity_id)}</span>` : ''}
                </div>
            </div>
            <div class="notification-actions">
                ${notification.actions.map(action => `
                    <button class="notification-action-btn" data-action-id="${action.id}">
                        ${action.label}
                    </button>
                `).join('')}
                ${notification.dismissible ? `
                    <button class="notification-dismiss-btn" data-action="dismiss">
                        <i class="mdi mdi-close"></i>
                    </button>
                ` : ''}
            </div>
        `;
        
        this._container.appendChild(notificationEl);
        this._updateContainerVisibility();
    }
    
    /**
     * Remove notification from DOM
     */
    _removeNotificationFromDOM(notificationId) {
        if (!this._container) return;
        
        const element = this._container.querySelector(`[data-notification-id="${notificationId}"]`);
        if (element) {
            element.style.animation = 'slideOutRight 0.3s ease-in-out';
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                    this._updateContainerVisibility();
                }
            }, 300);
        }
    }
    
    /**
     * Update container visibility based on notifications
     */
    _updateContainerVisibility() {
        if (!this._container) return;
        
        const hasNotifications = this._notifications.size > 0;
        this._container.style.display = hasNotifications ? 'flex' : 'none';
    }
    
    /**
     * Setup event listeners
     */
    _setupEventListeners() {
        if (!this._container) return;
        
        this._container.addEventListener('click', (event) => {
            const target = event.target;
            const notificationCard = target.closest('.notification-card');
            
            if (!notificationCard) return;
            
            const notificationId = notificationCard.dataset.notificationId;
            
            if (target.matches('.notification-dismiss-btn') || target.closest('.notification-dismiss-btn')) {
                this.dismissNotification(notificationId);
            } else if (target.matches('.notification-action-btn')) {
                const actionId = target.dataset.actionId;
                this._handleAction(notificationId, actionId);
            }
        });
    }
    
    /**
     * Handle notification action
     */
    async _handleAction(notificationId, actionId) {
        const notification = this._notifications.get(notificationId);
        if (!notification) return;
        
        const action = notification.actions.find(a => a.id === actionId);
        if (!action) return;
        
        try {
            if (action.service && action.entity_id) {
                const [domain, service] = action.service.split('.');
                await this._hass.callService(domain, service, {}, { entity_id: action.entity_id });
            }
            
            // Auto-dismiss after action if configured
            if (this._config.auto_dismiss) {
                await this.dismissNotification(notificationId);
            }
            
            console.log(`[NotificationManager] Executed action: ${action.label}`);
        } catch (error) {
            console.error('[NotificationManager] Failed to execute action:', error);
        }
    }
    
    /**
     * Set dismissal timer for notification
     */
    _setDismissalTimer(notification) {
        if (notification.duration <= 0) return;
        
        const timerId = setTimeout(() => {
            this.dismissNotification(notification.id);
        }, notification.duration * 1000);
        
        this._activeTimers.set(notification.id, timerId);
    }
    
    /**
     * Clear dismissal timer
     */
    _clearDismissalTimer(notificationId) {
        const timerId = this._activeTimers.get(notificationId);
        if (timerId) {
            clearTimeout(timerId);
            this._activeTimers.delete(notificationId);
        }
    }
    
    /**
     * Generate unique notification ID
     */
    _generateId() {
        return 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Get notification icon based on type
     */
    _getNotificationIcon(type) {
        const icons = {
            info: 'mdi-information',
            warning: 'mdi-alert',
            error: 'mdi-alert-circle',
            success: 'mdi-check-circle'
        };
        return icons[type] || icons.info;
    }
    
    /**
     * Get time ago text
     */
    _getTimeAgoText(timestamp) {
        try {
            // Import time utils if available
            import('./utils/time-utils.js').then(module => {
                if (module.calculateTimeDifferenceShort) {
                    return module.calculateTimeDifferenceShort(timestamp);
                }
            }).catch(() => {
                // Fallback if import fails
            });
            
            // Fallback implementation
            const now = new Date();
            const time = new Date(timestamp);
            const diffMs = now - time;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return 'jetzt';
            if (diffMins < 60) return `vor ${diffMins}m`;
            if (diffMins < 1440) return `vor ${Math.floor(diffMins / 60)}h`;
            return `vor ${Math.floor(diffMins / 1440)} Tagen`;
        } catch (error) {
            return 'vor kurzem';
        }
    }
    
    /**
     * Get entity friendly name
     */
    _getEntityName(entityId) {
        if (!this._hass || !entityId) return entityId;
        
        const state = this._hass.states[entityId];
        return state?.attributes?.friendly_name || entityId;
    }
    
    /**
     * Add notification to history
     */
    _addToHistory(notification) {
        const historyItem = {
            ...notification,
            dismissed_at: new Date().toISOString()
        };
        
        this._notificationHistory.unshift(historyItem);
        
        // Keep only last 100 items
        if (this._notificationHistory.length > 100) {
            this._notificationHistory = this._notificationHistory.slice(0, 100);
        }
    }
    
    /**
     * Update notification displays when hass changes
     */
    _updateNotificationDisplays() {
        // Update time ago texts and entity names
        this._notifications.forEach((notification, id) => {
            const element = this._container?.querySelector(`[data-notification-id="${id}"]`);
            if (element) {
                const timeElement = element.querySelector('.notification-time');
                if (timeElement) {
                    timeElement.textContent = this._getTimeAgoText(notification.timestamp);
                }
                
                if (notification.entity_id) {
                    const entityElement = element.querySelector('.notification-entity');
                    if (entityElement) {
                        entityElement.textContent = this._getEntityName(notification.entity_id);
                    }
                }
            }
        });
    }
    
    /**
     * Play notification sound
     */
    _playNotificationSound(type, priority) {
        if (!this._config.sound_enabled) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const frequencies = {
                'info': [800, 1000],
                'warning': [600, 800, 600],
                'error': [400, 300, 400],
                'success': [800, 1200, 800]
            };
            
            this._generateBeepSequence(audioContext, frequencies[type] || frequencies.info);
        } catch (error) {
            console.warn('[NotificationManager] Audio not supported:', error);
        }
    }
    
    /**
     * Generate beep sequence for sound notifications
     */
    _generateBeepSequence(audioContext, frequencies) {
        frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            
            const startTime = audioContext.currentTime + (index * 0.2);
            const duration = 0.1;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        });
    }
    
    /**
     * Emit notification lifecycle events
     */
    _emitNotificationEvent(eventType, notification) {
        const event = new CustomEvent(`dashview-notification-${eventType}`, {
            detail: { notification },
            bubbles: true
        });
        this._shadowRoot.dispatchEvent(event);
    }
    
    /**
     * Refresh notifications (called by refresh manager)
     */
    async refresh() {
        console.log('[NotificationManager] Refreshing notifications...');
        await this._loadConfig();
        await this._loadPersistentNotifications();
        this._updateNotificationDisplays();
    }
    
    /**
     * Get current notifications count
     */
    getNotificationCount() {
        return this._notifications.size;
    }
    
    /**
     * Get notifications by type
     */
    getNotificationsByType(type) {
        return Array.from(this._notifications.values()).filter(n => n.type === type);
    }
    
    /**
     * Clear all notifications
     */
    async clearAllNotifications() {
        const notificationIds = Array.from(this._notifications.keys());
        for (const id of notificationIds) {
            await this.dismissNotification(id);
        }
    }
    
    /**
     * Cleanup resources
     */
    dispose() {
        // Clear all active timers
        this._activeTimers.forEach(timerId => clearTimeout(timerId));
        this._activeTimers.clear();
        
        // Clear notifications
        this._notifications.clear();
        
        console.log('[NotificationManager] Disposed');
    }
}