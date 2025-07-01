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
        // Update events when hass changes
        this.update();
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
            
            const response = await fetch(
                `/api/dashview/config?type=calendar_events&entity_ids=${encodeURIComponent(entityIds)}&start_date=${encodeURIComponent(startDateString)}&end_date=${encodeURIComponent(endDateString)}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this._events = data.events || [];
            
            // Render events
            this._renderEvents(cardElement);
            
        } catch (error) {
            console.error('[DashView] UpcomingEventsManager: Error fetching events:', error);
            this._showError(cardElement, 'Fehler beim Laden der Termine');
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

    _showError(cardElement, message) {
        const contentDiv = cardElement.querySelector('.upcoming-events-content');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="upcoming-events-error">
                    <i class="mdi mdi-alert-circle-outline"></i>
                    <div class="upcoming-events-error-text">${message}</div>
                </div>
            `;
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

        // Sort events by start time and get next 3 events
        const sortedEvents = this._sortEventsByTime(this._events);
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
        return new Date(0);
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