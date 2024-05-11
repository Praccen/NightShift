import { ReadonlyVec3, mat4, vec3 } from "gl-matrix";
import BoundingBoxComponent from "../ECS/Components/BoundingBoxComponent";
import { ComponentTypeEnum } from "../ECS/Components/Component";
import MeshCollisionComponent from "../ECS/Components/MeshCollisionComponent";
import PositionComponent from "../ECS/Components/PositionComponent";
import PositionParentComponent from "../ECS/Components/PositionParentComponent";
import Entity from "../ECS/Entity";
import { IntersectionTester } from "../Physics/IntersectionTester";
import Ray from "../Physics/Shapes/Ray";
import Triangle from "../Physics/Shapes/Triangle";
import MovementComponent from "../ECS/Components/MovementComponent";
import Shape from "../Physics/Shapes/Shape";

export module ECSUtils {
	/**
	 * Calculates the position given all position effecting components (like PositionComponent, PositionParentComponent)
	 * @param entity The entity for which to calculate the position
	 * @returns The final position
	 */
	export function CalculatePosition(entity: Entity): vec3 {
		let posComp = <PositionComponent>entity.getComponent(ComponentTypeEnum.POSITION);
		let posParentComp = <PositionParentComponent>(
			entity.getComponent(ComponentTypeEnum.POSITIONPARENT)
		);

		let tempMatrix = mat4.create();
		if (posComp == undefined) {
			if (posParentComp == undefined) {
				return null;
			}

			posParentComp.calculateMatrix(tempMatrix);
		} else {
			if (posParentComp != undefined) {
				posParentComp.calculateMatrix(tempMatrix);
			}
			posComp.calculateMatrix(tempMatrix);
		}

		let posVector = vec3.transformMat4(vec3.create(), vec3.create(), tempMatrix);
		return vec3.fromValues(posVector[0], posVector[1], posVector[2]);
	}

	/**
	 * Raycasts against a list of entities
	 * @param ray Ray shape
	 * @param entities Array of entities to test against
	 * @returns Object with distance and entity ID of the closest hit
	 */
	export function RayCastAgainstEntityList(
		ray: Ray,
		entities: Array<Entity>,
		maxDist = Infinity
	): { distance: number; eId: number } {
		let closest = maxDist;
		let eId = -1;

		for (let e of entities) {
			if (e == undefined) {
				continue;
			}
			let bbComp = e.getComponent(ComponentTypeEnum.BOUNDINGBOX) as BoundingBoxComponent;
			if (bbComp == undefined) {
				continue;
			}

			bbComp.boundingBox.setUpdateNeeded();

			let dist = IntersectionTester.doRayCast(ray, [bbComp.boundingBox], closest); // Ray cast against bounding box, only caring about hits closer than the previous closest
			if (dist >= 0 && dist < closest) {
				// Boundingbox is closer than current closest hit
				// Ray cast against mesh if there is one, only caring about hits closer than the previous closest

				let meshColComp = e.getComponent(ComponentTypeEnum.MESHCOLLISION) as MeshCollisionComponent;
				if (meshColComp != undefined) {
					ray.setInverseMatrix(mat4.invert(mat4.create(), bbComp.boundingBox.getTransformMatrix()));
					let shapeArray = new Array<Triangle>();
					meshColComp.octree.getShapesForRayCast(ray, shapeArray, closest);
					dist = IntersectionTester.doRayCast(ray, shapeArray, closest);
					ray.setInverseMatrix(mat4.create());
				}

				if (dist >= 0.0 && dist < closest) {
					// Hit is still closer than current closest
					// Update the closest information and save the object for editing
					closest = dist;
					eId = e.id;
				}
			}
		}

		return { distance: closest, eId: eId };
	}

