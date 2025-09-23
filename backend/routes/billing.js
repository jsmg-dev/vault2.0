const express = require('express');
const router = express.Router();
const db = require('../db');

// Generate unique bill number
function generateBillNo() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `BILL-${timestamp}-${random}`;
}

// Create new bill
router.post('/create', async (req, res) => {
  try {
    const {
      customer_id,
      customer_name,
      customer_phone,
      customer_address,
      bill_date,
      due_date,
      bill_type = 'laundry',
      items,
      subtotal = 0,
      tax_amount = 0,
      discount_amount = 0,
      total_amount,
      paid_amount = 0,
      payment_method,
      notes,
      created_by
    } = req.body;

    // Validate required fields
    if (!customer_name || !total_amount) {
      return res.status(400).json({ error: 'Customer name and total amount are required' });
    }

    const bill_no = generateBillNo();
    const balance_amount = total_amount - paid_amount;
    const payment_status = paid_amount === 0 ? 'pending' : 
                          paid_amount < total_amount ? 'partial' : 'paid';

    // Insert main bill
    const billResult = await db.query(`
      INSERT INTO billing (
        bill_no, customer_id, customer_name, customer_phone, customer_address,
        bill_date, due_date, bill_type, items, subtotal, tax_amount, discount_amount,
        total_amount, paid_amount, balance_amount, payment_status, payment_method,
        notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `, [
      bill_no, customer_id, customer_name, customer_phone, customer_address,
      bill_date, due_date, bill_type, JSON.stringify(items), subtotal, tax_amount, discount_amount,
      total_amount, paid_amount, balance_amount, payment_status, payment_method,
      notes, created_by
    ]);

    const bill = billResult.rows[0];

    // Insert bill items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await db.query(`
          INSERT INTO billing_items (
            billing_id, item_name, item_description, quantity, unit_price, total_price, service_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          bill.id, item.name || item.item_name, item.description, 
          item.quantity || 1, item.price || item.unit_price, 
          item.total || item.total_price, item.service_type
        ]);
      }
    }

    // Insert payment record if paid_amount > 0
    if (paid_amount > 0) {
      await db.query(`
        INSERT INTO billing_payments (
          billing_id, payment_amount, payment_method, payment_reference, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [bill.id, paid_amount, payment_method, `PAY-${bill_no}`, notes, created_by]);
    }

    res.status(201).json(bill);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

// Get all bills
router.get('/', async (req, res) => {
  try {
    const { status, payment_status, bill_type, limit = 100, offset = 0 } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (payment_status) {
      paramCount++;
      whereClause += ` AND payment_status = $${paramCount}`;
      params.push(payment_status);
    }

    if (bill_type) {
      paramCount++;
      whereClause += ` AND bill_type = $${paramCount}`;
      params.push(bill_type);
    }

    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const bills = await db.query(`
      SELECT * FROM billing 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `, params);

    res.json(bills.rows);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Get bill by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const bill = await db.query('SELECT * FROM billing WHERE id = $1', [id]);
    if (bill.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Get bill items
    const items = await db.query('SELECT * FROM billing_items WHERE billing_id = $1', [id]);
    
    // Get payments
    const payments = await db.query('SELECT * FROM billing_payments WHERE billing_id = $1 ORDER BY payment_date DESC', [id]);

    res.json({
      ...bill.rows[0],
      items: items.rows,
      payments: payments.rows
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

// Update bill payment
router.put('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_amount, payment_method, payment_reference, notes, created_by } = req.body;

    if (!payment_amount || !payment_method) {
      return res.status(400).json({ error: 'Payment amount and method are required' });
    }

    // Get current bill
    const bill = await db.query('SELECT * FROM billing WHERE id = $1', [id]);
    if (bill.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const currentBill = bill.rows[0];
    const newPaidAmount = currentBill.paid_amount + parseFloat(payment_amount);
    const newBalanceAmount = currentBill.total_amount - newPaidAmount;
    const newPaymentStatus = newPaidAmount >= currentBill.total_amount ? 'paid' : 
                            newPaidAmount > 0 ? 'partial' : 'pending';

    // Update bill payment info
    await db.query(`
      UPDATE billing SET 
        paid_amount = $1, 
        balance_amount = $2, 
        payment_status = $3,
        payment_method = $4,
        payment_date = CASE WHEN $3 = 'paid' THEN NOW() ELSE payment_date END,
        updated_at = NOW()
      WHERE id = $5
    `, [newPaidAmount, newBalanceAmount, newPaymentStatus, payment_method, id]);

    // Insert payment record
    await db.query(`
      INSERT INTO billing_payments (
        billing_id, payment_amount, payment_method, payment_reference, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, payment_amount, payment_method, payment_reference, notes, created_by]);

    // Return updated bill
    const updatedBill = await db.query('SELECT * FROM billing WHERE id = $1', [id]);
    res.json(updatedBill.rows[0]);
  } catch (error) {
    console.error('Error updating bill payment:', error);
    res.status(500).json({ error: 'Failed to update bill payment' });
  }
});

// Update bill status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const result = await db.query(`
      UPDATE billing SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating bill status:', error);
    res.status(500).json({ error: 'Failed to update bill status' });
  }
});

// Delete bill
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM billing WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

// Get billing summary/statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { start_date, end_date, bill_type } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (start_date) {
      paramCount++;
      whereClause += ` AND bill_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      whereClause += ` AND bill_date <= $${paramCount}`;
      params.push(end_date);
    }

    if (bill_type) {
      paramCount++;
      whereClause += ` AND bill_type = $${paramCount}`;
      params.push(bill_type);
    }

    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_bills,
        SUM(total_amount) as total_amount,
        SUM(paid_amount) as total_paid,
        SUM(balance_amount) as total_balance,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_bills,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_bills,
        COUNT(CASE WHEN payment_status = 'partial' THEN 1 END) as partial_bills
      FROM billing 
      ${whereClause}
    `, params);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching billing stats:', error);
    res.status(500).json({ error: 'Failed to fetch billing stats' });
  }
});

module.exports = router;
