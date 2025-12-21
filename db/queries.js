import db from "./connection.js";

// ----------------------------------------------------
// 1️⃣ GET ITEM BY BARCODE
// ----------------------------------------------------
export const getItemByBarcode = async (barcode) => {
  try {
    const result = await db.query(
      "SELECT * FROM items WHERE barcode = $1 LIMIT 1",
      [barcode]
    );
    return result.rows[0];
  } catch (err) {
    console.error("❌ Error fetching item:", err);
    return null;
  }
};

// ----------------------------------------------------
// 2️⃣ SAVE BILL (Returns bill.id)
// ----------------------------------------------------
export const saveBill = async (
  customerName,
  customerPhone,
  customerEmail,
  paymentType,
  subtotal,
  gstTotal,
  discount,
  total,
  notes
) => {
  try {
    const result = await db.query(
      `
      INSERT INTO bills 
      (customer_name, customer_phone, customer_email, payment_type, subtotal, gst_total, discount, total, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id
      `,
      [
        customerName,
        customerPhone,
        customerEmail,
        paymentType,
        subtotal,
        gstTotal,
        discount,
        total,
        notes,
      ]
    );

    return result.rows[0].id;
  } catch (err) {
    console.error("❌ Error saving bill:", err);
    return null;
  }
};

// ----------------------------------------------------
// 3️⃣ SAVE BILL ITEM
// ----------------------------------------------------
export const saveBillItem = async (
  billId,
  itemName,
  qty,
  price,
  gst,
  total
) => {
  try {
    await db.query(
      `
      INSERT INTO bill_items 
      (bill_id, item_name, qty, price, gst, total)
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [billId, itemName, qty, price, gst, total]
    );
  } catch (err) {
    console.error("❌ Error saving bill item:", err);
  }
};

// ----------------------------------------------------
// 4️⃣ UPDATE STOCK
// ----------------------------------------------------
export const updateStock = async (itemId, qty) => {
  try {
    await db.query(
      `
      UPDATE items
      SET stock = stock - $1
      WHERE item_id = $2
      `,
      [qty, itemId]
    );
  } catch (err) {
    console.error("❌ Error updating stock:", err);
  }
};

// ----------------------------------------------------
// 5️⃣ GET ALL ITEMS
// ----------------------------------------------------
export const getAllItems = async () => {
  try {
    const result = await db.query("SELECT * FROM items ORDER BY name ASC");
    return result.rows;
  } catch (err) {
    console.error("❌ Error fetching items:", err);
    return [];
  }
};

// ----------------------------------------------------
// 6️⃣ GET BILL WITH ITEMS
// ----------------------------------------------------
export const getBillWithItems = async (billId) => {
  try {
    const bill = await db.query("SELECT * FROM bills WHERE id = $1", [billId]);
    const items = await db.query(
      "SELECT * FROM bill_items WHERE bill_id = $1",
      [billId]
    );

    return {
      bill: bill.rows[0],
      items: items.rows,
    };
  } catch (err) {
    console.error("❌ Error fetching bill details:", err);
    return null;
  }
};

// ----------------------------------------------------
// 7️⃣ TOTAL DASHBOARD STATS
// ----------------------------------------------------
export const getDashboardStats = async () => {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM bills) AS total_bills,
        (SELECT COALESCE(SUM(qty), 0) FROM bill_items) AS total_items_sold,
        (SELECT COALESCE(SUM(qty * price), 0) FROM bill_items) AS total_sales
    `);

    return result.rows[0];
  } catch (err) {
    console.error("❌ Error fetching dashboard stats:", err);
    return null;
  }
};

// ----------------------------------------------------
// 8️⃣ TODAY SALES
// ----------------------------------------------------
export const getTodaySales = async () => {
  try {
    const result = await db.query(`
      SELECT 
        COALESCE(SUM(bi.qty * bi.price), 0) AS today_sales
      FROM bill_items bi
      JOIN bills b ON b.id = bi.bill_id
      WHERE DATE(b.created_at) = CURRENT_DATE
    `);

    return result.rows[0].today_sales;
  } catch (err) {
    console.error("❌ Error fetching today's sales:", err);
    return 0;
  }
};

// ----------------------------------------------------
// 9️⃣ WEEKLY SALES
// ----------------------------------------------------
export const getWeeklySales = async () => {
  try {
    const result = await db.query(`
      SELECT 
        DATE(b.created_at) AS date,
        SUM(bi.qty * bi.price) AS total
      FROM bill_items bi
      JOIN bills b ON b.id = bi.bill_id
      WHERE b.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY date
      ORDER BY date DESC
    `);

    return result.rows;
  } catch (err) {
    console.error("❌ Error fetching weekly sales:", err);
    return [];
  }
};

