import AudioPlayer from "../Engine/Audio/AudioPlayer";
import TextObject2D from "../Engine/Rendering/GUI/Objects/Text/TextObject2D";
import Input from "../Engine/Input/Input";
import MeshStore from "../Engine/AssetHandling/MeshStore";
import State, { StatesEnum } from "../Engine/States/State";
import StateMachine from "../Engine/States/StateMachine";
import TextureStore from "../Engine/AssetHandling/TextureStore";
import ControlsMenu from "./States/ControlsMenu";
import DebugMode from "./States/DebugMode";
import Game from "./States/Game";
import LoadingScreen from "./States/LoadingScreen";
import Menu from "./States/Menu";
import OptionsMenu from "./States/OptionsMenu";
import { WebUtils } from "../Engine/Utils/WebUtils";
import { OverlayRendering } from "../Engine/Rendering/GUI/OverlayRendering";
import LevelSelect from "./States/LevelSelect";
import { Howler } from "howler";
import Intro from "./States/Intro";
import IntroDay2 from "./States/IntroDay2";
import End from "./States/End";
// Globals
export let input = new Input();
export let options = {
	useCrt: false,
	useBloom: false,
	foldableGrass: false,
	showFps: true,
	grassDensity: 10000,
	musicVolume: 0.2,
	effectVolume: 0.2,
};

/**
 * These are the variables available to all the states
 */
export class StateAccessible {
	textureStore: TextureStore;
	meshStore: MeshStore;
	audioPlayer: AudioPlayer;
	restartGame: boolean;
	localGame: boolean;
	level: string;
}

export default class GameMachine extends StateMachine {
	stateAccessible: StateAccessible;

	private overlayRendering: OverlayRendering;
	private fpsDisplay: TextObject2D;

	constructor() {
		super(StatesEnum.LOADINGSCREEN);
		this.initializeOptions();
		this.stateAccessible = new StateAccessible();
		this.stateAccessible.textureStore = new TextureStore();
		this.stateAccessible.meshStore = new MeshStore(this.stateAccessible.textureStore);
		(this.stateAccessible.audioPlayer = new AudioPlayer()),
			(this.stateAccessible.restartGame = false),
			(this.stateAccessible.localGame = true),
			this.stateAccessible.audioPlayer.setMusicVolume(options.musicVolume);
		this.stateAccessible.audioPlayer.setSoundEffectVolume(options.effectVolume);
		Howler.volume(options.effectVolume * 2.5);

		// Add states
		this.addState(
			StatesEnum.LOADINGSCREEN,
			LoadingScreen,
			1 / 60.0,
			new LoadingScreen(this.stateAccessible, this)
		);

		this.overlayRendering = new OverlayRendering();
		this.fpsDisplay = this.overlayRendering.getNew2DText();
		this.fpsDisplay.position[0] = 0.01;
		this.fpsDisplay.position[1] = 0.01;
		this.fpsDisplay.size = 18;
		this.fpsDisplay.scaleWithWindow = false;
		this.fpsDisplay.getElement().style.color = "lime";
	}

	onExit(e: BeforeUnloadEvent) {
		WebUtils.SetCookie("showFps", options.showFps.valueOf().toString());
		WebUtils.SetCookie("useCrt", options.useCrt.valueOf().toString());
		WebUtils.SetCookie("useBloom", options.useBloom.valueOf().toString());
		WebUtils.SetCookie("volume", options.musicVolume.toString());
		WebUtils.SetCookie("effectVolume", options.effectVolume.toString());
		WebUtils.SetCookie("foldableGrass", options.foldableGrass.valueOf().toString());
		WebUtils.SetCookie("grassDensity", options.grassDensity.toString());

		for (let s of this.states) {
			s[1].state.onExit(e);
		}
	}

	initializeOptions() {
		options.showFps = !(WebUtils.GetCookie("showFps") == "false");
		options.useCrt = WebUtils.GetCookie("useCrt") == "true";
		options.useBloom = WebUtils.GetCookie("useBloom") == "true";
		let volumeCookie = WebUtils.GetCookie("volume");
		if (volumeCookie != "") {
			options.musicVolume = parseFloat(volumeCookie);
		}
		let effectVolumeCookie = WebUtils.GetCookie("effectVolume");
		if (effectVolumeCookie != "") {
			options.effectVolume = parseFloat(effectVolumeCookie);
		}

		options.foldableGrass = WebUtils.GetCookie("foldableGrass") == "true";
		let grassDensityCookie = WebUtils.GetCookie("grassDensity");
		if (grassDensityCookie != "") {
			options.grassDensity = parseFloat(grassDensityCookie);
		}
	}

	/**
	 * Will be called by loading screen once everything is loaded
	 */
	createGameStates() {
		let game = Game.getInstance(this.stateAccessible);
		this.addState(StatesEnum.MAINMENU, Menu, 1.0 / 60.0, new Menu(this.stateAccessible));
		this.addState(StatesEnum.INTRO, Intro, 1.0 / 60.0, new Intro(this.stateAccessible));
		this.addState(StatesEnum.INTRO2, IntroDay2, 1.0 / 60.0, new IntroDay2(this.stateAccessible));
		this.addState(StatesEnum.END, End, 1.0 / 60.0, new End(this.stateAccessible, game));
		this.addState(
			StatesEnum.LEVELSELECT,
			LevelSelect,
			1.0 / 60.0,
			new LevelSelect(this.stateAccessible)
		);
		this.addState(
			StatesEnum.OPTIONS,
			OptionsMenu,
			1.0 / 60.0,
			new OptionsMenu(this.stateAccessible)
		);
		this.addState(
			StatesEnum.CONTROLS,
			ControlsMenu,
			1.0 / 60.0,
			new ControlsMenu(this.stateAccessible)
		);
		this.addState(StatesEnum.GAME, Game, 1.0 / 144.0, game);
		this.stateAccessible.restartGame = true;

		this.addState(
			StatesEnum.DEBUGMODE,
			DebugMode,
			1.0 / 144.0,
			new DebugMode(this.stateAccessible, game)
		);
	}

	async runCurrentState() {
		this.fpsDisplay.setHidden(!options.showFps);
		this.fpsDisplay.textString = Math.round(this.fps) + "";
		this.overlayRendering.draw();
		super.runCurrentState();
	}
}
