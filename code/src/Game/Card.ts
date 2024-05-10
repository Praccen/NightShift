import Game from "./States/Game";
enum COLOR {
	RED,
	GREEN,
	BLUE,
	ORANGE,
	PINK,
	PURPLE,
}
class Box {
	colors: COLOR;
	constructor() {
		let rand = Math.floor(Math.random() * 5 + 1);
		if (rand == 1) {
			this.colors = COLOR.RED;
			console.warn("RED");
		} else if (rand == 2) {
			this.colors = COLOR.GREEN;
			console.warn("GREEN");
		} else if (rand == 3) {
			this.colors = COLOR.BLUE;
			console.warn("BLUE");
		} else if (rand == 4) {
			this.colors = COLOR.ORANGE;
			console.warn("ORANGE");
		} else if (rand == 5) {
			this.colors = COLOR.PINK;
			console.warn("PINK");
		} else if (rand == 6) {
			this.colors = COLOR.PURPLE;
			console.warn("PURPLE");
		}
	}
}

export default class Card {
	private game: Game;
	boxes: Array<Box>;
	constructor(game: Game) {
		this.game = game;
		this.boxes = [new Box(), new Box(), new Box()];
	}
}
