import db from "./connection.js";

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

export const saveBill = async (total, gstTotal, discount, paymentType, customerName = "") => {
  try {
    const result = await db.query(
      `INSERT INTO bills (total, gst_total, discount, payment_type, customer_name)
       VALUES ($1, $2, $3, $4, $5) RETURNING bill_id`,
      [total, gstTotal, discount, paymentType, customerName]
    );
    return result.rows[0].bill_id;
  } catch (err) {
    console.error("❌ Error saving bill:", err);
    return null;
  }
};

export const saveBillItem = async (billId, itemId, qty, price, gst) => {
  try {
    await db.query(
      `INSERT INTO bill_items (bill_id, item_id, qty, price, gst)
       VALUES ($1, $2, $3, $4, $5)`,
      [billId, itemId, qty, price, gst]
    );
  } catch (err) {
    console.error("❌ Error saving bill item:", err);
  }
};

export const updateStock = async (itemId, qty) => {
  try {
    await db.query(`UPDATE items SET stock = stock - $1 WHERE item_id = $2`, [
      qty,
      itemId,
    ]);
  } catch (err) {
    console.error("❌ Error updating stock:", err);
  }
};
