import { ReadonlyVec3, vec3 } from "gl-matrix";
import Shape from "../Physics/Shapes/Shape";
import Triangle from "../Physics/Shapes/Triangle";

export module SAT {
	/**
	 * Finds how big of an overlap there is between two sets of points along a vector.
	 * @param overlapVector The vector to test along.
	 * @param shapeAVertices Points in set A
	 * @param shapeBVertices Points in set B
	 * @param reverse An object holding a variable "value" that is set to true if the vector should be flipped in order to have the vector point from dataset B towards dataset A.
	 * Is set by this function.
	 * @returns How big the overlap is, returns -1.0 if there is no overlap.
	 */
	export function getOverlap(
		overlapVector: vec3,
		shapeAVertices: Array<vec3>,
		shapeBVertices: Array<vec3>,
		reverse: { value: boolean },
		margin: number
	): number {
		let maxA = vec3.dot(overlapVector, shapeAVertices[0]);
		let minA = maxA;
		let maxB = vec3.dot(overlapVector, shapeBVertices[0]);
		let minB = maxB;

		let tempDot = 0.0;

		for (let i = 1; i < shapeAVertices.length; i++) {
			tempDot = vec3.dot(overlapVector, shapeAVertices[i]);
			minA = Math.min(tempDot, minA);
			maxA = Math.max(tempDot, maxA);
		}

		for (let i = 1; i < shapeBVertices.length; i++) {
			tempDot = vec3.dot(overlapVector, shapeBVertices[i]);
			minB = Math.min(tempDot, minB);
			maxB = Math.max(tempDot, maxB);
		}

		let overlap1 = maxB - minA;
		let overlap2 = maxA - minB;
		if (overlap1 >= -margin && overlap2 >= -margin) {
			if (overlap1 > overlap2) {
				reverse.value = true;
				return overlap2;
			} else {
				reverse.value = false;
				return overlap1;
			}
		}

		return -1.0;
	}

	/**
	 * Finds if two sets of vertices will overlap along an axis given their relative speed within the time frame (time input object).
	 * Will alter the first collision time and last collision time in the info object, as well as copy the test vec to the intersectionVec in the info object
	 * @param testVec The axis for overlap
	 * @param shapeAVertices Vertices for shape A
	 * @param shapeBVertices Vertices for shape B
	 * @param relativeVelocity Relative velocity between the shapes
	 * @param info info object which contains - time for first, last, max. Max is how soon the overlap has to happen to count. Also holds the intersection vector for the first overlap
	 * @returns If an overlap happens within the timeframe (info.max)
	 */
	export function getContinousOverlap(
		testVec: vec3,
		shapeAVertices: Array<vec3>,
		shapeBVertices: Array<vec3>,
		relativeVelocity: vec3,
		info: { first: number; last: number; max: number; intersectionVec: vec3}
	): boolean {
		let minA = Infinity,
			minB = Infinity;
		let maxA = -Infinity,
			maxB = -Infinity;

		let tempDot = 0.0;

		for (const vert of shapeAVertices) {
			tempDot = vec3.dot(vert, testVec);

			minA = Math.min(minA, tempDot);
			maxA = Math.max(maxA, tempDot);
		}

		for (const vert of shapeBVertices) {
			tempDot = vec3.dot(vert, testVec);

			minB = Math.min(minB, tempDot);
			maxB = Math.max(maxB, tempDot);
		}

		//Following found here: https://www.geometrictools.com/Documentation/MethodOfSeparatingAxes.pdf

		let T: number;
		let speed = vec3.dot(testVec, relativeVelocity);

		if (maxB <= minA) {
			if (speed <= 0.0) {
				// Interval (B) initially on ‘left’ of interval (A)
				return false; // Intervals moving apart
			}

			T = (minA - maxB) / speed;
			if (T > info.first) {
				info.first = T;
				vec3.copy(info.intersectionVec, testVec);
			}
			if (info.first > info.max) {
				return false;
			} // Early exit

			T = (maxA - minB) / speed;
			if (T < info.last) {
				info.last = T;
			}
			if (info.first > info.last) {
				return false;
			} // Early exit
		} else if (maxA <= minB) {
			// Interval (B) initially on ‘right’ of interval (A)
			if (speed >= 0.0) {
				return false;
			} // Intervals moving apart

			T = (maxA - minB) / speed;
			if (T > info.first) {
				info.first = T;
				vec3.copy(info.intersectionVec, testVec);
			}
			if (info.first > info.max) {
				return false;
			} // Early exit

			T = (minA - maxB) / speed;
			if (T < info.last) {
				info.last = T;
			}
			if (info.first > info.last) {
				return false;
			} // Early exit
		} else {
			// Interval (A) and interval (B) overlap
			if (speed > 0.0) {
				T = (maxA - minB) / speed;
				if (T < info.last) {
					info.last = T;
				}
				if (info.first > info.last) {
					return false;
				} // Early exit
			} else if (speed < 0.0) {
				T = (minA - maxB) / speed;
				if (T < info.last) {
					info.last = T;
				}
				if (info.first > info.last) {
					return false;
				} // Early exit
			}
		}

		return true;
	}