	/**
	 * Calculates when an entity (A) will collide with any of the entities in array "entities", if they remain on the same course and velocity (this will not take acceleration into account, so this needs to be recalculated if any forces/accelerations are applied to any involved entity)
	 * @param entityA Entity A
	 * @param entityAVel The velocity of Entity A
	 * @param entities The other entities to test collision time against
	 * @param max A cap of how far into the future this function will detect a collision
	 * @param allow0Collision If collisions happening right now should be included in the test
	 * @returns Object with time for collision, entity ID for which entity the collision will be with, and an intersecton vector with the normal of the surface entity will collide with.
	 */
	export function CalculateCollisionTime(
		entityA: Entity,
		entityAVel: ReadonlyVec3,
		entities: Array<Entity>,
		max: number,
		allow0Collision: boolean = true
	): { time: number; eId: number; intersectionVec: vec3 } {
		let earliest = Infinity;
		let eId = -1;
		let intersectionVec = null;

		let entityABBComp = entityA.getComponent(ComponentTypeEnum.BOUNDINGBOX) as BoundingBoxComponent;
		if (entityABBComp == undefined) {
			return { time: earliest, eId: eId, intersectionVec: intersectionVec };
		}

		entityABBComp.boundingBox.setUpdateNeeded();

		const entityAMeshColComp = entityA.getComponent(
			ComponentTypeEnum.MESHCOLLISION
		) as MeshCollisionComponent;

		for (let entityB of entities) {
			let entityBBBComp = entityB.getComponent(
				ComponentTypeEnum.BOUNDINGBOX
			) as BoundingBoxComponent;
			if (entityBBBComp == undefined) {
				continue;
			}

			let entityBMovComp = entityB.getComponent(ComponentTypeEnum.MOVEMENT) as MovementComponent;
			let entityBVel = vec3.create();
			if (entityBMovComp != undefined) {
				vec3.copy(entityBVel, entityBMovComp.velocity);
			}

			entityBBBComp.boundingBox.setUpdateNeeded();

			let [dist, iVec] = IntersectionTester.doContinousIntersection(
				[entityABBComp.boundingBox],
				entityAVel,
				[entityBBBComp.boundingBox],
				entityBVel,
				Math.min(earliest, max)
			);
			if (dist >= 0.0 && dist < earliest) {
				// Boundingbox collisions are closer than current closest hit
				// Continous collision check against mesh if there is one, only caring about hits closer than the previous closest

				let shapeBArray = new Array<Shape>();

				const entityBMeshColComp = entityB.getComponent(
					ComponentTypeEnum.MESHCOLLISION
				) as MeshCollisionComponent;

				if (entityBMeshColComp != undefined) {
					const inverseMatrix = mat4.invert(
						mat4.create(),
						entityBBBComp.boundingBox.getTransformMatrix()
					);

					entityABBComp.boundingBox.setInverseMatrix(inverseMatrix);

					let localShapeArray = new Array<Shape>();

					entityBMeshColComp.octree.getShapesForContinousCollision(
						entityABBComp.boundingBox,
						// Use velocities in local space for entity B
						vec3.transformMat4(vec3.create(), entityAVel, inverseMatrix),
						vec3.transformMat4(vec3.create(), entityBVel, inverseMatrix),
						localShapeArray,
						Math.min(earliest, max)
					);
					entityABBComp.boundingBox.setInverseMatrix(mat4.create());

					// Convert shapes to world space
					for (let shape of localShapeArray) {
						let index = shapeBArray.push(new Triangle()) - 1;
						let shapeOriginalVertices = shape.getOriginalVertices();
						(<Triangle>shapeBArray[index]).setVertices(
							shapeOriginalVertices[0],
							shapeOriginalVertices[1],
							shapeOriginalVertices[2]
						);
						(<Triangle>shapeBArray[index]).setTransformMatrix(
							entityBBBComp.boundingBox.getTransformMatrix()
						);
					}
				} else {
					shapeBArray.push(entityBBBComp.boundingBox);
				}

				let shapeAArray = new Array<Shape>();

				if (entityAMeshColComp != undefined) {
					const inverseMatrix = mat4.invert(
						mat4.create(),
						entityABBComp.boundingBox.getTransformMatrix()
					);

					entityBBBComp.boundingBox.setInverseMatrix(inverseMatrix);

					let localShapeArray = new Array<Shape>();

					entityAMeshColComp.octree.getShapesForContinousCollision(
						entityBBBComp.boundingBox,
						// Use velocities in local space for entity B
						vec3.transformMat4(vec3.create(), entityBVel, inverseMatrix),
						vec3.transformMat4(vec3.create(), entityAVel, inverseMatrix),
						localShapeArray,
						Math.min(earliest, max)
					);
					entityBBBComp.boundingBox.setInverseMatrix(mat4.create());

					// Convert shapes to world space
					for (let shape of localShapeArray) {
						let index = shapeAArray.push(new Triangle()) - 1;
						let shapeOriginalVertices = shape.getOriginalVertices();
						(<Triangle>shapeAArray[index]).setVertices(
							shapeOriginalVertices[0],
							shapeOriginalVertices[1],
							shapeOriginalVertices[2]
						);
						(<Triangle>shapeAArray[index]).setTransformMatrix(
							entityABBComp.boundingBox.getTransformMatrix()
						);
					}
				} else {
					shapeAArray.push(entityABBComp.boundingBox);
				}

				[dist, iVec] = IntersectionTester.doContinousIntersection(
					shapeAArray,
					entityAVel,
					shapeBArray,
					entityBVel,
					Math.min(earliest, max),
					allow0Collision
				);

				if (((allow0Collision && dist >= 0.0) || dist > 0.0) && (dist < earliest || dist > 0.0)) {
					// Hit is still closer than current closest
					// Update the closest information and save the object for editing
					earliest = dist;
					eId = entityB.id;
					intersectionVec = iVec;
				}
			}
		}

		return { time: earliest, eId: eId, intersectionVec: intersectionVec };
	}

	/**
	 * Assumes intersection, finds the smallest overlap
	 * @param entityA entityA
	 * @param entityB entityB
	 * @returns Intersection information array, all intersections will point from EntityB to EntityA
	 */
	export function GetIntersectionInformation(
		entityA: Entity,
		entityB: Entity
	): Array<IntersectionTester.IntersectionInformation> {
		let entityABBComp = entityA.getComponent(ComponentTypeEnum.BOUNDINGBOX) as BoundingBoxComponent;
		if (entityABBComp == undefined) {
			return null;
		}

		let entityBBBComp = entityB.getComponent(ComponentTypeEnum.BOUNDINGBOX) as BoundingBoxComponent;
		if (entityBBBComp == undefined) {
			return null;
		}

		let info = new Array<IntersectionTester.IntersectionInformation>();
		IntersectionTester.identifyIntersectionInformation(
			[entityABBComp.boundingBox],
			[entityBBBComp.boundingBox],
			info
		);
		return info;
	}
}
