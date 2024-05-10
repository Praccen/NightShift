import { applicationStartTime, gl } from "../../../main";

import GraphicsObject from "./GraphicsObject";
import Texture from "../../Rendering/Textures/Texture";
import ShaderProgram from "../../Rendering/ShaderPrograms/ShaderProgram";
import { vec3 } from "gl-matrix";

export default class ParticleSpawner extends GraphicsObject {
	texture: Texture;
	fadePerSecond: number;
	sizeChangePerSecond: number;

	// Private
	private numParticles: number;
	private vertices: Float32Array;
	private indices: Int32Array;
	private instanceVBO: WebGLBuffer;

	constructor(
		shaderProgram: ShaderProgram,
		texture: Texture,
		numberOfStartingParticles: number = 0
	) {
		super(shaderProgram);

		this.texture = texture;

		this.bindVAO();
		this.instanceVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			numberOfStartingParticles * 11 * 4,
			gl.DYNAMIC_DRAW
		);
		shaderProgram.setupInstancedVertexAttributePointers();
		this.unbindVAO();

		// prettier-ignore
		this.vertices = new Float32Array([ 
            // positions  // uv
            -0.5,  0.5,   0.0, 1.0,
            -0.5, -0.5,   0.0, 0.0,
             0.5, -0.5,   1.0, 0.0,
             0.5,  0.5,   1.0, 1.0,
        ]);

		// prettier-ignore
		this.indices = new Int32Array([
            0, 1, 2,
            0, 2, 3,
        ]);
		this.setVertexData(this.vertices);
		this.setIndexData(this.indices);

		// All starting particles are initialized as size and position 0, so they wont be visable unless manually changed
		this.numParticles = numberOfStartingParticles;

		this.fadePerSecond = 0.0;
		this.sizeChangePerSecond = 1.0;
	}

	setNumParticles(amount: number) {
		this.numParticles = amount;

		this.bindVAO();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO);
		gl.bufferData(gl.ARRAY_BUFFER, this.numParticles * 11 * 4, gl.DYNAMIC_DRAW);
		this.unbindVAO();
	}

	getNumberOfParticles(): number {
		return this.numParticles;
	}

	setParticleData(
		particleIndex: number,
		startPosition: vec3,
		size: number,
		startVel: vec3,
		acceleration: vec3
	): boolean {
		if (particleIndex > this.numParticles) {
			return false;
		}

		let data = new Float32Array([
			startPosition[0],
			startPosition[1],
			startPosition[2],
			size,
			startVel[0],
			startVel[1],
			startVel[2],
			(Date.now() - applicationStartTime) * 0.001,
			acceleration[0],
			acceleration[1],
			acceleration[2],
		]);

		this.bufferSubDataUpdate(particleIndex * 11, data);

		return true;
	}

	setParticleStartPosition(particleIndex: number, position: vec3): boolean {
		if (particleIndex > this.numParticles) {
			return false;
		}
		this.bufferSubDataUpdate(particleIndex * 11, <Float32Array>position);
		return true;
	}

	setParticleSize(particleIndex: number, size: number): boolean {
		if (particleIndex > this.numParticles) {
			return false;
		}
		this.bufferSubDataUpdate(particleIndex * 11 + 3, new Float32Array([size]));
		return true;
	}

	setParticleStartVelocity(particleIndex: number, vel: vec3): boolean {
		if (particleIndex > this.numParticles) {
			return false;
		}
		this.bufferSubDataUpdate(particleIndex * 11 + 4, <Float32Array>vel);
		return true;
	}

	setParticleStartTime(particleIndex: number, time: number): boolean {
		if (particleIndex > this.numParticles) {
			return false;
		}
		this.bufferSubDataUpdate(particleIndex * 11 + 7, new Float32Array([time]));
		return true;
	}

	resetParticleStartTime(particleIndex: number): boolean {
		if (particleIndex > this.numParticles) {
			return false;
		}
		this.bufferSubDataUpdate(
			particleIndex * 11 + 7,
			new Float32Array([(Date.now() - applicationStartTime) * 0.001])
		);
		return true;
	}

	setParticleAcceleration(particleIndex: number, acc: vec3): boolean {
		if (particleIndex > this.numParticles) {
			return false;
		}
		this.bufferSubDataUpdate(particleIndex * 11 + 8, <Float32Array>acc);
		return true;
	}

	private bufferSubDataUpdate(start: number, data: Float32Array): boolean {
		if (start > this.numParticles * 11) {
			return false;
		}
		this.bindVAO();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO);
		gl.bufferSubData(gl.ARRAY_BUFFER, start * 4, data);
		this.unbindVAO();
		return true;
	}

	draw() {
		this.bindVAO();

		this.texture.bind(0);
		gl.uniform1f(
			this.shaderProgram.getUniformLocation("fadePerSecond")[0],
			this.fadePerSecond
		);
		gl.uniform1f(
			this.shaderProgram.getUniformLocation("sizeChangePerSecond")[0],
			this.sizeChangePerSecond
		);

		gl.drawElementsInstanced(
			gl.TRIANGLES,
			6,
			gl.UNSIGNED_INT,
			0,
			this.getNumberOfParticles()
		);
		this.unbindVAO();
	}
}
