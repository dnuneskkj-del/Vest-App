const fs = require('fs');
const path = require('path');

async function testUpload() {
  const fileData = fs.readFileSync('package.json');
  const blob = new Blob([fileData]);
  const formData = new FormData();
  formData.append('file', blob, 'package.json');
  try {
    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    console.log('Upload response:', res.status, data);
  } catch (err) {
    console.error('Error:', err);
  }
}
testUpload();
