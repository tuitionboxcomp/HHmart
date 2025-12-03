import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import PDFDocument from "pdfkit";

// Resolve dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect environment
const isDev = !app.isPackaged;

// DB Path
const dbBasePath = isDev
  ? path.join(__dirname, "../db")
  : path.join(process.resourcesPath, "db");

// Load DB modules
let db, getItemByBarcode, saveBill, saveBillItem, updateStock;

try {
  const dbUrl = `file:///${path
    .join(dbBasePath, "connection.js")
    .replace(/\\/g, "/")}`;
  const queriesUrl = `file:///${path
    .join(dbBasePath, "queries.js")
    .replace(/\\/g, "/")}`;

  const dbModule = await import(dbUrl);
  db = dbModule.default;

  const queriesModule = await import(queriesUrl);
  ({ getItemByBarcode, saveBill, saveBillItem, updateStock } = queriesModule);

  if (!db || !db.query) throw new Error("DB connection not configured properly");

  console.log("📡 Database modules loaded successfully!");
} catch (error) {
  console.error("❌ Failed to load DB modules:", error);
}

// --------------------------------------------------
// Create Window
// --------------------------------------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 850,
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

// --------------------------------------------------
// Fetch Item
// --------------------------------------------------
ipcMain.handle("fetch-item", async (_, barcode) => {
  try {
    return (await getItemByBarcode(barcode)) || null;
  } catch (err) {
    console.error("❌ Error:", err);
    return null;
  }
});

// --------------------------------------------------
// Save Bill
// --------------------------------------------------
ipcMain.handle("save-bill", async (_, billData) => {
  try {
    const {
      cart,
      totals,
      paymentType,
      customer,
      notes,
      discountType,
      discount,
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

      // reduce stock
      await updateStock(item.item_id, item.qty);
    }

    return { success: true, billId };
  } catch (error) {
    console.error("❌ Error saving bill:", error);
    return { success: false };
  }
});

// --------------------------------------------------
// Generate PDF
// --------------------------------------------------
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
        doc.text(
          `${item.name} x${item.qty} - ₹${(item.qty * item.price).toFixed(2)}`
        );
      });

      doc.end();
      return { success: true, filePath };
    } catch (error) {
      console.error("❌ PDF error:", error);
      return { success: false };
    }
  }
);

// --------------------------------------------------
// 📊 DASHBOARD STATISTICS
// --------------------------------------------------
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
        case "custom":
          dateCondition = `b.created_at BETWEEN '${customRange.from}' AND '${customRange.to}'`;
          break;
      }

      const summary = await db.query(`
        SELECT
          COUNT(*) AS bills_count,
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
        SELECT item_name, SUM(qty) AS qty
        FROM bill_items bi
        JOIN bills b ON bi.bill_id = b.id
        WHERE ${dateCondition}
        GROUP BY item_name
        ORDER BY qty DESC
        LIMIT 5
      `);

      const lowStock = await db.query(`
        SELECT item_id, name, stock
        FROM items
        WHERE stock <= 5
        ORDER BY stock ASC
        LIMIT 5
      `);

      const graphData = await db.query(`
        SELECT DATE(b.created_at) AS date, SUM(bi.qty * bi.price) AS sales
        FROM bill_items bi
        JOIN bills b ON bi.bill_id = b.id
        WHERE ${dateCondition}
        GROUP BY date
        ORDER BY date ASC
      `);

      return {
        totalSales: summary.rows[0].total_sales,
        billsCount: summary.rows[0].bills_count,
        avgBill: summary.rows[0].avg_bill,
        itemsSold: itemsSold.rows[0].items_sold,
        profit: profit.rows[0].profit,
        graphData: graphData.rows,
        lowStock: lowStock.rows,
        topItems: topItems.rows,
        range,
      };
    } catch (error) {
      console.error("❌ Dashboard stats error:", error);
      return { error: "Dashboard failed." };
    }
  }
);

// --------------------------------------------------
// 🔥 NEW FEATURE IPC HANDLERS ADDED BELOW
// --------------------------------------------------

// 1️⃣ Search Items Modal
ipcMain.handle("search-items", async (_, keyword) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM items 
       WHERE name ILIKE $1 OR barcode ILIKE $1
       ORDER BY name ASC LIMIT 50`,
      [`%${keyword}%`]
    );
    return rows;
  } catch (e) {
    console.error("❌ search-items error:", e);
    return [];
  }
});

// 2️⃣ Hold Bill - Save temporary bill
ipcMain.handle("hold-bill", async (_, billData) => {
  try {
    const { rows } = await db.query(
      `INSERT INTO hold_bills(data) VALUES ($1) RETURNING id`,
      [billData]
    );
    return { success: true, id: rows[0].id };
  } catch (e) {
    console.error("❌ hold-bill error:", e);
    return { success: false };
  }
});

// 3️⃣ Get All Hold Bills
ipcMain.handle("get-hold-bills", async () => {
  try {
    const { rows } = await db.query(`SELECT * FROM hold_bills ORDER BY id DESC`);
    return rows;
  } catch (e) {
    console.error("❌ get-hold-bills error:", e);
    return [];
  }
});

// 4️⃣ Resume & Delete Hold Bill
ipcMain.handle("resume-hold-bill", async (_, id) => {
  try {
    const { rows } = await db.query(
      `DELETE FROM hold_bills WHERE id=$1 RETURNING data`,
      [id]
    );
    return rows[0]?.data || null;
  } catch (e) {
    console.error("❌ resume-hold-bill error:", e);
    return null;
  }
});

// 5️⃣ Quick Add Item
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
  } catch (e) {
    console.error("❌ quick-add-item error:", e);
    return null;
  }
});

// 6️⃣ Return Billing - Load previous bill
ipcMain.handle("get-bill-for-return", async (_, billId) => {
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
  } catch (e) {
    console.error("❌ get-bill-for-return error:", e);
    return null;
  }
});

// --------------------------------------------------
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
