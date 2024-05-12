import { gl, windowInfo } from "../../main";
import { options } from "../../Game/GameMachine";
import Framebuffer from "./Framebuffers/Framebuffer";
import Texture from "./Textures/Texture";
import TextureStore from "../AssetHandling/TextureStore";
import Camera from "../Objects/Camera";
import Scene from "./Scene";
import DirectionalShadowRenderPass from "./RenderPasses/ShadowPasses/DirectionalShadowRenderPass";
import CRTRenderPass from "./RenderPasses/PostProcessing/CRTRenderPass";
import BloomRenderPass from "./RenderPasses/PostProcessing/BloomRenderPass";
import SkyboxRenderPass from "./RenderPasses/SkyboxRenderPass";
import GeometryRenderPass from "./RenderPasses/DefferedRendering/GeometryRenderPass";
import LightingRenderPass from "./RenderPasses/DefferedRendering/LightingRenderPass";
import ParticleRenderPass from "./RenderPasses/ParticleRenderPass";
import FinishedOutputRenderPass from "./RenderPasses/FinishedOutputRenderPass";
import PointShadowRenderPass from "./RenderPasses/ShadowPasses/PointShadowRenderPass";
import CubeMap from "./Textures/CubeMap";
import VolumetricGodRayPass from "./RenderPasses/Volumetric/VolumetricGodRayPass";

export default class Rendering {
	// public
	camera: Camera;
	clearColour: { r: number; g: number; b: number; a: number };

	screenCaptureNextFrame: boolean;

	// ---- Post processing toggles ----
	useCrt: boolean;
	useBloom: boolean;
	// ---------------------------------

	// private
	private textureStore: TextureStore;
	private resolutionWidth: number;
	private resolutionHeight: number;

	// ---- Shadows ----
	private directionalShadowRenderPass: DirectionalShadowRenderPass;
	private pointShadowRenderPass: PointShadowRenderPass;
	// -----------------

	// ---- Deferred rendering ----
	private geometryRenderPass: GeometryRenderPass;
	private lightingRenderPass: LightingRenderPass;
	// ----------------------------

	// ---- Particles ----
	private particleFramebuffer: Framebuffer;
	private particleRenderPass: ParticleRenderPass;
	// -------------------

	// ---- Skybox ----
	private useSkybox: boolean;
	private skyboxRenderPass: SkyboxRenderPass;
	// ----------------

	// ---- Volumetric God Rays ----
	private volumetricGodRayPass: VolumetricGodRayPass;
	// -----------------------------

	// ---- Post processing ----
	// Crt effect
	private crtFramebuffer: Framebuffer;
	private crtRenderPass: CRTRenderPass;

	// Bloom
	private bloomExtractionInputFramebuffer: Framebuffer;
	private bloomRenderPass: BloomRenderPass;
	// -------------------------

	// Finished output
	private finishedFramebuffer: Framebuffer;
	private finishedOutputRenderPass: FinishedOutputRenderPass;

	scene: Scene;

	constructor(textureStore: TextureStore, scene: Scene) {
		this.textureStore = textureStore;
		this.scene = scene;

		this.camera = new Camera();
		this.resolutionWidth = windowInfo.resolutionWidth;
		this.resolutionHeight = windowInfo.resolutionHeight;

		// ---- Shadows ----
		this.directionalShadowRenderPass = new DirectionalShadowRenderPass();
		this.pointShadowRenderPass = new PointShadowRenderPass();
		// -----------------

		// ---- Deferred rendering ----
		this.geometryRenderPass = new GeometryRenderPass();

		let textureArray = new Array<Texture>();
		for (let i = 0; i < this.geometryRenderPass.outputFramebuffer.textures.length; i++) {
			textureArray.push(this.geometryRenderPass.outputFramebuffer.textures[i]);
		}
		textureArray.push(this.directionalShadowRenderPass.shadowBuffer.depthTexture);
		this.lightingRenderPass = new LightingRenderPass(textureArray);
		// ----------------------------

		// ---- Particles ----
		this.particleFramebuffer = new Framebuffer(
			this.resolutionWidth,
			this.resolutionHeight,
			[new Texture(false), new Texture(false, gl.R32F, gl.RED, gl.FLOAT)],
			null
		);
		this.particleRenderPass = new ParticleRenderPass(this.particleFramebuffer.textures);
		// -------------------

		// ---- Skybox ----
		this.useSkybox = false;
		this.skyboxRenderPass = new SkyboxRenderPass();
		// ----------------

		// ---- Volumetric God Rays ----
		this.volumetricGodRayPass = new VolumetricGodRayPass(this.directionalShadowRenderPass.shadowBuffer.depthTexture);
		// -----------------------------

		// ---- Post processing ----
		// Crt effect
		this.useCrt = options.useCrt;
		this.crtFramebuffer = new Framebuffer(
			this.resolutionWidth,
			this.resolutionHeight,
			[new Texture(false)],
			null
		);

		this.crtRenderPass = new CRTRenderPass(this.crtFramebuffer.textures);

		// Bloom
		this.bloomExtractionInputFramebuffer = new Framebuffer(
			windowInfo.resolutionWidth,
			windowInfo.resolutionHeight,
			[new Texture(false)],
			null
		);
		this.bloomRenderPass = new BloomRenderPass(this.bloomExtractionInputFramebuffer.textures);
		this.useBloom = options.useBloom;
		// -------------------------¨

		this.finishedFramebuffer = new Framebuffer(
			windowInfo.resolutionWidth,
			windowInfo.resolutionHeight,
			[new Texture(false)],
			null
		);

		this.finishedOutputRenderPass = new FinishedOutputRenderPass(this.finishedFramebuffer.textures);

		this.screenCaptureNextFrame = false;

		this.initGL();
	}

