import { mat4, vec3, vec4 } from "gl-matrix";
import GuiObject from "../GuiObject";

export default class TextObject3D extends GuiObject {
	position: vec3;
	size: number;
	scaleFontWithDistance: boolean;

	private hidden: boolean;

	constructor() {
		super();

		this.position = vec3.create();
		this.size = 42;
		this.scaleFontWithDistance = true;
	}

	setHidden(hidden: boolean) {
		super.setHidden(hidden);
		this.hidden = hidden;
	}

	draw3D(viewProj: mat4): void {
		let pos = vec4.fromValues(
			this.position[0],
			this.position[1],
			this.position[2],
			1.0
		);
		let screenCoords = vec4.transformMat4(vec4.create(), pos, viewProj);
		screenCoords[0] = (screenCoords[0] / screenCoords[3] + 1.0) / 2.0;
		screenCoords[1] = 1.0 - (screenCoords[1] / screenCoords[3] + 1.0) / 2.0;

		if (screenCoords[2] > 0.0 && !this.hidden) {
			this.position2D[0] = screenCoords[0];
			this.position2D[1] = screenCoords[1];

			let size = this.size;
			if (this.scaleFontWithDistance) {
				size = this.size / screenCoords[2];
			}
			this.fontSize = size;

			this.div.hidden = false;
			this.div.textContent = this.textString;
			this.drawObject();
		} else {
			this.div.hidden = true;
		}
	}
}
