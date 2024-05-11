import { ReadonlyVec3, quat, vec3 } from "gl-matrix";
import { ComponentTypeEnum } from "../Engine/ECS/Components/Component";
import PositionComponent from "../Engine/ECS/Components/PositionComponent";
import Entity from "../Engine/ECS/Entity";
import Game from "./States/Game";
import BoundingBoxComponent from "../Engine/ECS/Components/BoundingBoxComponent";
import GraphicsComponent from "../Engine/ECS/Components/GraphicsComponent";
import MovementComponent from "../Engine/ECS/Components/MovementComponent";
import CollisionComponent from "../Engine/ECS/Components/CollisionComponent";
import { ECSUtils } from "../Engine/Utils/ESCUtils";
import Ray from "../Engine/Physics/Shapes/Ray";

export default class Spider {
	private game: Game;

	private bodyEntity: Entity;
	private bodyPosComp: PositionComponent;
	private bodyMovComp: MovementComponent;
	private legEntities: Array<Entity>;

	constructor(game: Game) {
		this.game = game;

		this.bodyEntity = game.ecsManager.createEntity();
		this.bodyPosComp = this.game.ecsManager.addComponent(
			this.bodyEntity,
			new PositionComponent()
		) as PositionComponent;
		vec3.set(this.bodyPosComp.position, 0.0, 15.0, -11.3213);
		vec3.set(this.bodyPosComp.scale, 2.0, 2.0, 4.0);
		let bodyBoundingBoxComp = this.game.ecsManager.addComponent(
			this.bodyEntity,
			new BoundingBoxComponent(this.bodyPosComp.matrix)
		) as BoundingBoxComponent;
		let bodyGraphComp = this.game.ecsManager.addComponent(
			this.bodyEntity,
			new GraphicsComponent(
				this.game.rendering.scene.getNewMesh(
					"Assets/objs/cube.obj",
					"CSS:rgb(221, 137, 164)",
					"CSS:rgb(0,0,0)"
				)
			)
		) as GraphicsComponent;
		bodyBoundingBoxComp.setup(bodyGraphComp.bundle.graphicsObject);

		this.bodyMovComp = this.game.ecsManager.addComponent(
			this.bodyEntity,
			new MovementComponent()
		) as MovementComponent;
		this.bodyMovComp.constantAcceleration[1] = -2.0;

		let collisionComp = this.game.ecsManager.addComponent(
			this.bodyEntity,
			new CollisionComponent()
		) as CollisionComponent;
		collisionComp.mass = 100.0;
	}

	respawn() {
		vec3.set(this.bodyPosComp.position, 0.0, 15.0, -20.0);
		vec3.zero(this.bodyMovComp.velocity);
	}

	update(dt: number) {}
}
