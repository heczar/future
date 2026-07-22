async function testProductionStrategy() {
  console.log("--- TESTING PRODUCTION STRATEGY URL ---");
  try {
    const res = await fetch('https://futureia.vercel.app/api/gemini/generateContentStrategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Vende zapatos de cuero deportivos',
        context: 'Marca zapatería',
        styleReferences: [],
        logos: [],
        history: []
      })
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response Text:", text);
  } catch (err) {
    console.error("Error in production strategy fetch:", err);
  }
}

testProductionStrategy();
