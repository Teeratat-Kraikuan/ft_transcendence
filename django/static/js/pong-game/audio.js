
export class AudioPlayer {
    constructor () {
        this.audio_players = {};
    }
    load (name, url) {
        if (!this.audio_players[name])
        {
            console.log("Loading audio " + name + "...");
            this.audio_players[name] = new Audio(url);
        }
        return this.audio_players[name];
    }
    play (name) {
        if (!this.audio_players[name])
            return ;
        this.audio_players[name].play();
    }
    unload (name) {
        console.log("Unloading audio " + name + "...");
        this.audio_players[name].pause();
        this.audio_players[name].currentTime = 0;
        delete this.audio_players[name];
    }
    unloadAll()
    {
        Object.keys(this.audio_players).map (name => this.unload(name));
    }
}
