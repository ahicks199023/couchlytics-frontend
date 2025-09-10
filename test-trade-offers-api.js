// Test script to verify the trade offers API response structure
// Run this in the browser console on the trade offers page

async function testTradeOffersAPI() {
  console.log('🧪 Testing Trade Offers API...');
  
  try {
    const response = await fetch('/api/leagues/12335716/trade-offers', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response received:', data);
    
    // Test data structure
    if (data.sent && data.sent.length > 0) {
      const offer = data.sent[0];
      console.log('🔍 Testing first sent offer:', offer);
      
      // Check team data
      console.log('📋 Team Data Check:');
      console.log('  From team:', offer.from_team);
      console.log('  To team:', offer.to_team);
      
      if (offer.from_team) {
        console.log('  ✅ From team has data');
        console.log('    - Name:', offer.from_team.name);
        console.log('    - Abbreviation:', offer.from_team.abbreviation);
        console.log('    - City:', offer.from_team.city);
      } else {
        console.log('  ❌ From team is missing');
      }
      
      if (offer.to_team) {
        console.log('  ✅ To team has data');
        console.log('    - Name:', offer.to_team.name);
        console.log('    - Abbreviation:', offer.to_team.abbreviation);
        console.log('    - City:', offer.to_team.city);
      } else {
        console.log('  ❌ To team is missing');
      }
      
      // Check player data
      console.log('📋 Player Data Check:');
      console.log('  From players:', offer.fromPlayers);
      console.log('  To players:', offer.toPlayers);
      
      if (offer.fromPlayers && Array.isArray(offer.fromPlayers)) {
        console.log('  ✅ From players is array with', offer.fromPlayers.length, 'players');
        if (offer.fromPlayers.length > 0) {
          console.log('    - First player:', offer.fromPlayers[0]);
        }
      } else {
        console.log('  ❌ From players is missing or not array');
      }
      
      if (offer.toPlayers && Array.isArray(offer.toPlayers)) {
        console.log('  ✅ To players is array with', offer.toPlayers.length, 'players');
        if (offer.toPlayers.length > 0) {
          console.log('    - First player:', offer.toPlayers[0]);
        }
      } else {
        console.log('  ❌ To players is missing or not array');
      }
      
      // Check date data
      console.log('📋 Date Data Check:');
      console.log('  Created at:', offer.createdAt);
      console.log('  Expires at:', offer.expiresAt);
      
      if (offer.createdAt) {
        const createdDate = new Date(offer.createdAt);
        console.log('  ✅ Created date is valid:', createdDate.toLocaleDateString());
      } else {
        console.log('  ❌ Created date is missing');
      }
      
      if (offer.expiresAt) {
        const expiresDate = new Date(offer.expiresAt);
        console.log('  ✅ Expires date is valid:', expiresDate.toLocaleDateString());
      } else {
        console.log('  ❌ Expires date is missing');
      }
      
    } else {
      console.log('ℹ️ No sent offers found');
    }
    
    if (data.received && data.received.length > 0) {
      console.log('📋 Received offers:', data.received.length);
    } else {
      console.log('ℹ️ No received offers found');
    }
    
    console.log('🎉 API test completed successfully!');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

// Run the test
testTradeOffersAPI();
