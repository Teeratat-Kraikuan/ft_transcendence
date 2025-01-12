(function () {
	"use strict";

    let game;

    function waitForGameMain() {
        if (typeof window.game_main === 'function') {
            game = window.game_main();
        } else {
            setTimeout(waitForGameMain, 300);
        }
    }
    window.main = function () {
        // const game_script = document.getElementById("game-logic");
        // console.log(game_script);
        console.log("Game started!");
        // waitForGameMain();
        if (window.game_main == undefined)
            setTimeout(() => game = window.game_main(), 2000);
        else
            game = window.game_main();
    };

    window.unload = function () {
        // If `game` is defined, we do cleanup
        if (game) {
            // Dispose audio from the object reference
            game.audioPlayer.unloadAll();
            game.resetGame();
        }
        game = null;

        // Now unload the actual game logic from main.js
        if (typeof window.unloadGameMain === 'function') {
            window.unloadGameMain();
        }

        // Remove global references
        delete window.main;
        console.log("Game fully unloaded from game.js");
	}

    if (window["main"] != undefined)
		window.main();

})();