	initGL() {
		this.clearColour = { r: 0.15, g: 0.1, b: 0.1, a: 1.0 };
		gl.clearColor(this.clearColour.r, this.clearColour.g, this.clearColour.b, this.clearColour.a);

		// Enable depth test
		gl.enable(gl.DEPTH_TEST);

		//Enable alpha blending
		// gl.enable(gl.BLEND);
		// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.disable(gl.BLEND);

		// Disable faceculling
		gl.cullFace(gl.BACK);
		gl.disable(gl.CULL_FACE);
	}

	reportCanvasResize(x: number, y: number) {
		this.resolutionWidth = x;
		this.resolutionHeight = y;
		this.geometryRenderPass.setResolution(x, y);
		this.particleFramebuffer.setProportions(x, y);
		this.crtFramebuffer.setProportions(x, y);
		this.finishedFramebuffer.setProportions(x, y);

		this.bloomExtractionInputFramebuffer.setProportions(x, y);
		this.bloomRenderPass.setResolution(x, y);
	}

	setSkybox(path: string) {
		this.skyboxRenderPass.setSkybox(this.textureStore.getCubeMap(path));
		// this.skyboxRenderPass.setSkybox(this.scene.pointLights[0].pointShadowDepthMap);
		this.useSkybox = true;
	}

	private takeScreenshot(screenshotName: string) {
		var offscreenCanvas = document.createElement("canvas");
		offscreenCanvas.width = gl.canvas.width;
		offscreenCanvas.height = gl.canvas.height;
		var ctx = offscreenCanvas.getContext("2d");

		ctx.drawImage(gl.canvas, 0, 0);

		const saveBlob = (function () {
			const a = document.createElement("a");
			document.body.appendChild(a);
			a.style.display = "none";
			return function saveData(blob, fileName) {
				const url = window.URL.createObjectURL(blob);
				a.href = url;
				a.download = fileName;
				a.click();
			};
		})();

		offscreenCanvas.toBlob((blob) => {
			saveBlob(blob, screenshotName);
		});
	}

	draw(saveScreenshot: boolean = false, screenshotName: string = "screencapture") {
		if (
			this.resolutionWidth != windowInfo.resolutionWidth ||
			this.resolutionHeight != windowInfo.resolutionHeight
		) {
			this.reportCanvasResize(windowInfo.resolutionWidth, windowInfo.resolutionHeight);
		}

		gl.enable(gl.DEPTH_TEST);

		// ---- Shadow pass ----
		this.directionalShadowRenderPass.draw(this.scene, this.camera);
		this.pointShadowRenderPass.draw(this.scene);
		// ---------------------

		// ---- Geometry pass ----
		this.geometryRenderPass.draw(this.scene, this.camera);
		// -----------------------

		// Geometry pass over, start rendering to the particle framebuffer
		// this.particleFramebuffer.bind(gl.DRAW_FRAMEBUFFER);
		if (this.useBloom) {
			this.volumetricGodRayPass.outputBuffer =
				this.bloomExtractionInputFramebuffer;
		} else if (this.useCrt) {
			this.volumetricGodRayPass.outputBuffer = this.crtFramebuffer;
		} else {
			this.volumetricGodRayPass.outputBuffer = this.finishedFramebuffer;
		}
		this.volumetricGodRayPass.bindFramebuffers();

		// Clear the output with the actual clear colour we have set
		gl.clearColor(this.clearColour.r, this.clearColour.g, this.clearColour.b, this.clearColour.a);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

		// ---- Lighting pass ----
		this.lightingRenderPass.draw(this.scene, this.camera);
		// -----------------------

		// Copy the depth buffer information from the gBuffer to the current depth buffer
		this.geometryRenderPass.outputFramebuffer.bind(gl.READ_FRAMEBUFFER);
		gl.blitFramebuffer(
			0,
			0,
			this.resolutionWidth,
			this.resolutionHeight,
			0,
			0,
			this.resolutionWidth,
			this.resolutionHeight,
			gl.DEPTH_BUFFER_BIT,
			gl.NEAREST
		);

		// ---- Skybox ----
		if (this.useSkybox) {
			this.skyboxRenderPass.draw(this.camera);
		}
		// ----------------

		// ---- Particles ----
		// this.particleRenderPass.draw(this.scene, this.camera);
		// -------------------

		// ---- Volumetric God Rays ----
		this.volumetricGodRayPass.draw(this.scene, this.camera);
		// -----------------------------

		// ---- Post processing ----
		if (this.useBloom) {
			if (this.useCrt) {
				this.bloomRenderPass.outputFramebuffer = this.crtFramebuffer;
			} else {
				this.bloomRenderPass.outputFramebuffer = null;
			}
			this.bloomRenderPass.draw();
		}

		if (this.useCrt) {
			this.crtRenderPass.draw();
		}
		// -------------------------

		if (!this.useCrt && !this.useBloom) {
			this.finishedOutputRenderPass.draw();
		}

		if (this.screenCaptureNextFrame || saveScreenshot) {
			this.takeScreenshot(screenshotName);
			this.screenCaptureNextFrame = false;
		}
	}
}
