async function run() {
  const res = await fetch('http://localhost:3000/api/generate-question-resource', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: "O célebre aforismo de René Descartes, 'Penso, logo existo' (Cogito, ergo sum), constitui a base de qual corrente filosófica?",
      origin: "UNESP 2023",
      area: "Filosofia",
      options: ["Empirismo", "Racionalismo"]
    })
  });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}

run();
