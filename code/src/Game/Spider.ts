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
import PositionParentComponent from "../Engine/ECS/Components/PositionParentComponent";

class Leg {
	anchor: Entity;
	foot: Entity;
	joint: Entity;
}

export default class Spider {
	private game: Game;

	private bodyEntity: Entity;
	private bodyPosComp: PositionComponent;
	private parentPosComp: PositionParentComponent;
	private bodyMovComp: MovementComponent;
	private legs: Array<Leg>;

	private targetPos: vec3;

	constructor(game: Game) {
		this.game = game;
		this.targetPos = vec3.fromValues(0.0, 10.0, -25.0);

		this.bodyEntity = game.ecsManager.createEntity();
		this.parentPosComp = this.game.ecsManager.addComponent(
			this.bodyEntity,
			new PositionParentComponent()
		) as PositionParentComponent;
		this.bodyPosComp = this.game.ecsManager.addComponent(
			this.bodyEntity,
			new PositionComponent()
		) as PositionComponent;
		vec3.set(this.bodyPosComp.origin, 0.0, -0.5, 0.0);
		vec3.set(this.bodyPosComp.scale, 2.0, 2.0, 4.0);
		let bodyBoundingBoxComp = this.game.ecsManager.addComponent(
			this.bodyEntity,
			new BoundingBoxComponent(this.parentPosComp.matrix)
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
		vec3.zero(this.bodyMovComp.constantAcceleration);
		this.bodyMovComp.drag = 0.0;

		let collisionComp = this.game.ecsManager.addComponent(
			this.bodyEntity,
			new CollisionComponent()
		) as CollisionComponent;
		collisionComp.mass = 100.0;
		collisionComp.isImmovable = true;

		let positionDisplayEntity = game.ecsManager.createEntity();
		this.game.ecsManager.addComponent(positionDisplayEntity, this.parentPosComp);
		let displayPosComp = this.game.ecsManager.addComponent(
			positionDisplayEntity,
			new PositionComponent()
		) as PositionComponent;
		vec3.set(displayPosComp.scale, 0.5, 0.5, 0.5);
		this.game.ecsManager.addComponent(
			positionDisplayEntity,
			new GraphicsComponent(
				this.game.rendering.scene.getNewMesh(
					"Assets/objs/cube.obj",
					"CSS:rgb(255, 255, 255)",
					"CSS:rgb(0,0,0)"
				)
			)
		) as GraphicsComponent;

		this.legs = new Array<Leg>();

		const anchorOffsets = [
			vec3.fromValues(1.0, 1.0, 1.5), // Front left
			vec3.fromValues(-1.0, 1.0, 1.5), // Front right
			vec3.fromValues(1.0, 1.0, 0.0), // Middle left
			vec3.fromValues(-1.0, 1.0, 0.0), // Middle right
			vec3.fromValues(1.0, 1.0, -1.5), // Back left
			vec3.fromValues(-1.0, 1.0, -1.5), // Back right
		];

		for (let i = 0; i < 6; i++) {
			this.legs.push(new Leg());
			let leg = this.legs[i];
			leg.anchor = game.ecsManager.createEntity();
			this.game.ecsManager.addComponent(leg.anchor, this.parentPosComp);
			let anchorPosComp = this.game.ecsManager.addComponent(
				leg.anchor,
				new PositionComponent()
			) as PositionComponent;
			vec3.copy(anchorPosComp.position, anchorOffsets[i]);
			vec3.set(anchorPosComp.scale, 0.3, 0.3, 0.3);
			vec3.set(anchorPosComp.origin, -anchorOffsets[i][0] * 0.5, 0.0, 0.0);
			this.game.ecsManager.addComponent(
				leg.anchor,
				new GraphicsComponent(
					this.game.rendering.scene.getNewMesh(
						"Assets/objs/cube.obj",
						"CSS:rgb(221, 137, 164)",
						"CSS:rgb(0,0,0)"
					)
				)
			);

			leg.foot = game.ecsManager.createEntity();
			let footPosComp = this.game.ecsManager.addComponent(
				leg.foot,
				new PositionComponent()
			) as PositionComponent;
			vec3.set(footPosComp.origin, 0.0, -0.5, 0.0);
			vec3.set(footPosComp.scale, 0.3, 0.3, 0.3);
			this.game.ecsManager.addComponent(
				leg.foot,
				new GraphicsComponent(
					this.game.rendering.scene.getNewMesh(
						"Assets/objs/cube.obj",
						"CSS:rgb(221, 137, 164)",
						"CSS:rgb(0,0,0)"
					)
				)
			);

			leg.joint = game.ecsManager.createEntity();
			let jointPosComp = this.game.ecsManager.addComponent(
				leg.joint,
				new PositionComponent()
			) as PositionComponent;
			vec3.set(jointPosComp.origin, 0.0, -0.5, 0.0);
			vec3.set(jointPosComp.scale, 0.3, 0.3, 0.3);
			this.game.ecsManager.addComponent(
				leg.joint,
				new GraphicsComponent(
					this.game.rendering.scene.getNewMesh(
						"Assets/objs/cube.obj",
						"CSS:rgb(221, 137, 164)",
						"CSS:rgb(0,0,0)"
					)
				)
			);
		}
	}

	respawn() {
		vec3.set(this.parentPosComp.position, 0.0, 5.0, -20.0);
		vec3.zero(this.bodyMovComp.velocity);
	}

	setTarget(targetPos: ReadonlyVec3) {
		vec3.copy(this.targetPos, targetPos);
	}

	update(dt: number) {
		let dir = vec3.sub(vec3.create(), this.targetPos, this.parentPosComp.position);
		dir[1] = 0.0;
		vec3.normalize(dir, dir);

		if (vec3.squaredDistance(this.targetPos, this.parentPosComp.position) > 1.0) {
			let top = vec3.add(
				vec3.create(),
				this.parentPosComp.position,
				vec3.fromValues(0.0, this.parentPosComp.scale[1], 0.0)
			);

			let collisionObjects = this.game.objectPlacer.getEntitiesOfType("Box || Box Gray");
			let ray = new Ray();
			ray.setStartAndDir(top, vec3.add(vec3.create(), dir, vec3.fromValues(0.0, -1.0, 0.0)));
			let rayResult = ECSUtils.RayCastAgainstEntityList(ray, collisionObjects, 4.0);
			if (rayResult.eId > -1) {
				vec3.scale(this.bodyMovComp.velocity, dir, rayResult.distance * 2.0);
				this.bodyMovComp.velocity[1] += (2.0 - rayResult.distance) * 2.0;
			} else {
				this.bodyMovComp.accelerationDirection[1] = -3.0;
				ray.setStartAndDir(
					vec3.scaleAndAdd(vec3.create(), this.parentPosComp.position, dir, 1.0),
					vec3.add(vec3.create(), dir, vec3.fromValues(0.0, -1.0, 0.0))
				);
				let rayResult = ECSUtils.RayCastAgainstEntityList(ray, collisionObjects, 3.0);
				if (rayResult.eId > -1) {
					this.bodyMovComp.velocity[1] = -rayResult.distance;
				}
			}

			let yaw = Math.atan2(dir[0], dir[2]);
			let pitch = Math.asin(vec3.normalize(vec3.create(), this.bodyMovComp.velocity)[1]);
			quat.identity(this.parentPosComp.rotation);
			quat.rotateY(this.parentPosComp.rotation, this.parentPosComp.rotation, yaw);
			quat.rotateX(this.parentPosComp.rotation, this.parentPosComp.rotation, -pitch);
		} else {
			vec3.zero(this.bodyMovComp.velocity);
		}

		for (let leg of this.legs) {
			let footPosComp = leg.foot.getComponent(ComponentTypeEnum.POSITION) as PositionComponent;
			let jointPosComp = leg.joint.getComponent(ComponentTypeEnum.POSITION) as PositionComponent;
			let anchorPos = ECSUtils.CalculatePosition(leg.anchor);
			if (footPosComp == undefined || jointPosComp == undefined || anchorPos == undefined) {
				continue;
			}

			if (vec3.dist(anchorPos, footPosComp.position) > 3.0) {
				let ray = new Ray();
				ray.setStartAndDir(
					anchorPos,
					vec3.mul(
						vec3.create(),
						vec3.subtract(vec3.create(), anchorPos, this.parentPosComp.position),
						vec3.fromValues(1.0, -2.0, 1.0)
					)
				);
				let collisionObjects = this.game.objectPlacer.getEntitiesOfType("Box || Box Gray");
				let rayResult = ECSUtils.RayCastAgainstEntityList(ray, collisionObjects, 3.0);
				if (rayResult.eId > -1) {
					vec3.scaleAndAdd(footPosComp.position, anchorPos, ray.getDir(), rayResult.distance);
				}
			}

			// ---- Calculate foot peice size and rotation ----
			let jointPos = vec3.scale(
				vec3.create(),
				vec3.sub(vec3.create(), anchorPos, footPosComp.position),
				0.5
			);
			vec3.add(jointPos, jointPos, vec3.fromValues(0.0, 2.0, 0.0));
			footPosComp.scale[1] = vec3.len(jointPos);

			let yaw = Math.atan2(jointPos[2], jointPos[0]);
			let pitch = Math.acos(vec3.normalize(vec3.create(), jointPos)[1]);
			quat.identity(footPosComp.rotation);
			quat.rotateY(footPosComp.rotation, footPosComp.rotation, -yaw);
			quat.rotateZ(footPosComp.rotation, footPosComp.rotation, -pitch);
			// ------------------------------------------------

			// ---- Calculate joint peice size and rotation ----
			vec3.copy(jointPosComp.position, anchorPos);
			vec3.subtract(jointPos, vec3.add(jointPos, footPosComp.position, jointPos), anchorPos);
			jointPosComp.scale[1] = vec3.len(jointPos);
			yaw = Math.atan2(jointPos[2], jointPos[0]);
			pitch = Math.acos(vec3.normalize(vec3.create(), jointPos)[1]);
			quat.identity(jointPosComp.rotation);
			quat.rotateY(jointPosComp.rotation, jointPosComp.rotation, -yaw);
			quat.rotateZ(jointPosComp.rotation, jointPosComp.rotation, -pitch);
			// -------------------------------------------------
		}
	}
}
