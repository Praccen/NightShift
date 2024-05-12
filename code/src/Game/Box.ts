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
			if (this.collComp != undefined) {
				this.game.ecsManager.removeComponent(this.entity, ComponentTypeEnum.COLLISION);
				this.collComp = null;
				vec3.zero(this.moveComp.constantAcceleration);
				vec3.zero(this.moveComp.velocity);
			}

			let forward = vec3.clone(this.game.rendering.camera.getDir());
			let camPos = vec3.clone(this.game.rendering.camera.getPosition());
			if (this.posComp != undefined) {
				let walls = this.game.objectPlacer.getEntitiesOfType("Box Gray || Shelf");
				if (walls != undefined) {
					vec3.add(this.posComp.position, camPos, vec3.fromValues(0.0, -1.0, 0.0));
					let time = ECSUtils.CalculateCollisionTime(this.entity, forward, walls, 2.0);
					vec3.scaleAndAdd(this.posComp.position, this.posComp.position, forward, Math.min(time.time, 2.0));
				}
			}
		}
	}

	throwBox(forward) {
		vec3.add(
			this.moveComp.velocity,
			this.moveComp.velocity,
			vec3.scale(
				vec3.create(),
				vec3.add(vec3.create(), forward, vec3.fromValues(0, 1, 0)),
				7.0
			)
		);

		if (this.collComp == undefined) {
			this.collComp = new CollisionComponent();
			this.game.ecsManager.addComponent(this.entity, this.collComp);
			this.collComp.mass = 5.0;
			this.collComp.isStatic = false;
			this.moveComp.constantAcceleration = vec3.fromValues(0.0, -9.8, 0.0);
		}

		this.pickedUp = false;
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
