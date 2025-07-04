// custom_components/dashview/www/lib/ui/UpcomingEventsManager.js

export class UpcomingEventsManager {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._shadowRoot = panel.shadowRoot;
        this._events = [];
        this._isLoading = false;
        this._updateInterval = null;
        this._currentEventIndex = 0;  // Track current displayed event
        this._calendarsMetadata = {};  // Store calendar colors and names
    }

    setHass(hass) {
        this._hass = hass;
        // Don't update on every hass change - let the periodic timer handle updates
        // Only update if we don't have events yet or if upcoming events card is visible
        if (!this._events || this._events.length === 0) {
            this.update();
        }
    }

    /**
     * Initialize the upcoming events card and set up periodic updates
     */
    initialize() {
        this.update();
        this._setupEventListeners();
        
        // Set up periodic updates every 5 minutes
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
        }
        this._updateInterval = setInterval(() => {
            this.update();
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Set up event listeners for the new control buttons
     */
    _setupEventListeners() {
        const nextEventBtn = this._shadowRoot.querySelector('#next-event-btn');
        const prevEventBtn = this._shadowRoot.querySelector('#prev-event-btn');
        const viewAllBtn = this._shadowRoot.querySelector('#view-all-events-btn');

        if (nextEventBtn) {
            nextEventBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._cycleToNextEvent();
            });
        }

        if (prevEventBtn) {
            prevEventBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._cycleToPreviousEvent();
            });
        }

        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                this._openCalendarPopup();
            });
        }

        // Make the header title clickable to open calendar popup
        const headerTitleSection = this._shadowRoot.querySelector('.upcoming-events-title-section');
        if (headerTitleSection) {
            headerTitleSection.style.cursor = 'pointer';
            headerTitleSection.addEventListener('click', () => {
                this._openCalendarPopup();
            });
        }
    }

    /**
     * Cycle to the next event in the list
     */
    _cycleToNextEvent() {
        if (this._events.length <= 1) return;
        
        this._currentEventIndex = (this._currentEventIndex + 1) % this._events.length;
        this._renderSingleEvent();
        this._updateNavigationButtons();
    }

    /**
     * Cycle to the previous event in the list
     */
    _cycleToPreviousEvent() {
        if (this._events.length <= 1) return;
        
        this._currentEventIndex = this._currentEventIndex === 0 
            ? this._events.length - 1 
            : this._currentEventIndex - 1;
        this._renderSingleEvent();
        this._updateNavigationButtons();
    }

    /**
     * Open the full calendar popup
     */
    _openCalendarPopup() {
        const calendarButton = this._shadowRoot.querySelector('[data-hash="#calendar"]');
        if (calendarButton) {
            calendarButton.click();
        }
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = null;
        }
    }

    /**
     * Update the upcoming events card
     */
    async update() {
        if (!this._hass || this._isLoading) return;

        const cardElement = this._shadowRoot.querySelector('.upcoming-events-container');
        if (!cardElement) return;

        console.log('[DashView] UpcomingEventsManager: Updating upcoming events card');

        try {
            await this._loadAndRenderEvents(cardElement);
        } catch (error) {
            console.error('[DashView] UpcomingEventsManager: Error updating events:', error);
            this._showError(cardElement, 'Error loading events');
        }
    }

    async _loadAndRenderEvents(cardElement) {
        this._isLoading = true;

        // Get linked calendars from house config
        const linkedCalendars = this._panel._houseConfig?.linked_calendars || [];
        
        if (linkedCalendars.length === 0) {
            this._showNoCalendars(cardElement);
            this._isLoading = false;
            return;
        }

        try {
            // Calculate date range for next 7 days
            const startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);
            endDate.setHours(23, 59, 59, 999);

            // Fetch events from backend
            const entityIds = linkedCalendars.join(',');
            const startDateString = startDate.toISOString();
            const endDateString = endDate.toISOString();
            
            console.log('[DashView] UpcomingEventsManager: Fetching events for calendars:', linkedCalendars);
            
            // Use hass.callApi for proper authentication with enhanced API
            const data = await this._hass.callApi(
                'GET',
                `dashview/config?type=calendar_events&calendar_ids=${encodeURIComponent(entityIds)}&start_date=${encodeURIComponent(startDateString)}&end_date=${encodeURIComponent(endDateString)}`
            );
            
            // Handle backend errors
            if (data.errors && data.errors.length > 0) {
                console.warn('[DashView] UpcomingEventsManager: Backend reported errors:', data.errors);
                this._showDetailedError(cardElement, data.errors);
                return;
            }
            
            this._events = data.events || [];
            this._calendarsMetadata = data.calendars || {};
            console.log('[DashView] UpcomingEventsManager: Successfully loaded', this._events.length, 'events');
            
            // Render events
            this._renderEvents(cardElement);
            
        } catch (error) {
            console.error('[DashView] UpcomingEventsManager: Error fetching events:', error);
            this._showError(cardElement, 'Fehler beim Laden der Termine', error.message);
        } finally {
            this._isLoading = false;
        }
    }

    _showNoCalendars(cardElement) {
        const contentDiv = cardElement.querySelector('.upcoming-events-content');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="upcoming-events-empty">
                    <div class="upcoming-events-empty-text">Keine Kalender konfiguriert</div>
                    <div class="upcoming-events-help">Kalender im Admin konfigurieren</div>
                </div>
            `;
        }
    }

    _showError(cardElement, message, details = null) {
        const contentDiv = cardElement.querySelector('.upcoming-events-content');
        if (contentDiv) {
            let errorHtml = `
                <div class="upcoming-events-error">
                    <i class="mdi mdi-alert-circle-outline"></i>
                    <div class="upcoming-events-error-text">${message}</div>
            `;
            
            if (details) {
                errorHtml += `<div class="upcoming-events-error-details">${this._escapeHtml(details)}</div>`;
            }
            
            errorHtml += `
                    <button class="upcoming-events-retry-button">Erneut versuchen</button>
                </div>
            `;
            
            contentDiv.innerHTML = errorHtml;
            
            // Add retry functionality
            const retryButton = contentDiv.querySelector('.upcoming-events-retry-button');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    this.update();
                });
            }
        }
    }

    _showDetailedError(cardElement, errors) {
        const contentDiv = cardElement.querySelector('.upcoming-events-content');
        if (contentDiv) {
            let errorMessages = [];
            
            errors.forEach(error => {
                switch (error.error_type) {
                    case 'entity_not_found':
                        errorMessages.push(`Kalender "${error.entity_id}" nicht gefunden`);
                        break;
                    case 'service_call_failed':
                        errorMessages.push(`Fehler beim Laden von "${error.entity_id}"`);
                        break;
                    default:
                        errorMessages.push(`Fehler: ${error.error}`);
                }
            });
            
            const errorHtml = `
                <div class="upcoming-events-error">
                    <i class="mdi mdi-alert-circle-outline"></i>
                    <div class="upcoming-events-error-text">Kalender-Konfigurationsfehler</div>
                    <div class="upcoming-events-error-list">
                        ${errorMessages.map(msg => `<div class="upcoming-events-error-item">• ${this._escapeHtml(msg)}</div>`).join('')}
                    </div>
                    <div class="upcoming-events-error-help">
                        Gehen Sie zu Admin → Kalender, um die Kalender-Konfiguration zu überprüfen.
                    </div>
                    <button class="upcoming-events-retry-button">Erneut versuchen</button>
                </div>
            `;
            
            contentDiv.innerHTML = errorHtml;
            
            // Add retry functionality
            const retryButton = contentDiv.querySelector('.upcoming-events-retry-button');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    this.update();
                });
            }
        }
    }

    _renderEvents(cardElement) {
        // Filter out finished events first
        const activeEvents = this._events.filter(event => !this._isEventFinished(event));
        
        if (activeEvents.length === 0) {
            this._showNoEvents(cardElement);
            return;
        }

        // Sort active events by start time
        this._events = this._sortEventsByTime(activeEvents);
        
        // Reset current index if it's out of bounds
        if (this._currentEventIndex >= this._events.length) {
            this._currentEventIndex = 0;
        }

        // Render the current single event
        this._renderSingleEvent();
        
        // Update control button states
        this._updateControlButtons(cardElement);
        
        // Update navigation buttons
        this._updateNavigationButtons();
    }

    _showNoEvents(cardElement) {
        const contentDiv = cardElement.querySelector('.upcoming-events-content');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="upcoming-events-empty">
                    <div class="upcoming-events-empty-text">Keine kommenden Termine</div>
                    <div class="upcoming-events-help">Ihr Kalender ist frei!</div>
                </div>
            `;
        }
        
        // Hide control buttons when no events
        const controlsDiv = cardElement.querySelector('.upcoming-events-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'none';
        }
    }

    _renderSingleEvent() {
        if (this._events.length === 0) return;

        const event = this._events[this._currentEventIndex];
        const sensorCard = this._shadowRoot.querySelector('.upcoming-event-card');
        const timeElement = this._shadowRoot.querySelector('.upcoming-event-time');
        const titleElement = this._shadowRoot.querySelector('.upcoming-event-title');

        // Check if event is currently active and add appropriate class
        if (sensorCard) {
            if (this._isEventActive(event)) {
                sensorCard.classList.add('is-on');
            } else {
                sensorCard.classList.remove('is-on');
            }
        }

        if (timeElement) {
            timeElement.textContent = this._getEventTimeDisplay(event);
        }

        if (titleElement) {
            titleElement.textContent = event.summary || event.title || 'Untitled Event';
        }

        // No calendar source indicator needed per requirements
    }

    _updateControlButtons(cardElement) {
        // Update navigation button states
        this._updateNavigationButtons();
        
        // Update footer visibility
        const footerDiv = cardElement.querySelector('.upcoming-events-footer');
        if (footerDiv) {
            footerDiv.style.display = this._events.length > 0 ? 'block' : 'none';
        }
    }

    _updateNavigationButtons() {
        const nextBtn = this._shadowRoot.querySelector('#next-event-btn');
        const prevBtn = this._shadowRoot.querySelector('#prev-event-btn');
        
        if (nextBtn && prevBtn) {
            // Show/hide buttons based on number of events
            const hasMultipleEvents = this._events.length > 1;
            nextBtn.style.display = hasMultipleEvents ? 'flex' : 'none';
            
            // Show previous button only if not on first event
            prevBtn.style.display = hasMultipleEvents && this._currentEventIndex > 0 ? 'flex' : 'none';
            
            // Update tooltips with current position
            if (hasMultipleEvents) {
                nextBtn.title = `Next Event (${this._currentEventIndex + 1}/${this._events.length})`;
                prevBtn.title = `Previous Event (${this._currentEventIndex + 1}/${this._events.length})`;
            }
        }
    }

    _sortEventsByTime(events) {
        return events.sort((a, b) => {
            const timeA = this._getEventStartTime(a);
            const timeB = this._getEventStartTime(b);
            
            // Handle invalid dates gracefully - put them at the end
            if (isNaN(timeA.getTime()) && isNaN(timeB.getTime())) return 0;
            if (isNaN(timeA.getTime())) return 1;
            if (isNaN(timeB.getTime())) return -1;
            
            return timeA - timeB;
        });
    }

    _getEventStartTime(event) {
        if (event.start) {
            if (typeof event.start === 'string') {
                return new Date(event.start);
            } else if (event.start.dateTime) {
                return new Date(event.start.dateTime);
            } else if (event.start.date) {
                return new Date(event.start.date);
            }
        }
        return new Date(NaN); // Return invalid date for missing start
    }

    _getEventEndTime(event) {
        if (event.end) {
            if (typeof event.end === 'string') {
                return new Date(event.end);
            } else if (event.end.dateTime) {
                return new Date(event.end.dateTime);
            } else if (event.end.date) {
                return new Date(event.end.date);
            }
        }
        // If no end time provided, fallback to start time
        return this._getEventStartTime(event);
    }


    _getEventTimeDisplay(event) {
        const startTime = this._getEventStartTime(event);
        
        if (this._isAllDayEvent(event)) {
            return 'Ganztägig';
        } else {
            // Always show time in HH:MM format for sensor-card layout
            return startTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
            });
        }
    }

    _isEventFinished(event) {
        const now = new Date();
        
        // All-day events should show for the entire day they occur
        if (this._isAllDayEvent(event)) {
            const eventDate = this._getEventStartTime(event);
            
            // Handle invalid dates gracefully
            if (isNaN(eventDate.getTime())) {
                return false; // If we can't parse the date, don't filter it out
            }
            
            const today = new Date();
            
            // Compare just the date parts (YYYY-MM-DD)
            const eventDateStr = eventDate.toISOString().split('T')[0];
            const todayDateStr = today.toISOString().split('T')[0];
            
            // All-day events are considered finished only if they're before today
            return eventDateStr < todayDateStr;
        }
        
        // For timed events, check if the end time has passed
        const endTime = this._getEventEndTime(event);
        
        // Handle invalid dates gracefully
        if (isNaN(endTime.getTime())) {
            return false; // If we can't parse the end time, don't filter it out
        }
        
        return now > endTime;
    }

    _isAllDayEvent(event) {
        if (event.start) {
            if (typeof event.start === 'string') {
                return !event.start.includes('T');
            } else if (event.start.date && !event.start.dateTime) {
                return true;
            }
        }
        return false;
    }

    _isEventToday(event) {
        const eventDate = this._getEventStartTime(event);
        const today = new Date();
        return eventDate.toDateString() === today.toDateString();
    }

    _isEventTomorrow(event) {
        const eventDate = this._getEventStartTime(event);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return eventDate.toDateString() === tomorrow.toDateString();
    }

    /**
     * Check if an event is currently active (happening now)
     * @param {Object} event - The event object
     * @returns {boolean} True if the event is currently active
     */
    _isEventActive(event) {
        const now = new Date();
        const startTime = this._getEventStartTime(event);
        const endTime = this._getEventEndTime(event);
        
        // Handle invalid dates gracefully
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            return false;
        }
        
        // For all-day events, check if today is the event day
        if (this._isAllDayEvent(event)) {
            return this._isEventToday(event);
        }
        
        // For timed events, check if current time is between start and end
        return now >= startTime && now <= endTime;
    }

    _getEventDateString(event) {
        const eventDate = this._getEventStartTime(event);
        return eventDate.toISOString().split('T')[0];
    }

    _formatDateShort(date) {
        const options = { 
            weekday: 'short', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}