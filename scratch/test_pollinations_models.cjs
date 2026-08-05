async function testUrl(url) {
  console.log("Fetching URL:", url.substring(0, 120) + "...");
  try {
    const response = await globalThis.fetch(url);
    console.log("  Status Code:", response.status);
    console.log("  Content-Type:", response.headers.get("content-type"));
    if (!response.ok) {
      const errText = await response.text();
      console.log("  Error Preview:", errText.substring(0, 200));
    } else {
      console.log("  SUCCESS!");
    }
  } catch (err) {
    console.error("  Fetch threw error:", err.message);
  }
}

async function run() {
  const shortPrompt = "A professional corporate brand isotype for Botanica Garcia, flat vector, minimalist";
  const longPrompt = "A professional corporate brand isotype, flat vector design graphic, ultra-minimalist style. Professional brand mark for 'Botanica Garcia', a premium retail shop, embodying an organic and botanical aesthetic. Design features minimalist lines, symmetrical geometry, and meticulously crafted flat vector art with razor-sharp precision. Emphasize a clean spacing grid, refined visual hierarchy, and elegant, modern sans-serif typography. Rendered with high contrast on a deep, dark background, ensuring WCAG AA compliance. Presentation style: crisp focus, premium studio quality, inspired by the sophisticated visual impact of Vercel, Linear, and Stripe. Clean solid background, symmetrical modern geometry, sleek vector curves, sharp flat edges, inspired by Linear design system. No text, no watermark, rule of thirds layout.";

  console.log("--- TEST 1: short prompt, image.pollinations.ai, model=flux ---");
  await testUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(shortPrompt)}?width=1024&height=1024&seed=123&model=flux&nologo=true`);

  console.log("\n--- TEST 2: long prompt, image.pollinations.ai, model=flux ---");
  await testUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(longPrompt)}?width=1024&height=1024&seed=123&model=flux&nologo=true`);

  console.log("\n--- TEST 3: short prompt, gen.pollinations.ai, model=flux ---");
  await testUrl(`https://gen.pollinations.ai/image/${encodeURIComponent(shortPrompt)}?width=1024&height=1024&seed=123&model=flux&nologo=true`);
}

run();
