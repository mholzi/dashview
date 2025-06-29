// Test to verify popup alignment fix
// Test file: test_popup_alignment_fixed.js

const fs = require('fs');
const path = require('path');

describe('Popup Alignment Fix Verification', () => {
  let cssContent;

  beforeAll(() => {
    const cssPath = path.join(__dirname, '../www/style.css');
    cssContent = fs.readFileSync(cssPath, 'utf8');
  });

  test('Popup should have correct positioning properties', () => {
    const popupMatch = cssContent.match(/\.popup\s*{([^}]+)}/);
    expect(popupMatch).toBeTruthy();
    
    const popupStyles = popupMatch[1];
    
    // Should have align-items: flex-start instead of justify-content: center
    expect(popupStyles).toContain('align-items: flex-start');
    expect(popupStyles).not.toContain('justify-content: center');
    
    // Should have consistent padding with body
    expect(popupStyles).toContain('padding-left: 8px');
    expect(popupStyles).toContain('padding-right: 8px');
    expect(popupStyles).toContain('padding-top: 40px');
  });

  test('Popup content should have margin auto for centering', () => {
    const popupContentMatch = cssContent.match(/\.popup-content\s*{([^}]+)}/);
    expect(popupContentMatch).toBeTruthy();
    
    const popupContentStyles = popupContentMatch[1];
    
    // Should have margin: 0 auto for horizontal centering
    expect(popupContentStyles).toContain('margin: 0 auto');
    
    // Should maintain max-width and width properties
    expect(popupContentStyles).toContain('max-width: 500px');
    expect(popupContentStyles).toContain('width: 100%');
  });

  test('Dashboard container and popup content should use same centering approach', () => {
    const dashboardMatch = cssContent.match(/\.dashboard-container\s*{([^}]+)}/);
    const popupContentMatch = cssContent.match(/\.popup-content\s*{([^}]+)}/);
    
    expect(dashboardMatch).toBeTruthy();
    expect(popupContentMatch).toBeTruthy();
    
    const dashboardStyles = dashboardMatch[1];
    const popupContentStyles = popupContentMatch[1];
    
    // Both should use margin: 0 auto
    expect(dashboardStyles).toContain('margin: 0 auto');
    expect(popupContentStyles).toContain('margin: 0 auto');
    
    // Both should have max-width: 500px
    expect(dashboardStyles).toContain('max-width: 500px');
    expect(popupContentStyles).toContain('max-width: 500px');
  });

  test('Body and popup should have consistent padding', () => {
    const bodyMatch = cssContent.match(/body,\s*:host\s*{([^}]+)}/);
    const popupMatch = cssContent.match(/\.popup\s*{([^}]+)}/);
    
    expect(bodyMatch).toBeTruthy();
    expect(popupMatch).toBeTruthy();
    
    const bodyStyles = bodyMatch[1];
    const popupStyles = popupMatch[1];
    
    // Body has padding: 12px 8px
    expect(bodyStyles).toContain('padding: 12px 8px');
    
    // Popup should have matching 8px horizontal padding
    expect(popupStyles).toContain('padding-left: 8px');
    expect(popupStyles).toContain('padding-right: 8px');
  });
});