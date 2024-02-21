document.addEventListener('DOMContentLoaded', () => {
	let validatedCount = 0
	const containers = document.querySelectorAll('.time-container')
	containers.forEach((v) => {
		v.querySelector('input').addEventListener('blur', e => {
			const time = e.target.value.split(":")
			if (time.length !== 2) {
				e.target.style.border = "1px solid red"
				return
			}

			const hours = parseInt(time[0])
			const minutes = parseInt(time[1])

			if (isNaN(hours) || isNaN(minutes)) {
				e.target.style.border = "1px solid red"
				return
			}

			if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
				e.target.style.border = "1px solid red"
				return
			}

			e.target.style.border = "1px solid #ced4da"
			validatedCount += 1
			
			if (validatedCount === containers.length) {
				document.querySelector('form.time-form button').disabled = false
				document.querySelector('form.time-form button').focus()
			}
		})
	})
})