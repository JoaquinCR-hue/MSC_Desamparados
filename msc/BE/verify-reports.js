require('dotenv').config();
const { Report, Location, IncidentType } = require('./src/models');

async function check() {
  try {
    const reports = await Report.findAll({
      include: [
        { model: Location, as: 'location' },
        { model: IncidentType, as: 'incidentType' }
      ]
    });
    console.log('--- REPORTES EN BD ---');
    console.log(JSON.stringify(reports, null, 2));
    console.log('-----------------------');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
