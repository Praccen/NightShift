import { gl } from "../../../../main";
import Framebuffer from "../../Framebuffers/Framebuffer";
import Texture from "../../Textures/Texture";
import { crtShaderProgram } from "../../ShaderPrograms/PostProcessing/CrtShaderProgram";
import ScreenQuad from "../../../Objects/GraphicsObjects/ScreenQuad";

export default class CRTRenderPass {
	private screenQuad: ScreenQuad;
	outputFramebuffer: Framebuffer;

	constructor(inputTextures: Texture[]) {
		this.screenQuad = new ScreenQuad(crtShaderProgram, inputTextures);
		this.outputFramebuffer = null;
	}

	private bindFramebuffers() {
		if (this.outputFramebuffer == undefined) {
			gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null); // Render directly to screen
		} else {
			this.outputFramebuffer.bind(gl.DRAW_FRAMEBUFFER);
		}
	}

	draw() {
		this.bindFramebuffers();
		gl.disable(gl.DEPTH_TEST);
		// ---- Crt effect ----
		crtShaderProgram.use();
		this.screenQuad.draw(true);
		// --------------------
		gl.enable(gl.DEPTH_TEST);
	}
}
