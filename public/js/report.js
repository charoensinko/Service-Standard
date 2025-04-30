function generateReport() {
  const service = document.getElementById("service-select").value;
  const start = document.getElementById("start-month").value;
  const end = document.getElementById("end-month").value;
  if (!service || !start || !end) return alert("กรุณาเลือกทุกช่อง");
  fetch(
    `/api/report?service=${encodeURIComponent(
      service
    )}&start=${start}&end=${end}`
  )
    .then((res) => res.json())
    .then((data) => {
      const tbl = document.getElementById("report-table");
      const tbody = tbl.querySelector("tbody");
      tbody.innerHTML = "";
      data.forEach((r) => {
        const tr = document.createElement("tr");
        [
          "service",
          "month",
          "numbers_of_services",
          "sum_of_service_durations",
          "average_service_duration",
        ].forEach((k) => {
          const td = document.createElement("td");
          td.textContent = r[k];
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      tbl.style.display = "table";
    })
    .catch(console.error);
}
function exportReport() {
  const service = document.getElementById("service-select").value;
  const start = document.getElementById("start-month").value;
  const end = document.getElementById("end-month").value;
  if (!service || !start || !end) return alert("กรุณาเลือกทุกช่อง");
  window.location = `/export/report?service=${encodeURIComponent(
    service
  )}&start=${start}&end=${end}`;
}
