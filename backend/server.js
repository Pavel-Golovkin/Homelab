const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Подключение к PostgreSQL через переменную окружения
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Инициализация таблицы при запуске (идемпотентно: не упадет, если таблица уже есть)
const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        is_checked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  } finally {
    client.release();
  }
};

// --- API Эндпоинты ---

app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title, is_checked FROM todos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/todos', async (req, res) => {
  const { id, title, is_checked = false } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO todos (id, title, is_checked) VALUES ($1, $2, $3) RETURNING id, title, is_checked',
      [id, title, is_checked]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { title, is_checked } = req.body;
  try {
    const result = await pool.query(
      'UPDATE todos SET title = COALESCE($1, title), is_checked = COALESCE($2, is_checked) WHERE id = $3 RETURNING id, title, is_checked',
      [title, is_checked, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Todo not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM todos WHERE id = $1', [id]);
    res.status(204).send(); // 204 No Content - стандарт для успешного удаления
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Healthcheck для Kubernetes (важная SRE-практика!)
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  await initDb();
});