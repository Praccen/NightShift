import { gl } from "../../../main";
import Framebuffer from "../Framebuffers/Framebuffer";
import Texture from "../Textures/Texture";
import ScreenQuad from "../../Objects/GraphicsObjects/ScreenQuad";
import { screenQuadShaderProgram } from "../ShaderPrograms/ScreenQuadShaderProgram";

export default class FinishedOutputRenderPass {
	private screenQuad: ScreenQuad;
	outputFramebuffer: Framebuffer;

	constructor(inputTextures: Texture[]) {
		this.screenQuad = new ScreenQuad(screenQuadShaderProgram, inputTextures);
		this.outputFramebuffer = null;
	}

	draw() {
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null); // Render directly to screen
		gl.disable(gl.DEPTH_TEST);
		// ---- Crt effect ----
		screenQuadShaderProgram.use();
		this.screenQuad.draw(true);
		// --------------------
		gl.enable(gl.DEPTH_TEST);
	}
}
