const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vault_db',
  password: 'postgres',
  port: 5432,
});

async function migrateServices() {
  const client = await pool.connect();
  
  try {
    console.log('Starting services migration...');

    // Drop table if exists
    await client.query('DROP TABLE IF EXISTS laundry_services CASCADE;');
    console.log('Dropped existing laundry_services table');

    // Create laundry_services table
    await client.query(`
      CREATE TABLE laundry_services (
        id SERIAL PRIMARY KEY,
        service_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        laundry_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        dry_clean_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        ironing_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        category VARCHAR(50) NOT NULL,
        cloth_type VARCHAR(100) NOT NULL,
        icon VARCHAR(100) DEFAULT 'fas fa-tshirt',
        pickup BOOLEAN DEFAULT true,
        photo VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created laundry_services table');

    // Insert comprehensive services data
    const services = [
      // Men's Services
      { service_id: 'M001', name: 'Men Formal Shirt', description: 'Wash & Iron for Men Formal Shirts', price: 25, laundry_price: 25, dry_clean_price: 45, ironing_price: 15, category: 'Men', cloth_type: 'Formal Shirt', icon: 'fas fa-tshirt', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SHIRT' },
      { service_id: 'M002', name: 'Men Casual Shirt', description: 'Wash & Iron for Men Casual Shirts', price: 22, laundry_price: 22, dry_clean_price: 40, ironing_price: 12, category: 'Men', cloth_type: 'Casual Shirt', icon: 'fas fa-tshirt', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SHIRT' },
      { service_id: 'M003', name: 'Men T-Shirt', description: 'Wash & Iron for Men T-Shirts', price: 20, laundry_price: 20, dry_clean_price: 35, ironing_price: 10, category: 'Men', cloth_type: 'T-Shirt', icon: 'fas fa-tshirt', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SHIRT' },
      { service_id: 'M004', name: 'Men Polo Shirt', description: 'Wash & Iron for Men Polo Shirts', price: 23, laundry_price: 23, dry_clean_price: 38, ironing_price: 12, category: 'Men', cloth_type: 'Polo Shirt', icon: 'fas fa-tshirt', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SHIRT' },
      { service_id: 'M005', name: 'Men Jeans', description: 'Wash & Iron for Men Jeans', price: 30, laundry_price: 30, dry_clean_price: 50, ironing_price: 15, category: 'Men', cloth_type: 'Jeans', icon: 'fas fa-user', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=JEANS' },
      { service_id: 'M006', name: 'Men Formal Pants', description: 'Wash & Iron for Men Formal Pants', price: 28, laundry_price: 28, dry_clean_price: 45, ironing_price: 18, category: 'Men', cloth_type: 'Formal Pants', icon: 'fas fa-user-tie', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=PANTS' },
      { service_id: 'M007', name: 'Men Casual Pants', description: 'Wash & Iron for Men Casual Pants', price: 25, laundry_price: 25, dry_clean_price: 40, ironing_price: 15, category: 'Men', cloth_type: 'Casual Pants', icon: 'fas fa-user', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=PANTS' },
      { service_id: 'M008', name: 'Men Shorts', description: 'Wash & Iron for Men Shorts', price: 18, laundry_price: 18, dry_clean_price: 30, ironing_price: 10, category: 'Men', cloth_type: 'Shorts', icon: 'fas fa-user', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SHORTS' },
      { service_id: 'M009', name: 'Men Suit', description: 'Dry Clean for Men Suits', price: 150, laundry_price: 120, dry_clean_price: 150, ironing_price: 50, category: 'Men', cloth_type: 'Suit', icon: 'fas fa-user-tie', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SUIT' },
      { service_id: 'M010', name: 'Men Blazer', description: 'Dry Clean for Men Blazers', price: 120, laundry_price: 100, dry_clean_price: 120, ironing_price: 40, category: 'Men', cloth_type: 'Blazer', icon: 'fas fa-user-tie', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=BLAZER' },

      // Women's Services
      { service_id: 'W001', name: 'Women Saree', description: 'Wash & Iron for Women Sarees', price: 40, laundry_price: 40, dry_clean_price: 60, ironing_price: 20, category: 'Women', cloth_type: 'Saree', icon: 'fas fa-female', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=SAREE' },
      { service_id: 'W002', name: 'Women Salwar Kameez', description: 'Wash & Iron for Women Salwar Kameez', price: 35, laundry_price: 35, dry_clean_price: 55, ironing_price: 18, category: 'Women', cloth_type: 'Salwar Kameez', icon: 'fas fa-female', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=SALWAR' },
      { service_id: 'W003', name: 'Women Kurti', description: 'Wash & Iron for Women Kurtis', price: 25, laundry_price: 25, dry_clean_price: 40, ironing_price: 15, category: 'Women', cloth_type: 'Kurti', icon: 'fas fa-female', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=KURTI' },
      { service_id: 'W004', name: 'Women Dress', description: 'Wash & Iron for Women Dresses', price: 30, laundry_price: 30, dry_clean_price: 45, ironing_price: 18, category: 'Women', cloth_type: 'Dress', icon: 'fas fa-female', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=DRESS' },
      { service_id: 'W005', name: 'Women Top', description: 'Wash & Iron for Women Tops', price: 20, laundry_price: 20, dry_clean_price: 35, ironing_price: 12, category: 'Women', cloth_type: 'Top', icon: 'fas fa-female', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=TOP' },
      { service_id: 'W006', name: 'Women Jeans', description: 'Wash & Iron for Women Jeans', price: 28, laundry_price: 28, dry_clean_price: 45, ironing_price: 15, category: 'Women', cloth_type: 'Jeans', icon: 'fas fa-female', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=JEANS' },
      { service_id: 'W007', name: 'Women Leggings', description: 'Wash & Iron for Women Leggings', price: 18, laundry_price: 18, dry_clean_price: 30, ironing_price: 10, category: 'Women', cloth_type: 'Leggings', icon: 'fas fa-female', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=LEGGINGS' },
      { service_id: 'W008', name: 'Women Skirt', description: 'Wash & Iron for Women Skirts', price: 22, laundry_price: 22, dry_clean_price: 38, ironing_price: 12, category: 'Women', cloth_type: 'Skirt', icon: 'fas fa-female', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=SKIRT' },
      { service_id: 'W009', name: 'Women Blouse', description: 'Wash & Iron for Women Blouses', price: 25, laundry_price: 25, dry_clean_price: 40, ironing_price: 15, category: 'Women', cloth_type: 'Blouse', icon: 'fas fa-female', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=BLOUSE' },
      { service_id: 'W010', name: 'Women Suit', description: 'Dry Clean for Women Suits', price: 120, laundry_price: 100, dry_clean_price: 120, ironing_price: 40, category: 'Women', cloth_type: 'Suit', icon: 'fas fa-female', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=SUIT' },

      // Children's Services
      { service_id: 'C001', name: 'Boy Shirt', description: 'Wash & Iron for Boy Shirts', price: 15, laundry_price: 15, dry_clean_price: 25, ironing_price: 8, category: 'Children', cloth_type: 'Boy Shirt', icon: 'fas fa-child', pickup: true, photo: 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=SHIRT' },
      { service_id: 'C002', name: 'Boy T-Shirt', description: 'Wash & Iron for Boy T-Shirts', price: 12, laundry_price: 12, dry_clean_price: 20, ironing_price: 6, category: 'Children', cloth_type: 'Boy T-Shirt', icon: 'fas fa-child', pickup: true, photo: 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=SHIRT' },
      { service_id: 'C003', name: 'Boy Pants', description: 'Wash & Iron for Boy Pants', price: 18, laundry_price: 18, dry_clean_price: 28, ironing_price: 10, category: 'Children', cloth_type: 'Boy Pants', icon: 'fas fa-child', pickup: true, photo: 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=PANTS' },
      { service_id: 'C004', name: 'Boy Shorts', description: 'Wash & Iron for Boy Shorts', price: 10, laundry_price: 10, dry_clean_price: 18, ironing_price: 5, category: 'Children', cloth_type: 'Boy Shorts', icon: 'fas fa-child', pickup: true, photo: 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=SHORTS' },
      { service_id: 'C005', name: 'Girl Frock', description: 'Wash & Iron for Girl Frocks', price: 20, laundry_price: 20, dry_clean_price: 32, ironing_price: 12, category: 'Children', cloth_type: 'Girl Frock', icon: 'fas fa-child', pickup: true, photo: 'https://via.placeholder.com/80x80/ec4899/ffffff?text=FROCK' },
      { service_id: 'C006', name: 'Girl Dress', description: 'Wash & Iron for Girl Dresses', price: 18, laundry_price: 18, dry_clean_price: 28, ironing_price: 10, category: 'Children', cloth_type: 'Girl Dress', icon: 'fas fa-child', pickup: true, photo: 'https://via.placeholder.com/80x80/ec4899/ffffff?text=DRESS' },
      { service_id: 'C007', name: 'Girl Top', description: 'Wash & Iron for Girl Tops', price: 12, laundry_price: 12, dry_clean_price: 20, ironing_price: 6, category: 'Children', cloth_type: 'Girl Top', icon: 'fas fa-child', pickup: true, photo: 'https://via.placeholder.com/80x80/ec4899/ffffff?text=TOP' },
      { service_id: 'C008', name: 'Girl Skirt', description: 'Wash & Iron for Girl Skirts', price: 15, laundry_price: 15, dry_clean_price: 25, ironing_price: 8, category: 'Children', cloth_type: 'Girl Skirt', icon: 'fas fa-child', pickup: true, photo: 'https://via.placeholder.com/80x80/ec4899/ffffff?text=SKIRT' },

      // Home Services
      { service_id: 'H001', name: 'Bed Sheet', description: 'Wash & Iron for Bed Sheets', price: 50, laundry_price: 50, dry_clean_price: 80, ironing_price: 25, category: 'Home', cloth_type: 'Bed Sheet', icon: 'fas fa-bed', pickup: true, photo: 'https://via.placeholder.com/80x80/795548/ffffff?text=BEDSHEET' },
      { service_id: 'H002', name: 'Pillow Cover', description: 'Wash & Iron for Pillow Covers', price: 15, laundry_price: 15, dry_clean_price: 25, ironing_price: 8, category: 'Home', cloth_type: 'Pillow Cover', icon: 'fas fa-bed', pickup: true, photo: 'https://via.placeholder.com/80x80/795548/ffffff?text=PILLOW' },
      { service_id: 'H003', name: 'Curtain', description: 'Wash & Iron for Curtains', price: 80, laundry_price: 80, dry_clean_price: 120, ironing_price: 40, category: 'Home', cloth_type: 'Curtain', icon: 'fas fa-home', pickup: true, photo: 'https://via.placeholder.com/80x80/795548/ffffff?text=CURTAIN' },
      { service_id: 'H004', name: 'Table Cloth', description: 'Wash & Iron for Table Cloths', price: 25, laundry_price: 25, dry_clean_price: 40, ironing_price: 15, category: 'Home', cloth_type: 'Table Cloth', icon: 'fas fa-home', pickup: true, photo: 'https://via.placeholder.com/80x80/795548/ffffff?text=TABLE' },
      { service_id: 'H005', name: 'Carpet', description: 'Dry Clean for Carpets', price: 200, laundry_price: 150, dry_clean_price: 200, ironing_price: 50, category: 'Home', cloth_type: 'Carpet', icon: 'fas fa-home', pickup: true, photo: 'https://via.placeholder.com/80x80/795548/ffffff?text=CARPET' },

      // Special Services
      { service_id: 'S001', name: 'Wedding Dress', description: 'Special Care for Wedding Dresses', price: 300, laundry_price: 250, dry_clean_price: 300, ironing_price: 100, category: 'Special', cloth_type: 'Wedding Dress', icon: 'fas fa-heart', pickup: true, photo: 'https://via.placeholder.com/80x80/9C27B0/ffffff?text=WEDDING' },
      { service_id: 'S002', name: 'Leather Jacket', description: 'Special Care for Leather Jackets', price: 150, laundry_price: 120, dry_clean_price: 150, ironing_price: 60, category: 'Special', cloth_type: 'Leather Jacket', icon: 'fas fa-tshirt', pickup: true, photo: 'https://via.placeholder.com/80x80/9C27B0/ffffff?text=LEATHER' },
      { service_id: 'S003', name: 'Silk Saree', description: 'Special Care for Silk Sarees', price: 100, laundry_price: 80, dry_clean_price: 100, ironing_price: 40, category: 'Special', cloth_type: 'Silk Saree', icon: 'fas fa-female', pickup: true, photo: 'https://via.placeholder.com/80x80/9C27B0/ffffff?text=SILK' },
      { service_id: 'S004', name: 'Woolen Sweater', description: 'Special Care for Woolen Sweaters', price: 60, laundry_price: 50, dry_clean_price: 60, ironing_price: 25, category: 'Special', cloth_type: 'Woolen Sweater', icon: 'fas fa-tshirt', pickup: true, photo: 'https://via.placeholder.com/80x80/9C27B0/ffffff?text=WOOLEN' }
    ];

    // Insert services
    for (const service of services) {
      await client.query(`
        INSERT INTO laundry_services (
          service_id, name, description, price, laundry_price, dry_clean_price, ironing_price,
          category, cloth_type, icon, pickup, photo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        service.service_id, service.name, service.description, service.price,
        service.laundry_price, service.dry_clean_price, service.ironing_price,
        service.category, service.cloth_type, service.icon, service.pickup, service.photo
      ]);
    }

    console.log(`Inserted ${services.length} services into laundry_services table`);

    // Create indexes for better performance
    await client.query('CREATE INDEX idx_laundry_services_category ON laundry_services(category);');
    await client.query('CREATE INDEX idx_laundry_services_cloth_type ON laundry_services(cloth_type);');
    await client.query('CREATE INDEX idx_laundry_services_service_id ON laundry_services(service_id);');
    console.log('Created indexes on laundry_services table');

    console.log('Services migration completed successfully!');

  } catch (error) {
    console.error('Error during services migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
migrateServices()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
