/**
 * Confirmation Dialog Component
 *
 * A reusable modal dialog for confirming destructive actions.
 *
 * @fires confirm - Dispatched when the user confirms the action
 * @fires cancel - Dispatched when the user cancels the action
 *
 * @property {boolean} open - Whether the dialog is open
 * @property {string} title - The dialog title
 * @property {string} message - The confirmation message
 * @property {string} confirmText - Text for the confirm button (default: 'Confirm')
 * @property {string} cancelText - Text for the cancel button (default: 'Cancel')
 * @property {boolean} destructive - Whether this is a destructive action (changes button color)
 */

// Get LitElement and utilities from Home Assistant's ha-panel-lovelace
const getLitElement = async () => {
  await customElements.whenDefined("ha-panel-lovelace");
  const haPanel = customElements.get("ha-panel-lovelace");
  const LitElement = Object.getPrototypeOf(haPanel);
  const { html, css } = LitElement.prototype;
  return { LitElement, html, css };
};

getLitElement().then(({ LitElement, html, css }) => {
  class ConfirmationDialog extends LitElement {
    static get properties() {
      return {
        open: { type: Boolean, reflect: true },
        title: { type: String },
        message: { type: String },
        confirmText: { type: String, attribute: 'confirm-text' },
        cancelText: { type: String, attribute: 'cancel-text' },
        destructive: { type: Boolean }
      };
    }

    constructor() {
      super();
      this.open = false;
      this.title = '';
      this.message = '';
      this.confirmText = 'Confirm';
      this.cancelText = 'Cancel';
      this.destructive = false;
    }

    static get styles() {
      return css`
        :host {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: none;
          align-items: center;
          justify-content: center;
        }

        :host([open]) {
          display: flex;
        }

        .backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
        }

        .dialog {
          position: relative;
          background: var(--card-background-color, #fff);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          min-width: 300px;
          max-width: 500px;
          padding: 24px;
          z-index: 1;
        }

        .title {
          font-size: 20px;
          font-weight: 500;
          margin: 0 0 16px;
          color: var(--primary-text-color);
        }

        .message {
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 24px;
          color: var(--secondary-text-color);
        }

        .actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        button {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        button:hover {
          opacity: 0.9;
        }

        .cancel-btn {
          background: transparent;
          color: var(--primary-text-color);
        }

        .cancel-btn:hover {
          background: var(--secondary-background-color);
        }

        .confirm-btn {
          background: var(--primary-color);
          color: var(--text-primary-color, #fff);
        }

        .confirm-btn.destructive {
          background: var(--error-color, #db4437);
        }
      `;
    }

    render() {
      return html`
        <div class="backdrop" @click=${this._handleBackdropClick}></div>
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <h2 id="dialog-title" class="title">${this.title}</h2>
          <p class="message">${this.message}</p>
          <div class="actions">
            <button class="cancel-btn" @click=${this._handleCancel}>${this.cancelText}</button>
            <button class="confirm-btn ${this.destructive ? 'destructive' : ''}" @click=${this._handleConfirm}>
              ${this.confirmText}
            </button>
          </div>
        </div>
      `;
    }

    _handleConfirm() {
      this.dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
      this.open = false;
    }

    _handleCancel() {
      this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
      this.open = false;
    }

    _handleBackdropClick(e) {
      if (e.target.classList.contains('backdrop')) {
        this._handleCancel();
      }
    }

    connectedCallback() {
      super.connectedCallback();
      this._keyHandler = (e) => {
        if (e.key === 'Escape' && this.open) {
          this._handleCancel();
        }
      };
      document.addEventListener('keydown', this._keyHandler);
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      if (this._keyHandler) {
        document.removeEventListener('keydown', this._keyHandler);
      }
    }
  }

  customElements.define('confirmation-dialog', ConfirmationDialog);
});
