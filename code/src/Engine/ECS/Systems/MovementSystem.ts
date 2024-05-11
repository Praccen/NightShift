import System from "./System";
import { ComponentTypeEnum } from "../Components/Component";
import PositionComponent from "../Components/PositionComponent";
import MovementComponent from "../Components/MovementComponent";
import { quat, vec3 } from "gl-matrix";

export default class MovementSystem extends System {
	constructor() {
		super([ComponentTypeEnum.POSITION, ComponentTypeEnum.MOVEMENT]);
	}

	update(dt: number) {
		for (const e of this.entities) {
			let posComp = <PositionComponent>e.getComponent(ComponentTypeEnum.POSITIONPARENT);

			if (posComp == undefined) {
				posComp = <PositionComponent>e.getComponent(ComponentTypeEnum.POSITION);
			}
			let movComp = <MovementComponent>e.getComponent(ComponentTypeEnum.MOVEMENT);

			let oldVel = vec3.clone(movComp.velocity);

			// Do movement calculations
			vec3.add(
				movComp.velocity,
				movComp.velocity,
				vec3.scale(vec3.create(), movComp.accelerationDirection, movComp.acceleration * dt)
			);
			vec3.add(
				movComp.velocity,
				movComp.velocity,
				vec3.scale(vec3.create(), movComp.constantAcceleration, dt)
			);

			movComp.jumpAllowed = movComp.jumpAllowed || movComp.onGround;

			if (movComp.jumpAllowed && movComp.jumpRequested) {
				movComp.velocity[1] = movComp.jumpPower;
				movComp.onGround = false;
				movComp.jumpRequested = false;
				movComp.jumpAllowed = false;
			}

			//Drag
			let dragVec = vec3.scale(vec3.create(), movComp.velocity, -1.0);
			dragVec[1] = 0.0;
			let magnitude = vec3.len(dragVec);
			vec3.add(
				movComp.velocity,
				movComp.velocity,
				vec3.scale(
					dragVec,
					vec3.normalize(dragVec, dragVec),
					Math.min(movComp.drag * dt, magnitude)
				)
			);

			//stop if velocity is too slow
			const accelerating =
				movComp.accelerationDirection[0] != 0.0 || movComp.accelerationDirection[2] != 0.0;
			if (!accelerating && vec3.sqrLen(movComp.velocity) < 0.001) {
				vec3.multiply(movComp.velocity, movComp.velocity, vec3.fromValues(0.0, 1.0, 0.0));
			}

			let displacement = vec3.scale(
				vec3.create(),
				vec3.add(vec3.create(), movComp.velocity, oldVel),
				0.5 * dt
			);

			if (Math.abs(displacement[0]) > 0.001) {
				posComp.position[0] += displacement[0];
			}

			if (Math.abs(displacement[1]) > 0.001) {
				posComp.position[1] += displacement[1];
			}

			if (Math.abs(displacement[2]) > 0.001) {
				posComp.position[2] += displacement[2];
			}

			vec3.set(movComp.accelerationDirection, 0.0, 0.0, 0.0);
			quat.slerp(
				posComp.rotation,
				posComp.rotation,
				quat.mul(quat.create(), posComp.rotation, movComp.momentum),
				dt
			);
		}
	}
}
