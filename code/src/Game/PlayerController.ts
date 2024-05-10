import { vec2, vec3 } from "gl-matrix";
import PositionComponent from "../Engine/ECS/Components/PositionComponent";
import MovementComponent from "../Engine/ECS/Components/MovementComponent";
import Entity from "../Engine/ECS/Entity";
import BoundingBoxComponent from "../Engine/ECS/Components/BoundingBoxComponent";
import { input } from "./GameMachine";
import Game from "./States/Game";
import CollisionComponent from "../Engine/ECS/Components/CollisionComponent";

export default class PlayerController {
	private game: Game;

	private entity: Entity;
	private positionComp: PositionComponent;
	private movComp: MovementComponent;

	private mouseMovement: vec2;
	private jawPitch: vec2;

	constructor(game: Game) {
		this.game = game;

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

			vec2.sub(
				this.mouseMovement,
				this.mouseMovement,
				vec2.fromValues(movX, movY)
			);
		};

		this.positionComp = new PositionComponent();
		this.entity = this.game.ecsManager.createEntity();
		this.game.ecsManager.addComponent(this.entity, this.positionComp);
		let boundingBoxComp = new BoundingBoxComponent();
		boundingBoxComp.boundingBox.setMinAndMaxVectors(
			vec3.fromValues(-0.4, 0.0, -0.4),
			vec3.fromValues(0.4, 1.8, 0.4)
		);
		boundingBoxComp.updateTransformMatrix(this.positionComp.matrix);
		this.game.ecsManager.addComponent(this.entity, boundingBoxComp);

		let collisionComp = new CollisionComponent();
		collisionComp.mass = 70.0;
		collisionComp.frictionCoefficient = 0.0;
		collisionComp.collisionCoefficient = 0.0;
		this.game.ecsManager.addComponent(this.entity, collisionComp);

		this.movComp = new MovementComponent();
		this.movComp.acceleration = 20.0;
		this.movComp.drag = 10.0;
		this.game.ecsManager.addComponent(this.entity, this.movComp);
	}

	init() {
		this.respawn();
	}

	respawn() {
		vec3.set(this.positionComp.position, 0.0, 15.0, 0.0);
		vec3.set(this.movComp.velocity, 0.0, 0.0, 0.0);
		this.setCameraDirection(vec3.fromValues(-1.0, 0.0, 0.0));
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
		if (vec2.squaredLength(this.mouseMovement) > 0.0) {
			let sensitivity: number = 45.0; // TODO: move to options, and add a slider in options menu.
			vec2.scaleAndAdd(
				this.jawPitch,
				this.jawPitch,
				this.mouseMovement,
				sensitivity * dt
			);
			this.jawPitch[0] = this.jawPitch[0] % 360;
			this.jawPitch[1] = Math.max(Math.min(this.jawPitch[1], 89), -89);
			this.game.rendering.camera.setPitchJawDegrees(
				this.jawPitch[1],
				this.jawPitch[0]
			);

			vec2.zero(this.mouseMovement);
		}

		if (input.keys["P"]) {
			this.respawn();
		}

		this.game.rendering.camera.setPosition(
			vec3.add(
				vec3.create(),
				this.positionComp.position,
				vec3.fromValues(0.0, 1.7, 0.0)
			)
		);
	}
}
