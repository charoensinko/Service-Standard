// ตั้งค่า default วันที่เป็นวันนี้
document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.querySelector('input[type="date"]');
  dateInput.value = new Date().toISOString().substr(0, 10);
});
