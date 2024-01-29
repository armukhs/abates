(function(){
	const LDG_BUCKET = document.getElementById("lgd-assessors-bucket");
	const LGD_LOADER = document.getElementById("lgd-load-bucket");
	const LGD_LOADER_BTN = document.getElementById("btn-lgd-load-bucket");
	const F2F_BUCKET = document.getElementById("f2f-assessors-bucket");
	const F2F_LOADER = document.getElementById("f2f-load-bucket");
	const F2F_LOADER_BTN = document.getElementById("btn-f2f-load-bucket");

	let LGD_IDS = [...LGD_ASS_IDS];
	let F2F_IDS = [...F2F_ASS_IDS];
	let CURRENT_TYPE = "";

	console.log("LGD_IDS", LGD_IDS);
	console.log("F2F_IDS", F2F_IDS);

	if (LGD_IDS.length < MAX_LGD) LGD_LOADER.style.display = "block";
	if (F2F_IDS.length < MAX_F2F) F2F_LOADER.style.display = "block";


	// SSE "bucket-loaded"
	document.body.addEventListener('bucket-loaded', function (ev) {
		const detail = ev.detail
		const loader = detail.loader;
		const type = detail.type;
		CURRENT_TYPE = type;
		const filter = type == "lgd" ? LGD_IDS : F2F_IDS;
		console.log("filter", filter);
		console.log(loader, CURRENT_TYPE);
		document.getElementById(loader).style.display="none";
		document.querySelectorAll(".bucket-loader").forEach((b) => b.setAttribute("disabled", true));

		// Add delay before activating bucket items
		setTimeout(() => {
			console.log(F2F_IDS)
			console.log(LGD_IDS)
			document.querySelectorAll(".bucket-item").forEach(elm => {
				const id = parseInt(elm.getAttribute("ass_id"));
				// filter
				if (filter.includes(id)) {
					console.log("Filter:", id)
					elm.classList.add("selected")
				}
				elm.addEventListener("click", bucketItemClick)
			});
		}, 200);
	});

	// SSE "assessor-saved"
	document.body.addEventListener("assessor-saved", function (ev){
		const type = ev.detail.type;
		const ass_id = ev.detail.ass_id;
		if (type == 'f2f') {
			F2F_IDS.push(ass_id);
			if (F2F_IDS.length == MAX_F2F) {
				F2F_LOADER.style.display = "none";
				F2F_BUCKET.innerHTML = "";
				LGD_LOADER_BTN.removeAttribute("disabled");
			}
		} else {
			LGD_IDS.push(ass_id);
			if (LGD_IDS.length == MAX_LGD) {
				LGD_LOADER.style.display = "none";
				LDG_BUCKET.innerHTML = "";
				F2F_LOADER_BTN.removeAttribute("disabled");
			}
		}
		console.log("ev.detail", ev.detail);
		console.log("f2f", F2F_IDS)
		console.log("lgd", LGD_IDS)
		const elm = document.getElementById('A-' + ev.detail.ass_id)
		if (elm) elm.classList.add('selected');
		// minmax();
	})

	// SSE "assessor-dropped"
	document.body.addEventListener("assessor-dropped", function (ev){
		console.log(ev.detail);
		const { ass_id, type } = ev.detail;
		// Update array and check max
		if (type == "lgd") {
			LGD_IDS = LGD_IDS.filter(x => x != ass_id);
			if (LGD_IDS.length < MAX_LGD && LDG_BUCKET.innerHTML == "") {
				LGD_LOADER.style.display = "block";
				LGD_LOADER_BTN.removeAttribute("disabled");
			}
		} else {
			F2F_IDS = F2F_IDS.filter(x => x != ass_id);
			if (F2F_IDS.length < MAX_F2F && F2F_BUCKET.innerHTML == "") {
				F2F_LOADER.style.display = "block";
				F2F_LOADER_BTN.removeAttribute("disabled");
			}
		}

		console.log("assessor-dropped", ev.detail)
		console.log("Current type", CURRENT_TYPE);
		console.log(LGD_IDS)
		console.log(F2F_IDS)

		// No need to check max

		// Update bucket item if bucket exists
		const elm = document.getElementById('A-' + ev.detail.ass_id);
		if (elm) elm.classList.remove('selected');
	})

	function minmax() {
		if (CURRENT_TYPE == "lgd") {
			const display = LGD_IDS.length == MAX_LGD ? "none" : "block";
			document.getElementById("lgd-load-bucket").style.display = display;
		} else if (CURRENT_TYPE == "f2f") {
			const display = F2F_IDS.length == MAX_F2F ? "none" : "block";
			document.getElementById("f2f-load-bucket").style.display = display;
		}
	}

	function bucketItemClick(event) {
		const src = event.target;
		const id = src.getAttribute("ass_id");
		const name = src.innerText;
		if (src.classList.contains("selected")) return;
		console.log("bucketItemClick()", id, name);
		console.log(src.nextSibling)
		src.nextSibling.click();
	}

	// minmax();
	/* EOF */
}())
