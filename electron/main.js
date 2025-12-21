import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import PDFDocument from "pdfkit";
import { getAllBills, getBillById } from "../db/queries.js";

// Database (POOL VERSION)
import db from "../db/connection.js";

import {
  getItemByBarcode,
  saveBill,
  saveBillItem,
  updateStock,
} from "../db/queries.js";

// Resolve dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect environment
const isDev = !app.isPackaged;

/* --------------------------------------------------
   🔒 GLOBAL CRASH PROTECTION (Prevents popup crash)
-------------------------------------------------- */
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception (Recovered):", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Promise Rejection (Recovered):", reason);
});

/* --------------------------------------------------
   🪟 CREATE MAIN WINDOW
-------------------------------------------------- */
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 850,
    icon: path.join(__dirname, "assets", "icon.ico"),
    fullscreenable: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist-react/index.html"));
  }
}

app.whenReady().then(createWindow);

// Recreate window if closed (macOS safety)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/* --------------------------------------------------
   📌 FETCH ITEM
-------------------------------------------------- */
ipcMain.handle("fetch-item", async (_, barcode) => {
  try {
    return (await getItemByBarcode(barcode)) || null;
  } catch (err) {
    console.error("❌ Fetch Item Error:", err);
    return null;
  }
});

/* --------------------------------------------------
   💾 SAVE BILL
-------------------------------------------------- */
ipcMain.handle("save-bill", async (_, billData) => {
  try {
    const {
      cart,
      totals,
      paymentType,
      customer,
      notes,
    } = billData;

    const billId = await saveBill(
      customer.name || "Walk-In",
      customer.phone || "",
      customer.email || "",
      paymentType,
      totals.subtotal,
      totals.gstTotal,
      totals.discount,
      totals.total,
      notes
    );

    if (!billId) return { success: false };

    for (const item of cart) {
      await saveBillItem(
        billId,
        item.name,
        item.qty,
        item.price,
        item.gst,
        item.qty * item.price
      );

      await updateStock(item.item_id, item.qty);
    }

    return { success: true, billId };
  } catch (error) {
    console.error("❌ Save Bill Error:", error);
    return { success: false };
  }
});