	/**
	 * This will find the average point of intersection between two shapes along an axis.
	 * This assumes that the shapes are intersecting and can not be used to find out IF two shapes are intersecting.
	 * @param shapeA Shape A
	 * @param shapeB Shape B
	 * @param testAxis The axis to test along.
	 * @returns The average point of intersection.
	 */
	export function getIntersectionPoint(
		shapeA: Shape,
		shapeB: Shape,
		testAxis: vec3
	): vec3 {
		let shapeAVertices = shapeA.getTransformedVertices();
		let shapeBVertices = shapeB.getTransformedVertices();

		let maxAPoints: Array<number> = new Array<number>();
		let minAPoints: Array<number> = new Array<number>();
		let maxBPoints: Array<number> = new Array<number>();
		let minBPoints: Array<number> = new Array<number>();

		let maxA = vec3.dot(testAxis, shapeAVertices[0]);
		maxAPoints.push(0);
		let minA = maxA;
		minAPoints.push(0);
		let maxB = vec3.dot(testAxis, shapeBVertices[0]);
		maxBPoints.push(0);
		let minB = maxB;
		minBPoints.push(0);

		let tempDot = 0.0;

		for (let i = 1; i < shapeAVertices.length; i++) {
			tempDot = vec3.dot(testAxis, shapeAVertices[i]);
			if (tempDot < minA) {
				minA = tempDot;
				minAPoints.length = 0;
				minAPoints.push(i);
			} else if (Math.abs(tempDot - minA) < 0.0001) {
				minAPoints.push(i);
			}
			if (tempDot > maxA) {
				maxA = tempDot;
				maxAPoints.length = 0;
				maxAPoints.push(i);
			} else if (Math.abs(tempDot - maxA) < 0.0001) {
				maxAPoints.push(i);
			}
		}

		for (let i = 1; i < shapeBVertices.length; i++) {
			tempDot = vec3.dot(testAxis, shapeBVertices[i]);
			if (tempDot < minB) {
				minB = tempDot;
				minBPoints.length = 0;
				minBPoints.push(i);
			} else if (Math.abs(tempDot - minB) < 0.0001) {
				minBPoints.push(i);
			}
			if (tempDot > maxB) {
				maxB = tempDot;
				maxBPoints.length = 0;
				maxBPoints.push(i);
			} else if (Math.abs(tempDot - maxB) < 0.0001) {
				maxBPoints.push(i);
			}
		}

		let overlap1 = Math.abs(maxB - minA);
		let overlap2 = Math.abs(maxA - minB);

		// let averagePoint = new Vec3();
		// let nrPoints = 0;
		let intersectionPoint = vec3.create();

		if (overlap1 > overlap2) {
			// overlap2
			// for (const p of maxAPoints) {
			// 	averagePoint.add(shapeAVertices[p]);
			// 	nrPoints++;
			// }
			// for (const p of minBPoints) {
			// 	averagePoint.add(shapeBVertices[p]);
			// 	nrPoints++;
			// }

			if (maxAPoints.length == 1) {
				vec3.copy(intersectionPoint, shapeAVertices[maxAPoints[0]]);
			}
			else if (minBPoints.length == 1) {
				vec3.copy(intersectionPoint, shapeBVertices[minBPoints[0]]);
			}
		} else {
			// overlap1;
			// for (const p of minAPoints) {
			// 	averagePoint.add(shapeAVertices[p]);
			// 	nrPoints++;
			// }
			// for (const p of maxBPoints) {
			// 	averagePoint.add(shapeBVertices[p]);
			// 	nrPoints++;
			// }

			if (minAPoints.length == 1) {
				vec3.copy(intersectionPoint, shapeAVertices[minAPoints[0]]);
			}
			else if (maxBPoints.length == 1) {
				vec3.copy(intersectionPoint, shapeBVertices[maxBPoints[0]]);
			}
		}
		// averagePoint.multiply(1.0 / nrPoints);
		return intersectionPoint;
	}

