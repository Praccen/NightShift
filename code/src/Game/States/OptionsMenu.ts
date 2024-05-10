import Button from "../../Engine/Rendering/GUI/Objects/Button";
import Checkbox from "../../Engine/Rendering/GUI/Objects/Checkbox";
import Slider from "../../Engine/Rendering/GUI/Objects/Slider";
import { options } from "../GameMachine";
import State, { StatesEnum } from "../../Engine/States/State";
import { StateAccessible } from "../GameMachine";
import { OverlayRendering } from "../../Engine/Rendering/GUI/OverlayRendering";

export default class OptionsMenu extends State {
	private overlayRendering: OverlayRendering;

	private backButton: Button;
	private crtCB: Checkbox;
	private bloomCB: Checkbox;
	private grassCB: Checkbox;
	private grassDensitySlider: Slider;
	private fpsDisplayCB: Checkbox;
	private controlsButton: Button;
	private musicVolume: Slider;
	private effectVolume: Slider;
	private stateAccessible: StateAccessible;

	constructor(sa: StateAccessible) {
		super();
		this.stateAccessible = sa;
		this.overlayRendering = new OverlayRendering();

		this.crtCB = this.overlayRendering.getNewCheckbox();
		this.crtCB.position[0] = 0.4;
		this.crtCB.position[1] = 0.25;
		this.crtCB.textString = "CRT-effect ";
		this.crtCB.getInputElement().checked = options.useCrt;

		this.bloomCB = this.overlayRendering.getNewCheckbox();
		this.bloomCB.position[0] = 0.4;
		this.bloomCB.position[1] = 0.3;
		this.bloomCB.textString = "Bloom-effect ";
		this.bloomCB.getInputElement().checked = options.useBloom;

		this.grassCB = this.overlayRendering.getNewCheckbox();
		this.grassCB.position[0] = 0.4;
		this.grassCB.position[1] = 0.35;
		this.grassCB.textString = "Foldable grass ";
		this.grassCB.getInputElement().checked = options.foldableGrass;

		this.grassDensitySlider = this.overlayRendering.getNewSlider();
		this.grassDensitySlider.position[0] = 0.4;
		this.grassDensitySlider.position[1] = 0.4;
		this.grassDensitySlider.textString = "Grass density \r\n(requires restart)";
		this.grassDensitySlider.getInputElement().min = "1000";
		this.grassDensitySlider.getInputElement().max = "100000";
		this.grassDensitySlider.getInputElement().value = options.grassDensity + "";

		this.fpsDisplayCB = this.overlayRendering.getNewCheckbox();
		this.fpsDisplayCB.position[0] = 0.4;
		this.fpsDisplayCB.position[1] = 0.5;
		this.fpsDisplayCB.textString = "Fps counter ";
		this.fpsDisplayCB.getInputElement().checked = options.showFps;

		this.musicVolume = this.overlayRendering.getNewSlider();
		this.musicVolume.position[0] = 0.4;
		this.musicVolume.position[1] = 0.55;
		this.musicVolume.textString = "Music volume";
		this.musicVolume.getInputElement().min = "0";
		this.musicVolume.getInputElement().max = "100";
		this.musicVolume.getInputElement().value = options.musicVolume * 250 + "";

		this.effectVolume = this.overlayRendering.getNewSlider();
		this.effectVolume.position[0] = 0.4;
		this.effectVolume.position[1] = 0.6;
		this.effectVolume.textString = "Effects volume";
		this.effectVolume.getInputElement().min = "0";
		this.effectVolume.getInputElement().max = "100";
		this.effectVolume.getInputElement().value = options.effectVolume * 250 + "";

		this.controlsButton = this.overlayRendering.getNewButton();
		this.controlsButton.position[0] = 0.5;
		this.controlsButton.position[1] = 0.75;
		this.controlsButton.center = true;

		this.controlsButton.textString = "Controls";

		let self = this;
		this.controlsButton.onClick(function () {
			self.gotoState = StatesEnum.CONTROLS;
		});

		this.backButton = this.overlayRendering.getNewButton();
		this.backButton.position[0] = 0.5;
		this.backButton.position[1] = 0.85;
		this.backButton.center = true;
		this.backButton.textString = "Back to main menu";

		this.backButton.onClick(function () {
			self.gotoState = StatesEnum.MAINMENU;
		});
	}

	async init() {
		this.overlayRendering.show();
	}

	reset() {
		this.overlayRendering.hide();
	}

	update(dt: number) {
		options.useCrt = this.crtCB.getChecked();
		options.useBloom = this.bloomCB.getChecked();
		options.foldableGrass = this.grassCB.getChecked();
		options.showFps = this.fpsDisplayCB.getChecked();
		options.grassDensity = this.grassDensitySlider.getValue();
		options.musicVolume = this.musicVolume.getValue() * 0.004;
		this.stateAccessible.audioPlayer.setMusicVolume(options.musicVolume);
		options.effectVolume = this.effectVolume.getValue() * 0.004;
		this.stateAccessible.audioPlayer.setSoundEffectVolume(options.effectVolume);
	}

	draw() {
		this.overlayRendering.draw();
	}
}