/* --------------------------------------------------
   📄 PDF GENERATION
-------------------------------------------------- */
ipcMain.handle(
  "generatePDF",
  async (_, { billId, cart, totals, customer, paymentType }) => {
    try {
      const doc = new PDFDocument();
      const filePath = path.join(process.cwd(), `Bill-${billId}.pdf`);
      doc.pipe(fs.createWriteStream(filePath));

      doc.fontSize(20).text("🧾 Invoice", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Bill No: ${billId}`);
      doc.text(`Customer: ${customer.name}`);
      doc.text(`Payment Type: ${paymentType}`);
      doc.text(`Date: ${new Date().toLocaleString()}`);
      doc.moveDown();
      doc.text("----------------------------------");

      cart.forEach((item) => {
        doc.text(`${item.name} x${item.qty} - ₹${(item.qty * item.price).toFixed(2)}`);
      });

      doc.end();
      return { success: true, filePath };
    } catch (error) {
      console.error("❌ PDF Error:", error);
      return { success: false };
    }
  }
);

/* --------------------------------------------------
   📊 DASHBOARD STATISTICS
-------------------------------------------------- */
ipcMain.handle(
  "getDashboardStats",
  async (_, range = "daily", customRange = {}) => {
    try {
      let dateCondition = "";

      switch (range) {
        case "daily":
          dateCondition = `DATE(b.created_at) = CURRENT_DATE`;
          break;
        case "weekly":
          dateCondition = `b.created_at >= NOW() - INTERVAL '7 days'`;
          break;
        case "monthly":
          dateCondition = `b.created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
          break;
        case "yearly":
          dateCondition = `b.created_at >= DATE_TRUNC('year', CURRENT_DATE)`;
          break;
        case "custom":
          dateCondition = `b.created_at BETWEEN '${customRange.from}' AND '${customRange.to}'`;
          break;
      }

      const summary = await db.query(`
        SELECT COUNT(*) AS bills_count,
               COALESCE(SUM(bi.qty * bi.price), 0) AS total_sales,
               COALESCE(AVG(bi.qty * bi.price), 0) AS avg_bill
        FROM bills b
        LEFT JOIN bill_items bi ON b.id = bi.bill_id
        WHERE ${dateCondition}
      `);

      const itemsSold = await db.query(`
        SELECT COALESCE(SUM(bi.qty), 0) AS items_sold
        FROM bill_items bi
        JOIN bills b ON bi.bill_id = b.id
        WHERE ${dateCondition}
      `);

      const profit = await db.query(`
        SELECT COALESCE(SUM((bi.qty * bi.price) - (bi.qty * i.buy_price)), 0) AS profit
        FROM bill_items bi
        JOIN items i ON i.name = bi.item_name
        JOIN bills b ON b.id = bi.bill_id
        WHERE ${dateCondition}
      `);

      const topItems = await db.query(`
        SELECT bi.item_name AS name,
               SUM(bi.qty) AS qty,
               SUM(bi.qty * bi.price) AS revenue
        FROM bill_items bi
        JOIN bills b ON bi.bill_id = b.id
        WHERE ${dateCondition}
        GROUP BY bi.item_name
        ORDER BY qty DESC
        LIMIT 5
      `);

      const lowStock = await db.query(`
        SELECT item_id AS id, name, stock
        FROM items
        WHERE stock <= 5
        ORDER BY stock ASC
        LIMIT 5
      `);

      const recentBills = await db.query(`
        SELECT b.id AS bill_id,
               COUNT(bi.id) AS item_count,
               COALESCE(SUM(bi.qty * bi.price), 0) AS total,
               b.created_at AS date_time
        FROM bills b
        LEFT JOIN bill_items bi ON bi.bill_id = b.id
        WHERE ${dateCondition}
        GROUP BY b.id, b.created_at
        ORDER BY b.created_at DESC
        LIMIT 50
      `);

      return {
        totalSales: summary.rows[0].total_sales,
        billsCount: summary.rows[0].bills_count,
        avgBill: summary.rows[0].avg_bill,
        itemsSold: itemsSold.rows[0].items_sold,
        profit: profit.rows[0].profit,
        graphData: recentBills.rows,
        lowStock: lowStock.rows,
        topItems: topItems.rows,
        recentBills: recentBills.rows,
        range,
      };
    } catch (error) {
      console.error("❌ Dashboard Stats Error:", error);
      return { error: "Dashboard failed." };
    }
  }
);

/* --------------------------------------------------
   🟡 HOLD BILL SYSTEM
-------------------------------------------------- */

ipcMain.handle("saveHoldBill", async (_, billData) => {
  try {
    const { rows } = await db.query(
      `INSERT INTO hold_bills 
       (items, customer_name, customer_phone, customer_email, payment_type, notes, discount_type, discount, subtotal, gst, total) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        JSON.stringify(billData.items),
        billData.customer_name,
        billData.customer_phone,
        billData.customer_email,
        billData.payment_type,
        billData.notes,
        billData.discountType,
        billData.discount,
        billData.totals.subtotal,
        billData.totals.gstTotal,
        billData.totals.total,
      ]
    );
    return { success: true, id: rows[0].id };
  } catch (err) {
    console.error("❌ saveHoldBill Error:", err);
    return { success: false };
  }
});

ipcMain.handle("get-hold-bills", async () => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM hold_bills ORDER BY id DESC`
    );
    return rows;
  } catch (err) {
    console.error("❌ get-hold-bills Error:", err);
    return [];
  }
});

