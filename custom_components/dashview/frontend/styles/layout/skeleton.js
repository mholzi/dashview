/**
 * Skeleton Loading Styles
 * Shimmer animations and placeholder components
 */

export const skeletonStyles = `
  /* ==================== SKELETON LOADING STATES ==================== */
  @keyframes skeleton-shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .skeleton {
    background: linear-gradient(
      90deg,
      var(--dv-gray100) 25%,
      var(--dv-gray200) 50%,
      var(--dv-gray100) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
    border-radius: var(--dv-radius-sm);
  }

  .skeleton-card {
    background: linear-gradient(
      90deg,
      var(--dv-gray000) 25%,
      var(--dv-gray100) 50%,
      var(--dv-gray000) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
    border-radius: var(--dv-radius-md);
  }

  .skeleton-text {
    height: 1em;
    margin: 4px 0;
  }

  .skeleton-text.large {
    height: 2em;
  }

  .skeleton-text.small {
    height: 0.75em;
    width: 60%;
  }

  .skeleton-icon {
    width: 50px;
    height: 50px;
    border-radius: var(--dv-radius-full);
  }

  .skeleton-room-card {
    height: 143px;
    display: flex;
    flex-direction: column;
    padding: 12px;
    gap: 8px;
  }

  .skeleton-room-card .skeleton-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .skeleton-room-card .skeleton-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 4px;
  }

  /* Floor overview loading state */
  .floor-overview-card.loading {
    background: var(--dv-gray000);
  }

  .floor-overview-card.loading .skeleton-slide {
    min-width: 100%;
    height: 143px;
    padding: 8px;
    display: grid;
    grid-template-areas: "n i" "temp temp";
    grid-template-rows: 1fr min-content;
    grid-template-columns: min-content 1fr;
  }

  .floor-overview-card.loading .skeleton-name {
    grid-area: n;
    width: 80px;
    height: 20px;
    margin: 14px;
  }

  .floor-overview-card.loading .skeleton-icon {
    grid-area: i;
    justify-self: end;
  }

  .floor-overview-card.loading .skeleton-temp {
    grid-area: temp;
    width: 60px;
    height: 32px;
    margin: 0 0 6px 14px;
  }

  /* Garbage card loading state */
  .garbage-card.loading {
    background: var(--dv-gray000);
  }

  .garbage-card.loading .skeleton-slide {
    min-width: 100%;
    height: 143px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .garbage-card.loading .skeleton-icon {
    align-self: flex-end;
    margin: -6px -6px 0 0;
  }

  .garbage-card.loading .skeleton-label {
    width: 80px;
    height: 28px;
    margin-top: auto;
  }

  .garbage-card.loading .skeleton-name {
    width: 100px;
    height: 16px;
  }
`;
