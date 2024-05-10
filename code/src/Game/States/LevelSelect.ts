import { OverlayRendering } from "../../Engine/Rendering/GUI/OverlayRendering";
import State, { StatesEnum } from "../../Engine/States/State";
import { StateAccessible } from "../GameMachine";
import Game from "./Game";

const numLevels = 5;

export default class LevelSelect extends State {
	private overlayRendering: OverlayRendering;
	private sa: StateAccessible;

	constructor(sa: StateAccessible) {
		super();
		this.sa = sa;
		this.overlayRendering = new OverlayRendering();

		for (let i = 1; i <= numLevels; i++) {
			let level1Button = this.overlayRendering.getNewButton();
			level1Button.position[0] = 0.5;
			level1Button.position[1] = 0.2 + i * 0.1;
			level1Button.center = true;
			level1Button.textString = "Level " + i;

			let self = this;
			level1Button.onClick(function () {
				self.gotoState = StatesEnum.GAME;
				self.sa.level = "Assets/placements/Level" + i + ".txt";
				self.sa.restartGame = true;
			});
		}

		let backButton = this.overlayRendering.getNewButton();
		backButton.position[0] = 0.5;
		backButton.position[1] = 0.2 + (numLevels + 1) * 0.1;
		backButton.center = true;
		backButton.textString = "Back";

		let self = this;
		backButton.onClick(function () {
			self.gotoState = StatesEnum.MAINMENU;
		});
	}

	async init() {
		this.overlayRendering.show();
		document.exitPointerLock();
	}

	reset() {
		this.overlayRendering.hide();
	}

	update(dt: number) {}

	draw() {
		this.overlayRendering.draw();
	}
}
