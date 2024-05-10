import { quat, vec3 } from "gl-matrix";
import Entity from "../ECS/Entity";
import MovementComponent from "../ECS/Components/MovementComponent";
import { ComponentTypeEnum } from "../ECS/Components/Component";
import CollisionComponent from "../ECS/Components/CollisionComponent";
import PositionComponent from "../ECS/Components/PositionComponent";
import { ECSUtils } from "../Utils/ESCUtils";
import { IntersectionTester } from "./IntersectionTester";

export module CollisionSolver {
	export function getTranslationNeeded(
		intersectionInformation: Array<IntersectionTester.IntersectionInformation>
	): vec3 {
		if (intersectionInformation.length == 0) {
			return vec3.create();
		}

		// Displace along the axis which has the most depth
		let resultingVec = vec3.create();
		let maxDepth = 0.0;
		for (let inf of intersectionInformation) {
			// Only displace for triangles if it is along the normal
			if (inf.shapeB.getTransformedNormals().length == 1) {
				if (vec3.dot(inf.axis, inf.shapeB.getTransformedNormals()[0]) < 0.99) {
					continue;
				}
			}

			if (inf.depth > maxDepth) {
				vec3.copy(resultingVec, inf.axis);
				maxDepth = inf.depth;
			}
		}
		vec3.scale(resultingVec, resultingVec, maxDepth);

		return resultingVec;
	}

	function updateMomentum(collisionComp: CollisionComponent, movComp: MovementComponent, inf: IntersectionTester.IntersectionInformation, entity: Entity, axis: vec3, change: vec3) {
		if (collisionComp.isDynamic) {
			let collisionPointOffset = vec3.subtract(vec3.create(), inf.point, ECSUtils.CalculatePosition(entity));

			let rotationAxis = vec3.cross(vec3.create(), axis, collisionPointOffset);
			if (vec3.sqrLen(rotationAxis) > 0.0001) {
				vec3.normalize(rotationAxis, rotationAxis);
				let axis = vec3.create();
				let angle = quat.getAxisAngle(axis, movComp.momentum);
				vec3.normalize(axis, axis);
				let rotationImpact = angle * vec3.dot(axis, rotationAxis);
				vec3.scale(rotationAxis, rotationAxis, (vec3.len(change) + rotationImpact) * vec3.len(collisionPointOffset) * 5.0);
				quat.mul(movComp.momentum, movComp.momentum, quat.fromEuler(quat.create(), rotationAxis[0], rotationAxis[1], rotationAxis[2]));
			}
			else {
				movComp.momentum = quat.create();
			}
		}
	}

