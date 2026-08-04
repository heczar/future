const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function getPollinationsModels() {
  try {
    const res = await fetch("https://image.pollinations.ai/models");
    console.log("Status:", res.status);
    if (res.ok) {
      const data = await res.json();
      console.log("Active Models:", data);
    }
  } catch (err) {
    console.error("Err:", err.message);
  }
}

getPollinationsModels();
