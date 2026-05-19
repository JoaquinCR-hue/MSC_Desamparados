const { Sequelize } = require('sequelize');
const config = require('./src/config/config.json')['development'];
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false
});

async function check() {
  const [results] = await sequelize.query("SELECT r.id, r.date, i.name as tipo FROM Reports r LEFT JOIN IncidentTypes i ON r.incidentTypeId = i.id ORDER BY r.id DESC LIMIT 5");
  console.log(results);
  process.exit(0);
}
check();
