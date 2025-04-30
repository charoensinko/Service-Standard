// โหลดข้อมูลจาก API แล้วเติมลงในตาราง
window.addEventListener("DOMContentLoaded", () => {
  fetch("/api/data")
    .then((res) => res.json())
    .then((rows) => {
      const tbody = document.querySelector("#data-table tbody");
      rows.forEach((r) => {
        const tr = document.createElement("tr");
        [
          "id",
          "date",
          "cust_id",
          "service",
          "start_time",
          "stop_time",
          "service_duration",
        ].forEach((key) => {
          const td = document.createElement("td");
          td.textContent = r[key];
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    })
    .catch(console.error);
});
