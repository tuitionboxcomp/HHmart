import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import PDFDocument from 'pdfkit';

// Resolve ESM dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect environment
const isDev = !app.isPackaged;

// Resolve DB folder for dev & production
const dbBasePath = isDev
  ? path.join(__dirname, '../db') // Local project in development
  : path.join(process.resourcesPath, 'db'); // Inside asar on production

// --------------------------------------------------
// 📦 Load DB modules using proper file:// URLs (fixes ERR_UNSUPPORTED_ESM_URL_SCHEME)
// --------------------------------------------------
let db, getItemByBarcode, saveBill, saveBillItem, updateStock;

try {
  // Convert path to valid file URL
  const dbUrl = `file:///${path.join(dbBasePath, 'connection.js').replace(/\\/g, '/')}`;
  const queriesUrl = `file:///${path.join(dbBasePath, 'queries.js').replace(/\\/g, '/')}`;

  // Dynamic imports
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
// 🚀 Create Application Window
// --------------------------------------------------
console.log("Resources Path:", process.resourcesPath);
console.log("DB Path:", dbBasePath);

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 850,
    fullscreenable: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools();
  } else {
   win.loadFile(path.join(__dirname, "../dist-react/index.html"));

  }
}

app.whenReady().then(createWindow);

// --------------------------------------------------
// 🔍 Fetch Item by Barcode
// --------------------------------------------------
ipcMain.handle('fetch-item', async (_, barcode) => {
  try {
    return (await getItemByBarcode(barcode)) || null;
  } catch (err) {
    console.error("❌ Error fetching item:", err);
    return null;
  }
});

// --------------------------------------------------
// 💾 Save Bill & Update Stock
// --------------------------------------------------
ipcMain.handle('save-bill', async (_, billData) => {
  try {
    const { cart, totals, paymentType, customerName } = billData;
    const billId = await saveBill(
      totals.total,
      totals.gstTotal,
      totals.discount || 0,
      paymentType,
      customerName
    );

    if (!billId) return { success: false };

    for (const item of cart) {
      await saveBillItem(billId, item.id, item.qty, item.price, item.gst);
      await updateStock(item.id, item.qty);
    }

    return { success: true, billId };
  } catch (error) {
    console.error("❌ Error saving bill:", error);
    return { success: false };
  }
});

// --------------------------------------------------
// 📄 Generate & Save PDF Invoice
// --------------------------------------------------
ipcMain.handle('generatePDF', async (_, { billId, cart, totals, customerName, paymentType }) => {
  try {
    const doc = new PDFDocument();
    const filePath = path.join(process.cwd(), `Bill-${billId}.pdf`);
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text('🧾 Mart Billing Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Bill No: ${billId}`);
    doc.text(`Customer: ${customerName || 'Walk-in'}`);
    doc.text(`Payment Type: ${paymentType}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.moveDown();
    doc.text('----------------------------------');

    cart.forEach(item => {
      doc.text(
        `${item.name} x${item.qty} - ₹${(
          item.qty * item.price +
          (item.qty * item.price * item.gst) / 100
        ).toFixed(2)}`
      );
    });

    doc.text('----------------------------------');
    doc.text(`Subtotal: ₹${totals.subtotal.toFixed(2)}`);
    doc.text(`GST: ₹${totals.gstTotal.toFixed(2)}`);
    doc.text(`Discount: ₹${totals.discount}`);
    doc.moveDown();
    doc.fontSize(14).text(`Net Total: ₹${totals.total.toFixed(2)}`, { align: 'right' });
    doc.end();

    return { success: true, filePath };
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    return { success: false };
  }
});

// --------------------------------------------------
// 📈 Dashboard Analytics
// --------------------------------------------------
ipcMain.handle("getDashboardStats", async (_, range = "daily", customRange = {}) => {
  try {
    let dateCondition = "";

    switch (range) {
      case "daily": dateCondition = `DATE(b.date_time) = CURRENT_DATE`; break;
      case "weekly": dateCondition = `b.date_time >= CURRENT_DATE - INTERVAL '7 days'`; break;
      case "monthly": dateCondition = `EXTRACT(MONTH FROM b.date_time) = EXTRACT(MONTH FROM CURRENT_DATE)`; break;
      case "custom": dateCondition = `b.date_time BETWEEN '${customRange.from}' AND '${customRange.to}'`; break;
    }

    // 📌 Summary Stats
    const summary = await db.query(`
      SELECT
        COALESCE(SUM(b.total), 0) AS totalSales,
        COALESCE(COUNT(b.bill_id), 0) AS billsCount,
        COALESCE(AVG(b.total), 0) AS avgBill
      FROM bills b
      WHERE ${dateCondition}
    `);

    // 🛒 Items Sold
    const itemsSold = await db.query(`
      SELECT COALESCE(SUM(bi.qty), 0) AS itemsSold
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.bill_id
      WHERE ${dateCondition}
    `);

    // 💸 Profit
    const profitData = await db.query(`
      SELECT COALESCE(SUM((bi.qty * bi.price) - (bi.qty * i.buy_price)), 0) AS profit
      FROM bill_items bi
      JOIN items i ON bi.item_id = i.item_id
      JOIN bills b ON bi.bill_id = b.bill_id
      WHERE ${dateCondition}
    `);

    // 🔥 Top Items
    const topItems = await db.query(`
      SELECT i.name, SUM(bi.qty) AS qty
      FROM bill_items bi
      JOIN items i ON bi.item_id = i.item_id
      JOIN bills b ON bi.bill_id = b.bill_id
      WHERE ${dateCondition}
      GROUP BY i.name
      ORDER BY qty DESC
      LIMIT 5
    `);

    // ⚠ Low Stock
    const lowStock = await db.query(`
      SELECT item_id AS id, name, stock
      FROM items
      WHERE stock <= 5
      ORDER BY stock ASC
      LIMIT 5
    `);

    // 📈 Graph Data
    const graphData = await db.query(`
      SELECT DATE(b.date_time) AS date, SUM(b.total) AS sales
      FROM bills b
      WHERE ${dateCondition}
      GROUP BY DATE(b.date_time)
      ORDER BY DATE(b.date_time) ASC
    `);

    // 🧾 Recent Bills (no date filter)
    const recentBills = await db.query(`
      SELECT bill_id, total, date_time
      FROM bills
      ORDER BY bill_id DESC
      LIMIT 5
    `);

    return {
      totalSales: summary.rows[0].totalsales,
      billsCount: summary.rows[0].billscount,
      avgBill: summary.rows[0].avgbill,
      itemsSold: itemsSold.rows[0].itemssold,
      profit: profitData.rows[0].profit,
      graphData: graphData.rows,
      recentBills: recentBills.rows,
      lowStock: lowStock.rows,
      topItems: topItems.rows,
      range
    };

  } catch (error) {
    console.error("❌ Dashboard stats error:", error);
    return { error: "Failed to fetch dashboard stats" };
  }
});


// --------------------------------------------------
// 🚪 Quit the app
// --------------------------------------------------
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
