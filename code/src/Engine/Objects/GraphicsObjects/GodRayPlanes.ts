import { gl } from "../../../main";

import GraphicsObject from "./GraphicsObject";
import ShaderProgram from "../../Rendering/ShaderPrograms/ShaderProgram";

export default class GodRayPlanes extends GraphicsObject {
	// Private
	private numPlanes: number;
	private fogMaxDistance: number;
	private vertices: Float32Array;
	private indices: Int32Array;

	constructor(shaderProgram: ShaderProgram) {
		super(shaderProgram);

		this.numPlanes = 50;
		this.fogMaxDistance = 100.0;

		this.bindVAO();
		this.unbindVAO();

		// prettier-ignore
		this.vertices = new Float32Array([ 
            // positions
            -1.0,  1.0,
            -1.0, -1.0,
             1.0, -1.0,
             1.0,  1.0,
        ]);

		// prettier-ignore
		this.indices = new Int32Array([
            0, 1, 2,
            0, 2, 3,
        ]);
		this.setVertexData(this.vertices);
		this.setIndexData(this.indices);
	}

	draw() {
		this.bindVAO();

		gl.uniform1f(
			this.shaderProgram.getUniformLocation("fogMaxDistance")[0],
			this.fogMaxDistance
		);
		gl.uniform1f(
			this.shaderProgram.getUniformLocation("numPlanes")[0],
			this.numPlanes
		);

		gl.drawElementsInstanced(
			gl.TRIANGLES,
			6,
			gl.UNSIGNED_INT,
			0,
			this.numPlanes
		);
	}
}
