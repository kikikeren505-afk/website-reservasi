import { Pool } from 'pg';

// Konfigurasi koneksi database PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
});

// Log koneksi
console.log('✅ PostgreSQL pool created successfully');
console.log(`📍 Connecting to Supabase PostgreSQL`);

// Helper: Convert ? placeholders to PostgreSQL $1, $2, $3 format
function convertToPostgreSQLParams(sql: string, params?: any[]): { sql: string; params: any[] } {
  if (!params || params.length === 0) {
    return { sql, params: [] };
  }
  
  let paramIndex = 1;
  const convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
  
  return { sql: convertedSql, params };
}

// Test koneksi database
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Query untuk multiple rows
export async function query(sql: string, params?: any[]) {
  try {
    const { sql: convertedSql, params: convertedParams } = convertToPostgreSQLParams(sql, params);
    const result = await pool.query(convertedSql, convertedParams);
    return result.rows;
  } catch (error: any) {
    console.error('❌ Database query error:', error.message);
    console.error('   SQL:', sql);
    console.error('   Params:', params);
    throw error;
  }
}

// Query untuk single row
export async function queryOne(sql: string, params?: any[]) {
  try {
    const { sql: convertedSql, params: convertedParams } = convertToPostgreSQLParams(sql, params);
    const result = await pool.query(convertedSql, convertedParams);
    return result.rows[0] || null;
  } catch (error: any) {
    console.error('❌ Database queryOne error:', error.message);
    console.error('   SQL:', sql);
    console.error('   Params:', params);
    throw error;
  }
}

// Insert data dan return ID
export async function insert(sql: string, params?: any[]) {
  try {
    const { sql: convertedSql, params: convertedParams } = convertToPostgreSQLParams(sql, params);
    const result = await pool.query(convertedSql + ' RETURNING id', convertedParams);
    return result.rows[0]?.id;
  } catch (error: any) {
    console.error('❌ Database insert error:', error.message);
    console.error('   SQL:', sql);
    console.error('   Params:', params);
    throw error;
  }
}

// Update/Delete data dan return affected rows
export async function execute(sql: string, params?: any[]) {
  try {
    const { sql: convertedSql, params: convertedParams } = convertToPostgreSQLParams(sql, params);
    const result = await pool.query(convertedSql, convertedParams);
    return result.rowCount || 0;
  } catch (error: any) {
    console.error('❌ Database execute error:', error.message);
    console.error('   SQL:', sql);
    console.error('   Params:', params);
    throw error;
  }
}

// Transaction support
export async function transaction(callback: (client: any) => Promise<any>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Close pool (untuk cleanup)
export async function closePool() {
  try {
    await pool.end();
    console.log('✅ Database pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
    throw error;
  }
}

// Export pool sebagai default
export default pool;