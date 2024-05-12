import { vec3 } from "gl-matrix";
import BoundingBoxComponent from "../Engine/ECS/Components/BoundingBoxComponent";
import CollisionComponent from "../Engine/ECS/Components/CollisionComponent";
import { ComponentTypeEnum } from "../Engine/ECS/Components/Component";
import GraphicsComponent from "../Engine/ECS/Components/GraphicsComponent";
import MovementComponent from "../Engine/ECS/Components/MovementComponent";
import PositionComponent from "../Engine/ECS/Components/PositionComponent";
import Entity from "../Engine/ECS/Entity";
import { ECSUtils } from "../Engine/Utils/ESCUtils";
import { COLOR } from "./Card";
import Game from "./States/Game";

export default class Box {
	game: Game;
	entity: Entity;
	color: COLOR;
	posComp: PositionComponent;
	graphComp: GraphicsComponent;
	collComp: CollisionComponent;
	moveComp: MovementComponent;
	collected: boolean;
	pickedUp: boolean;

	constructor(game: Game, color: COLOR, entity: Entity) {
		this.entity = entity;
		this.color = color;
		this.game = game;
		this.collected = false;
		this.pickedUp = false;

		this.graphComp = entity.getComponent(ComponentTypeEnum.GRAPHICS) as GraphicsComponent;
		this.setColor();

		this.posComp = entity.getComponent(ComponentTypeEnum.POSITION) as PositionComponent;

		this.moveComp = this.game.ecsManager.addComponent(
			this.entity,
			new MovementComponent()
		) as MovementComponent;
		this.moveComp.constantAcceleration = vec3.fromValues(0.0, 0.0, 0.0);

		let boundComp = entity.getComponent(ComponentTypeEnum.BOUNDINGBOX) as BoundingBoxComponent;
	}

	update(dt: number) {
		if (this.pickedUp) {
			if (this.collComp == undefined) {
				this.collComp = new CollisionComponent();
				this.game.ecsManager.addComponent(this.entity, this.collComp);
				this.collComp.mass = 5.0;
				this.collComp.isStatic = false;
				this.moveComp.constantAcceleration = vec3.fromValues(0.0, -9.8, 0.0);
			}
			vec3.set(this.moveComp.velocity, 0, 0, 0);
			let forward = vec3.clone(this.game.rendering.camera.getDir());
			let camPos = vec3.clone(this.game.rendering.camera.getPosition());
			if (this.posComp != undefined) {
				let walls = this.game.objectPlacer.getEntitiesOfType("Box Gray");
				if (walls != undefined) {
					vec3.copy(this.posComp.position, camPos);
					let time = ECSUtils.CalculateCollisionTime(this.entity, forward, walls, 1.0);
					vec3.scaleAndAdd(this.posComp.position, camPos, forward, Math.min(time.time, 1.0));
				}
			}
		}
	}

	setColor() {
		switch (this.color) {
			case COLOR.RED:
				this.graphComp.bundle.emissionColor = vec3.fromValues(1, 0, 0);
				break;
			case COLOR.GREEN:
				this.graphComp.bundle.emissionColor = vec3.fromValues(0, 1, 0);
				break;
			case COLOR.BLUE:
				this.graphComp.bundle.emissionColor = vec3.fromValues(0, 0, 1);
				break;
			case COLOR.ORANGE:
				this.graphComp.bundle.emissionColor = vec3.fromValues(1, 1, 0);
				break;
			case COLOR.PINK:
				this.graphComp.bundle.emissionColor = vec3.fromValues(1, 0, 0.5);
				break;
			case COLOR.PURPLE:
				this.graphComp.bundle.emissionColor = vec3.fromValues(0.5, 0, 1);
				break;
		}
	}
}
