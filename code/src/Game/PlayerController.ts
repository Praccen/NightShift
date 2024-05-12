import { vec2, vec3 } from "gl-matrix";
import PositionComponent from "../Engine/ECS/Components/PositionComponent";
import MovementComponent from "../Engine/ECS/Components/MovementComponent";
import Entity from "../Engine/ECS/Entity";
import BoundingBoxComponent from "../Engine/ECS/Components/BoundingBoxComponent";
import { input } from "./GameMachine";
import Game from "./States/Game";
import CollisionComponent from "../Engine/ECS/Components/CollisionComponent";
import Card from "./Card";
import { MousePicking } from "../Engine/Maths/MousePicking";
import { ECSUtils } from "../Engine/Utils/ESCUtils";
import Box from "./Box";
import Ray from "../Engine/Physics/Shapes/Ray";

const sensitivity = 45.0; // TODO: move to options, and add a slider in options menu.

export default class PlayerController {
	private game: Game;

	private entity: Entity;
	positionComp: PositionComponent;
	private movComp: MovementComponent;

	private mouseMovement: vec2;
	jawPitch: vec2;
	cards: Card[];
	private selectedCard: number;
	private wasRotated: boolean;
	private wasPicked: boolean;
	private isHoldingBox: boolean;
	private selectedBox: Box;
	showCards: boolean;
	private cardsToggled: boolean;
	healthPoints: number;

	constructor(game: Game) {
		this.game = game;
		this.cards = new Array<Card>(3);
		this.cards = [new Card(this, game, 0), new Card(this, game, 1), new Card(this, game, 2)];
		this.selectedCard = 0;
		this.wasRotated = true;
		this.showCards = false;
		this.cardsToggled = true;
		this.wasPicked = true;
		this.isHoldingBox = false;

		this.jawPitch = vec2.create();
		this.mouseMovement = vec2.create();
		input.mouseMoveCallBack = (event: MouseEvent) => {
			let movX = event.movementX;
			let movY = event.movementY;

			if (Math.abs(movX) > window.innerWidth * 0.3) {
				movX = 0.0;
			}

			if (Math.abs(movY) > window.innerHeight * 0.3) {
				movY = 0.0;
			}

			vec2.sub(this.mouseMovement, this.mouseMovement, vec2.fromValues(movX, movY));
		};

		this.positionComp = new PositionComponent();
		this.entity = this.game.ecsManager.createEntity();
		this.game.ecsManager.addComponent(this.entity, this.positionComp);
		let boundingBoxComp = new BoundingBoxComponent(this.positionComp.matrix);
		boundingBoxComp.boundingBox.setMinAndMaxVectors(
			vec3.fromValues(-0.4, 0.0, -0.4),
			vec3.fromValues(0.4, 1.8, 0.4)
		);
		this.game.ecsManager.addComponent(this.entity, boundingBoxComp);

		let collisionComp = new CollisionComponent();
		collisionComp.mass = 70.0;
		collisionComp.frictionCoefficient = 0.0;
		collisionComp.collisionCoefficient = 0.0;
		this.game.ecsManager.addComponent(this.entity, collisionComp);

		this.movComp = new MovementComponent();
		this.movComp.acceleration = 40.0;
		this.movComp.drag = 10.0;
		this.game.ecsManager.addComponent(this.entity, this.movComp);
	}

	respawn() {
		vec3.set(this.positionComp.position, 0.0, 8.0, 0.0);
		vec3.set(this.movComp.velocity, 0.0, 0.0, 0.0);
		this.setCameraDirection(vec3.fromValues(0.0, 0.0, -1.0));
		vec2.zero(this.mouseMovement);
	}

	private setCameraDirection(direction: vec3) {
		let newDir = vec3.clone(direction);
		vec3.normalize(newDir, newDir);

		this.game.rendering.camera.setDir(newDir);
		this.jawPitch[1] = (Math.asin(newDir[1]) * 180) / Math.PI;
		this.jawPitch[0] = (Math.atan2(newDir[0], newDir[2]) * 180) / Math.PI;
	}

