// Input escape
function __handleEsc(event) {
  if (event.key == "Escape") {
    const id = event.target.getAttribute("escapedby");
    console.log("id", id)
    if (id) {
      const el = document.getElementById(id);
      if (el) el.click();
    }
  }
}
