(function () {
	"use strict";

	class Canvas {
	  constructor(selector) {
		this.el = document.querySelector(selector);
		this.ctx = this.el.getContext("2d");
	  }
	}

	const canvas = new Canvas(".game-canvas");

	const setCanvas = function () {
	  const bound = canvas.el.parentElement.getBoundingClientRect();
	  const desiredHeight = bound.width * (3 / 4);

	  canvas.el.width = bound.width;
	  canvas.el.height = desiredHeight;

	  console.log(`Canvas resized: ${canvas.el.width}x${canvas.el.height}`);
	};

	const evResize = window.addEventListener("resize", setCanvas);

	setCanvas();

	window.onunload = function () {
	  removeEventListener("resize", evResize);
	};

  })();