const mysql = require('mysql2/promise');
const fs = require('fs');

async function reset() {
  const env = fs.readFileSync('.env', 'utf8');
  const urlLine = env.split('\n').find(l => l.startsWith('DATABASE_URL='));
  const url = urlLine ? urlLine.split('=').slice(1).join('=') : '';
  
  if (!url) { console.error('No DATABASE_URL'); process.exit(1); }
  
  const conn = await mysql.createConnection(url);
  
  const [tables] = await conn.execute('SHOW TABLES');
  const names = tables.map(r => Object.values(r)[0]);
  console.log('Tables found:', names);
  
  for (const name of names) {
    await conn.execute(`DROP TABLE IF EXISTS \`${name}\``);
    console.log('Dropped:', name);
  }
  
  await conn.end();
  console.log('All tables dropped!');
}

reset().catch(e => { console.error(e); process.exit(1); });
