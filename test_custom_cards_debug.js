// Quick test script to check custom cards save functionality
// This will help us understand the persistence issue

const testCustomCardsAPI = async () => {
    console.log('[DashView Test] Testing custom cards persistence...');
    
    try {
        // Test data
        const testCustomCards = {
            test_card_1: {
                name: "Test Card 1",
                yaml_config: "type: markdown\ncontent: 'Hello World'"
            }
        };
        
        // Try to save
        console.log('[DashView Test] Saving test custom cards...');
        const saveResponse = await fetch('/api/dashview/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                config_type: 'custom_cards',
                config_payload: testCustomCards
            })
        });
        
        console.log('[DashView Test] Save response:', await saveResponse.text());
        
        // Try to load back
        console.log('[DashView Test] Loading custom cards...');
        const loadResponse = await fetch('/api/dashview/config?type=custom_cards');
        const loadedCards = await loadResponse.json();
        
        console.log('[DashView Test] Loaded custom cards:', loadedCards);
        
        // Check if persistence worked
        if (loadedCards && loadedCards.test_card_1) {
            console.log('[DashView Test] ✓ Persistence working correctly');
        } else {
            console.log('[DashView Test] ✗ Persistence failed - cards not saved');
        }
        
    } catch (error) {
        console.error('[DashView Test] Error testing custom cards:', error);
    }
};

// Run test if in browser
if (typeof window !== 'undefined') {
    testCustomCardsAPI();
}