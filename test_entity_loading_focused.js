/**
 * Focused test to check entity loading initialization issue
 */

console.log('[Test] Analyzing entity loading initialization sequence...');

// Read the dashview-panel.js file to analyze the logic
const fs = require('fs');
const code = fs.readFileSync('custom_components/dashview/www/dashview-panel.js', 'utf8');

// Find the key methods
const setHassMatch = code.match(/set hass\(hass\) \{([\s\S]*?)\}/);
const handleHassUpdateMatch = code.match(/_handleHassUpdate\(\) \{([\s\S]*?)\}/);
const checkEntityChangesMatch = code.match(/_checkEntityChanges\(\) \{([\s\S]*?)\n  \}/);

console.log('\n[Analysis] Key methods found:');
console.log('- set hass() method:', !!setHassMatch);
console.log('- _handleHassUpdate() method:', !!handleHassUpdateMatch);
console.log('- _checkEntityChanges() method:', !!checkEntityChangesMatch);

if (setHassMatch && handleHassUpdateMatch && checkEntityChangesMatch) {
    const setHassCode = setHassMatch[1];
    const handleHassUpdateCode = handleHassUpdateMatch[1];
    const checkEntityChangesCode = checkEntityChangesMatch[1];
    
    console.log('\n[Analysis] set hass() logic:');
    console.log(setHassCode.trim());
    
    console.log('\n[Analysis] _handleHassUpdate() logic:');
    console.log(handleHassUpdateCode.trim());
    
    console.log('\n[Analysis] _checkEntityChanges() logic (first few lines):');
    console.log(checkEntityChangesCode.split('\n').slice(0, 15).join('\n'));
    
    // Check for the specific issue
    const checkForInitialStateLoad = checkEntityChangesCode.includes('_lastEntityStates.set') && 
                                     checkEntityChangesCode.includes('!lastState');
    
    console.log('\n[Analysis] Issue Detection:');
    console.log('- Does _checkEntityChanges() handle initial state (no lastState)?', checkForInitialStateLoad);
    
    // Check if set hass() calls _handleHassUpdate() when content is not ready
    const hassSetHandlesContentNotReady = setHassCode.includes('_contentReady') && 
                                          setHassCode.includes('_handleHassUpdate');
    
    console.log('- Does set hass() handle content not ready?', hassSetHandlesContentNotReady);
    
    // Check if loadContent() calls _handleHassUpdate() when hass exists
    const loadContentMatch = code.match(/async loadContent\(\) \{([\s\S]*?)\n  \}/);
    if (loadContentMatch) {
        const loadContentCode = loadContentMatch[1];
        const loadContentHandlesHass = loadContentCode.includes('this._hass') && 
                                       loadContentCode.includes('_handleHassUpdate');
        
        console.log('- Does loadContent() handle existing hass?', loadContentHandlesHass);
        
        // Look for the specific sequence
        const contentReadySequence = loadContentCode.includes('_contentReady = true') && 
                                     loadContentCode.includes('if (this._hass)');
        
        console.log('- Does loadContent() set _contentReady=true then check hass?', contentReadySequence);
    }
    
    // Analyze the potential issue
    console.log('\n[Diagnosis] Potential Issues:');
    
    // Issue 1: Race condition in initialization
    if (!hassSetHandlesContentNotReady) {
        console.log('🔴 Issue 1: When hass is set before content is ready, _handleHassUpdate() is not called');
        console.log('   This means initial entity states are not processed');
    }
    
    // Issue 2: No initial state population
    if (!checkForInitialStateLoad) {
        console.log('🔴 Issue 2: _checkEntityChanges() may not properly handle initial state loading');
        console.log('   This could cause entities to not be detected as "changed" on first load');
    }
    
    // Check if there's an initialization method that should be called
    const hasInitialUpdateMethod = code.includes('_performInitialUpdate') || 
                                   code.includes('_initializeEntityStates') ||
                                   code.includes('_loadInitialStates');
    
    console.log('- Has dedicated initial update method?', hasInitialUpdateMethod);
    
    if (!hasInitialUpdateMethod) {
        console.log('🔴 Issue 3: No dedicated method for initial entity state loading');
        console.log('   The system relies on change detection which may not work for initial load');
    }
}

console.log('\n[Test] Complete. Analysis suggests entity loading initialization issues.');