	/**
	 * Intersection testing of two shapes.
	 * @param shapeA Shape A
	 * @param shapeB Shape B
	 * @param intersectionAxis The minimum translation vector (MTV).
	 * This is the axis at which the shapes are intersecting the least.
	 * Is set by this function.
	 * Will always point from Shape B towards Shape A.
	 * @param intersectionDepth An object holding a variable "depth" that will state how much the shapes are intersecting.
	 * Is set by this function
	 * @returns Boolean stating if the shapes intersect or not.
	 */
	export function getIntersection3D(
		shapeA: Shape,
		shapeB: Shape,
		intersectionAxis: vec3,
		intersectionDepth: { depth: number }
	): boolean {
		intersectionDepth.depth = Infinity;

		let shapeAVertices = shapeA.getTransformedVertices();
		let shapeBVertices = shapeB.getTransformedVertices();

		// Check normal and update intersection depth and axis if shallower than previous
		let checkNormal = function (normal: vec3): boolean {
			let reverse = { value: false };
			let overlap = SAT.getOverlap(
				normal,
				shapeAVertices,
				shapeBVertices,
				reverse,
				shapeA.margin + shapeB.margin
			);

			if (overlap < 0.0) {
				return false;
			}

			if (overlap < intersectionDepth.depth) {
				intersectionDepth.depth = overlap;
				vec3.copy(intersectionAxis, normal);
				if (reverse.value) {
					vec3.scale(intersectionAxis, intersectionAxis, -1);
				}
			}
			return true;
		};

		let shapeBNormals = shapeB.getTransformedNormals();
		for (let normal of shapeBNormals) {
			if (!checkNormal(normal)) {
				return false;
			}
		}

		let shapeANormals = shapeA.getTransformedNormals();
		for (let normal of shapeANormals) {
			if (!checkNormal(normal)) {
				return false;
			}
		}

		// The shapes are intersecting along all normals
		// Two cases are possible;
		// 1. The shapes are flat and coplanar -> We need to test the shapes in "2d", projected on the plane they are on
		// 2. The shapes are not flat and coplanar -> We need to test the cross products of all the edges of ShapeA with the edges of ShapeB

		// Lets start with the coplanar possibility, which can be checked by seeing if both shapes have only one normal, and the two shapes normals are perpendicular
		// Side note; If the normals are perpendicular, but the shapes are not coplanar, the previous tests would have found a seperating axis, so we wouldn't have gotten here

		if (shapeANormals.length == 1 && shapeBNormals.length == 1) {
			// Coplanar possible
			let crossVector = vec3.cross(vec3.create(), shapeANormals[0], shapeBNormals[0]);

			if (
				crossVector[0] == 0.0 &&
				crossVector[1] == 0.0 &&
				crossVector[2] == 0.0
			) {
				// Coplanar
				// Test the edge normals for all edges
				for (const AEdgeNormal of shapeA.getTransformedEdgeNormals()) {
					if (!checkNormal(AEdgeNormal)) {
						return false;
					}
				}

				for (const BEdgeNormal of shapeB.getTransformedEdgeNormals()) {
					if (!checkNormal(BEdgeNormal)) {
						return false;
					}
				}

				// There is an intersection, return it
				return true;
			}
		}

		// Calculate cross vectors of edges and test along the results
		for (const e1 of shapeA.getTransformedEdges()) {
			for (const e2 of shapeB.getTransformedEdges()) {
				const dotProd = vec3.dot(e1, e2);
				if (dotProd < 0.99 && dotProd > -0.99) {
					let testVec = vec3.clone(e1);
					vec3.normalize(testVec, vec3.cross(testVec, testVec, e2));
					if (!checkNormal(testVec)) {
						return false;
					}
				}
			}
		}

		return true;
	}

