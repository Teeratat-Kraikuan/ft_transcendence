import router from "./router.js";

(async function(){
	try {
		await fetch("/api/v1/logout/");
		router.redirect("/home");
	} catch (e) {
		console.error(e);
	}
})();
