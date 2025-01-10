(function () {
	"use strict";

    let game;

    window.main = function () {
        // const game_script = document.getElementById("game-logic");
        // console.log(game_script);
        console.log("Game started!");
        if (window.game_main == undefined)
            setTimeout(() => game = window.game_main(), 1000);
        else
            game = window.game_main();
    };

    window.unload = function () {
        game.audioPlayer.unloadAll();
        game.resetGame();
        game = null;
		delete window.main;
	}

    if (window["main"] != undefined)
		window.main();

})();