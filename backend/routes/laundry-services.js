const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vault_db',
  password: 'postgres',
  port: 5432,
});

// Get all laundry services
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        service_id,
        name,
        description,
        price,
        laundry_price,
        dry_clean_price,
        ironing_price,
        category,
        cloth_type,
        icon,
        pickup,
        photo,
        created_at,
        updated_at
      FROM laundry_services 
      ORDER BY category, cloth_type, name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching laundry services:', error);
    res.status(500).json({ error: 'Failed to fetch laundry services' });
  }
});

// Get services by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const result = await pool.query(`
      SELECT 
        id,
        service_id,
        name,
        description,
        price,
        laundry_price,
        dry_clean_price,
        ironing_price,
        category,
        cloth_type,
        icon,
        pickup,
        photo,
        created_at,
        updated_at
      FROM laundry_services 
      WHERE category = $1
      ORDER BY cloth_type, name
    `, [category]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({ error: 'Failed to fetch services by category' });
  }
});

// Get services by cloth type
router.get('/cloth-type/:clothType', async (req, res) => {
  try {
    const { clothType } = req.params;
    const result = await pool.query(`
      SELECT 
        id,
        service_id,
        name,
        description,
        price,
        laundry_price,
        dry_clean_price,
        ironing_price,
        category,
        cloth_type,
        icon,
        pickup,
        photo,
        created_at,
        updated_at
      FROM laundry_services 
      WHERE cloth_type = $1
      ORDER BY name
    `, [clothType]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services by cloth type:', error);
    res.status(500).json({ error: 'Failed to fetch services by cloth type' });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        id,
        service_id,
        name,
        description,
        price,
        laundry_price,
        dry_clean_price,
        ironing_price,
        category,
        cloth_type,
        icon,
        pickup,
        photo,
        created_at,
        updated_at
      FROM laundry_services 
      WHERE id = $1 OR service_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Create new service
router.post('/', async (req, res) => {
  try {
    const {
      service_id,
      name,
      description,
      price,
      laundry_price,
      dry_clean_price,
      ironing_price,
      category,
      cloth_type,
      icon,
      pickup,
      photo
    } = req.body;

    // Validate required fields
    if (!service_id || !name || !price || !category || !cloth_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(`
      INSERT INTO laundry_services (
        service_id, name, description, price, laundry_price, dry_clean_price, ironing_price,
        category, cloth_type, icon, pickup, photo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      service_id, name, description, price || 0,
      laundry_price || price || 0, dry_clean_price || (price * 1.5) || 0, ironing_price || (price * 0.6) || 0,
      category, cloth_type, icon || 'fas fa-tshirt', pickup !== false, photo || ''
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Service ID already exists' });
    }
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update service
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      laundry_price,
      dry_clean_price,
      ironing_price,
      category,
      cloth_type,
      icon,
      pickup,
      photo
    } = req.body;

    const result = await pool.query(`
      UPDATE laundry_services 
      SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        laundry_price = COALESCE($5, laundry_price),
        dry_clean_price = COALESCE($6, dry_clean_price),
        ironing_price = COALESCE($7, ironing_price),
        category = COALESCE($8, category),
        cloth_type = COALESCE($9, cloth_type),
        icon = COALESCE($10, icon),
        pickup = COALESCE($11, pickup),
        photo = COALESCE($12, photo),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 OR service_id = $1
      RETURNING *
    `, [id, name, description, price, laundry_price, dry_clean_price, ironing_price, category, cloth_type, icon, pickup, photo]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      DELETE FROM laundry_services 
      WHERE id = $1 OR service_id = $1
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ message: 'Service deleted successfully', service: result.rows[0] });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Search services
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const result = await pool.query(`
      SELECT 
        id,
        service_id,
        name,
        description,
        price,
        laundry_price,
        dry_clean_price,
        ironing_price,
        category,
        cloth_type,
        icon,
        pickup,
        photo,
        created_at,
        updated_at
      FROM laundry_services 
      WHERE 
        name ILIKE $1 OR 
        description ILIKE $1 OR 
        cloth_type ILIKE $1 OR 
        category ILIKE $1
      ORDER BY category, cloth_type, name
    `, [`%${query}%`]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching services:', error);
    res.status(500).json({ error: 'Failed to search services' });
  }
});

module.exports = router;