// ----------------------------------------------------
// 🔟 MONTHLY SALES
// ----------------------------------------------------
export const getMonthlySales = async () => {
  try {
    const result = await db.query(`
      SELECT 
        DATE(b.created_at) AS date,
        SUM(bi.qty * bi.price) AS total
      FROM bill_items bi
      JOIN bills b ON b.id = bi.bill_id
      WHERE b.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY date
      ORDER BY date ASC
    `);

    return result.rows;
  } catch (err) {
    console.error("❌ Error fetching monthly sales:", err);
    return [];
  }
};

// ----------------------------------------------------
// 1️⃣1️⃣ BEST SELLING ITEMS
// ----------------------------------------------------
export const getBestSellingItems = async () => {
  try {
    const result = await db.query(`
      SELECT 
        item_name,
        SUM(qty) AS total_sold 
      FROM bill_items
      GROUP BY item_name
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    return result.rows;
  } catch (err) {
    console.error("❌ Error fetching best-selling items:", err);
    return [];
  }
};
// ----------------------------------------------------
// 1️⃣ GET ALL BILLS
// ----------------------------------------------------
export const getAllBills = async () => {
  const result = await db.query(`
    SELECT
      id,
      customer_name,
      customer_phone,
      payment_type,
      total,
      created_at
    FROM bills
    ORDER BY created_at DESC
  `);

  return result.rows;
};
// ----------------------------------------------------
// 2️⃣ GET BILL BY ID WITH ITEMS
// ----------------------------------------------------
export const getBillById = async (billId) => {
  const billRes = await db.query(
    `SELECT * FROM bills WHERE id = $1`,
    [billId]
  );

  const itemsRes = await db.query(
    `SELECT * FROM bill_items WHERE bill_id = $1`,
    [billId]
  );

  return {
    bill: billRes.rows[0],
    items: itemsRes.rows,
  };
};






// ⬇⬇⬇⬇⬇ NEW QUERIES BELOW FOR MODALS ⬇⬇⬇⬇⬇




// ----------------------------------------------------
// 🔍 12️⃣ SEARCH ITEMS (ItemSearchModal)
// ----------------------------------------------------
export const searchItems = async (keyword) => {
  try {
    const { rows } = await db.query(
      `
      SELECT * FROM items
      WHERE name ILIKE $1 OR barcode ILIKE $1
      ORDER BY name ASC
      LIMIT 50
      `,
      [`%${keyword}%`]
    );
    return rows;
  } catch (err) {
    console.error("❌ Error searching items:", err);
    return [];
  }
};

// ----------------------------------------------------
// 1️⃣3️⃣ HOLD BILL — SAVE TEMP BILL
// ----------------------------------------------------
export const saveHoldBill = async (billData) => {
  try {
    const { rows } = await db.query(
      `INSERT INTO hold_bills (data) VALUES ($1) RETURNING id`,
      [billData]
    );
    return rows[0];
  } catch (err) {
    console.error("❌ Error saving hold bill:", err);
    return null;
  }
};

// ----------------------------------------------------
// 1️⃣4️⃣ GET ALL HOLD BILLS
// ----------------------------------------------------
export const getHoldBills = async () => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM hold_bills ORDER BY id DESC`
    );
    return rows;
  } catch (err) {
    console.error("❌ Error fetching hold bills:", err);
    return [];
  }
};

// ----------------------------------------------------
// 1️⃣5️⃣ RESUME HOLD BILL (DELETE + RETURN DATA)
// ----------------------------------------------------
export const resumeHoldBill = async (id) => {
  try {
    const { rows } = await db.query(
      `DELETE FROM hold_bills WHERE id = $1 RETURNING data`,
      [id]
    );
    return rows[0]?.data || null;
  } catch (err) {
    console.error("❌ Error resuming hold bill:", err);
    return null;
  }
};

// ----------------------------------------------------
// 1️⃣6️⃣ QUICK ADD ITEM
// ----------------------------------------------------
export const quickAddItem = async (item) => {
  try {
    const { rows } = await db.query(
      `
      INSERT INTO items (name, price, gst, stock, barcode, category)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        item.name,
        item.price,
        item.gst ?? 0,
        item.stock ?? 0,
        item.barcode ?? null,
        item.category ?? "General",
      ]
    );
    return rows[0];
  } catch (err) {
    console.error("❌ Error adding quick item:", err);
    return null;
  }
};

// ----------------------------------------------------
// 1️⃣7️⃣ RETURN BILL — FETCH BILL + ITEMS
// ----------------------------------------------------
export const getBillForReturn = async (billId) => {
  try {
    const bill = await db.query(
      `SELECT * FROM bills WHERE id = $1`,
      [billId]
    );

    const items = await db.query(
      `SELECT * FROM bill_items WHERE bill_id = $1`,
      [billId]
    );

    if (!bill.rows[0]) return null;

    return {
      ...bill.rows[0],
      items: items.rows,
    };
  } catch (err) {
    console.error("❌ Error fetching return bill:", err);
    return null;
  }
};
