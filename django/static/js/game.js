(function() {

	"use strict";

	class Canvas {
		constructor (selector) {
			this.el = document.querySelector(selector);
			this.ctx = this.el.getContext("2d");
		}
	}

	const canvas = new Canvas(".game-canvas");

	const set_canvas = function () {
		canvas.el.width = 0;
		canvas.el.height = 0;
		const bound = canvas.el.getBoundingClientRect();
		canvas.el.width = bound.width;
		canvas.el.height = bound.height;
	};

	const ev_resize = window.addEventListener("resize", set_canvas);

	set_canvas();
	window.unload = function () {
		removeEventListener('resize', ev_resize);
	}

})();