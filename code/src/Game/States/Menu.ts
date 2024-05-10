import { OverlayRendering } from "../../Engine/Rendering/GUI/OverlayRendering";
import State, { StatesEnum } from "../../Engine/States/State";
import { gl } from "../../main";
import { StateAccessible } from "../GameMachine";

export default class Menu extends State {
	private overlayRendering: OverlayRendering;
	private sa: StateAccessible;

	constructor(sa: StateAccessible) {
		super();
		this.sa = sa;
		this.overlayRendering = new OverlayRendering();

		let startButton = this.overlayRendering.getNewButton();
		startButton.position[0] = 0.5;
		startButton.position[1] = 0.2;
		startButton.center = true;
		startButton.textString = "Start";

		let self = this;
		startButton.onClick(function () {
			self.gotoState = StatesEnum.LEVELSELECT;
		});

		let resumeButton = this.overlayRendering.getNewButton();
		resumeButton.position[0] = 0.5;
		resumeButton.position[1] = 0.4;
		resumeButton.center = true;
		resumeButton.textString = "Resume";

		resumeButton.onClick(function () {
			self.gotoState = StatesEnum.GAME;
		});

		let optionsButton = this.overlayRendering.getNewButton();
		optionsButton.position[0] = 0.5;
		optionsButton.position[1] = 0.6;
		optionsButton.center = true;
		optionsButton.textString = "Options";

		optionsButton.onClick(function () {
			self.gotoState = StatesEnum.OPTIONS;
		});

		let fullscreenButton = this.overlayRendering.getNewButton();
		fullscreenButton.position[0] = 0.5;
		fullscreenButton.position[1] = 0.8;
		fullscreenButton.center = true;
		fullscreenButton.textString = "Fullscreen";

		fullscreenButton.onClick(function () {
			document.getElementById("gameDiv").requestFullscreen();
		});
	}

	async init() {
		this.overlayRendering.show();
		document.exitPointerLock();
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
	}

	reset() {
		this.overlayRendering.hide();
	}

	update(dt: number) {}

	draw() {
		this.overlayRendering.draw();
	}
}
