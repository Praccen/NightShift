import System from "./System";
import { ComponentTypeEnum } from "../Components/Component";
import { IntersectionTester } from "../../Physics/IntersectionTester";
import MeshCollisionComponent from "../Components/MeshCollisionComponent";
import MovementComponent from "../Components/MovementComponent";
import { CollisionSolver } from "../../Physics/CollisionSolver";
import CollisionComponent from "../Components/CollisionComponent";
import BoundingBoxComponent from "../Components/BoundingBoxComponent";
import Shape from "../../Physics/Shapes/Shape";
import Triangle from "../../Physics/Shapes/Triangle";
import { mat4, vec3 } from "gl-matrix";

export default class CollisionSystem extends System {
	lastCollisionPoint: vec3;

	constructor() {
		super([
			ComponentTypeEnum.COLLISION,
			ComponentTypeEnum.BOUNDINGBOX,
			ComponentTypeEnum.POSITION,
		]);
		// Optional MESHCOLLISION, MOVEMENT

		this.lastCollisionPoint = vec3.create();
	}

	update(dt: number) {
		let information = new Array<IntersectionTester.IntersectionInformation>();

		// First update the bounding box for all entities that are not static
		for (let e of this.entities) {
			let collisionComp = <CollisionComponent>(
				e.getComponent(ComponentTypeEnum.COLLISION)
			);

			if (collisionComp.isStatic) {
				continue;
			}

			let bbComp = <BoundingBoxComponent>(
				e.getComponent(ComponentTypeEnum.BOUNDINGBOX)
			);
			bbComp.updateTransformMatrix();

			let movComp = <MovementComponent>(e.getComponent(ComponentTypeEnum.MOVEMENT));
			if (movComp) {
				movComp.onGround = false;
			}
		}

		// Now do collisions
		for (let i = 0; i < this.entities.length; i++) {
			const e1 = this.entities[i];
			let e1CollisionComp = <CollisionComponent>(
				e1.getComponent(ComponentTypeEnum.COLLISION)
			);

			let e1BoundingBoxComp = <BoundingBoxComponent>(
				e1.getComponent(ComponentTypeEnum.BOUNDINGBOX)
			);

			let e1MeshCollisionComp = <MeshCollisionComponent>(
				e1.getComponent(ComponentTypeEnum.MESHCOLLISION)
			);

			for (let j = i+1; j < this.entities.length; j++) {
				const e2 = this.entities[j];
				if (e1.id == e2.id) {
					// Don't collide with self
					continue;
				}
				
				let e2CollisionComp = <CollisionComponent>(
					e2.getComponent(ComponentTypeEnum.COLLISION)
				);

				if ((e1CollisionComp.isStatic || e1CollisionComp.isImmovable) && (e2CollisionComp.isStatic || e2CollisionComp.isImmovable)) {
					continue;
				}

				let e2BoundingBoxComp = <BoundingBoxComponent>(
					e2.getComponent(ComponentTypeEnum.BOUNDINGBOX)
				);

				let e2MeshCollisionComp = <MeshCollisionComponent>(
					e2.getComponent(ComponentTypeEnum.MESHCOLLISION)
				);

				
				information.length = 0;
				if (e1MeshCollisionComp || e2MeshCollisionComp) {
					// At least one of the entities have mesh collision
					// Start by checking bounding boxes, but don't save information
					if (
						IntersectionTester.identifyIntersection(
							[e1BoundingBoxComp.boundingBox],
							[e2BoundingBoxComp.boundingBox]
						)
					) {
						let e1ShapeArray = new Array<Shape>();
						let e2ShapeArray = new Array<Shape>();

						if (e1MeshCollisionComp) {
							// Entity 1 has mesh collision, check e2 bb versus e1 mesh octree

							// By first giving e2 bb inverse matrix of e1 matrix
							e2BoundingBoxComp.boundingBox.setInverseMatrix(mat4.invert(mat4.create(), e1BoundingBoxComp.boundingBox.getTransformMatrix()));

							// Then check against mesh octree (now in e1 local coords)
							let localE1ShapeArray = new Array<Triangle>();
							e1MeshCollisionComp.octree.getShapesForCollision(
								e2BoundingBoxComp.boundingBox,
								localE1ShapeArray
							);

							// Reset the inverse matrix
							e2BoundingBoxComp.boundingBox.setInverseMatrix(mat4.create());

							// Apply actual matrices on the resulting shape array (only triangles since this is a mesh)
							for (let shape of localE1ShapeArray) {
								let index = e1ShapeArray.push(new Triangle()) - 1;
								let shapeOriginalVertices = shape.getOriginalVertices();
								(<Triangle>e1ShapeArray[index]).setVertices(shapeOriginalVertices[0], shapeOriginalVertices[1], shapeOriginalVertices[2]);
								(<Triangle>e1ShapeArray[index]).setTransformMatrix(e1BoundingBoxComp.boundingBox.getTransformMatrix());
							}
						} else {
							// Entity 1 does not have mesh collision, use the bounding box for intersection testing
							e1ShapeArray.push(e1BoundingBoxComp.boundingBox);
						}

						if (e2MeshCollisionComp) {
							// Entity 2 has mesh collision, check e1 bb versus e2 mesh octree

							// By first giving e1 bb inverse matrix of e2 matrix
							e1BoundingBoxComp.boundingBox.setInverseMatrix(mat4.invert(mat4.create(), e2BoundingBoxComp.boundingBox.getTransformMatrix()));

							// Then get the shapes from the octree (now in e2 local coords)
							let localE2ShapeArray = new Array<Triangle>();
							e2MeshCollisionComp.octree.getShapesForCollision(
								e1BoundingBoxComp.boundingBox,
								localE2ShapeArray
							);

							// Reset the inverse matrix
							e1BoundingBoxComp.boundingBox.setInverseMatrix(mat4.create());

							// Apply actual matrices on the resulting shape array (only triangles since this is a mesh)
							for (let shape of localE2ShapeArray) {
								let index = e2ShapeArray.push(new Triangle()) - 1;
								let shapeOriginalVertices = shape.getOriginalVertices();
								(<Triangle>e2ShapeArray[index]).setVertices(shapeOriginalVertices[0], shapeOriginalVertices[1], shapeOriginalVertices[2]);
								(<Triangle>e2ShapeArray[index]).setTransformMatrix(e2BoundingBoxComp.boundingBox.getTransformMatrix());
							}
						} else {
							// Entity 2 does not have mesh collision, use the bounding box for intersection testing
							e2ShapeArray.push(e2BoundingBoxComp.boundingBox);
						}

						// We now have our updated shape arrays to intersection test, let's do it!
						IntersectionTester.identifyIntersectionInformation(
							e1ShapeArray,
							e2ShapeArray,
							information
						);
					}
				} else {
					// None of the entities have mesh collision, do collision with bounding boxes, and save information
					IntersectionTester.identifyIntersectionInformation(
						[e1BoundingBoxComp.boundingBox],
						[e2BoundingBoxComp.boundingBox],
						information
					);
				}

				if (information.length > 0) {
					CollisionSolver.handleCollision(information, e1, e2);
					if (e1CollisionComp.isDynamic || e2CollisionComp.isDynamic) {
						vec3.copy(this.lastCollisionPoint, information[0].point);
					}
				}
			}
		}
	}
}