ipcMain.handle("resume-hold-bill", async (_, id) => {
  try {
    const { rows } = await db.query(
      `DELETE FROM hold_bills WHERE id=$1 RETURNING *`,
      [id]
    );

    if (!rows[0]) return null;

    return {
      items: rows[0].items,
      customer_name: rows[0].customer_name,
      customer_phone: rows[0].customer_phone,
      customer_email: rows[0].customer_email,
      payment_type: rows[0].payment_type,
      notes: rows[0].notes,
      discount_type: rows[0].discount_type,
      discount: rows[0].discount,
      subtotal: rows[0].subtotal,
      gst: rows[0].gst,
      total: rows[0].total,
    };
  } catch (err) {
    console.error("❌ resume-hold-bill Error:", err);
    return null;
  }
});

/* --------------------------------------------------
   🔍 SEARCH ITEMS
-------------------------------------------------- */
ipcMain.handle("search-items", async (_, keyword) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM items 
       WHERE name ILIKE $1 OR barcode ILIKE $1
       ORDER BY name ASC LIMIT 50`,
      [`%${keyword}%`]
    );
    return rows;
  } catch (err) {
    console.error("❌ search-items Error:", err);
    return [];
  }
});

/* --------------------------------------------------
   ➕ ADD NEW PRODUCT
-------------------------------------------------- */
ipcMain.handle("add-new-item", async (_, item) => {
  try {
    await db.query(
      `INSERT INTO items (barcode, name, price, gst, category, stock, buy_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        item.barcode,
        item.name,
        item.price,
        item.gst || 0,
        item.category || "",
        item.stock || 0,
        item.buy_price || 0,
      ]
    );

    return { success: true };
  } catch (err) {
    console.error("❌ add-new-item Error:", err);
    return { success: false };
  }
});

/* --------------------------------------------------
   ⚡ QUICK ADD ITEM
-------------------------------------------------- */
ipcMain.handle("quick-add-item", async (_, item) => {
  try {
    const { rows } = await db.query(
      `INSERT INTO items (name, price, gst, stock, barcode, category)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
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
    console.error("❌ quick-add-item Error:", err);
    return null;
  }
});

/* --------------------------------------------------
   📁 VIEW + EDIT + DELETE ITEMS
-------------------------------------------------- */
ipcMain.handle("get-all-items", async () => {
  try {
    const res = await db.query("SELECT * FROM items ORDER BY item_id DESC");
    return res.rows;
  } catch (err) {
    console.error("❌ get-all-items Error:", err);
    return [];
  }
});

ipcMain.handle("update-item", async (_, item) => {
  try {
    await db.query(
      `UPDATE items 
       SET name=$1, barcode=$2, price=$3, buy_price=$4, gst=$5, category=$6, stock=$7
       WHERE item_id=$8`,
      [
        item.name,
        item.barcode,
        item.price,
        item.buy_price,
        item.gst,
        item.category,
        item.stock,
        item.item_id,
      ]
    );
    return { success: true };
  } catch (err) {
    console.error("❌ update-item Error:", err);
    return { success: false };
  }
});

ipcMain.handle("delete-item", async (_, id) => {
  try {
    await db.query(`DELETE FROM items WHERE item_id=$1`, [id]);
    return { success: true };
  } catch (err) {
    console.error("❌ delete-item Error:", err);
    return { success: false };
  }
});

/* --------------------------------------------------
   🔁 GET BILL FOR RETURN
-------------------------------------------------- */
ipcMain.handle("get-bill-for-return", async (_, billId) => {
  try {
    const bill = await db.query(`SELECT * FROM bills WHERE id = $1`, [billId]);
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
    console.error("❌ get-bill-for-return Error:", err);
    return null;
  }
});
/* --------------------------------------------------
   🧾 PREVIOUS BILLS
-------------------------------------------------- */
ipcMain.handle("get-all-bills", async () => {
  try {
    return await getAllBills();
  } catch (err) {
    console.error("Error fetching bills:", err);
    return [];
  }
});

ipcMain.handle("get-bill-by-id", async (_, billId) => {
  try {
    return await getBillById(billId);
  } catch (err) {
    console.error("Error fetching bill:", err);
    return null;
  }
});


/* --------------------------------------------------
   📴 CLOSE APP
-------------------------------------------------- */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
