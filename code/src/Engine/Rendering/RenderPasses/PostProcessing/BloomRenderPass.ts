import { gl, windowInfo } from "../../../../main";
import Framebuffer from "../../Framebuffers/Framebuffer";
import Texture from "../../Textures/Texture";
import ScreenQuad from "../../../Objects/GraphicsObjects/ScreenQuad";
import { screenQuadShaderProgram } from "../../ShaderPrograms/ScreenQuadShaderProgram";
import { bloomExtraction } from "../../ShaderPrograms/PostProcessing/BloomExtraction";
import { bloomBlending } from "../../ShaderPrograms/PostProcessing/BloomBlending";

export default class BloomRenderPass {
	private bloomResolutionWidth: number;
	private bloomResolutionHeight: number;
	private bloomExtractionOutputFramebuffer: Framebuffer;
	private bloomLevelsFramebuffers: Array<Framebuffer>;

	private screenQuad: ScreenQuad;
	outputFramebuffer: Framebuffer;

	constructor(inputTextures: Texture[]) {
		this.bloomResolutionWidth = 1280;
		this.bloomResolutionHeight = 720;
		this.bloomExtractionOutputFramebuffer = new Framebuffer(
			windowInfo.resolutionWidth,
			windowInfo.resolutionHeight,
			[new Texture(false), new Texture(false)],
			null
		);
		this.bloomLevelsFramebuffers = new Array<Framebuffer>();

		for (let i = 1; i <= 5; i++) {
			this.bloomLevelsFramebuffers.push(
				new Framebuffer(
					this.bloomResolutionWidth * Math.pow(0.5, i),
					this.bloomResolutionHeight * Math.pow(0.5, i),
					[new Texture(false)],
					null
				)
			);
		}

		this.screenQuad = new ScreenQuad(screenQuadShaderProgram, inputTextures);
		this.outputFramebuffer = null;
	}

	setResolution(x: number, y: number) {
		this.bloomExtractionOutputFramebuffer.setProportions(x, y);
	}

	private bindFramebuffers() {
		// Render result to screen or to crt framebuffer if doing crt effect after this.
		if (this.outputFramebuffer == undefined) {
			gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null); // Render directly to screen
		} else {
			this.outputFramebuffer.bind(gl.DRAW_FRAMEBUFFER);
		}
	}

	draw() {
		gl.disable(gl.DEPTH_TEST);

		// Extract the bloom areas
		this.bloomExtractionOutputFramebuffer.bind(gl.DRAW_FRAMEBUFFER);
		bloomExtraction.use();
		this.screenQuad.draw(true);

		// Downscale the image and save every iteration
		screenQuadShaderProgram.use();
		this.bloomExtractionOutputFramebuffer.textures[1].bind(0);
		for (let i = 0; i < this.bloomLevelsFramebuffers.length; i++) {
			gl.viewport(
				0,
				0,
				this.bloomResolutionWidth * Math.pow(0.5, i + 1),
				this.bloomResolutionHeight * Math.pow(0.5, i + 1)
			);
			this.bloomLevelsFramebuffers[i].bind(gl.DRAW_FRAMEBUFFER);
			this.screenQuad.draw(false);
			this.bloomLevelsFramebuffers[i].textures[0].bind(0);
		}

		// Combine the normal image with bloom iterations
		bloomBlending.use();
		gl.viewport(0, 0, windowInfo.resolutionWidth, windowInfo.resolutionHeight);

		this.bloomExtractionOutputFramebuffer.textures[0].bind(0); // Normal scene
		// Bloom levels
		for (let i = 0; i < this.bloomLevelsFramebuffers.length; i++) {
			this.bloomLevelsFramebuffers[i].textures[0].bind(i + 1);
		}

		this.bindFramebuffers();
		this.screenQuad.draw(false);

		gl.enable(gl.DEPTH_TEST);
	}
}
