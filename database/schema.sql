CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT
);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  contact TEXT,
  address TEXT,
  loan_amount REAL,
  emi REAL,
  start_date TEXT,
  duration INTEGER,
  status TEXT
);

CREATE TABLE deposits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  amount REAL,
  deposit_date TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE renewals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  old_amount REAL,
  renew_amount REAL,
  date TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
