const express = require('express');
const router = express.Router();
const { query, one, many } = require('../db');

// Get all laundry customers
router.get('/', async (req, res) => {
  try {
    const customers = await many(`
      SELECT * FROM laundry_customers 
      ORDER BY created_at DESC
    `);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching laundry customers:', error);
    res.status(500).json({ error: 'Failed to fetch laundry customers' });
  }
});

// Get laundry customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await one('SELECT * FROM laundry_customers WHERE id = $1', [id]);
    
    if (!customer) {
      return res.status(404).json({ error: 'Laundry customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching laundry customer:', error);
    res.status(500).json({ error: 'Failed to fetch laundry customer' });
  }
});

// Create new laundry customer
router.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      alt_phone,
      address,
      email,
      status = 'received',
      expected_delivery_date,
      items,
      service_type,
      total_amount,
      special_instructions
    } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Calculate balance amount
    const balance_amount = total_amount ? total_amount - (req.body.paid_amount || 0) : 0;

    const result = await query(`
      INSERT INTO laundry_customers (
        name, phone, alt_phone, address, email, status, 
        expected_delivery_date, items, service_type, 
        total_amount, paid_amount, balance_amount, special_instructions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      name, phone, alt_phone, address, email, status,
      expected_delivery_date, items, service_type,
      total_amount, req.body.paid_amount || 0, balance_amount, special_instructions
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating laundry customer:', error);
    res.status(500).json({ error: 'Failed to create laundry customer' });
  }
});

// Update laundry customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      alt_phone,
      address,
      email,
      status,
      expected_delivery_date,
      delivery_date,
      items,
      service_type,
      total_amount,
      paid_amount,
      special_instructions
    } = req.body;

    // Calculate balance amount
    const balance_amount = total_amount ? total_amount - (paid_amount || 0) : 0;

    const result = await query(`
      UPDATE laundry_customers SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        alt_phone = COALESCE($3, alt_phone),
        address = COALESCE($4, address),
        email = COALESCE($5, email),
        status = COALESCE($6, status),
        expected_delivery_date = COALESCE($7, expected_delivery_date),
        delivery_date = COALESCE($8, delivery_date),
        items = COALESCE($9, items),
        service_type = COALESCE($10, service_type),
        total_amount = COALESCE($11, total_amount),
        paid_amount = COALESCE($12, paid_amount),
        balance_amount = COALESCE($13, balance_amount),
        special_instructions = COALESCE($14, special_instructions),
        updated_at = NOW()
      WHERE id = $15
      RETURNING *
    `, [
      name, phone, alt_phone, address, email, status,
      expected_delivery_date, delivery_date, items, service_type,
      total_amount, paid_amount, balance_amount, special_instructions, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Laundry customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating laundry customer:', error);
    res.status(500).json({ error: 'Failed to update laundry customer' });
  }
});

// Update laundry customer status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const result = await query(`
      UPDATE laundry_customers 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Laundry customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating laundry customer status:', error);
    res.status(500).json({ error: 'Failed to update laundry customer status' });
  }
});

// Delete laundry customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM laundry_customers WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Laundry customer not found' });
    }
    
    res.json({ message: 'Laundry customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting laundry customer:', error);
    res.status(500).json({ error: 'Failed to delete laundry customer' });
  }
});

// Get laundry customers by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const customers = await many(`
      SELECT * FROM laundry_customers 
      WHERE status = $1 
      ORDER BY created_at DESC
    `, [status]);
    
    res.json(customers);
  } catch (error) {
    console.error('Error fetching laundry customers by status:', error);
    res.status(500).json({ error: 'Failed to fetch laundry customers by status' });
  }
});

module.exports = router;
