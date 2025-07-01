// custom_components/dashview/www/lib/ui/CalendarManager.js

export class CalendarManager {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._shadowRoot = panel.shadowRoot;
        this._currentDate = new Date();
        this._events = [];
        this._isLoading = false;
    }

    setHass(hass) {
        this._hass = hass;
    }

    async update(popupElement) {
        if (!popupElement || this._isLoading) return;
        
        console.log('[DashView] CalendarManager: Updating calendar popup');
        
        try {
            await this._loadAndRenderEvents(popupElement);
        } catch (error) {
            console.error('[DashView] CalendarManager: Error updating calendar:', error);
            this._showError(popupElement, 'Error loading calendar events');
        }
    }

    async _loadAndRenderEvents(popupElement) {
        this._isLoading = true;
        
        // Get linked calendars from house config
        const linkedCalendars = this._panel._houseConfig?.linked_calendars || [];
        
        if (linkedCalendars.length === 0) {
            this._showNoCalendars(popupElement);
            this._isLoading = false;
            return;
        }

        // Show loading state
        this._showLoading(popupElement);

        try {
            // Get display range from house config (default to 14 days)
            const displayRange = this._panel._houseConfig?.calendar_display_range || 14;
            
            // Calculate date range based on configured display range
            const startDate = new Date(this._currentDate);
            startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + displayRange - 1); // Configured range
            endDate.setHours(23, 59, 59, 999);

            // Fetch events from backend
            const entityIds = linkedCalendars.join(',');
            const startDateString = startDate.toISOString();
            const endDateString = endDate.toISOString();
            
            console.log('[DashView] CalendarManager: Fetching events for calendars:', linkedCalendars);
            
            // Use hass.callApi for proper authentication
            const data = await this._hass.callApi(
                'GET',
                `dashview/config?type=calendar_events&entity_ids=${encodeURIComponent(entityIds)}&start_date=${encodeURIComponent(startDateString)}&end_date=${encodeURIComponent(endDateString)}`
            );
            
            // Handle backend errors
            if (data.errors && data.errors.length > 0) {
                console.warn('[DashView] CalendarManager: Backend reported errors:', data.errors);
                this._showDetailedError(popupElement, data.errors);
                return;
            }
            
            this._events = data.events || [];
            console.log('[DashView] CalendarManager: Successfully loaded', this._events.length, 'events');
            
            // Render events
            this._renderEvents(popupElement);
            
        } catch (error) {
            console.error('[DashView] CalendarManager: Error fetching events:', error);
            this._showError(popupElement, 'Failed to load calendar events', error.message);
        } finally {
            this._isLoading = false;
        }
    }

    _showLoading(popupElement) {
        const contentDiv = popupElement.querySelector('.calendar-content') || 
                          popupElement.querySelector('.popup-content');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="calendar-loading">
                    <i class="mdi mdi-loading mdi-spin"></i>
                    <p>Loading calendar events...</p>
                </div>
            `;
        }
    }

    _showNoCalendars(popupElement) {
        const contentDiv = popupElement.querySelector('.calendar-content') || 
                          popupElement.querySelector('.popup-content');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="calendar-no-data">
                    <i class="mdi mdi-calendar-outline"></i>
                    <p>No calendars configured</p>
                    <p class="help-text">Go to Admin → Calendar to select calendars to display</p>
                </div>
            `;
        }
    }

    _showError(popupElement, message, details = null) {
        const contentDiv = popupElement.querySelector('.calendar-content') || 
                          popupElement.querySelector('.popup-content');
        if (contentDiv) {
            let errorHtml = `
                <div class="calendar-error">
                    <i class="mdi mdi-alert-circle-outline"></i>
                    <p>${message}</p>
            `;
            
            if (details) {
                errorHtml += `<p class="calendar-error-details">${this._escapeHtml(details)}</p>`;
            }
            
            errorHtml += `
                    <button class="calendar-retry-button">Retry</button>
                </div>
            `;
            
            contentDiv.innerHTML = errorHtml;
            
            // Add retry functionality
            const retryButton = contentDiv.querySelector('.calendar-retry-button');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    this.update(popupElement);
                });
            }
        }
    }

    _showDetailedError(popupElement, errors) {
        const contentDiv = popupElement.querySelector('.calendar-content') || 
                          popupElement.querySelector('.popup-content');
        if (contentDiv) {
            let errorMessages = [];
            
            errors.forEach(error => {
                switch (error.error_type) {
                    case 'entity_not_found':
                        errorMessages.push(`Calendar "${error.entity_id}" not found`);
                        break;
                    case 'service_call_failed':
                        errorMessages.push(`Failed to load "${error.entity_id}"`);
                        break;
                    default:
                        errorMessages.push(`Error: ${error.error}`);
                }
            });
            
            const errorHtml = `
                <div class="calendar-error">
                    <i class="mdi mdi-alert-circle-outline"></i>
                    <p>Calendar Configuration Error</p>
                    <div class="calendar-error-list">
                        ${errorMessages.map(msg => `<div class="calendar-error-item">• ${this._escapeHtml(msg)}</div>`).join('')}
                    </div>
                    <p class="calendar-error-help">
                        Go to Admin → Calendar to check your calendar configuration.
                    </p>
                    <button class="calendar-retry-button">Retry</button>
                </div>
            `;
            
            contentDiv.innerHTML = errorHtml;
            
            // Add retry functionality
            const retryButton = contentDiv.querySelector('.calendar-retry-button');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    this.update(popupElement);
                });
            }
        }
    }

    _renderEvents(popupElement) {
        const contentDiv = popupElement.querySelector('.calendar-content') || 
                          popupElement.querySelector('.popup-content');
        if (!contentDiv) return;

        if (this._events.length === 0) {
            contentDiv.innerHTML = `
                <div class="calendar-no-events">
                    <i class="mdi mdi-calendar-check"></i>
                    <p>No upcoming events</p>
                    <p class="help-text">Your calendars don't have any events in the next 2 weeks</p>
                </div>
            `;
            return;
        }

        // Group events by date
        const eventsByDate = this._groupEventsByDate(this._events);
        
        let html = `
            <div class="calendar-header">
                <button class="calendar-nav-button" id="calendar-prev-week">
                    <i class="mdi mdi-chevron-left"></i>
                </button>
                <h3>Upcoming Events</h3>
                <button class="calendar-nav-button" id="calendar-next-week">
                    <i class="mdi mdi-chevron-right"></i>
                </button>
            </div>
            <div class="calendar-events-container">
        `;

        // Render events grouped by date
        for (const [dateKey, events] of Object.entries(eventsByDate)) {
            const date = new Date(dateKey);
            const isToday = this._isToday(date);
            const isTomorrow = this._isTomorrow(date);
            
            let dateLabel;
            if (isToday) {
                dateLabel = 'Today';
            } else if (isTomorrow) {
                dateLabel = 'Tomorrow';
            } else {
                dateLabel = this._formatDate(date);
            }

            html += `
                <div class="calendar-day-section ${isToday ? 'calendar-today' : ''}">
                    <h4 class="calendar-day-header">${dateLabel}</h4>
                    <div class="calendar-day-events">
            `;

            events.forEach(event => {
                html += this._renderEvent(event);
            });

            html += `
                    </div>
                </div>
            `;
        }

        html += '</div>';
        
        contentDiv.innerHTML = html;
        
        // Add navigation event listeners
        this._addNavigationListeners(contentDiv, popupElement);
    }

    _groupEventsByDate(events) {
        const grouped = {};
        
        events.forEach(event => {
            let eventDate;
            
            // Handle different date formats
            if (event.start) {
                if (typeof event.start === 'string') {
                    eventDate = new Date(event.start);
                } else if (event.start.dateTime) {
                    eventDate = new Date(event.start.dateTime);
                } else if (event.start.date) {
                    eventDate = new Date(event.start.date);
                }
            }
            
            if (!eventDate || isNaN(eventDate.getTime())) {
                console.warn('[DashView] CalendarManager: Invalid event date:', event);
                return;
            }
            
            const dateKey = eventDate.toISOString().split('T')[0];
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(event);
        });
        
        // Sort events within each day by time
        Object.values(grouped).forEach(dayEvents => {
            dayEvents.sort((a, b) => {
                const timeA = this._getEventStartTime(a);
                const timeB = this._getEventStartTime(b);
                return timeA - timeB;
            });
        });
        
        return grouped;
    }

    _renderEvent(event) {
        const title = event.summary || event.title || 'Untitled Event';
        const startTime = this._formatEventTime(event);
        const isAllDay = this._isAllDayEvent(event);
        const calendarName = this._getCalendarName(event.calendar_entity_id);
        const calendarColor = this._getCalendarColor(event.calendar_entity_id);
        
        return `
            <div class="calendar-event ${isAllDay ? 'calendar-event-all-day' : ''}" style="border-left: 4px solid ${calendarColor};">
                <div class="calendar-event-time">
                    ${isAllDay ? 'All Day' : startTime}
                </div>
                <div class="calendar-event-details">
                    <div class="calendar-event-title">${this._escapeHtml(title)}</div>
                    ${calendarName ? `<div class="calendar-event-source" style="color: ${calendarColor};">${calendarName}</div>` : ''}
                    ${event.description ? `<div class="calendar-event-description">${this._escapeHtml(event.description)}</div>` : ''}
                </div>
            </div>
        `;
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

    _formatEventTime(event) {
        const startTime = this._getEventStartTime(event);
        if (this._isAllDayEvent(event)) {
            return 'All Day';
        }
        
        return startTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
    }

    _isAllDayEvent(event) {
        if (event.start) {
            // If start has only a date (no time), it's an all-day event
            if (typeof event.start === 'string') {
                return !event.start.includes('T');
            } else if (event.start.date && !event.start.dateTime) {
                return true;
            }
        }
        return false;
    }

    _getCalendarName(entityId) {
        if (!entityId) return null;
        
        const state = this._hass?.states?.[entityId];
        if (state?.attributes?.friendly_name) {
            return state.attributes.friendly_name;
        }
        
        // Extract name from entity ID
        return entityId.replace('calendar.', '').replace(/_/g, ' ');
    }

    _getCalendarColor(entityId) {
        if (!entityId) return '#cccccc'; // Default gray color
        
        // Get calendar colors from house config
        const calendarColors = this._panel._houseConfig?.calendar_colors || {};
        
        // Return configured color or default color
        return calendarColors[entityId] || '#cccccc';
    }

    _isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    _isTomorrow(date) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return date.toDateString() === tomorrow.toDateString();
    }

    _formatDate(date) {
        const options = { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    _addNavigationListeners(contentDiv, popupElement) {
        const prevButton = contentDiv.querySelector('#calendar-prev-week');
        const nextButton = contentDiv.querySelector('#calendar-next-week');
        
        // Get navigation step size based on display range
        const displayRange = this._panel._houseConfig?.calendar_display_range || 14;
        const navigationStep = this._getNavigationStep(displayRange);
        
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this._currentDate.setDate(this._currentDate.getDate() - navigationStep);
                this.update(popupElement);
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this._currentDate.setDate(this._currentDate.getDate() + navigationStep);
                this.update(popupElement);
            });
        }
    }

    _getNavigationStep(displayRange) {
        // For short ranges (1-3 days), navigate by 1 day
        // For longer ranges, navigate by 1 week
        if (displayRange <= 3) {
            return 1;
        }
        return 7;
    }
}