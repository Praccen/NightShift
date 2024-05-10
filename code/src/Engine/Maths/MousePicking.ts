import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { input } from "../../Game/GameMachine";
import { windowInfo } from "../../main";
import Camera from "../Objects/Camera";
import Ray from "../Physics/Shapes/Ray";

export module MousePicking {
	export function GetRay(camera: Camera): Ray {
		let ndc = vec2.fromValues(
			input.mousePositionOnCanvas.x,
			input.mousePositionOnCanvas.y,
		);
		ndc[0] = (ndc[0] / windowInfo.resolutionWidth - 0.5) * 2.0;
		ndc[1] = (ndc[1] / windowInfo.resolutionHeight - 0.5) * -2.0;

		let mouseRayClip = vec4.fromValues(ndc[0], ndc[1], -1.0, 1.0);
		let mouseRayCamera = vec4.transformMat4(vec4.create(), mouseRayClip, mat4.invert(mat4.create(), camera.getProjectionMatrix()))
		mouseRayCamera[2] = -1.0;
		mouseRayCamera[3] = 0.0;
		let mouseRayWorld4D = vec4.transformMat4(vec4.create(), mouseRayCamera, mat4.invert(mat4.create(), camera.getViewMatrix())); 
		let dir = vec3.normalize(vec3.create(), vec3.fromValues(
			mouseRayWorld4D[0],
			mouseRayWorld4D[1],
			mouseRayWorld4D[2],
		));

		let ray = new Ray();
		ray.setDir(dir);
		ray.setStart(vec3.clone(camera.getPosition()));

		return ray;
	}
}
