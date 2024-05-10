import { gl } from "../../../main";

export default class ShaderProgram {
	// Protected
	protected shaderProgram: WebGLProgram;
	protected uniformBindings: Map<string, WebGLUniformLocation>;

	constructor(
		shaderProgramName: string,
		vertexShaderName: string,
		fragmentShaderName: string,
		debugShaderCompilation: boolean = false
	) {
		this.shaderProgram = null;
		this.loadShaders(
			shaderProgramName,
			vertexShaderName,
			fragmentShaderName,
			debugShaderCompilation
		);
		this.uniformBindings = new Map<string, WebGLUniformLocation>();
	}

	loadShaders(
		shaderProgramName: string,
		vertexShaderString: string,
		fragmentShaderString: string,
		debugShaderCompilation: boolean
	) {
		// link shaders
		if (this.shaderProgram != null) {
			gl.deleteProgram(this.shaderProgram); // Delete in case this is not the first time this shader is created.
		}

		console.log("Compiling shader program: " + shaderProgramName);

		// vertex shader
		const vertexShader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertexShader, vertexShaderString);
		gl.compileShader(vertexShader);

		// Check for shader compile errors
		if (
			!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) ||
			debugShaderCompilation
		) {
			console.log(
				"Vertex shader compiled successfully: " +
					gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)
			);
			console.log(
				"Vertex shader compiler log: \n" + gl.getShaderInfoLog(vertexShader)
			);
		}

		// fragment shader
		const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragmentShader, fragmentShaderString);
		gl.compileShader(fragmentShader);

		// Check for shader compile errors
		if (
			!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS) ||
			debugShaderCompilation
		) {
			console.log(
				"Fragment shader compiled successfully: " +
					gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)
			);
			console.log(
				"Fragment shader compiler log: \n" + gl.getShaderInfoLog(fragmentShader)
			);
		}

		this.shaderProgram = gl.createProgram();

		gl.attachShader(this.shaderProgram, vertexShader);
		gl.attachShader(this.shaderProgram, fragmentShader);
		gl.linkProgram(this.shaderProgram);

		// Check for linking errors?
		let linkedShaders = gl.getProgramParameter(
			this.shaderProgram,
			gl.LINK_STATUS
		);
		if (!linkedShaders || debugShaderCompilation) {
			console.log("Linked shaders successfully: " + linkedShaders);
			console.log(
				"Linking shaders log: \n" + gl.getProgramInfoLog(this.shaderProgram)
			);
		}

		// Delete shaders now that they have been made into a program
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
	}

	use() {
		gl.useProgram(this.shaderProgram);
	}

	setupVertexAttributePointers() {
		// TODO: Pure virtual possible?
	}

	setupInstancedVertexAttributePointers() {}

	setUniformLocation(uniformName: string) {
		this.uniformBindings.set(
			uniformName,
			gl.getUniformLocation(this.shaderProgram, uniformName)
		);
	}

	getUniformLocation(uniformName: string): [WebGLUniformLocation, boolean] {
		if (this.uniformBindings.has(uniformName)) {
			return [this.uniformBindings.get(uniformName), true];
		}

		// console.log("No uniform with name " + uniformName + "\n");
		return [0, false];
	}
}

// ShaderProgram::~ShaderProgram() {
//     glDeleteProgram(p_shaderProgram);
// }