	update(dt: number) {
		if (vec2.sqrLen(input.joystickRightDirection) > 0.001) {
			vec2.scaleAndAdd(
				this.jawPitch,
				this.jawPitch,
				input.joystickRightDirection,
				-sensitivity * 4.0 * dt
			);
			this.jawPitch[0] = this.jawPitch[0] % 360;
			this.jawPitch[1] = Math.max(Math.min(this.jawPitch[1], 89), -89);
			this.game.rendering.camera.setPitchJawDegrees(this.jawPitch[1], this.jawPitch[0]);
		} else if (
			vec2.squaredLength(this.mouseMovement) > 0.0 &&
			document.pointerLockElement == document.getElementById("gameDiv")
		) {
			vec2.scaleAndAdd(this.jawPitch, this.jawPitch, this.mouseMovement, sensitivity * dt);
			this.jawPitch[0] = this.jawPitch[0] % 360;
			this.jawPitch[1] = Math.max(Math.min(this.jawPitch[1], 89), -89);
			this.game.rendering.camera.setPitchJawDegrees(this.jawPitch[1], this.jawPitch[0]);

			vec2.zero(this.mouseMovement);
		}

		// Movement input
		let forward = vec3.clone(this.game.rendering.camera.getDir());
		forward[1] = 0.0;
		vec3.normalize(forward, forward);

		let right = vec3.clone(this.game.rendering.camera.getRight());
		right[1] = 0.0;
		vec3.normalize(right, right);

		let accVec = vec3.create();

		// Touch / joystick control
		input.updateGamepad();
		if (vec2.sqrLen(input.joystickLeftDirection) > 0.001) {
			vec3.scaleAndAdd(accVec, accVec, right, input.joystickLeftDirection[0] * 2.0);
			vec3.scaleAndAdd(accVec, accVec, forward, -input.joystickLeftDirection[1] * 2.0);
		}
		// Keyboard control
		else {
			if (input.keys["W"]) {
				vec3.add(accVec, accVec, forward);
			}

			if (input.keys["S"]) {
				vec3.sub(accVec, accVec, forward);
			}

			if (input.keys["A"]) {
				vec3.sub(accVec, accVec, right);
			}

			if (input.keys["D"]) {
				vec3.add(accVec, accVec, right);
			}

			// Look at cards
			if ((input.keys["C"] || input.buttons.get("B")) && !this.isHoldingBox) {
				if (!this.cardsToggled) {
					this.showCards = this.showCards ? false : true;
				}
				this.cardsToggled = true;
			} else {
				this.cardsToggled = false;
			}

			// Rotate cards
			if (input.keys["R"]) {
				if (!this.wasRotated) {
					this.selectedCard = (this.selectedCard % this.cards.length) + 1;
				}
				this.wasRotated = true;
			} else {
				this.wasRotated = false;
			}

			// Pickup box
			if (input.keys["E"]) {
				if (!this.wasPicked) {
					if (!this.isHoldingBox) {
						this.showCards = false;
						let objective_boxes = this.game.objectPlacer.getEntitiesOfType("Box Objective");

						let ray = new Ray();
						ray.setStartAndDir(
							this.game.rendering.camera.getPosition(),
							this.game.rendering.camera.getDir()
						);
						let rayCastResult = ECSUtils.RayCastAgainstEntityList(ray, objective_boxes, 2.0);
						this.selectedBox = this.game.uncollectedBoxed.get(rayCastResult.eId);
						if (this.selectedBox == undefined) {
							this.selectedBox = this.game.boxes.get(rayCastResult.eId);
						}
						if (this.selectedBox != undefined && rayCastResult.distance! < 2.0) {
							if (!this.selectedBox.collected) {
								this.selectedBox.pickedUp = true;
								this.isHoldingBox = true;
							}
						}
					} else {
						this.selectedBox.throwBox(forward);
						this.isHoldingBox = false;
					}
				}
				this.wasPicked = true;
			} else {
				this.wasPicked = false;
			}
		}

		if (vec3.sqrLen(accVec) > 1.0) {
			vec3.normalize(accVec, accVec);
		}
		vec3.copy(this.movComp.accelerationDirection, accVec);

		// Jumping
		if (input.keys[" "] || input.buttons.get("A")) {
			this.movComp.jumpRequested = true;
			this.movComp.jumpAllowed = true;
		} else {
			this.movComp.jumpRequested = false;
		}

		let xzVelocity = vec3.clone(this.movComp.velocity);
		xzVelocity[1] = 0.0;
		this.movComp.drag = 10.0 + vec3.len(xzVelocity) * 2.0;

		this.game.rendering.camera.setPosition(
			vec3.add(vec3.create(), this.positionComp.position, vec3.fromValues(0.0, 1.7, 0.0))
		);
		this.cards[0].update(dt, 0);
		this.cards[1].update(dt, 1);
		this.cards[2].update(dt, 2);
	}
}
