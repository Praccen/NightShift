import Div from "../../Engine/Rendering/GUI/Objects/Div";
import TextObject2D from "../../Engine/Rendering/GUI/Objects/Text/TextObject2D";
import { OverlayRendering } from "../../Engine/Rendering/GUI/OverlayRendering";
import State, { StatesEnum } from "../../Engine/States/State";
import { StateAccessible } from "../GameMachine";

export default class End extends State {
	private overlayRendering: OverlayRendering;
	private sa: StateAccessible;
	private introText: TextObject2D;
	private introDiv: Div;

	constructor(sa: StateAccessible) {
		super();
		this.sa = sa;
		this.overlayRendering = new OverlayRendering();

		this.introDiv = this.overlayRendering.getNewDiv();
		this.introDiv.getElement().style.width = "80%";
		this.introDiv.getElement().style.height = "60%";
		this.introDiv.getElement().style.backgroundColor = "gray";
		this.introDiv.getElement().style.opacity = "70%";
		this.introDiv.position[0] = 0.5;
		this.introDiv.position[1] = 0.4;
		this.introDiv.center = true;
		this.introDiv.getElement().style.borderRadius = "10px";
		this.introDiv.getElement().style.overflowY = "auto";
		this.introDiv.getElement().style.overflowWrap = "break-word";
		this.introText = this.overlayRendering.getNew2DText(this.introDiv);

		let playButton = this.overlayRendering.getNewButton();
		playButton.position[0] = 0.5;
		playButton.position[1] = 0.8;
		playButton.center = true;
		playButton.textString = "Start";

		let self = this;
		playButton.onClick(function () {
			self.gotoState = StatesEnum.GAME;
			self.sa.level = "Assets/placements/Level2.txt";
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
		if (!this.sa.caughtBySpider) {
			this.introText.textString = `Great job once again! No problem, right?

If you are ever in the need of money again
don't hesitate to sign up for a night shift or two!

FINAL PAYCHECK:
PAYCHECK:
Boxes___________  ${this.sa.endTotalBoxes} * $100
TOTAL:
$${this.sa.endTotalBoxes * 100}`;
		} else {
			this.introText.textString = `*after the vicious attack from that monster your
wake up in the hospital, you boss standing over you*

Ouf, that bite looks ROUGH, so sorry about that!
But don't worry, they said it is not venomous and I've
already payed for the hospital bill. It will be
coming out of your salary though.. See you around!

PAYCHECK:
Boxes___________  ${this.sa.endTotalBoxes} * $100
Hospital bills__ -$200
TOTAL:
$${this.sa.endTotalBoxes * 100 - 200}`;
		}
	}

	reset() {
		this.overlayRendering.hide();
		this.introText.textString = "";
	}

	update(dt: number) {}

	draw() {
		this.overlayRendering.draw();
	}
}
