// server.js
const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const ExcelJS = require("exceljs");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// --- Database Setup ---
const dbFile = path.join(__dirname, "data", "service.db");
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) console.error("DB Error:", err);
});
db.run(`CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  cust_id TEXT,
  service TEXT,
  start_time TEXT,
  stop_time TEXT,
  service_duration REAL
)`);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "ui.html"))
);

app.post("/submit", (req, res) => {
  const { service, date, cust_id, start_time, stop_time } = req.body;
  const [y, m, d] = date.split("-");
  const fdate = `${d}/${m}/${y}`;
  const [sh, sm] = start_time.split(":").map(Number);
  const [eh, em] = stop_time.split(":").map(Number);
  let duration = eh * 60 + em - (sh * 60 + sm);
  duration = parseFloat(duration.toFixed(2));
  db.run(
    `INSERT INTO services (date, cust_id, service, start_time, stop_time, service_duration)
          VALUES (?, ?, ?, ?, ?, ?)`,
    [fdate, cust_id, service, start_time, stop_time, duration],
    (err) => {
      if (err) console.error(err);
      res.redirect("/database");
    }
  );
});

app.get("/database", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "database.html"))
);

app.get("/api/data", (req, res) => {
  db.all(`SELECT * FROM services ORDER BY id ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/export", async (req, res) => {
  db.all(`SELECT * FROM services ORDER BY id ASC`, [], async (err, rows) => {
    if (err) return res.status(500).send(err.message);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Service Log");
    ws.columns = [
      { header: "ID", key: "id", width: 6 },
      { header: "Date", key: "date", width: 12 },
      { header: "Customer ID", key: "cust_id", width: 20 },
      { header: "Service", key: "service", width: 15 },
      { header: "Start Time", key: "start_time", width: 12 },
      { header: "Stop Time", key: "stop_time", width: 12 },
      { header: "Duration (min)", key: "service_duration", width: 15 },
    ];
    rows.forEach((r) => ws.addRow(r));
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="services.xlsx"'
    );
    await wb.xlsx.write(res);
    res.end();
  });
});

app.get("/report", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "report.html"))
);

app.get("/api/report", (req, res) => {
  const { service, start, end } = req.query;
  db.all(`SELECT * FROM services WHERE service = ?`, [service], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const groups = {};
    const [sy, sm] = start.split("-").map(Number);
    const [ey, em] = end.split("-").map(Number);
    const startDate = new Date(sy, sm - 1);
    const endDate = new Date(ey, em - 1);
    rows.forEach((r) => {
      const [d, m, y] = r.date.split("/").map(Number);
      const dt = new Date(y, m - 1);
      if (dt >= startDate && dt <= endDate) {
        const key = `${y}-${String(m).padStart(2, "0")}`;
        if (!groups[key]) groups[key] = { count: 0, sum: 0 };
        groups[key].count++;
        groups[key].sum += r.service_duration;
      }
    });
    const result = Object.keys(groups)
      .sort()
      .map((month) => {
        const count = groups[month].count;
        const sum = groups[month].sum;
        const avg = parseFloat((sum / count).toFixed(2));
        return {
          service,
          month,
          numbers_of_services: count,
          sum_of_service_durations: parseFloat(sum.toFixed(2)),
          average_service_duration: avg,
        };
      });
    res.json(result);
  });
});

app.get("/export/report", async (req, res) => {
  const { service, start, end } = req.query;
  db.all(
    `SELECT * FROM services WHERE service = ?`,
    [service],
    async (err, rows) => {
      if (err) return res.status(500).send(err.message);
      const groups = {};
      const [sy, sm] = start.split("-").map(Number);
      const [ey, em] = end.split("-").map(Number);
      const startDate = new Date(sy, sm - 1);
      const endDate = new Date(ey, em - 1);
      rows.forEach((r) => {
        const [d, m, y] = r.date.split("/").map(Number);
        const dt = new Date(y, m - 1);
        if (dt >= startDate && dt <= endDate) {
          const key = `${y}-${String(m).padStart(2, "0")}`;
          if (!groups[key]) groups[key] = { count: 0, sum: 0 };
          groups[key].count++;
          groups[key].sum += r.service_duration;
        }
      });
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Report");
      ws.columns = [
        { header: "Service", key: "service", width: 15 },
        { header: "Month", key: "month", width: 12 },
        {
          header: "Numbers_of_Services",
          key: "numbers_of_services",
          width: 20,
        },
        {
          header: "Sum_of_Service_Durations",
          key: "sum_of_service_durations",
          width: 25,
        },
        {
          header: "Average_Service_Duration",
          key: "average_service_duration",
          width: 20,
        },
      ];
      Object.keys(groups)
        .sort()
        .forEach((month) => {
          const count = groups[month].count;
          const sum = groups[month].sum;
          const avg = parseFloat((sum / count).toFixed(2));
          ws.addRow({
            service,
            month,
            numbers_of_services: count,
            sum_of_service_durations: parseFloat(sum.toFixed(2)),
            average_service_duration: avg,
          });
        });
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="report.xlsx"'
      );
      await wb.xlsx.write(res);
      res.end();
    }
  );
});

// Start server
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
