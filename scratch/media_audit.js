const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('components.db', { readonly: true });

async function auditMedia() {
  const stats = {
    units: { total: 0, missingHero: 0 },
    activities: {
      flashcard: { total: 0, missingAudio: 0 },
      pronunciation: { total: 0, missingAudio: 0 },
      listening: { total: 0, missingAudio: 0 },
    }
  };

  // Units
  const units = db.prepare('SELECT id FROM units').all();
  stats.units.total = units.length;
  const unitImages = fs.existsSync('public/media/units') ? fs.readdirSync('public/media/units') : [];
  units.forEach(u => {
    if (!unitImages.some(img => img.includes(`unit_${u.id}`) || img.includes(`u${u.id}`))) {
      stats.units.missingHero++;
    }
  });

  // Activities
  const activities = db.prepare('SELECT id, type, data FROM activities').all();
  activities.forEach(a => {
    if (stats.activities[a.type] !== undefined) {
      stats.activities[a.type].total++;
      const data = JSON.parse(a.data);
      if (!data.audioSrc && !data.audio && (!data.words || data.words.every(w => !w.audioSrc))) {
        stats.activities[a.type].missingAudio++;
      } else if (JSON.stringify(data).includes('needed')) {
        stats.activities[a.type].missingAudio++;
      }
    }
  });

  console.log(JSON.stringify(stats, null, 2));
}

auditMedia();
db.close();
