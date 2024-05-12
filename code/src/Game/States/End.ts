import { OverlayRendering } from "../../Engine/Rendering/GUI/OverlayRendering";
import State, { StatesEnum } from "../../Engine/States/State";
import { StateAccessible } from "../GameMachine";
import Game from "./Game";

export default class End extends State {
	private overlayRendering: OverlayRendering;
	private sa: StateAccessible;

	constructor(sa: StateAccessible, game: Game) {
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
		if (!game.caughtBySpider) {
			introText.textString = `Great job once again! No problem, right?

If you are ever in the need of money again
don't hesitate to sign up for a night shift or two!

FINAL PAYCHECK:
PAYCHECK:
Boxes___________  ${game.totalBoxes} * $100
TOTAL:
$${game.totalBoxes * 100}
`;
		} else {
			introText.textString = `*after the vicious attack from that monster your
wake up in the hospital, you boss standing over you*

Ouf, that bite looks ROUGH! Sorry about that!
But don't worry, they said it is not venomous and I've
already payed for the hospital bill. It will be
coming out of your salary though.. See you around!

PAYCHECK:
Boxes___________  ${game.totalBoxes} * $100
Hospital bills__ -$200
TOTAL:
$${game.totalBoxes * 100 - 200}

`;
		}

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
	}

	reset() {
		this.overlayRendering.hide();
	}

	update(dt: number) {}

	draw() {
		this.overlayRendering.draw();
	}
}
