async function run() {
  // Clean prompt: no ?, &, # or %
  const rawPrompt = "A professional corporate brand isotype, flat vector design graphic, ultra-minimalist style. Professional brand mark for 'Botanica Garcia', a premium retail shop, embodying an organic and botanical aesthetic. Design features minimalist lines, symmetrical geometry, and meticulously crafted flat vector art with razor-sharp precision. Emphasize a clean spacing grid, refined visual hierarchy, and elegant, modern sans-serif typography. Rendered with high contrast on a deep, dark background, ensuring WCAG AA compliance. Presentation style: crisp focus, premium studio quality, inspired by the sophisticated visual impact of Vercel, Linear, and Stripe. Clean solid background, symmetrical modern geometry, sleek vector curves, sharp flat edges, inspired by Linear design system. No text, no watermark, rule of thirds layout.";
  const cleanPrompt = rawPrompt.replace(/[\?&\#%]/g, '');
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&seed=456789&model=flux&nologo=true`;
  
  console.log("Fetching Pollinations URL directly (cleaned prompt):");
  try {
    const response = await globalThis.fetch(url);
    console.log("Status Code:", response.status);
    console.log("Headers content-type:", response.headers.get("content-type"));
    if (response.ok) {
      console.log("SUCCESS! Image loaded successfully from Pollinations.");
    } else {
      const text = await response.text();
      console.log("ERROR details:", text);
    }
  } catch (err) {
    console.error("Fetch threw error:", err);
  }
}

run();
