const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'student_user',
  password: process.env.MYSQL_PASSWORD || 'StudentAppSecurePass2026!',
  database: process.env.MYSQL_DATABASE || 'student_management',
  port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

async function checkDatabaseConnection(retries = 15, delayMs = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await pool.getConnection();
      console.log(`[DB] Đã kết nối thành công tới MySQL Server (${process.env.MYSQL_HOST || 'localhost'}:${process.env.MYSQL_PORT || 3306})`);
      conn.release();
      return true;
    } catch (err) {
      console.warn(`[DB] Lần thử ${i}/${retries}: Chưa kết nối được MySQL. Thử lại sau ${delayMs / 1000}s... (${err.message})`);
      if (i === retries) {
        console.error('[DB] Không thể kết nối cơ sở dữ liệu sau nhiều lần thử!');
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = {
  pool,
  checkDatabaseConnection
};
