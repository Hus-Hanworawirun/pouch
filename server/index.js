const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

// Upload directory setup (persists in %APPDATA%\NewPOS\uploads on Windows)
function getUploadsDir() {
  if (process.env.APPDATA) {
    const appDataUploads = path.join(process.env.APPDATA, 'CopperGolemPOS', 'uploads');
    if (!fs.existsSync(appDataUploads)) {
      fs.mkdirSync(appDataUploads, { recursive: true });
    }
    return appDataUploads;
  }
  const localUploads = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(localUploads)) {
    fs.mkdirSync(localUploads, { recursive: true });
  }
  return localUploads;
}

const uploadsDir = getUploadsDir();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `prod_${Date.now()}_${Math.round(Math.random() * 1e5)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ---------------- PRODUCTS API ----------------

// GET all products (optional search & category filter)
app.get('/api/products', (req, res) => {
  try {
    const { search, category, lowStockOnly } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR barcode LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (lowStockOnly === 'true') {
      sql += ' AND stock_qty <= min_stock';
    }

    sql += ' ORDER BY id DESC';
    const products = db.prepare(sql).all(...params);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product by barcode (exact match for scanner)
app.get('/api/products/barcode/:barcode', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE barcode = ?').get(req.params.barcode);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add new product
app.post('/api/products', upload.single('image'), (req, res) => {
  try {
    const {
      barcode,
      name,
      category = 'ทั่วไป',
      pack_cost = 0,
      pack_qty = 1,
      cost_price,
      profit_margin = 0,
      sell_price,
      stock_qty = 0,
      min_stock = 5
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    // Auto barcode if not provided
    const finalBarcode = barcode && barcode.trim() !== '' 
      ? barcode.trim() 
      : `${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`;

    // Calculation logic
    const numPackCost = parseFloat(pack_cost) || 0;
    const numPackQty = Math.max(1, parseInt(pack_qty, 10) || 1);

    // Calculated unit cost: fallback to direct cost_price or calculated from pack
    const calculatedUnitCost = cost_price !== undefined && cost_price !== ''
      ? (parseFloat(cost_price) || 0)
      : (numPackCost > 0 ? Number((numPackCost / numPackQty).toFixed(2)) : 0);

    const parsedMargin = profit_margin !== undefined && profit_margin !== '' ? parseFloat(profit_margin) : NaN;
    const parsedSell = sell_price !== undefined && sell_price !== '' ? parseFloat(sell_price) : NaN;

    const calculatedSellPrice = !isNaN(parsedSell)
      ? parsedSell
      : Number((calculatedUnitCost + (!isNaN(parsedMargin) ? parsedMargin : 0)).toFixed(2));
    const numProfit = !isNaN(parsedMargin) && (parsedMargin !== 0 || calculatedSellPrice === calculatedUnitCost)
      ? parsedMargin
      : Number((calculatedSellPrice - calculatedUnitCost).toFixed(2));

    const initialStock = parseInt(stock_qty, 10) || 0;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const stmt = db.prepare(`
      INSERT INTO products (
        barcode, name, category, image_url,
        pack_cost, pack_qty, cost_price, profit_margin, sell_price,
        stock_qty, min_stock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      finalBarcode,
      name.trim(),
      category.trim(),
      imageUrl,
      numPackCost,
      numPackQty,
      calculatedUnitCost,
      numProfit,
      calculatedSellPrice,
      initialStock,
      parseInt(min_stock, 10) || 5
    );

    const newId = result.lastInsertRowid;

    // Log stock in if initial stock > 0
    if (initialStock > 0) {
      db.prepare(`
        INSERT INTO stock_logs (product_id, change_qty, type, total_cost, unit_cost, note)
        VALUES (?, ?, 'PURCHASE_IN', ?, ?, 'Initial Stock')
      `).run(newId, initialStock, Number((calculatedUnitCost * initialStock).toFixed(2)), calculatedUnitCost);
    }

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(newId);
    res.status(201).json(created);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: products.barcode')) {
      return res.status(400).json({ error: 'บาร์โค้ดนี้มีอยู่ในระบบแล้ว' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT update product
app.put('/api/products/:id', upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const {
      barcode = existing.barcode,
      name = existing.name,
      category = existing.category,
      pack_cost = existing.pack_cost,
      pack_qty = existing.pack_qty,
      cost_price = existing.cost_price,
      profit_margin = existing.profit_margin,
      sell_price = existing.sell_price,
      stock_qty = existing.stock_qty,
      min_stock = existing.min_stock
    } = req.body;

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : existing.image_url;
    const numCost = parseFloat(cost_price) || 0;
    const numSell = parseFloat(sell_price) || 0;
    const parsedMargin = profit_margin !== undefined && profit_margin !== '' ? parseFloat(profit_margin) : NaN;
    const numMargin = !isNaN(parsedMargin) && (parsedMargin !== 0 || numSell === numCost)
      ? parsedMargin
      : Number((numSell - numCost).toFixed(2));

    db.prepare(`
      UPDATE products SET
        barcode = ?,
        name = ?,
        category = ?,
        image_url = ?,
        pack_cost = ?,
        pack_qty = ?,
        cost_price = ?,
        profit_margin = ?,
        sell_price = ?,
        stock_qty = ?,
        min_stock = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      barcode,
      name,
      category,
      imageUrl,
      parseFloat(pack_cost) || 0,
      parseInt(pack_qty, 10) || 1,
      numCost,
      numMargin,
      numSell,
      parseInt(stock_qty, 10) || 0,
      parseInt(min_stock, 10) || 5,
      id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: products.barcode')) {
      return res.status(400).json({ error: 'บาร์โค้ดนี้มีอยู่ในระบบแล้ว' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST restock (Receive new batch)
app.post('/api/products/:id/restock', (req, res) => {
  try {
    const { id } = req.params;
    const { add_qty, unit_cost, batch_cost, update_cost_price, note } = req.body;

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const qtyToAdd = parseInt(add_qty, 10);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    let batchUnitCost = product.cost_price || 0;
    if (unit_cost !== undefined && unit_cost !== '' && unit_cost !== null && !isNaN(parseFloat(unit_cost))) {
      batchUnitCost = Math.max(0, Number(parseFloat(unit_cost).toFixed(2)));
    } else if (batch_cost !== undefined && batch_cost !== '' && !isNaN(parseFloat(batch_cost))) {
      const legacyBatch = parseFloat(batch_cost);
      if (legacyBatch >= 0) {
        batchUnitCost = Number((legacyBatch / qtyToAdd).toFixed(2));
      }
    }
    const totalBatchCost = Number((batchUnitCost * qtyToAdd).toFixed(2));

    const existingMargin =
      product.profit_margin !== undefined &&
      product.profit_margin !== null &&
      (product.profit_margin !== 0 || product.sell_price === product.cost_price)
        ? product.profit_margin
        : Number(((product.sell_price || 0) - (product.cost_price || 0)).toFixed(2));

    // Transaction for atomic stock update and logging
    const restockTx = db.transaction(() => {
      const newStock = product.stock_qty + qtyToAdd;
      let newCostPrice = product.cost_price;
      let newSellPrice = product.sell_price;

      if (update_cost_price) {
        newCostPrice = batchUnitCost;
        newSellPrice = Number((newCostPrice + existingMargin).toFixed(2));
      }

      db.prepare(`
        UPDATE products SET
          stock_qty = ?,
          cost_price = ?,
          profit_margin = ?,
          sell_price = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStock, newCostPrice, existingMargin, newSellPrice, id);

      db.prepare(`
        INSERT INTO stock_logs (product_id, change_qty, type, total_cost, unit_cost, note)
        VALUES (?, ?, 'PURCHASE_IN', ?, ?, ?)
      `).run(id, qtyToAdd, totalBatchCost, batchUnitCost, note || 'Restock');

      return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    });

    const updated = restockTx();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ORDERS & CHECKOUT API ----------------

// POST checkout
app.post('/api/orders', (req, res) => {
  try {
    const { items, payment_method = 'CASH', cash_received = 0 } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const checkoutTx = db.transaction(() => {
      let totalAmount = 0;
      let totalCost = 0;
      let totalItems = 0;

      // Validate products and stock
      const detailedItems = [];
      for (const item of items) {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
        if (!product) {
          throw new Error(`ไม่พบสินค้ารหัส ID ${item.product_id}`);
        }
        if (product.stock_qty < item.quantity) {
          throw new Error(`สินค้า "${product.name}" สต็อกไม่พอ (เหลือ ${product.stock_qty} ชิ้น)`);
        }

        const qty = parseInt(item.quantity, 10);
        const unitPrice = parseFloat(product.sell_price);
        const unitCost = parseFloat(product.cost_price);
        const unitProfit = unitPrice - unitCost;

        const subtotal = unitPrice * qty;
        const subtotalCost = unitCost * qty;
        const subtotalProfit = unitProfit * qty;

        totalAmount += subtotal;
        totalCost += subtotalCost;
        totalItems += qty;

        detailedItems.push({
          product_id: product.id,
          product_name: product.name,
          unit_cost: unitCost,
          unit_price: unitPrice,
          unit_profit: unitProfit,
          quantity: qty,
          subtotal,
          subtotal_cost: subtotalCost,
          subtotal_profit: subtotalProfit
        });
      }

      totalAmount = Number(totalAmount.toFixed(2));
      totalCost = Number(totalCost.toFixed(2));
      const totalProfit = Number((totalAmount - totalCost).toFixed(2));

      const received = parseFloat(cash_received) || totalAmount;
      const isCashPayment = payment_method === 'CASH' || payment_method === 'เงินสด';
      const change = isCashPayment ? Math.max(0, Number((received - totalAmount).toFixed(2))) : 0;
      const localNow = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
      const orderNo = `INV-${localNow.toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;

      // Insert order
      const orderStmt = db.prepare(`
        INSERT INTO orders (
          order_no, total_amount, total_cost, total_profit,
          payment_method, cash_received, change_amount, items_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const orderResult = orderStmt.run(
        orderNo,
        totalAmount,
        totalCost,
        totalProfit,
        payment_method,
        received,
        change,
        totalItems
      );

      const orderId = orderResult.lastInsertRowid;

      // Insert items and decrement stock
      const itemStmt = db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_name,
          unit_cost, unit_price, unit_profit,
          quantity, subtotal, subtotal_cost, subtotal_profit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStockStmt = db.prepare(`
        UPDATE products SET stock_qty = stock_qty - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `);

      const stockLogStmt = db.prepare(`
        INSERT INTO stock_logs (product_id, change_qty, type, total_cost, unit_cost, note)
        VALUES (?, ?, 'SALE_OUT', ?, ?, ?)
      `);

      for (const item of detailedItems) {
        itemStmt.run(
          orderId,
          item.product_id,
          item.product_name,
          item.unit_cost,
          item.unit_price,
          item.unit_profit,
          item.quantity,
          item.subtotal,
          item.subtotal_cost,
          item.subtotal_profit
        );

        updateStockStmt.run(item.quantity, item.product_id);
        stockLogStmt.run(item.product_id, -item.quantity, item.subtotal_cost, item.unit_cost, `Order ${orderNo}`);
      }

      return {
        id: orderId,
        order_no: orderNo,
        total_amount: totalAmount,
        total_cost: totalCost,
        total_profit: totalProfit,
        payment_method,
        cash_received: received,
        change_amount: change,
        items_count: totalItems,
        items: detailedItems,
        created_at: new Date().toISOString()
      };
    });

    const newOrder = checkoutTx();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET all orders history (supports search and limit)
app.get('/api/orders', (req, res) => {
  try {
    const { search, limit = 300 } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (order_no LIKE ? OR payment_method LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(parseInt(limit, 10) || 300);

    const orders = db.prepare(sql).all(...params);
    const itemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');

    const result = orders.map(ord => ({
      ...ord,
      items: itemsStmt.all(ord.id)
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ACCOUNTING & REPORTS API ----------------

app.get('/api/reports/summary', (req, res) => {
  try {
    // 1. Sales & Profit Stats (All Time)
    const allStats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(total_profit), 0) as total_profit,
        COALESCE(SUM(items_count), 0) as total_items_sold
      FROM orders
    `).get();

    // 2. Today's Stats
    const todayStats = db.prepare(`
      SELECT 
        COUNT(*) as today_orders,
        COALESCE(SUM(total_amount), 0) as today_revenue,
        COALESCE(SUM(total_cost), 0) as today_cost,
        COALESCE(SUM(total_profit), 0) as today_profit,
        COALESCE(SUM(items_count), 0) as today_items_sold
      FROM orders
      WHERE date(created_at, 'localtime') = date('now', 'localtime')
    `).get();

    // 3. Current Inventory Valuation (Total inventory value at cost price & retail price)
    const inventoryValuation = db.prepare(`
      SELECT 
        COUNT(*) as product_count,
        COALESCE(SUM(stock_qty), 0) as total_stock_units,
        COALESCE(SUM(stock_qty * cost_price), 0) as total_inventory_cost_value,
        COALESCE(SUM(stock_qty * sell_price), 0) as total_inventory_retail_value,
        COUNT(CASE WHEN stock_qty <= min_stock THEN 1 END) as low_stock_count
      FROM products
    `).get();

    // 4. Top selling products by profit and quantity
    const topProducts = db.prepare(`
      SELECT 
        product_name,
        SUM(quantity) as total_sold_qty,
        SUM(subtotal) as total_revenue,
        SUM(subtotal_profit) as total_profit
      FROM order_items
      GROUP BY product_name
      ORDER BY total_profit DESC
      LIMIT 5
    `).all();

    res.json({
      allTime: allStats,
      today: todayStats,
      inventory: inventoryValuation,
      topProducts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET stock movement logs
app.get('/api/reports/stock-logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT 
        l.id, l.change_qty, l.type, l.total_cost, l.unit_cost, l.note, l.created_at,
        p.name as product_name, p.barcode, p.stock_qty as current_stock
      FROM stock_logs l
      LEFT JOIN products p ON l.product_id = p.id
      ORDER BY l.id DESC
      LIMIT 200
    `).all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- THAI TAXATION & REVENUE DEPARTMENT API (มาตรา 40(8)) ----------------

// Helper: Calculate Thai Personal Income Tax (อัตราภาษีเงินได้บุคคลธรรมดาแบบขั้นบันได)
function calculateThaiPIT(netTaxableIncome) {
  if (netTaxableIncome <= 0) return 0;
  let tax = 0;
  const brackets = [
    { limit: 150000, rate: 0.00 },
    { limit: 300000, rate: 0.05 },
    { limit: 500000, rate: 0.10 },
    { limit: 750000, rate: 0.15 },
    { limit: 1000000, rate: 0.20 },
    { limit: 2000000, rate: 0.25 },
    { limit: 5000000, rate: 0.30 },
    { limit: Infinity, rate: 0.35 }
  ];

  let prevLimit = 0;
  for (const b of brackets) {
    if (netTaxableIncome > prevLimit) {
      const taxableInBracket = Math.min(netTaxableIncome, b.limit) - prevLimit;
      tax += taxableInBracket * b.rate;
      prevLimit = b.limit;
    } else {
      break;
    }
  }
  return Math.round(tax);
}

// GET operational expenses
app.get('/api/expenses', (req, res) => {
  try {
    const expenses = db.prepare('SELECT * FROM expenses ORDER BY expense_date DESC, id DESC').all();
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new operational expense
app.post('/api/expenses', (req, res) => {
  try {
    const localToday = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const {
      expense_date = localToday,
      category = 'อื่นๆ',
      title,
      amount,
      receipt_no = '',
      note = ''
    } = req.body;

    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const parsedAmount = parseFloat(amount);
    if (!cleanTitle || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'กรุณากรอกคำอธิบายและจำนวนเงินที่มากกว่า 0' });
    }

    const stmt = db.prepare(`
      INSERT INTO expenses (expense_date, category, title, amount, receipt_no, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      expense_date,
      category,
      cleanTitle,
      Number(parsedAmount.toFixed(2)),
      receipt_no.trim(),
      note.trim()
    );

    const created = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE operational expense
app.delete('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Thai Revenue Department "รายงานเงินสดรับ-จ่าย" (Cash Receipts & Payments Report)
app.get('/api/tax/cash-flow', (req, res) => {
  try {
    const { year = new Date().getFullYear(), period = 'all' } = req.query; // 'all', 'h1' (Jan-Jun for PND94), 'h2' (Jul-Dec)

    // 1. Fetch Orders (Cash In)
    const orders = db.prepare(`
      SELECT 
        date(created_at, 'localtime') as entry_date,
        'รายรับจากการขายสินค้าปลีก' as description,
        order_no as ref_no,
        total_amount as cash_in,
        0 as cash_out,
        payment_method as note,
        created_at as raw_time
      FROM orders
      WHERE strftime('%Y', created_at, 'localtime') = ?
    `).all(year.toString());

    // 2. Fetch Stock Purchases (Cash Out - ต้นทุนซื้อสินค้า)
    const purchases = db.prepare(`
      SELECT 
        date(l.created_at, 'localtime') as entry_date,
        'ซื้อสินค้าเข้าสต็อก: ' || p.name as description,
        'STK-' || l.id as ref_no,
        0 as cash_in,
        l.total_cost as cash_out,
        'จำนวน ' || l.change_qty || ' ชิ้น' as note,
        l.created_at as raw_time
      FROM stock_logs l
      LEFT JOIN products p ON l.product_id = p.id
      WHERE l.type = 'PURCHASE_IN' AND l.total_cost > 0
        AND strftime('%Y', l.created_at, 'localtime') = ?
    `).all(year.toString());

    // 3. Fetch Operational Expenses (Cash Out - ค่าใช้จ่ายดำเนินงานร้าน)
    const opExpenses = db.prepare(`
      SELECT 
        expense_date as entry_date,
        category || ': ' || title as description,
        receipt_no as ref_no,
        0 as cash_in,
        amount as cash_out,
        note,
        created_at as raw_time
      FROM expenses
      WHERE strftime('%Y', expense_date) = ?
    `).all(year.toString());

    // Combine all entries
    let combined = [...orders, ...purchases, ...opExpenses];

    // Filter by period if requested
    if (period === 'h1') {
      combined = combined.filter(it => {
        const m = parseInt(it.entry_date.split('-')[1], 10);
        return m >= 1 && m <= 6;
      });
    } else if (period === 'h2') {
      combined = combined.filter(it => {
        const m = parseInt(it.entry_date.split('-')[1], 10);
        return m >= 7 && m <= 12;
      });
    }

    // Sort chronologically ascending
    combined.sort((a, b) => new Date(a.raw_time) - new Date(b.raw_time));

    // Calculate running balance
    let runningBalance = 0;
    const reportRows = combined.map((row, idx) => {
      runningBalance += row.cash_in - row.cash_out;
      return {
        id: idx + 1,
        date: row.entry_date,
        description: row.description,
        ref_no: row.ref_no || '-',
        cash_in: row.cash_in,
        cash_out: row.cash_out,
        balance: runningBalance,
        note: row.note || ''
      };
    });

    res.json({
      year: parseInt(year, 10),
      period,
      total_in: combined.reduce((sum, r) => sum + r.cash_in, 0),
      total_out: combined.reduce((sum, r) => sum + r.cash_out, 0),
      net_cash: runningBalance,
      rows: reportRows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Thai Tax Summary & Filing Estimator (ภ.ง.ด. 90/94 & VAT Tracker)
app.get('/api/tax/summary', (req, res) => {
  try {
    const targetYear = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();

    // 1. Total Sales Income for target year
    const salesStat = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(total_cost), 0) as cogs_sold
      FROM orders
      WHERE strftime('%Y', created_at, 'localtime') = ?
    `).get(targetYear.toString());

    // 2. Operational Expenses for target year
    const expStat = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses
      WHERE strftime('%Y', expense_date) = ?
    `).get(targetYear.toString());

    const totalRevenue = salesStat.total_revenue;
    const cogsSold = salesStat.cogs_sold;
    const totalExpenses = expStat.total_expenses;

    // A. Actual Deduction (หักค่าใช้จ่ายตามจริง)
    const actualExpensesTotal = cogsSold + totalExpenses;
    const actualNetIncome = Math.max(0, totalRevenue - actualExpensesTotal);
    const personalAllowance = 60000; // ค่าลดหย่อนผู้มีเงินได้ 60,000 บาท
    const taxableActual = Math.max(0, actualNetIncome - personalAllowance);
    const taxPayableActual = calculateThaiPIT(taxableActual);

    // B. Flat Deduction 60% (หักเหมา 60% ตาม ม.40(8))
    const flatDeduction = totalRevenue * 0.60;
    const flatNetIncome = Math.max(0, totalRevenue - flatDeduction);
    const taxableFlat = Math.max(0, flatNetIncome - personalAllowance);
    const taxPayableFlat = calculateThaiPIT(taxableFlat);

    // C. VAT Threshold Tracker (1,800,000 บาท)
    const vatThreshold = 1800000;
    const vatProgress = Number(((totalRevenue / vatThreshold) * 100).toFixed(1));
    const isVatRequired = totalRevenue >= vatThreshold;

    // Discover available tax years
    const orderYears = db.prepare(`SELECT DISTINCT strftime('%Y', created_at, 'localtime') as yr FROM orders WHERE created_at IS NOT NULL`).all().map(r => parseInt(r.yr, 10)).filter(Boolean);
    const expenseYears = db.prepare(`SELECT DISTINCT strftime('%Y', expense_date) as yr FROM expenses WHERE expense_date IS NOT NULL`).all().map(r => parseInt(r.yr, 10)).filter(Boolean);
    const currYr = new Date().getFullYear();
    const defaultYears = [currYr, currYr - 1, currYr - 2, currYr - 3];
    const availableYears = Array.from(new Set([...defaultYears, ...orderYears, ...expenseYears])).sort((a, b) => b - a);

    res.json({
      tax_year: targetYear,
      available_years: availableYears,
      total_revenue: totalRevenue,
      cogs_sold: cogsSold,
      operational_expenses: totalExpenses,
      
      // Actual vs Flat comparison
      actual_method: {
        total_expenses: actualExpensesTotal,
        net_income: actualNetIncome,
        taxable_income: taxableActual,
        tax_payable: taxPayableActual
      },
      flat_method: {
        flat_deduction: flatDeduction,
        net_income: flatNetIncome,
        taxable_income: taxableFlat,
        tax_payable: taxPayableFlat
      },
      recommended_method: actualExpensesTotal >= flatDeduction ? 'ACTUAL' : 'FLAT',
      tax_saving: Math.abs(taxPayableFlat - taxPayableActual),

      // VAT 1.8M Tracker
      vat: {
        threshold: vatThreshold,
        current_revenue: totalRevenue,
        remaining_limit: Math.max(0, vatThreshold - totalRevenue),
        progress_percentage: vatProgress,
        is_required: isVatRequired
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- SYSTEM DATA MANAGEMENT API ----------------
const { clearDatabase } = require('./clear');
const { seedDatabase } = require('./seed');

app.post('/api/system/clear', (req, res) => {
  try {
    clearDatabase();
    res.json({ success: true, message: 'ล้างข้อมูลทั้งหมดในระบบเรียบร้อย (100% Clean State)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/system/seed', (req, res) => {
  try {
    seedDatabase();
    res.json({ success: true, message: 'สร้างข้อมูลจำลอง (Mockup Data) สำเร็จ 5 รายการ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- STORE SETTINGS API ----------------
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM store_settings WHERE id = 1').get();
    res.json(settings || {
      store_name: 'Pouch',
      store_subtitle: 'ระบบแคชเชียร์ & คลังสต็อก',
      tax_id: '0105566012345',
      logo_url: '/logo.png'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', upload.single('logo'), (req, res) => {
  try {
    const { store_name, store_subtitle, tax_id } = req.body;
    const existing = db.prepare('SELECT * FROM store_settings WHERE id = 1').get();

    const logoUrl = req.file ? `/uploads/${req.file.filename}` : (existing ? existing.logo_url : '/logo.png');
    const name = (store_name !== undefined && store_name.trim()) ? store_name.trim() : (existing?.store_name || 'Pouch');
    const subtitle = store_subtitle !== undefined ? store_subtitle.trim() : (existing?.store_subtitle || 'ระบบแคชเชียร์ & คลังสต็อก');
    const tax = tax_id !== undefined ? tax_id.trim() : (existing?.tax_id || '0105566012345');

    db.prepare(`
      INSERT INTO store_settings (id, store_name, store_subtitle, tax_id, logo_url, updated_at)
      VALUES (1, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        store_name = excluded.store_name,
        store_subtitle = excluded.store_subtitle,
        tax_id = excluded.tax_id,
        logo_url = excluded.logo_url,
        updated_at = CURRENT_TIMESTAMP
    `).run(name, subtitle, tax, logoUrl);

    const updated = db.prepare('SELECT * FROM store_settings WHERE id = 1').get();
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend build if available
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
