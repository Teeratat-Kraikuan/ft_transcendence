(function() {

	"use strict";

	let ev_submit;

	window.main = function () {
		console.log("Account validator started!");
		const form = document.querySelector('form');
		ev_submit = form.addEventListener('change', () => {
			const inputs = {
				email: document.querySelector("input[name='email']"),
				passwd: document.querySelector("input[name='password']"),
				rep_passwd: document.querySelector("input[name='repeat_password']")
			};
			Object.keys(inputs)
				.map(k => inputs[k]?.setCustomValidity(""));
			if (inputs.email.value.match(/[a-z0-9._%+-]{1,}@[a-z0-9.-]{2,}.[a-z]{2,4}/) == null)
				inputs.email.setCustomValidity("Invalid Email!");
			else if (inputs.passwd.value.match(/(?=.*\d)(?=.*[\W_]).{7,}/) == null)
				inputs.passwd.setCustomValidity("Password Invalid! Requirement: Minimum of 7 characters. Should have at least one special character and one number.");
			else if (inputs.rep_passwd && inputs.passwd.value !== inputs.rep_passwd.value)
				inputs.rep_passwd.setCustomValidity("Password mismatch!");
			form.reportValidity();
		});
	};
	window.unload = function () {
		delete window.main;
		removeEventListener('change', ev_submit);
	}

	if (window["main"] != undefined)
		window.main();

})();