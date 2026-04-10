fetch('http://localhost:3000/api/roadmap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dreamCompany: "Google",
    targetRole: "Software Engineer",
    timelinMonths: 3,
    hoursPerDay: 4,
    focusAreas: ["dsa"]
  })
}).then(r => r.json()).then(console.log).catch(console.error);
