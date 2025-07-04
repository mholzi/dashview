// custom_components/dashview/www/lib/ui/CalendarManager.js

export class CalendarManager {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._shadowRoot = panel.shadowRoot;
        this._currentDay = 'heute';  // heute, morgen, übermorgen
        this._events = {};  // Events grouped by day
        this._calendarsMetadata = {};
        this._selectedCalendars = [];  // For filtering
        this._isLoading = false;
    }

    setHass(hass) {
        this._hass = hass;
    }

    async update(popupElement) {
        if (!popupElement || this._isLoading) return;
        
        console.log('[DashView] CalendarManager: Updating calendar popup');
        
        try {
            await this._setupEventListeners(popupElement);
            await this._loadCalendarMetadata();
            await this._loadEventsForCurrentDay(popupElement);
            // Note: _renderCurrentView is now called inside _loadEventsForCurrentDay after successful loading
        } catch (error) {
            console.error('[DashView] CalendarManager: Error updating calendar:', error);
            this._showError(popupElement, 'Error loading calendar events');
        }
    }

    async _setupEventListeners(popupElement) {
        // Day navigation buttons
        const dayButtons = popupElement.querySelectorAll('.calendar-day-btn');
        dayButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this._switchDay(btn.dataset.day, popupElement);
            });
        });

        // Calendar filter dropdown
        const filterBtn = popupElement.querySelector('.calendar-filter-btn');
        const filterOptions = popupElement.querySelector('.calendar-filter-options');
        
        if (filterBtn && filterOptions) {
            filterBtn.addEventListener('click', () => {
                const isVisible = filterOptions.style.display !== 'none';
                filterOptions.style.display = isVisible ? 'none' : 'block';
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!filterBtn.contains(e.target) && !filterOptions.contains(e.target)) {
                    filterOptions.style.display = 'none';
                }
            });
        }

        // Event modal close handlers
        const modalClose = popupElement.querySelector('.calendar-event-modal-close');
        const modalBackdrop = popupElement.querySelector('.calendar-event-modal-backdrop');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this._closeEventModal(popupElement);
            });
        }
        
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => {
                this._closeEventModal(popupElement);
            });
        }
    }

    _switchDay(day, popupElement) {
        if (this._currentDay === day) return;
        
        this._currentDay = day;
        
        // Update button states
        const dayButtons = popupElement.querySelectorAll('.calendar-day-btn');
        dayButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.day === day);
        });
        
        // Load events for new day
        this._loadEventsForCurrentDay(popupElement);
    }

    async _loadCalendarMetadata() {
        try {
            const data = await this._hass.callApi('GET', 'dashview/config?type=available_calendars');
            this._calendarsMetadata = {};
            
            data.forEach(calendar => {
                this._calendarsMetadata[calendar.entity_id] = {
                    friendly_name: calendar.friendly_name,
                    color: this._getCalendarColor(calendar.entity_id)
                };
            });
            
            // Initialize selected calendars with linked calendars if empty
            if (this._selectedCalendars.length === 0) {
                const linkedCalendars = this._panel._houseConfig?.linked_calendars || [];
                this._selectedCalendars = [...linkedCalendars];
            }
        } catch (error) {
            console.error('[DashView] CalendarManager: Error loading calendar metadata:', error);
        }
    }

    async _loadEventsForCurrentDay(popupElement) {
        this._isLoading = true;
        
        // Get linked calendars from house config
        const linkedCalendars = this._panel._houseConfig?.linked_calendars || [];
        
        // Ensure selected calendars is initialized with linked calendars
        if (this._selectedCalendars.length === 0) {
            this._selectedCalendars = [...linkedCalendars];
            console.log('[DashView] CalendarManager: Initialized selected calendars during load:', this._selectedCalendars);
        }
        
        if (linkedCalendars.length === 0) {
            this._showNoCalendars(popupElement);
            this._isLoading = false;
            return;
        }

        // Show loading state
        this._showLoading(popupElement);

        try {
            // Determine date filter based on current day
            let dateFilter = this._currentDay;
            
            // Fetch events for the current day from backend
            const entityIds = linkedCalendars.join(',');
            
            console.log('[DashView] CalendarManager: Fetching events for day:', this._currentDay, 'calendars:', linkedCalendars);
            console.log('[DashView] CalendarManager: API URL will be:', `dashview/config?type=calendar_events&calendar_ids=${encodeURIComponent(entityIds)}&date_filter=${dateFilter}`);
            
            // Use enhanced API with date filter
            const data = await this._hass.callApi(
                'GET',
                `dashview/config?type=calendar_events&calendar_ids=${encodeURIComponent(entityIds)}&date_filter=${dateFilter}`
            );
            
            console.log('[DashView] CalendarManager: API response received:', data);
            
            // Handle backend errors
            if (data.errors && data.errors.length > 0) {
                console.warn('[DashView] CalendarManager: Backend reported errors:', data.errors);
                this._showDetailedError(popupElement, data.errors);
                return;
            }
            
            // Store events for current day and calendar metadata
            this._events[this._currentDay] = data.events || [];
            this._calendarsMetadata = { ...this._calendarsMetadata, ...(data.calendars || {}) };
            
            console.log('[DashView] CalendarManager: Successfully loaded', this._events[this._currentDay].length, 'events for', this._currentDay);
            
            // Render the events after successful loading
            this._renderCurrentView(popupElement);
            
        } catch (error) {
            console.error('[DashView] CalendarManager: Error fetching events:', error);
            
            // Try fallback API call without date filter
            try {
                console.log('[DashView] CalendarManager: Attempting fallback API call...');
                const fallbackData = await this._hass.callApi(
                    'GET',
                    `dashview/config?type=calendar_events&entity_ids=${encodeURIComponent(entityIds)}`
                );
                
                console.log('[DashView] CalendarManager: Fallback API response:', fallbackData);
                
                if (fallbackData && fallbackData.events) {
                    this._events[this._currentDay] = fallbackData.events || [];
                    this._calendarsMetadata = { ...this._calendarsMetadata, ...(fallbackData.calendars || {}) };
                    
                    console.log('[DashView] CalendarManager: Fallback successful, loaded', this._events[this._currentDay].length, 'events');
                    this._renderCurrentView(popupElement);
                } else {
                    this._showError(popupElement, 'Fehler beim Laden der Termine', error.message);
                }
            } catch (fallbackError) {
                console.error('[DashView] CalendarManager: Fallback also failed:', fallbackError);
                this._showError(popupElement, 'Fehler beim Laden der Termine', `${error.message} (Fallback: ${fallbackError.message})`);
            }
        } finally {
            this._isLoading = false;
        }
    }

    _renderCurrentView(popupElement) {
        this._setupCalendarFilters(popupElement);
        this._renderEventsForCurrentDay(popupElement);
    }

    _setupCalendarFilters(popupElement) {
        const filterOptions = popupElement.querySelector('.calendar-filter-options');
        if (!filterOptions) return;

        const linkedCalendars = this._panel._houseConfig?.linked_calendars || [];
        
        let html = '';
        linkedCalendars.forEach(calendarId => {
            const metadata = this._calendarsMetadata[calendarId] || {};
            const isSelected = this._selectedCalendars.includes(calendarId);
            
            html += `
                <label class="calendar-filter-option">
                    <input type="checkbox" value="${calendarId}" ${isSelected ? 'checked' : ''}>
                    <span class="calendar-indicator" style="background-color: ${metadata.color || '#cccccc'}"></span>
                    <span class="calendar-filter-name">${metadata.friendly_name || calendarId}</span>
                </label>
            `;
        });
        
        filterOptions.innerHTML = html;
        
        // Add change listeners
        filterOptions.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const calendarId = e.target.value;
                if (e.target.checked) {
                    if (!this._selectedCalendars.includes(calendarId)) {
                        this._selectedCalendars.push(calendarId);
                    }
                } else {
                    this._selectedCalendars = this._selectedCalendars.filter(id => id !== calendarId);
                }
                
                this._updateFilterButtonText(popupElement);
                this._renderEventsForCurrentDay(popupElement);
            });
        });
        
        this._updateFilterButtonText(popupElement);
    }

    _updateFilterButtonText(popupElement) {
        const filterBtn = popupElement.querySelector('.calendar-filter-btn span');
        const linkedCalendars = this._panel._houseConfig?.linked_calendars || [];
        
        if (filterBtn) {
            if (this._selectedCalendars.length === linkedCalendars.length) {
                filterBtn.textContent = 'Alle Kalender';
            } else if (this._selectedCalendars.length === 1) {
                const calendarId = this._selectedCalendars[0];
                const metadata = this._calendarsMetadata[calendarId] || {};
                filterBtn.textContent = metadata.friendly_name || calendarId;
            } else {
                filterBtn.textContent = `${this._selectedCalendars.length} Kalender`;
            }
        }
    }

    _renderEventsForCurrentDay(popupElement) {
        const eventsContainer = popupElement.querySelector('.calendar-events-container');
        if (!eventsContainer) {
            console.error('[DashView] CalendarManager: Calendar events container not found');
            return;
        }

        const dayEvents = this._events[this._currentDay] || [];
        console.log('[DashView] CalendarManager: Rendering events for', this._currentDay, '- total events:', dayEvents.length);
        
        // Ensure selected calendars is initialized
        if (this._selectedCalendars.length === 0) {
            const linkedCalendars = this._panel._houseConfig?.linked_calendars || [];
            this._selectedCalendars = [...linkedCalendars];
            console.log('[DashView] CalendarManager: Initialized selected calendars:', this._selectedCalendars);
        }
        
        // Filter events by selected calendars - if no calendars selected, show all events
        let filteredEvents;
        if (this._selectedCalendars.length === 0) {
            filteredEvents = dayEvents;
            console.log('[DashView] CalendarManager: No selected calendars, showing all events');
        } else {
            filteredEvents = dayEvents.filter(event => 
                this._selectedCalendars.includes(event.calendar_entity_id)
            );
        }
        
        console.log('[DashView] CalendarManager: Filtered events:', filteredEvents.length, 'from', dayEvents.length, 'total events');
        console.log('[DashView] CalendarManager: Selected calendars:', this._selectedCalendars);
        console.log('[DashView] CalendarManager: Event calendar IDs:', dayEvents.map(e => e.calendar_entity_id));

        if (filteredEvents.length === 0) {
            eventsContainer.innerHTML = `
                <div class="calendar-no-events">
                    <i class="mdi mdi-calendar-check"></i>
                    <p>Keine Termine ${this._getDayLabel()}</p>
                    <p class="help-text">Ihr Kalender ist frei!</p>
                </div>
            `;
            return;
        }

        // Sort events by time
        const sortedEvents = filteredEvents.sort((a, b) => {
            const timeA = this._getEventStartTime(a);
            const timeB = this._getEventStartTime(b);
            return timeA - timeB;
        });

        let html = `<div class="calendar-day-header">${this._getDayLabel()}</div>`;
        html += '<div class="calendar-events-list">';
        
        sortedEvents.forEach(event => {
            html += this._renderEventItem(event);
        });
        
        html += '</div>';
        
        console.log('[DashView] CalendarManager: Setting events container HTML, length:', html.length);
        eventsContainer.innerHTML = html;
        console.log('[DashView] CalendarManager: Events container updated successfully');
        
        // Add event click listeners
        this._addEventClickListeners(eventsContainer);
    }

    _getDayLabel() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

        switch (this._currentDay) {
            case 'heute':
                return `Heute, ${today.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}`;
            case 'morgen':
                return `Morgen, ${tomorrow.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}`;
            case 'übermorgen':
                return `Übermorgen, ${dayAfterTomorrow.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}`;
            default:
                return 'Events';
        }
    }

    _renderEventItem(event) {
        const title = event.summary || event.title || 'Untitled Event';
        const startTime = this._formatEventTime(event);
        const isAllDay = this._isAllDayEvent(event);
        const calendarMeta = this._calendarsMetadata[event.calendar_entity_id] || {};
        const calendarColor = calendarMeta.color || '#cccccc';
        
        return `
            <div class="calendar-event-item" data-event-id="${event.uid || event.id || Math.random()}">
                <div class="calendar-event-time">
                    ${isAllDay ? 'Ganztägig' : startTime}
                </div>
                <div class="calendar-event-content">
                    <div class="calendar-event-title">${this._escapeHtml(title)}</div>
                    <div class="calendar-event-calendar">
                        <span class="calendar-indicator" style="background-color: ${calendarColor}"></span>
                        <span class="calendar-name">${calendarMeta.friendly_name || event.calendar_entity_id}</span>
                    </div>
                    ${event.location ? `
                        <div class="calendar-event-details" style="display: none;">
                            <div class="calendar-event-location">
                                <i class="mdi mdi-map-marker"></i>
                                ${this._escapeHtml(event.location)}
                            </div>
                        </div>
                    ` : ''}
                    ${event.description ? `
                        <div class="calendar-event-details" style="display: none;">
                            <div class="calendar-event-description">
                                <i class="mdi mdi-text"></i>
                                ${this._escapeHtml(event.description)}
                            </div>
                        </div>
                    ` : ''}
                </div>
                ${(event.location || event.description) ? `
                    <button class="calendar-event-expand-btn">
                        <i class="mdi mdi-chevron-down"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }

    _addEventClickListeners(container) {
        // Event expand/collapse
        container.querySelectorAll('.calendar-event-expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventItem = btn.closest('.calendar-event-item');
                const details = eventItem.querySelectorAll('.calendar-event-details');
                const icon = btn.querySelector('i');
                
                details.forEach(detail => {
                    const isVisible = detail.style.display !== 'none';
                    detail.style.display = isVisible ? 'none' : 'block';
                });
                
                icon.classList.toggle('mdi-chevron-down');
                icon.classList.toggle('mdi-chevron-up');
            });
        });
        
        // Event click for details modal
        container.querySelectorAll('.calendar-event-item').forEach(item => {
            item.addEventListener('click', () => {
                // Find the event data
                const eventId = item.dataset.eventId;
                const dayEvents = this._events[this._currentDay] || [];
                const event = dayEvents.find(e => (e.uid || e.id || Math.random()) == eventId);
                
                if (event) {
                    this._showEventModal(item.closest('.calendar-content'), event);
                }
            });
        });
    }

    _showEventModal(popupElement, event) {
        const modal = popupElement.querySelector('.calendar-event-modal');
        const modalBody = modal.querySelector('.calendar-event-modal-body');
        
        if (!modal || !modalBody) return;
        
        const calendarMeta = this._calendarsMetadata[event.calendar_entity_id] || {};
        const startTime = this._getEventStartTime(event);
        const endTime = this._getEventEndTime(event);
        const isAllDay = this._isAllDayEvent(event);
        
        let timeDisplay;
        if (isAllDay) {
            timeDisplay = 'Ganztägig';
        } else {
            const duration = Math.round((endTime - startTime) / (1000 * 60)); // minutes
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;
            let durationStr = '';
            if (hours > 0) durationStr += `${hours} Stunde${hours > 1 ? 'n' : ''}`;
            if (minutes > 0) durationStr += `${hours > 0 ? ' ' : ''}${minutes} Minute${minutes > 1 ? 'n' : ''}`;
            
            timeDisplay = `${this._formatEventTime(event)}${endTime ? ` - ${this._formatEventTime({ start: endTime })}` : ''} (${durationStr || '< 1 Minute'})`;
        }
        
        modalBody.innerHTML = `
            <div class="calendar-event-modal-title">
                <h4>${this._escapeHtml(event.summary || event.title || 'Untitled Event')}</h4>
                <div class="calendar-event-modal-calendar">
                    <span class="calendar-indicator" style="background-color: ${calendarMeta.color || '#cccccc'}"></span>
                    <span>${calendarMeta.friendly_name || event.calendar_entity_id}</span>
                </div>
            </div>
            
            <div class="calendar-event-modal-details">
                <div class="calendar-event-modal-detail">
                    <i class="mdi mdi-calendar"></i>
                    <strong>Datum:</strong> ${this._getDayLabel()}
                </div>
                <div class="calendar-event-modal-detail">
                    <i class="mdi mdi-clock"></i>
                    <strong>Zeit:</strong> ${timeDisplay}
                </div>
                ${event.location ? `
                    <div class="calendar-event-modal-detail">
                        <i class="mdi mdi-map-marker"></i>
                        <strong>Ort:</strong> ${this._escapeHtml(event.location)}
                    </div>
                ` : ''}
                ${event.description ? `
                    <div class="calendar-event-modal-detail">
                        <i class="mdi mdi-text"></i>
                        <strong>Beschreibung:</strong> ${this._escapeHtml(event.description)}
                    </div>
                ` : ''}
            </div>
        `;
        
        modal.style.display = 'block';
    }

    _closeEventModal(popupElement) {
        const modal = popupElement.querySelector('.calendar-event-modal');
        if (modal) {
            modal.style.display = 'none';
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