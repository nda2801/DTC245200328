const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'student_mysql',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'student_user',
  password: process.env.DB_PASSWORD || 'StudentSecurePass2026!',
  database: process.env.DB_NAME || 'student_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  charset: 'utf8mb4'
});

async function testConnection(retries = 10, delay = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await pool.getConnection();
      connection.release();
      return true;
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      await new Promise(res => setTimeout(res, delay));
    }
  }
  return false;
}

module.exports = {
  pool,
  testConnection
};
