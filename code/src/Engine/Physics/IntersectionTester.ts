import { ReadonlyVec3, vec3 } from "gl-matrix";
import { SAT } from "../Maths/SAT";
import Ray from "./Shapes/Ray";
import Shape from "./Shapes/Shape";

export module IntersectionTester {
	/**
	 *
	 */
	export class IntersectionInformation {
		axis: vec3;
		depth: number;
		point: vec3;
		shapeA: Shape;
		shapeB: Shape;

		/**
		 * Holds information about an intersection
		 * @param axis Normalized axis for the minimum translation vector (mtv)
		 * @param depth The magnitude of the mtv
		 * @param point The point of intersection (Under construction, not fully accurate yet)
		 * @param shapeA The shape of physical object A that is intersecting
		 * @param shapeB The shape of physical object B that is intersecting
		 */
		constructor(
			axis: vec3,
			depth: number,
			point: vec3,
			shapeA: Shape,
			shapeB: Shape
		) {
			this.axis = vec3.clone(axis);
			this.depth = depth;
			this.point = vec3.clone(point);
			this.shapeA = shapeA;
			this.shapeB = shapeB;
		}
	}

	/**
	 * Will check if there is an intersection between two meshes.
	 * @param shapeArrayA List of shapes in physical object A.
	 * @param shapeArrayB List of shapes in physical object B.
	 * @returns if there is an intersection.
	 */
	export function identifyIntersection(
		shapeArrayA: Array<Shape>,
		shapeArrayB: Array<Shape>
	): boolean {
		let intersectionAxis = vec3.create();
		let intersectionDepth = { depth: Infinity };
		for (let shapeA of shapeArrayA) {
			for (let shapeB of shapeArrayB) {
				if (
					SAT.getIntersection3D(
						shapeA,
						shapeB,
						intersectionAxis,
						intersectionDepth
					)
				) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Finds the intersection information (axises, depths, and points) between two physical objects, if they intersect
	 * @param shapeArrayA List of shapes in physical object A.
	 * @param shapeArrayB List of shapes in physical object B.
	 * @param intersectionInformation An array that gets filled with information about all intersections happening between the two objects.
	 * @returns If there is an intersection.
	 */
	export function identifyIntersectionInformation(
		shapeArrayA: Array<Shape>,
		shapeArrayB: Array<Shape>,
		intersectionInformation: Array<IntersectionInformation>
	): boolean {
		let intersecting = false;
		let tempIntersectionAxis = vec3.create();
		let tempIntersectionDepth = { depth: Infinity };

		for (let shapeA of shapeArrayA) {
			for (let shapeB of shapeArrayB) {
				if (
					SAT.getIntersection3D(
						shapeA,
						shapeB,
						tempIntersectionAxis,
						tempIntersectionDepth
					)
				) {
					intersecting = true;

					// Save information about intersection
					intersectionInformation.push(
						new IntersectionInformation(
							tempIntersectionAxis,
							tempIntersectionDepth.depth,
							SAT.getIntersectionPoint(shapeA, shapeB, tempIntersectionAxis),
							shapeA,
							shapeB
						)
					);
				}
			}
		}

		return intersecting;
	}

	/**
	 * Finds the closest ray cast hit between a ray and an array of shapes
	 * @param ray Ray shape
	 * @param shapeArray shape array to cast against
	 * @param maxDistance The furthest allowed hit
	 * @param breakOnFirstHit If the first hit should be returned immediately
	 * @returns the closest hit
	 */
	export function doRayCast(
		ray: Ray,
		shapeArray: Array<Shape>,
		maxDistance: number = Infinity,
		breakOnFirstHit: boolean = false
	): number {
		let closestHit = -1.0;

		for (const shape of shapeArray) {
			let [dist, _] = SAT.getContinousIntersection3D(
				ray,
				shape,
				ray.getDir(),
				vec3.create(),
				maxDistance
			);
			if (dist >= 0.0 && (dist < closestHit || closestHit < 0)) {
				closestHit = dist;
				maxDistance = closestHit;

				if (breakOnFirstHit) {
					return closestHit;
				}
			}
		}

		return closestHit;
	}

	/**
	 * Finds the closest continous collision hit between two shape arrays with velocities
	 * @param shapeArrayA List of shapes in physical object A.
	 * @param shapeArrayB List of shapes in physical object B.
	 * @param maxDistance The furthest allowed hit
	 * @param breakOnFirstHit If the first hit should be returned immediately
	 * @returns the closest hit
	 */
	export function doContinousIntersection(
		shapeArrayA: Array<Shape>,
		shapeAVelocity: ReadonlyVec3,
		shapeArrayB: Array<Shape>,
		shapeBVelocity: ReadonlyVec3,
		maxDistance: number = Infinity,
		allow0Collision: boolean = true,
		breakOnFirstHit: boolean = false
	): [number, vec3] {
		let earliestHit = -1.0;
		let intersectionVec = null;

		for (let shapeA of shapeArrayA) {
			for (let shapeB of shapeArrayB) {
				let [dist, iVec] = SAT.getContinousIntersection3D(
					shapeA,
					shapeB,
					shapeAVelocity,
					shapeBVelocity,
					maxDistance
				);

				if (
					((allow0Collision && dist >= 0.0) || dist > 0.0) &&
					(dist < earliestHit || earliestHit < 0)
				) {
					earliestHit = dist;
					intersectionVec = iVec;
					maxDistance = earliestHit;

					if (breakOnFirstHit) {
						return [earliestHit, intersectionVec];
					}
				}
			}
		}

		return [earliestHit, intersectionVec];
	}
}
