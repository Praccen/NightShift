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
import PlayerController from "../PlayerController";
import Spider from "../Spider";
import Box from "../Box";
import { COLOR } from "../Card";

export default class Game extends State {
	rendering: Rendering;
	ecsManager: ECSManager;
	stateAccessible: StateAccessible;

	private overlayRendering: OverlayRendering;
	private menuButton: Button;
	objectPlacer: ObjectPlacer;

	scene: Scene;
	private static instance: Game;

	player: PlayerController;
	private spider: Spider;
	boxes: Map<number, Box>;

	private pointerLockTimer: number;
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
		this.objectPlacer = new ObjectPlacer(
			this.stateAccessible.meshStore,
			this.stateAccessible.textureStore
		);

		this.pointerLockTimer = -1.0;
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

		this.scene = new Scene(this.stateAccessible.textureStore, this.stateAccessible.meshStore);
		this.rendering = new Rendering(this.stateAccessible.textureStore, this.scene);
		this.ecsManager = new ECSManager(this.rendering);
		// this.createPointLight(vec3.fromValues(-14.0, 0.0, 7.0), true, vec3.fromValues(3.0, 0.8, 0.0));
		// this.createPointLight(vec3.fromValues(5.0, 0.0, -9.0), true, vec3.fromValues(0.0, 0.8, 3.0));
		// this.createPointLight(vec3.fromValues(-20.0, 0.0, -14.0), true, vec3.fromValues(0.0, 2.0, 0.8));
		// this.createPointLight(vec3.fromValues(10.0, 0.0, -15.0), true, vec3.fromValues(2.0, 0.0, 0.8));
		// this.createPointLight(vec3.fromValues(10.0, 0.0, 15.0), true, vec3.fromValues(0.8, 2.0, 0.0));

		this.player = new PlayerController(this);
		this.spider = new Spider(this);
	}

	initBoxes() {
		this.boxes = new Map<number, Box>();
		let objective_boxes = this.objectPlacer.getEntitiesOfType("Box Objective");
		objective_boxes.forEach((box) => {
			this.boxes.set(box.id, new Box(this, COLOR.BLUE, box));
		});
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
		let colour = vec3.fromValues(0.1, 0.1, 0.15);
		// let colour = vec3.fromValues(0.0, 0.0, 0.0);
		this.rendering.clearColour.r = colour[0];
		this.rendering.clearColour.g = colour[1];
		this.rendering.clearColour.b = colour[2];

		let dirLight = this.scene.getDirectionalLight();
		dirLight.ambientMultiplier = 0.5;
		vec3.set(dirLight.direction, 0.2, -0.9, -0.4);
		vec3.copy(dirLight.colour, colour);

		this.rendering.setSkybox("Assets/textures/skyboxes/NightSky");

		await this.objectPlacer.load(this.scene, this.ecsManager, this.stateAccessible.level);
		// Run first update right away to let placed objects init
		this.ecsManager.update(0);

		this.rendering.camera.setPosition(vec3.fromValues(0.0, 2.0, 0.0));
		this.overlayRendering.setCamera(this.rendering.camera);

		this.player.respawn();
		this.spider.respawn();
		this.initBoxes();
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
		} else {
			document.getElementById("gameDiv").requestPointerLock();
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
		if (this.pointerLockTimer >= 0.0) {
			this.pointerLockTimer += dt;

			if (this.pointerLockTimer >= 0.2) {
				document.getElementById("gameDiv").requestPointerLock();
				this.pointerLockTimer = -1.0;
			}
		}

		if (input.mouseClicked && this.pointerLockTimer < 0.0) {
			this.pointerLockTimer = 0.0;
		}

		if (input.keys["P"]) {
			this.player.respawn();
			this.spider.respawn();
		}

		if (input.keys["O"]) {
			if (!this.oWasPressed) {
				this.gotoState = StatesEnum.DEBUGMODE;
				WebUtils.SetCookie("debug", "true");
			}
			this.oWasPressed = true;
		} else {
			this.oWasPressed = false;
		}

		if (input.keys["Q"]) {
			this.spider.setTarget(this.player.positionComp.position);
		}

		this.player.update(dt);
		this.spider.update(dt);
		this.boxes.forEach((box) => box.update(dt));

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
