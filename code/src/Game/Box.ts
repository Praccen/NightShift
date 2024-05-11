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
	pickedUp = false;

	constructor(game: Game, color: COLOR, entity: Entity) {
		this.entity = entity;
		this.color = color;
		this.game = game;

		let setColor: string = "CSS:rgb(255,255,255)";
		switch (this.color) {
			case COLOR.RED:
				setColor = "CSS:rgb(255,0,0)";
				break;
			case COLOR.GREEN:
				setColor = "CSS:rgb(0,255,0)";
				break;
			case COLOR.BLUE:
				setColor = "CSS:rgb(0,0,255)";

				break;
			case COLOR.ORANGE:
				setColor = "CSS:rgb(255,255,0)";

				break;
			case COLOR.PINK:
				setColor = "CSS:rgb(0,0,0)";

				break;
			case COLOR.PURPLE:
				setColor = "CSS:rgb(255,0,255)";
				break;
		}
		this.graphComp = entity.getComponent(ComponentTypeEnum.GRAPHICS) as GraphicsComponent;
		this.graphComp.bundle.diffuse = this.game.stateAccessible.textureStore.getTexture(setColor);

		this.posComp = entity.getComponent(ComponentTypeEnum.POSITION) as PositionComponent;
		vec3.set(this.posComp.scale, 0.5, 0.5, 0.5);

		this.moveComp = this.game.ecsManager.addComponent(
			this.entity,
			new MovementComponent()
		) as MovementComponent;

		let boundComp = entity.getComponent(ComponentTypeEnum.BOUNDINGBOX) as BoundingBoxComponent;

		this.collComp = entity.getComponent(ComponentTypeEnum.COLLISION) as CollisionComponent;
		this.collComp.mass = 5.0;
		this.collComp.isStatic = false;
	}

	update(dt: number) {
		if (this.pickedUp) {
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
}
