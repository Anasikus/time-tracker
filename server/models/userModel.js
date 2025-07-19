// server/models/userModel.js
import pool from '../db.js';

export async function getAllUsers() {
  const res = await pool.query('SELECT * FROM users');
  return res.rows;
}

export async function createUser({ name }) {
  const res = await pool.query(
    'INSERT INTO users (name) VALUES ($1) RETURNING *',
    [name]
  );
  return res.rows[0];
}
