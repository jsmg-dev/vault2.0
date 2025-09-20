const express = require('express');
const router = express.Router();
const { query, one, many } = require('../db');

// Get all laundry services
router.get('/', async (req, res) => {
  try {
    const services = await many(`
      SELECT * FROM laundry_services 
      WHERE is_active = true 
      ORDER BY category, name
    `);
    res.json(services);
  } catch (error) {
    console.error('Error fetching laundry services:', error);
    res.status(500).json({ error: 'Failed to fetch laundry services' });
  }
});

// Get laundry service by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await one('SELECT * FROM laundry_services WHERE id = $1', [id]);
    
    if (!service) {
      return res.status(404).json({ error: 'Laundry service not found' });
    }
    
    res.json(service);
  } catch (error) {
    console.error('Error fetching laundry service:', error);
    res.status(500).json({ error: 'Failed to fetch laundry service' });
  }
});

// Create new laundry service
router.post('/', async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      description
    } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const result = await query(`
      INSERT INTO laundry_services (name, category, price, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, category, price, description]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating laundry service:', error);
    res.status(500).json({ error: 'Failed to create laundry service' });
  }
});

// Update laundry service
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      price,
      description,
      is_active
    } = req.body;

    const result = await query(`
      UPDATE laundry_services SET
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        price = COALESCE($3, price),
        description = COALESCE($4, description),
        is_active = COALESCE($5, is_active)
      WHERE id = $6
      RETURNING *
    `, [name, category, price, description, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Laundry service not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating laundry service:', error);
    res.status(500).json({ error: 'Failed to update laundry service' });
  }
});

// Delete laundry service (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      UPDATE laundry_services 
      SET is_active = false 
      WHERE id = $1 
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Laundry service not found' });
    }
    
    res.json({ message: 'Laundry service deactivated successfully' });
  } catch (error) {
    console.error('Error deleting laundry service:', error);
    res.status(500).json({ error: 'Failed to delete laundry service' });
  }
});

// Get services by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const services = await many(`
      SELECT * FROM laundry_services 
      WHERE category = $1 AND is_active = true 
      ORDER BY name
    `, [category]);
    
    res.json(services);
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({ error: 'Failed to fetch services by category' });
  }
});

module.exports = router;
