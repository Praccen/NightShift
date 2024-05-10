import System from "./System";
import { ComponentTypeEnum } from "../Components/Component";
import CameraFocusComponent from "../Components/CameraFocusCompontent";
import PositionComponent from "../Components/PositionComponent";
import Camera from "../../Objects/Camera";
import { mat4, vec3 } from "gl-matrix";

export default class CameraFocusSystem extends System {
	camera: Camera;

	constructor(camera: Camera) {
		super([ComponentTypeEnum.POSITION, ComponentTypeEnum.CAMERAFOCUS]);
		this.camera = camera;
	}

	update(dt: number) {
		for (const e of this.entities) {
			let posComp = <PositionComponent>(
				e.getComponent(ComponentTypeEnum.POSITIONPARENT)
			);

			if (!posComp) {
				posComp = <PositionComponent>e.getComponent(ComponentTypeEnum.POSITION);
			}

			let camFocusComp = <CameraFocusComponent>(
				e.getComponent(ComponentTypeEnum.CAMERAFOCUS)
			);

			let tempMatrix = mat4.create();
			posComp.calculateMatrix(tempMatrix);
			let camPosVector = vec3.transformMat4(vec3.create(), vec3.create(), tempMatrix);
			let camPos = vec3.add(
				vec3.create(), vec3.add(
					vec3.create(), camPosVector, 
					camFocusComp.focusPoint)
				, camFocusComp.offset);

			this.camera.setPosition(camPos);
			this.camera.setDir(
				vec3.negate(vec3.create(), camFocusComp.offset)
			);
		}
	}
}
