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
import Card, { COLOR } from "../Card";
import { ECSUtils } from "../../Engine/Utils/ESCUtils";
import Ray from "../../Engine/Physics/Shapes/Ray";
import HandInZone from "../HandInZone";
import { Utils } from "./Util";
import { Howler, Howl } from "howler";

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
	uncollectedBoxed: Map<number, Box>;
	zone: HandInZone;
	boxesCollected: number;
	boxesCollectedCurrent: number;
	keyArray: Array<number>;

	private pointerLockTimer: number;
	private oWasPressed: boolean;

	playStep: Howl;
	playStepping: Howl;

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
		this.boxesCollected = 0;
		this.boxesCollectedCurrent = 0;
	}

	colorBoxes() {
		this.uncollectedBoxed.clear();
		let size = this.keyArray.length - 1;
		let randomIds = Utils.generateUniqueRandomNumbers(3, 0, size);
		let boxId1 = randomIds[0];
		let box1 = this.boxes.get(this.keyArray[boxId1]);
		box1.color = this.player.cards[0].boxes[0].color;
		box1.setColor();
		this.uncollectedBoxed.set(box1.entity.id, box1);

		let boxId2 = randomIds[1];
		let box2 = this.boxes.get(this.keyArray[boxId2]);
		box2.color = this.player.cards[1].boxes[0].color;
		box2.setColor();
		this.uncollectedBoxed.set(box2.entity.id, box2);

		let boxId3 = randomIds[2];
		let box3 = this.boxes.get(this.keyArray[boxId3]);
		box3.color = this.player.cards[2].boxes[0].color;
		box3.setColor();
		this.uncollectedBoxed.set(box3.entity.id, box3);

		// Remove from standard map and index array
		// Remove in ascending order
		randomIds.sort((a, b) => b - a);
		this.boxes.delete(box1.entity.id);
		this.boxes.delete(box2.entity.id);
		this.boxes.delete(box3.entity.id);
		this.keyArray.splice(randomIds[0], 1);
		this.keyArray.splice(randomIds[1], 1);
		this.keyArray.splice(randomIds[2], 1);
		console.log(this.keyArray.length);
	}

	initBoxes() {
		this.boxes = new Map<number, Box>();
		this.keyArray = new Array<number>();
		this.uncollectedBoxed = new Map<number, Box>();
		let objective_boxes = this.objectPlacer.getEntitiesOfType("Box Objective");
		objective_boxes.forEach((box) => {
			this.boxes.set(box.id, new Box(this, COLOR.BLACK, box));
			this.keyArray.push(box.id);
		});
		this.colorBoxes();
	}

	initZone() {
		let zoneObj = this.objectPlacer.getEntitiesOfType("Delivery zone");
		this.zone = new HandInZone(this, COLOR.GREEN, zoneObj[0]);
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
		Howler.pos(0, 0, 0);
		// Initialize the Howl object
		this.playStep = new Howl({
			src: ["Assets/audio/single_step.mp3"],
			volume: 0.5,
			rate: 0.3,
			spatial: true,
			pos: [0, 0, 0], // Initial position in 3D space
			panningModel: "HRTF", // HRTF for realistic 3D audio
			refDistance: 1,
			rolloffFactor: 1,
		});
		this.playStepping = new Howl({
			src: ["Assets/audio/stepping.mp3"],
			volume: 0.1,
			rate: 0.1,
			spatial: true,
			pos: [0, 0, 0], // Initial position in 3D space
			panningModel: "HRTF", // HRTF for realistic 3D audio
			refDistance: 1,
			rolloffFactor: 1,
		});

		let colour = vec3.fromValues(0.1, 0.1, 0.15);
		// let colour = vec3.fromValues(0.0, 0.0, 0.0);
		this.rendering.clearColour.r = colour[0];
		this.rendering.clearColour.g = colour[1];
		this.rendering.clearColour.b = colour[2];

		let dirLight = this.scene.getDirectionalLight();
		dirLight.ambientMultiplier = 0.1;
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
		this.initZone();
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

		if (input.keys["Y"]) {
			let ray = new Ray();
			ray.setStartAndDir(this.rendering.camera.getPosition(), this.rendering.camera.getDir());
			let collisionObjects = this.objectPlacer.getEntitiesOfType("Box || Box Gray || Shelf");
			let rayInfo = ECSUtils.RayCastAgainstEntityList(ray, collisionObjects);
			if (rayInfo.eId > -1) {
				this.spider.setTarget(
					vec3.scaleAndAdd(
						vec3.create(),
						this.rendering.camera.getPosition(),
						ray.getDir(),
						rayInfo.distance
					)
				);
			}
		}

		this.player.update(dt);
		this.spider.update(dt);
		this.boxes.forEach((box) => box.update(dt));
		this.uncollectedBoxed.forEach((box) => box.update(dt));
		this.zone.update(dt);

		this.ecsManager.update(dt);

		if (this.boxesCollectedCurrent == 3 && this.boxes.size >= 3) {
			this.boxesCollectedCurrent = 0;
			this.player.cards = new Array<Card>(3);
			this.player.cards = [
				new Card(this.player, this, 0),
				new Card(this.player, this, 1),
				new Card(this.player, this, 2),
			];
			this.colorBoxes();
		}

		Howler.pos(
			this.player.positionComp.position[0],
			this.player.positionComp.position[1],
			this.player.positionComp.position[2]
		);
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
