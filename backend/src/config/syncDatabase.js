const { sequelize } = require('../models');

const syncDatabase = async ({ alter = false, force = false } = {}) => {
  try {
    console.log('[Database Sync] Synchronizing database tables with Sequelize models...');
    await sequelize.sync({ alter, force });
    console.log('[Database Sync] Database models synchronized successfully with MySQL.');
  } catch (error) {
    console.error('[Database Sync] Error synchronizing database:', error);
    throw error;
  }
};

if (require.main === module) {
  syncDatabase({ alter: true })
    .then(() => {
      console.log('[Database Sync] Sync process completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Database Sync] Sync failed:', err);
      process.exit(1);
    });
}

module.exports = syncDatabase;
