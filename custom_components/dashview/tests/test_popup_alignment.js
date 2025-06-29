// Test popup alignment with dashboard container
// Test file: test_popup_alignment.js

describe('Popup Alignment', () => {
  test('Popup content should align with dashboard container', () => {
    // Create a mock dashboard container
    const dashboardContainer = document.createElement('div');
    dashboardContainer.className = 'dashboard-container';
    dashboardContainer.style.maxWidth = '500px';
    dashboardContainer.style.margin = '0 auto';
    document.body.appendChild(dashboardContainer);

    // Create a mock popup
    const popup = document.createElement('div');
    popup.className = 'popup active';
    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';
    popup.appendChild(popupContent);
    document.body.appendChild(popup);

    // Get computed positions
    const dashboardRect = dashboardContainer.getBoundingClientRect();
    const popupContentRect = popupContent.getBoundingClientRect();

    // Check if they are horizontally aligned (within 1px tolerance)
    const dashboardCenter = dashboardRect.left + dashboardRect.width / 2;
    const popupCenter = popupContentRect.left + popupContentRect.width / 2;
    const alignment = Math.abs(dashboardCenter - popupCenter);

    console.log('Dashboard center:', dashboardCenter);
    console.log('Popup center:', popupCenter);
    console.log('Alignment difference:', alignment);

    // They should be aligned within 1px
    expect(alignment).toBeLessThan(1);

    // Cleanup
    document.body.removeChild(dashboardContainer);
    document.body.removeChild(popup);
  });
});