	/**
	 * Check when an intersection will occur (if it happens before timeMax).
	 * @param shapeA
	 * @param shapeB
	 * @param velocityA
	 * @param velocityB
	 * @param timeMax
	 * @returns Returns time of intersection if there is one within timeMax, otherwise returns -1.0
	 */
	export function getContinousIntersection3D(
		shapeA: Shape,
		shapeB: Shape,
		velocityA: ReadonlyVec3,
		velocityB: ReadonlyVec3,
		timeMax: number
	): [number, vec3]{
		// Treat shapeA as stationary and shapeB as moving
		let relativeVel = vec3.subtract(vec3.create(), velocityB, velocityA);

		let info = { first: 0.0, last: Infinity, max: timeMax, intersectionVec: vec3.create()};

		let shapeAVertices = shapeA.getTransformedVertices();
		let shapeBVertices = shapeB.getTransformedVertices();

		let shapeANormals = shapeA.getTransformedNormals();
		for (let normal of shapeANormals) {
			if (
				!getContinousOverlap(
					normal,
					shapeAVertices,
					shapeBVertices,
					relativeVel,
					info
				)
			) {
				return [-1.0, null];
			}
		}

		let shapeBNormals = shapeB.getTransformedNormals();
		for (let normal of shapeBNormals) {
			if (
				!getContinousOverlap(
					normal,
					shapeAVertices,
					shapeBVertices,
					relativeVel,
					info
				)
			) {
				return [-1.0, null];
			}
		}

		// The shapes are intersecting along all normals
		// Two cases are possible;
		// 1. The shapes are flat and coplanar -> We need to test the shapes in "2d", projected on the plane they are on
		// 2. The shapes are not flat and coplanar -> We need to test the cross products of all the edges of ShapeA with the edges of ShapeB

		// Lets start with the coplanar possibility, which can be checked by seeing if both shapes have only one normal, and the two shapes normals are perpendicular
		// Side note; If the normals are perpendicular, but the shapes are not coplanar, the previous tests would have found a seperating axis, so we wouldn't have gotten here

		if (shapeANormals.length == 1 && shapeBNormals.length == 1) {
			// Coplanar possible
			let crossVector = vec3.cross(vec3.create(), shapeANormals[0], shapeBNormals[0]);

			if (
				crossVector[0] == 0.0 &&
				crossVector[1] == 0.0 &&
				crossVector[2] == 0.0
			) {
				// Coplanar
				// Test the edge normals for all edges
				for (const AEdgeNormal of shapeA.getTransformedEdgeNormals()) {
					if (
						!getContinousOverlap(
							AEdgeNormal,
							shapeAVertices,
							shapeBVertices,
							relativeVel,
							info
						)
					) {
						return [-1.0, null];
					}
				}

				for (const BEdgeNormal of shapeB.getTransformedEdgeNormals()) {
					if (
						!getContinousOverlap(
							BEdgeNormal,
							shapeAVertices,
							shapeBVertices,
							relativeVel,
							info
						)
					) {
						return [-1.0, null];
					}
				}

				// There is an intersection
				// If the intersection is NOT exactly at 0.0 and never again, return it
				if (info.last == 0.0) {
					return [-1.0, null];
				}
				return [info.first, info.intersectionVec];
			}
		}

		// Calculate cross vectors of edges and test along the results
		for (const e1 of shapeA.getTransformedEdges()) {
			for (const e2 of shapeB.getTransformedEdges()) {
				const dotProd = vec3.dot(e1, e2);
				if (dotProd < 0.99 && dotProd > -0.99) {
					let testVec = vec3.clone(e1);
					vec3.normalize(testVec, vec3.cross(testVec, testVec, e2));
					if (
						!getContinousOverlap(
							testVec,
							shapeAVertices,
							shapeBVertices,
							relativeVel,
							info
						)
					) {
						return [-1.0, null];
					}
				}
			}
		}

		// If the intersection is NOT exactly at 0.0 and never again, return it
		if (info.last == 0.0) {
			return [-1.0, null];
		}
		return [info.first, info.intersectionVec];
	}
}
