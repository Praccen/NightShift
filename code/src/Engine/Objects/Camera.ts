import { ReadonlyVec3, mat4, vec3 } from "gl-matrix";
import { gl } from "../../main";

export default class Camera {
	private pos: vec3;
	private dir: vec3;
	private up: vec3;
	private fov: number;
	private ratio: number;
	private farPlaneDistance: number;
	private viewMatrixNeedsUpdate: boolean;
	private projMatrixNeedsUpdate: boolean;
	private viewMatrix: mat4;
	private projectionMatrix: mat4;
	private viewProjMatrix: mat4;

	constructor() {
		// ----View----
		this.pos = vec3.create();
		this.dir = vec3.fromValues(0.0, 0.0, -1.0);
		this.up = vec3.fromValues(0.0, 1.0, 0.0);
		this.viewMatrix = mat4.create();
		this.viewMatrixNeedsUpdate = true;
		// ------------

		// ----Proj----
		this.projectionMatrix = mat4.create();
		this.projMatrixNeedsUpdate = true;
		this.ratio = 16.0 / 9.0;
		this.fov = (85.0 * Math.PI) / 180;
		this.farPlaneDistance = 1000.0;
		// ------------

		this.viewProjMatrix = mat4.create();
	}

	getViewProjMatrix(): mat4 {
		this.updateViewProjMatrix();
		return this.viewProjMatrix;
	}

	getViewMatrix(): mat4 {
		this.updateViewProjMatrix();
		return this.viewMatrix;
	}

	getProjectionMatrix(): mat4 {
		this.updateViewProjMatrix();
		return this.projectionMatrix;
	}

	getFov(): number {
		return this.fov;
	}

	getPosition(): vec3 {
		return this.pos;
	}

	getDir(): ReadonlyVec3 {
		return this.dir;
	}

	getRight(): vec3 {
		let returnVec = vec3.create();
		vec3.cross(returnVec, this.dir, this.up);
		vec3.normalize(returnVec, returnVec);
		return returnVec;
	}

	setPosition(pos: ReadonlyVec3) {
		vec3.copy(this.pos, pos);
		this.viewMatrixNeedsUpdate = true;
	}

	translate(translation: ReadonlyVec3) {
		vec3.add(this.pos, this.pos, translation);
		this.viewMatrixNeedsUpdate = true;
	}

	setDir(dir: vec3) {
		vec3.normalize(this.dir, dir);
		this.viewMatrixNeedsUpdate = true;
	}

	setUp(up: vec3) {
		vec3.normalize(this.up, up);
		this.viewMatrixNeedsUpdate = true;
	}

	setPitchJawDegrees(pitch: number, jaw: number) {
		vec3.set(
			this.dir,
			Math.cos((pitch * Math.PI) / 180) * Math.sin((jaw * Math.PI) / 180),
			Math.sin((pitch * Math.PI) / 180),
			Math.cos((pitch * Math.PI) / 180) * Math.cos((jaw * Math.PI) / 180)
		);
		this.viewMatrixNeedsUpdate = true;
	}

	setPitchJawRadians(pitch: number, jaw: number) {
		vec3.set(
			this.dir,
			Math.cos(pitch) * Math.sin(jaw),
			Math.sin(pitch),
			Math.cos(pitch) * Math.cos(jaw)
		);
		this.viewMatrixNeedsUpdate = true;
	}

	setFOV(fov: number) {
		this.fov = (fov * Math.PI) / 180.0;
		this.projMatrixNeedsUpdate = true;
	}

	setAspectRatio(ratio: number) {
		this.ratio = ratio;
		this.projMatrixNeedsUpdate = true;
	}

	setFarPlaneDistance(distance: number) {
		this.farPlaneDistance = distance;
		this.projMatrixNeedsUpdate;
	}

	private updateViewProjMatrix() {
		let updateViewProj = false;
		if (this.viewMatrixNeedsUpdate) {
			mat4.lookAt(this.viewMatrix, this.pos, vec3.add(vec3.create(), this.pos, this.dir), this.up);
			this.viewMatrixNeedsUpdate = false;
			updateViewProj = true;
		}

		if (this.projMatrixNeedsUpdate) {
			mat4.perspective(this.projectionMatrix, this.fov, this.ratio, 0.01, this.farPlaneDistance);
			this.projMatrixNeedsUpdate = false;
			updateViewProj = true;
		}

		if (updateViewProj) {
			mat4.mul(this.viewProjMatrix, this.projectionMatrix, this.viewMatrix);
		}
	}

	bindViewProjMatrix(uniformLocation: WebGLUniformLocation, skybox: boolean = false) {
		this.updateViewProjMatrix();

		if (skybox) {
			let tempViewMatrix = mat4.lookAt(mat4.create(), vec3.create(), this.dir, this.up);
			let tempViewProj = mat4.mul(mat4.create(), this.projectionMatrix, tempViewMatrix);

			gl.uniformMatrix4fv(uniformLocation, false, tempViewProj);
		} else {
			gl.uniformMatrix4fv(uniformLocation, false, this.viewProjMatrix);
		}
	}
}
