const express = require("express");
const router = express.Router();
const pool = require("../db");

// =============================
// Get dashboard statistics
// =============================
router.get("/stats", async (req, res) => {
  try {
    const userId = req.session.userId;
    const userRole = req.session.userRole;
    
    // Build user filter for queries
    let userFilter = "";
    let queryParams = [];
    
    if (userRole !== 'admin') {
      userFilter = " WHERE created_by = $1";
      queryParams = [userId];
    }
    
    // Get total customers
    const customersResult = await pool.query(`SELECT COUNT(*) as total FROM customers${userFilter}`, queryParams);
    const totalCustomers = customersResult.rows[0].total;

    // Get total deposits amount
    const depositsResult = await pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM deposits${userFilter}`, queryParams);
    const totalDeposits = depositsResult.rows[0].total;

    // Get active loans (customers with status = 'active')
    const activeLoansResult = await pool.query(`SELECT COUNT(*) as total FROM customers WHERE status = 'active'${userFilter.replace('WHERE', 'AND')}`, queryParams);
    const activeLoans = activeLoansResult.rows[0].total;

    // Get monthly earnings (current month)
    const monthlyEarningsQuery = `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM deposits 
      WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE) 
      AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      ${userFilter.replace('WHERE', 'AND')}
    `;
    const monthlyEarningsResult = await pool.query(monthlyEarningsQuery, queryParams);
    const monthlyEarnings = monthlyEarningsResult.rows[0].total;

    // Get customers per month (last 6 months) - use created_at if start_date is null
    const customersPerMonthQuery = `
      WITH month_series AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE - INTERVAL '5 months'),
          date_trunc('month', CURRENT_DATE),
          '1 month'::interval
        ) as month
      ),
      customer_counts AS (
        SELECT 
          TO_CHAR(COALESCE(start_date, created_at::date), 'Mon') as month_name,
          EXTRACT(MONTH FROM COALESCE(start_date, created_at::date)) as month_num,
          COUNT(*) as count
        FROM customers 
        WHERE COALESCE(start_date, created_at::date) >= CURRENT_DATE - INTERVAL '6 months'
        ${userFilter.replace('WHERE', 'AND')}
        GROUP BY TO_CHAR(COALESCE(start_date, created_at::date), 'Mon'), EXTRACT(MONTH FROM COALESCE(start_date, created_at::date))
      )
      SELECT 
        TO_CHAR(ms.month, 'Mon') as month,
        COALESCE(cc.count, 0) as count
      FROM month_series ms
      LEFT JOIN customer_counts cc ON TO_CHAR(ms.month, 'Mon') = cc.month_name
      ORDER BY ms.month
    `;
    const customersPerMonthResult = await pool.query(customersPerMonthQuery, queryParams);
    
    const customersPerMonth = {};
    customersPerMonthResult.rows.forEach(row => {
      customersPerMonth[row.month] = parseInt(row.count);
    });

    // Get loan type distribution
    const loanTypeDistributionQuery = `
      SELECT 
        COALESCE(loan_type, 'Personal Loan') as loan_type,
        COUNT(*) as count
      FROM customers 
      ${userFilter}
      GROUP BY loan_type
      ORDER BY count DESC
    `;
    const loanTypeDistributionResult = await pool.query(loanTypeDistributionQuery, queryParams);
    
    const loanTypeDistribution = {};
    loanTypeDistributionResult.rows.forEach(row => {
      loanTypeDistribution[row.loan_type] = parseInt(row.count);
    });

    // Debug logging
    console.log('Dashboard Stats:', {
      totalCustomers: parseInt(totalCustomers),
      totalDeposits: parseFloat(totalDeposits),
      activeLoans: parseInt(activeLoans),
      monthlyEarnings: parseFloat(monthlyEarnings),
      customersPerMonthData: customersPerMonthResult.rows,
      customersPerMonth,
      loanTypeDistributionData: loanTypeDistributionResult.rows,
      loanTypeDistribution
    });

    res.json({
      totalCustomers: parseInt(totalCustomers),
      totalDeposits: parseFloat(totalDeposits),
      activeLoans: parseInt(activeLoans),
      monthlyEarnings: parseFloat(monthlyEarnings),
      customersPerMonth,
      loanTypeDistribution
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
