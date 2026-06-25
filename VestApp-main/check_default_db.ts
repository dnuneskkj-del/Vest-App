import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

async function inspect() {
  console.log("=== INSPECTING DEFAULT DATABASE ===");
  const app = initializeApp(firebaseConfig);
  
  // Connect to '(default)'
  const dbDefault = getFirestore(app, "(default)");
  try {
    const defaultUsers = await getDocs(collection(dbDefault, 'users'));
    console.log(`Default DB Users found: ${defaultUsers.size}`);
    defaultUsers.forEach(doc => {
      console.log(`- [default] UID: ${doc.id} | Name: ${doc.data().displayName} | Email: ${doc.data().email} | XP: ${doc.data().xp}`);
    });
  } catch (err) {
    console.error("Error reading default DB:", err);
  }

  // Connect to custom database
  const dbCustom = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  try {
    const customUsers = await getDocs(collection(dbCustom, 'users'));
    console.log(`Custom DB Users found: ${customUsers.size}`);
    customUsers.forEach(doc => {
      console.log(`- [custom] UID: ${doc.id} | Name: ${doc.data().displayName} | Email: ${doc.data().email} | XP: ${doc.data().xp}`);
    });
  } catch (err) {
    console.error("Error reading custom DB:", err);
  }
}

inspect();
