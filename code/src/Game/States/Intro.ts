import { OverlayRendering } from "../../Engine/Rendering/GUI/OverlayRendering";
import State, { StatesEnum } from "../../Engine/States/State";
import { StateAccessible } from "../GameMachine";
import Game from "./Game";

export default class Intro extends State {
	private overlayRendering: OverlayRendering;
	private sa: StateAccessible;

	constructor(sa: StateAccessible) {
		super();
		this.sa = sa;
		this.overlayRendering = new OverlayRendering();

		let introDiv = this.overlayRendering.getNewDiv();
		introDiv.getElement().style.width = "80%";
		introDiv.getElement().style.height = "60%";
		introDiv.getElement().style.backgroundColor = "gray";
		introDiv.getElement().style.opacity = "70%";
		introDiv.position[0] = 0.5;
		introDiv.position[1] = 0.4;
		introDiv.center = true;
		introDiv.getElement().style.borderRadius = "10px";
		introDiv.getElement().style.overflowY = "auto";
		introDiv.getElement().style.overflowWrap = "break-word";

		let introText = this.overlayRendering.getNew2DText(introDiv);
		introText.textString = `Hello! Welcome to your new job as a personal shopper.
You will get orders of three boxes to pick up at a time.
		
Look at the orders by pressing C.

Go get matching boxes and put them in the delivery zone.


		`;

		let playButton = this.overlayRendering.getNewButton();
		playButton.position[0] = 0.5;
		playButton.position[1] = 0.8;
		playButton.center = true;
		playButton.textString = "Start";

		let self = this;
		playButton.onClick(function () {
			self.gotoState = StatesEnum.GAME;
			self.sa.level = "Assets/placements/Level1.txt";
			self.sa.restartGame = true;
		});

		let backButton = this.overlayRendering.getNewButton();
		backButton.position[0] = 0.5;
		backButton.position[1] = 0.9;
		backButton.center = true;
		backButton.textString = "Back";

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
