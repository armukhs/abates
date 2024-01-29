// document.querySelectorAll('option[value="13"]:not([g="1102-06"])')
// document.querySelectorAll('select:not([g="1102-06"]) option[value="13"]')

// Select event listener
const lgdAssessorChange = (event) => {
	const elm = event.target;
	const name = elm.getAttribute("name");
	const group = elm.getAttribute("g");
	const value = elm.value;
	const values = [];
	document.querySelectorAll(`select[name="${name}"]`).forEach(s => {
		if (s.value) values.push(s.value);
	});
	console.log(values)

	// Iterate siblings
	document.querySelectorAll(`select[name="${name}"]:not([g="${group}"]) option`).forEach(o => {
		if (o.value && values.includes(o.value) && o.value == value) {
			o.setAttribute("disabled", true);
		} else {
			o.removeAttribute("disabled");
		}
	})

	// Iterate inside
	document.querySelectorAll(`select[name="${name}"][g="${group}"] option`).forEach(o => {
		if (o.value && values.includes(o.value) && o.value != value) {
			o.setAttribute("disabled", true);
		} else {
			o.removeAttribute("disabled");
		}
	})
}

document.querySelectorAll("select").forEach(s => {
	s.addEventListener("change", lgdAssessorChange)
})
