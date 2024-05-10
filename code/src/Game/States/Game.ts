import ECSManager from "../../Engine/ECS/ECSManager";
import State, { StatesEnum } from "../../Engine/States/State";
import Rendering from "../../Engine/Rendering/Rendering";
import { input, options, StateAccessible } from "../GameMachine";
import Button from "../../Engine/Rendering/GUI/Objects/Button";
import { OverlayRendering } from "../../Engine/Rendering/GUI/OverlayRendering";
import Scene from "../../Engine/Rendering/Scene";
import ObjectPlacer from "../ObjectPlacer";
import { WebUtils } from "../../Engine/Utils/WebUtils";
import { vec3 } from "gl-matrix";
import PointLightComponent from "../../Engine/ECS/Components/PointLightComponent";
import PositionComponent from "../../Engine/ECS/Components/PositionComponent";

export default class Game extends State {
	rendering: Rendering;
	ecsManager: ECSManager;
	private stateAccessible: StateAccessible;

	private overlayRendering: OverlayRendering;
	private menuButton: Button;
	objectPlacer: ObjectPlacer;

	private scene: Scene;
	private static instance: Game;

	private oWasPressed: boolean;

	public static getInstance(sa: StateAccessible): Game {
		if (!Game.instance) {
			Game.instance = new Game(sa);
		}
		return Game.instance;
	}

	public static getInstanceNoSa(): Game {
		return Game.instance;
	}

	private constructor(sa: StateAccessible) {
		super();
		this.stateAccessible = sa;
		this.objectPlacer = new ObjectPlacer(this.stateAccessible.meshStore, this.stateAccessible.textureStore);
		this.oWasPressed = true;

		this.overlayRendering = new OverlayRendering();

		this.menuButton = this.overlayRendering.getNewButton();
		this.menuButton.position[0] = 0.9;
		this.menuButton.position[1] = 0.0;
		this.menuButton.textSize = 40;
		this.menuButton.getInputElement().style.background = "transparent";
		this.menuButton.getInputElement().style.borderColor = "transparent";
		this.menuButton.getInputElement().style.boxShadow = "none";
		this.menuButton.textString = "Menu";

		let self = this;
		this.menuButton.onClick(function () {
			self.gotoState = StatesEnum.MAINMENU;
		});

		let crosshair = this.overlayRendering.getNew2DText();
		crosshair.position[0] = 0.5;
		crosshair.position[1] = 0.5;
		crosshair.center = true;
		crosshair.scaleWithWindow = true;
		crosshair.size = 10;
		crosshair.textString = "➕";

		this.scene = new Scene(
			this.stateAccessible.textureStore,
			this.stateAccessible.meshStore
		);
		this.rendering = new Rendering(
			this.stateAccessible.textureStore,
			this.scene
		);
		this.ecsManager = new ECSManager(this.rendering);
		this.createPointLight(vec3.fromValues(-14.0, -5.0, 7.0), true, vec3.fromValues(3.0, 0.8, 0.0));
		this.createPointLight(vec3.fromValues(5.0, -5.0, -9.0), true, vec3.fromValues(0.0, 0.8, 3.0));
		// this.createPointLight(vec3.fromValues(-20.0, -5.0, -14.0), true, vec3.fromValues(0.0, 2.0, 0.8));
		// this.createPointLight(vec3.fromValues(10.0, -5.0, -15.0), true, vec3.fromValues(2.0, 0.0, 0.8));
		// this.createPointLight(vec3.fromValues(10.0, -5.0, 15.0), true, vec3.fromValues(0.8, 2.0, 0.0));
	}

	createPointLight(position: vec3, castShadow: boolean, colour?: vec3) {
		let pointLightEntity = this.ecsManager.createEntity();
		let pointLightComp = new PointLightComponent(this.scene.getNewPointLight());
		vec3.set(pointLightComp.posOffset, 0.0, 2.0, 0.0);
		if (colour != undefined) {
			vec3.copy(pointLightComp.pointLight.colour, colour);
		}
		// pointLightComp.pointLight.linear = 0.007;
		// pointLightComp.pointLight.quadratic = 0.005;
		pointLightComp.pointLight.castShadow = castShadow;
		this.ecsManager.addComponent(pointLightEntity, pointLightComp);
		let lightPosComp = new PositionComponent();
		vec3.copy(lightPosComp.position, position);
		this.ecsManager.addComponent(pointLightEntity, lightPosComp);
	}

	async load() {
		// let colour = vec3.fromValues(0.10, 0.10, 0.15);
		let colour = vec3.fromValues(0.0, 0.0, 0.0);
		this.rendering.clearColour.r = colour[0];
		this.rendering.clearColour.g = colour[1];
		this.rendering.clearColour.b = colour[2];

		let dirLight = this.scene.getDirectionalLight();
		dirLight.ambientMultiplier = 0.1;
		vec3.set(dirLight.direction, 0.2, -0.9, -0.4);
		vec3.copy(dirLight.colour, colour);

		this.rendering.setSkybox("Assets/textures/skyboxes/NightSky");

		await this.objectPlacer.load(this.scene, this.ecsManager, this.stateAccessible.level);

		this.rendering.camera.setPosition(vec3.fromValues(0.0, 2.0, 0.0));
		this.overlayRendering.setCamera(this.rendering.camera);
	}

	async init() {
		if (this.stateAccessible.restartGame) {
			await this.load();
			this.stateAccessible.restartGame = false;
		}

		this.overlayRendering.show();
		this.rendering.useCrt = options.useCrt;
		this.rendering.useBloom = options.useBloom;
		if (WebUtils.GetCookie("debug") == "true") {
			this.gotoState = StatesEnum.DEBUGMODE;
		}
		this.oWasPressed = true;
	}

	reset() {
		if (this.overlayRendering) {
			this.overlayRendering.hide();
		}
		input.touchUsed = false;
		input.drawTouchControls();
	}

	onExit(e: BeforeUnloadEvent) {
		this.objectPlacer.onExit(e);
	}

	update(dt: number) {
		if (input.keys["O"]) {
			if (!this.oWasPressed) {
				this.gotoState = StatesEnum.DEBUGMODE;
				WebUtils.SetCookie("debug", "true");
			}
			this.oWasPressed = true;
		}
		else {
			this.oWasPressed = false;
		}

		this.ecsManager.update(dt);
	}

	prepareDraw(dt: number, updateCameraFocus: boolean = true): void {
		this.ecsManager.updateRenderingSystems(dt, updateCameraFocus);
	}

	draw() {
		this.rendering.draw();
		this.overlayRendering.draw();
		input.drawTouchControls();
	}
}
