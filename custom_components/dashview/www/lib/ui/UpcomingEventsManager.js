// custom_components/dashview/www/lib/ui/UpcomingEventsManager.js

export class UpcomingEventsManager {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._shadowRoot = panel.shadowRoot;
        this._events = [];
        this._isLoading = false;
        this._updateInterval = null;
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
        
        // Set up periodic updates every 5 minutes
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
        }
        this._updateInterval = setInterval(() => {
            this.update();
        }, 5 * 60 * 1000); // 5 minutes
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

        const cardElement = this._shadowRoot.querySelector('.upcoming-events-card');
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
            
            // Use hass.callApi for proper authentication
            const data = await this._hass.callApi(
                'GET',
                `dashview/config?type=calendar_events&entity_ids=${encodeURIComponent(entityIds)}&start_date=${encodeURIComponent(startDateString)}&end_date=${encodeURIComponent(endDateString)}`
            );
            
            // Handle backend errors
            if (data.errors && data.errors.length > 0) {
                console.warn('[DashView] UpcomingEventsManager: Backend reported errors:', data.errors);
                this._showDetailedError(cardElement, data.errors);
                return;
            }
            
            this._events = data.events || [];
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
        const contentDiv = cardElement.querySelector('.upcoming-events-content');
        if (!contentDiv) return;

        if (this._events.length === 0) {
            contentDiv.innerHTML = `
                <div class="upcoming-events-empty">
                    <div class="upcoming-events-empty-text">Keine kommenden Termine</div>
                    <div class="upcoming-events-help">Ihr Kalender ist frei!</div>
                </div>
            `;
            return;
        }

        // Filter out finished events first
        const activeEvents = this._events.filter(event => !this._isEventFinished(event));
        
        if (activeEvents.length === 0) {
            contentDiv.innerHTML = `
                <div class="upcoming-events-empty">
                    <div class="upcoming-events-empty-text">Keine kommenden Termine</div>
                    <div class="upcoming-events-help">Ihr Kalender ist frei!</div>
                </div>
            `;
            return;
        }

        // Sort active events by start time and get next 3 events
        const sortedEvents = this._sortEventsByTime(activeEvents);
        const upcomingEvents = sortedEvents.slice(0, 3);

        let html = '';
        upcomingEvents.forEach(event => {
            html += this._renderEventItem(event);
        });

        contentDiv.innerHTML = html;

        // Add click handlers to open calendar popup
        this._addEventClickHandlers(contentDiv);
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

    _renderEventItem(event) {
        const title = this._escapeHtml(event.summary || event.title || 'Untitled Event');
        const timeDisplay = this._getEventTimeDisplay(event);
        const isToday = this._isEventToday(event);
        const calendarIcon = this._getCalendarIcon(event.calendar_entity_id);

        return `
            <div class="upcoming-event-item ${isToday ? 'upcoming-event-today' : ''}" data-event-date="${this._getEventDateString(event)}">
                <div class="upcoming-event-grid">
                    <div class="upcoming-event-icon">
                        <i class="mdi ${calendarIcon}"></i>
                    </div>
                    <div class="upcoming-event-time">${timeDisplay}</div>
                    <div class="upcoming-event-title">${title}</div>
                </div>
            </div>
        `;
    }

    _getEventTimeDisplay(event) {
        const startTime = this._getEventStartTime(event);
        const now = new Date();
        
        if (this._isAllDayEvent(event)) {
            if (this._isEventToday(event)) {
                return 'Heute';
            } else if (this._isEventTomorrow(event)) {
                return 'Morgen';
            } else {
                return this._formatDateShort(startTime);
            }
        } else {
            if (this._isEventToday(event)) {
                return startTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false
                });
            } else if (this._isEventTomorrow(event)) {
                return `Morgen, ${startTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false
                })}`;
            } else {
                return `${this._formatDateShort(startTime)}, ${startTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false
                })}`;
            }
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

    _getCalendarIcon(entityId) {
        // Default calendar icon
        let icon = 'mdi-calendar-blank';
        
        // Try to get more specific icon based on calendar name
        if (entityId) {
            const lowerName = entityId.toLowerCase();
            if (lowerName.includes('work') || lowerName.includes('office')) {
                icon = 'mdi-briefcase';
            } else if (lowerName.includes('family') || lowerName.includes('home')) {
                icon = 'mdi-home-group';
            } else if (lowerName.includes('holiday') || lowerName.includes('vacation')) {
                icon = 'mdi-airplane';
            } else if (lowerName.includes('birthday')) {
                icon = 'mdi-cake-variant';
            }
        }
        
        return icon;
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    _addEventClickHandlers(contentDiv) {
        const eventItems = contentDiv.querySelectorAll('.upcoming-event-item');
        eventItems.forEach(item => {
            item.addEventListener('click', () => {
                // Open calendar popup
                const calendarButton = this._shadowRoot.querySelector('[data-hash="#calendar"]');
                if (calendarButton) {
                    calendarButton.click();
                }
            });
        });

        // Also make the header clickable
        const headerElement = this._shadowRoot.querySelector('.upcoming-events-header');
        if (headerElement) {
            headerElement.style.cursor = 'pointer';
            headerElement.addEventListener('click', () => {
                const calendarButton = this._shadowRoot.querySelector('[data-hash="#calendar"]');
                if (calendarButton) {
                    calendarButton.click();
                }
            });
        }
    }
}