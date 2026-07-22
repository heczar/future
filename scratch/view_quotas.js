const PROJECT_ID = "gen-lang-client-0242058740";
const DATABASE_ID = "ai-studio-940ee2eb-eba9-4b19-a623-7185c5a75909";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

async function run() {
  try {
    console.log("=== ANÁLISIS DE CONSUMOS DE USUARIO FIRESTORE ===");
    const usersRes = await fetch(`${BASE_URL}/users?pageSize=300`);
    if (!usersRes.ok) {
      throw new Error(`Error obteniendo usuarios: ${usersRes.statusText}`);
    }
    const usersData = await usersRes.json();
    if (usersData.documents) {
      for (const doc of usersData.documents) {
        const parts = doc.name.split('/');
        const id = parts[parts.length - 1];
        const email = doc.fields?.email?.stringValue || "";
        const isPremium = doc.fields?.isPremium?.booleanValue || false;
        
        let apiConsumption = {};
        if (doc.fields?.apiConsumption?.mapValue?.fields) {
          const fields = doc.fields.apiConsumption.mapValue.fields;
          apiConsumption = {
            dailyConsultsUsed: fields.dailyConsultsUsed?.integerValue || 0,
            dailyConsultsLimit: fields.dailyConsultsLimit?.integerValue || 0,
            monthlyTokensUsed: fields.monthlyTokensUsed?.integerValue || 0,
            monthlyTokensLimit: fields.monthlyTokensLimit?.integerValue || 0,
            monthlyImagesUsed: fields.monthlyImagesUsed?.integerValue || 0,
            monthlyImagesLimit: fields.monthlyImagesLimit?.integerValue || 0,
          };
        }
        
        console.log(`Usuario: ID=${id}`);
        console.log(`  Email: ${email}`);
        console.log(`  Premium: ${isPremium}`);
        console.log(`  Consumo:`, JSON.stringify(apiConsumption));
      }
    } else {
      console.log("No documents found in 'users' collection.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