	export function handleCollision(intersectionInformation: Array<IntersectionTester.IntersectionInformation>, e1: Entity, e2: Entity) {
		let e1MovComp = <MovementComponent>(e1.getComponent(ComponentTypeEnum.MOVEMENT));
		let e1CollisionComp = <CollisionComponent>(e1.getComponent(ComponentTypeEnum.COLLISION));
		
		let e2MovComp = <MovementComponent>(e2.getComponent(ComponentTypeEnum.MOVEMENT));
		let e2CollisionComp = <CollisionComponent>(e2.getComponent(ComponentTypeEnum.COLLISION));

		for (let inf of intersectionInformation) {
			let axis = vec3.clone(inf.axis);
			if (inf.shapeB.getTransformedNormals().length == 1) {
				vec3.copy(axis, inf.shapeB.getTransformedNormals()[0]);
			}
			else if(inf.shapeA.getTransformedNormals().length == 1) {
				vec3.copy(axis, inf.shapeA.getTransformedNormals()[0]);
				vec3.negate(axis, axis); // Make sure axis is always pointing from b to a
			}

			let e1Vel = e1MovComp ? e1MovComp.velocity : vec3.create();
			let e2Vel = e2MovComp ? e2MovComp.velocity : vec3.create();

			let velDifference = vec3.sub(vec3.create(), e1Vel, e2Vel);
			let dotProd = vec3.dot(velDifference, axis);
			if (dotProd < 0.0) {
				let eN = vec3.cross(vec3.create(), vec3.cross(vec3.create(), velDifference, axis), axis);

				if (vec3.squaredLength(eN) > 0.0001) {
					vec3.normalize(eN, eN);
				}

				let e1Change = vec3.create();
				let e2Change = vec3.create();

				let collisionCoefficient = Math.max(e1CollisionComp.collisionCoefficient, e2CollisionComp.collisionCoefficient); // TODO: This can be calculated differently, will be based on material abilities in the future
				let frictionCoefficient = Math.max(e1CollisionComp.frictionCoefficient, e2CollisionComp.frictionCoefficient); // TODO: This can be calculated differently, will be based on material abilities in the future

				if (e1MovComp && !e1CollisionComp.isStatic && !e1CollisionComp.isImmovable && e2MovComp && !e2CollisionComp.isStatic && !e2CollisionComp.isImmovable) {
					let v1Dot = vec3.dot(e1Vel, axis);
					let v2Dot = vec3.dot(e2Vel, axis);
					let tangentVel1 = vec3.dot(e1Vel, eN);
					let tangentVel2 = vec3.dot(e2Vel, eN);
					let u1Dot = ((e1CollisionComp.mass - collisionCoefficient * e2CollisionComp.mass) / (e1CollisionComp.mass + e2CollisionComp.mass)) * v1Dot + ((1.0 + collisionCoefficient) * e2CollisionComp.mass) / (e1CollisionComp.mass + e2CollisionComp.mass) * v2Dot;
					let u2Dot = ((e2CollisionComp.mass - collisionCoefficient * e1CollisionComp.mass) / (e2CollisionComp.mass + e1CollisionComp.mass)) * v2Dot + ((1.0 + collisionCoefficient) * e1CollisionComp.mass) / (e2CollisionComp.mass + e1CollisionComp.mass) * v1Dot;

					let frictionMagnitude1 = -1.0 * (((u1Dot - v1Dot) * frictionCoefficient) < 0.0 ? 1 : 0) * Math.min(Math.abs(tangentVel1), Math.abs((u1Dot - v1Dot) * frictionCoefficient));
					let frictionMagnitude2 = -1.0 * (((u2Dot - v2Dot) * frictionCoefficient) < 0.0 ? 1 : 0) * Math.min(Math.abs(tangentVel2), Math.abs((u2Dot - v2Dot) * frictionCoefficient));

					vec3.scaleAndAdd(e1Change, e1Change, axis, (u1Dot - v1Dot));
					vec3.scaleAndAdd(e1Change, e1Change, eN, frictionMagnitude1);

					vec3.scaleAndAdd(e2Change, e2Change, axis, (u2Dot - v2Dot));
					vec3.scaleAndAdd(e2Change, e2Change, eN, frictionMagnitude2);
				}
				else if (!e1MovComp || e1CollisionComp.isStatic || e1CollisionComp.isImmovable) {
					let inverseVelDifference = vec3.negate(vec3.create(), velDifference);
					let v2Dot = vec3.dot(inverseVelDifference, axis);
					let relativeTangentVel = vec3.dot(inverseVelDifference, eN);
					let frictionMagnitude = Math.min(relativeTangentVel * frictionCoefficient, v2Dot * (1.0 + collisionCoefficient) + frictionCoefficient);

					vec3.scaleAndAdd(e2Change, e2Change, axis, -v2Dot * (1.0 + collisionCoefficient));
					vec3.scaleAndAdd(e2Change, e2Change, eN, -frictionMagnitude);
				}
				else if (!e2MovComp || e2CollisionComp.isStatic || e2CollisionComp.isImmovable) {
					let v1Dot = vec3.dot(velDifference, axis);
					let relativeTangentVel = vec3.dot(velDifference, eN);
					let frictionMagnitude = Math.min(relativeTangentVel * frictionCoefficient, v1Dot * (1.0 + collisionCoefficient) + frictionCoefficient);

					vec3.scaleAndAdd(e1Change, e1Change, axis, -v1Dot * (1.0 + collisionCoefficient));
					vec3.scaleAndAdd(e1Change, e1Change, eN, -frictionMagnitude);
				}

				if (e1MovComp) {
					vec3.add(e1Vel, e1Vel, e1Change);
					if (e1Change[1] > 0.0) {
						e1MovComp.onGround = true;
					}

					updateMomentum(e1CollisionComp, e1MovComp, inf, e1, axis, e1Change);
				}

				if (e2MovComp) {
					vec3.add(e2Vel, e2Vel, e2Change);
					if (e2Change[1] > 0.0) {
						e2MovComp.onGround = true;
					}

					updateMomentum(e2CollisionComp, e2MovComp, inf, e2, axis, e2Change);
				}
				
				let displacement = CollisionSolver.getTranslationNeeded([inf]);

				if (!e1CollisionComp.isImmovable && !e1CollisionComp.isStatic) {
					// Prioritize the parent position component if there is one
					let posComp = <PositionComponent>(
						e1.getComponent(ComponentTypeEnum.POSITIONPARENT)
					);

					// Otherwise move the position component
					if (!posComp) {
						posComp = <PositionComponent>(
							e1.getComponent(ComponentTypeEnum.POSITION)
						);
					}

					vec3.add(posComp.position, posComp.position, vec3.scale(vec3.create(), displacement, vec3.len(e1Change) / (vec3.len(e1Change) + vec3.len(e2Change))));
				}
				
				if (!e2CollisionComp.isImmovable && !e2CollisionComp.isStatic) {
					// Prioritize the parent position component if there is one
					let posComp = <PositionComponent>(
						e2.getComponent(ComponentTypeEnum.POSITIONPARENT)
					);

					// Otherwise move the position component
					if (!posComp) {
						posComp = <PositionComponent>(
							e2.getComponent(ComponentTypeEnum.POSITION)
						);
					}

					vec3.subtract(posComp.position, posComp.position, vec3.scale(vec3.create(), displacement, vec3.len(e2Change) / (vec3.len(e1Change) + vec3.len(e2Change))));
				}
			}
		}
	}
}
