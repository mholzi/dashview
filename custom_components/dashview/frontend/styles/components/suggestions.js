/**
 * Suggestion Banner Styles
 * Contextual smart suggestions displayed above room cards
 */
export const suggestionStyles = `
/* ============================================
   Suggestion Banner
   ============================================ */

.suggestions-section {
  margin: 0 0 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 16px;
  animation: suggestionSlideIn 0.3s ease;
  position: relative;
  overflow: hidden;
}

.suggestion-banner.info {
  background: rgba(var(--rgb-primary-color, 33, 150, 243), 0.1);
}

.suggestion-banner.warning {
  background: var(--dv-yellow, rgba(255, 193, 7, 0.15));
}

.suggestion-banner-icon {
  font-size: 24px;
  flex-shrink: 0;
  line-height: 1;
}

.suggestion-banner-content {
  flex: 1;
  min-width: 0;
}

.suggestion-banner-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-text-color);
  line-height: 1.3;
}

.suggestion-banner-desc {
  font-size: 12px;
  color: var(--secondary-text-color);
  margin-top: 2px;
  line-height: 1.3;
}

.suggestion-banner-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.suggestion-action-btn {
  padding: 6px 16px;
  border-radius: 8px;
  border: none;
  background: var(--primary-color);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.suggestion-action-btn:active {
  opacity: 0.8;
}

.suggestion-dismiss-btn {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(128, 128, 128, 0.15);
  color: var(--secondary-text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease, background 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  padding: 0;
  font-size: 14px;
  line-height: 1;
}

.suggestion-dismiss-btn:active {
  opacity: 0.7;
  background: rgba(128, 128, 128, 0.25);
}

/* Slide-in animation */
@keyframes suggestionSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .suggestion-banner {
    animation: none;
  }
}

/* Mobile: stack actions below content on small screens */
@media (max-width: 380px) {
  .suggestion-banner {
    flex-wrap: wrap;
  }
  .suggestion-banner-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 4px;
  }
}
`;
