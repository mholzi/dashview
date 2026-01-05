/**
 * Coach Mark Styles
 * Styles for the first-run tutorial overlay
 */

export const coachMarkStyles = `
  /* ==================== COACH MARK ==================== */

  .coach-mark-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--dv-overlay-bg, rgba(0, 0, 0, 0.7));
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--dv-z-coach, 10000);
    padding: 20px;
    box-sizing: border-box;
    animation: coach-fade-in 0.3s ease-out;
    transition: opacity 0.2s ease-out;
  }

  .coach-mark-overlay.dismissing {
    opacity: 0;
  }

  .coach-mark-overlay.dismissing .coach-mark-card {
    transform: translateY(10px);
    opacity: 0;
  }

  @keyframes coach-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .coach-mark-card {
    background: var(--dv-popup-bg-color, #fafbfc);
    border-radius: var(--dv-radius-xl, 20px);
    padding: 24px;
    max-width: 320px;
    width: 100%;
    text-align: center;
    box-shadow: var(--dv-shadow-heavy, 0 8px 32px rgba(0, 0, 0, 0.3));
    animation: coach-slide-up 0.3s ease-out;
    transition: transform 0.2s ease-out, opacity 0.2s ease-out;
  }

  @keyframes coach-slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .coach-mark-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--dv-gray800, #0f0f10);
    margin-bottom: 24px;
  }

  .coach-hint {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--dv-gray000, #edeff2);
    border-radius: var(--dv-radius-md, 12px);
    margin-bottom: 12px;
  }

  .coach-hint:last-of-type {
    margin-bottom: 24px;
  }

  .gesture-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--dv-gray600, #494a4c);
    position: relative;
    flex-shrink: 0;
  }

  .coach-hint-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray700, #313233);
    text-align: left;
  }

  /* Swipe Animation */
  .swipe-animation .swipe-finger {
    position: absolute;
    width: 12px;
    height: 12px;
    background: var(--dv-blue, #c8ddfa);
    border-radius: 50%;
    bottom: 4px;
    left: 50%;
    animation: swipe-hint var(--dv-animation-coach, 2s ease-in-out) infinite;
  }

  @keyframes swipe-hint {
    0%, 100% {
      transform: translateX(-50%);
      opacity: 0.7;
    }
    25% {
      transform: translateX(calc(-50% + 16px));
      opacity: 1;
    }
    50% {
      transform: translateX(-50%);
      opacity: 0.7;
    }
    75% {
      transform: translateX(calc(-50% - 16px));
      opacity: 1;
    }
  }

  /* Press Animation */
  .press-animation .press-indicator {
    position: absolute;
    width: 24px;
    height: 24px;
    border: 2px solid var(--dv-blue, #c8ddfa);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: press-hint var(--dv-animation-coach, 2s ease-in-out) infinite;
  }

  @keyframes press-hint {
    0%, 100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.3;
    }
    50% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 1;
    }
  }

  .coach-dismiss {
    width: 100%;
    padding: 14px 24px;
    background: var(--dv-blue, #c8ddfa);
    color: var(--dv-gray800, #0f0f10);
    border: none;
    border-radius: var(--dv-radius-md, 12px);
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform var(--dv-transition-fast, 0.15s),
                box-shadow var(--dv-transition-fast, 0.15s);
    -webkit-tap-highlight-color: transparent;
  }

  .coach-dismiss:hover {
    transform: translateY(-1px);
    box-shadow: var(--dv-shadow-interactive, 0 4px 12px rgba(0, 0, 0, 0.15));
  }

  .coach-dismiss:active {
    transform: translateY(0);
    box-shadow: var(--dv-shadow-pressed, 0 2px 4px rgba(0, 0, 0, 0.1));
  }

  /* Dark mode adjustments */
  @media (prefers-color-scheme: dark) {
    .coach-mark-card {
      background: var(--dv-popup-bg-color, #28282A);
    }

    .coach-hint {
      background: var(--dv-gray100, #353637);
    }

    .coach-dismiss {
      background: var(--dv-blue, #abcbf8);
      color: var(--dv-gray800, #0f0f10);
    }
  }

  :host-context(html.dark-mode) .coach-mark-card,
  :host-context(body.dark-mode) .coach-mark-card,
  :host-context([data-theme="dark"]) .coach-mark-card {
    background: var(--dv-popup-bg-color, #28282A);
  }

  :host-context(html.dark-mode) .coach-hint,
  :host-context(body.dark-mode) .coach-hint,
  :host-context([data-theme="dark"]) .coach-hint {
    background: var(--dv-gray100, #353637);
  }

  :host-context(html.dark-mode) .coach-dismiss,
  :host-context(body.dark-mode) .coach-dismiss,
  :host-context([data-theme="dark"]) .coach-dismiss {
    background: var(--dv-blue, #abcbf8);
    color: var(--dv-white, #28282A);
  }
`;
