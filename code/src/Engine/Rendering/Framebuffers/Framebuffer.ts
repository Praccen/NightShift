import { gl } from "../../../main";
import Texture from "../Textures/Texture";

export default class Framebuffer {
	// Public
	textures: Array<Texture>;
	depthTexture: Texture;

	// Protected
	protected rbo: WebGLRenderbuffer;
	protected fbo: WebGLFramebuffer;
	protected width: number;
	protected height: number;

	/**
	 * @param width - width of framebuffer textures
	 * @param height - height of framebuffer textures
	 * @param textures - colour attachment textures, send empty array if no colour attachments should be used
	 * @param depthTexture - depth attachment texture, send null if no depth attachment (an rbo will be created instead)
	 */
	constructor(
		width: number,
		height: number,
		textures: Array<Texture>,
		depthTexture: Texture
	) {
		this.width = width;
		this.height = height;

		this.textures = textures;
		this.depthTexture = depthTexture;

		this.fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

		this.setupAttachments();

		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
			console.warn("ERROR::FRAMEBUFFER:: Framebuffer is not complete!");
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	protected setupAttachments() {
		let attachments = new Array<number>();
		for (let i = 0; i < this.textures.length; i++) {
			this.textures[i].setTextureData(null, this.width, this.height);
			if (this.textures[i].textureTarget == gl.TEXTURE_CUBE_MAP) {
				// This is a cube map, set the positive x as target and rendering loop will take care of switching target to the correct side
				gl.framebufferTexture2D(
					gl.FRAMEBUFFER,
					gl.COLOR_ATTACHMENT0 + i,
					gl.TEXTURE_CUBE_MAP_POSITIVE_X,
					this.textures[i].texture,
					0
				);
				attachments.push(gl.COLOR_ATTACHMENT0 + i);
			} else {
				// This is a normal 2D texture, set TexParameters to something fitting for a framebuffer target, and set up the target.
				this.textures[i].setTexParameterI(gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				this.textures[i].setTexParameterI(gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				this.textures[i].setTexParameterI(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				this.textures[i].setTexParameterI(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.framebufferTexture2D(
					gl.FRAMEBUFFER,
					gl.COLOR_ATTACHMENT0 + i,
					gl.TEXTURE_2D,
					this.textures[i].texture,
					0
				);
				attachments.push(gl.COLOR_ATTACHMENT0 + i);
			}
		}

		// Attach drawing targets
		gl.drawBuffers(attachments);

		if (this.depthTexture != undefined) {
			// There is a defined depth texture, null it's content with the correct width and height
			this.depthTexture.setTextureData(null, this.width, this.height);

			if (this.depthTexture.textureTarget == gl.TEXTURE_CUBE_MAP) {
				// The depth texture is a cube map, set the positive x as target and rendering loop will take care of switching target to the correct side
				gl.framebufferTexture2D(
					gl.FRAMEBUFFER,
					gl.DEPTH_ATTACHMENT,
					gl.TEXTURE_CUBE_MAP_POSITIVE_X,
					this.depthTexture.texture,
					0
				);
			} else {
				// The depth texture is a normal 2D texture, set up the appropriate target
				gl.framebufferTexture2D(
					gl.FRAMEBUFFER,
					gl.DEPTH_ATTACHMENT,
					gl.TEXTURE_2D,
					this.depthTexture.texture,
					0
				);
			}
		} else {
			// We have no defined depth texture, use a render buffer instead
			this.rbo = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, this.rbo);
			gl.renderbufferStorage(
				gl.RENDERBUFFER,
				gl.DEPTH_STENCIL,
				this.width,
				this.height
			);

			gl.framebufferRenderbuffer(
				gl.FRAMEBUFFER,
				gl.DEPTH_STENCIL_ATTACHMENT,
				gl.RENDERBUFFER,
				this.rbo
			);
		}
	}

	/**
	 * Will setup the framebuffer to the given width and height, including resizing (and clearing) all textures (both normal render textures and depth texture)
	 * For cubemaps all sides will be cleared and resized
	 * @param width New width of the framebuffer
	 * @param height New height of the framebuffer
	 */
	setProportions(width: number, height: number) {
		this.width = width;
		this.height = height;
		for (let texture of this.textures) {
			texture.setTextureData(null, this.width, this.height);
		}
		if (this.depthTexture) {
			this.depthTexture.setTextureData(null, this.width, this.height);
		}

		if (this.rbo) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
			gl.bindRenderbuffer(gl.RENDERBUFFER, this.rbo);
			gl.renderbufferStorage(
				gl.RENDERBUFFER,
				gl.DEPTH24_STENCIL8,
				width,
				height
			);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}
	}

	/**
	 * Bind this framebuffer to the sent in target
	 * @param target framebuffer target (for example gl.FRAMEBUFFER, gl.DRAW_FRAMEBUFFER, gl.READ_FRAMEBUFFER)
	 */
	bind(target: number) {
		gl.bindFramebuffer(target, this.fbo);
	}
}
