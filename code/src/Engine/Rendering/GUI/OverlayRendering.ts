import Camera from "../../Objects/Camera";
import Button from "./Objects/Button";
import Checkbox from "./Objects/Checkbox";
import Div from "./Objects/Div";
import GuiObject from "./Objects/GuiObject";
import Progress from "./Objects/Progress";
import Slider from "./Objects/Slider";
import EditText from "./Objects/Text/EditText";
import TextObject2D from "./Objects/Text/TextObject2D";
import TextObject3D from "./Objects/Text/TextObject3D";

export class OverlayRendering {
	private camera: Camera; // Optional camera for calculating 3D texts

	// ---- GUI rendering ----
	private guiObjects3D: Array<TextObject3D>;
	private guiObjects2D: Array<GuiObject>;
	// -----------------------

	constructor(camera: Camera = null) {
		this.camera = camera;

		// ---- GUI rendering ----
		this.guiObjects3D = new Array<TextObject3D>();
		this.guiObjects2D = new Array<GuiObject>();
		// -----------------------
	}

	setCamera(camera: Camera) {
		this.camera = camera;
	}

	clear() {
		for (let guiObject2D of this.guiObjects2D) {
			guiObject2D.remove();
		}

		for (let guiObject3D of this.guiObjects3D) {
			guiObject3D.remove();
		}
	}

	hide() {
		for (let guiObject2D of this.guiObjects2D) {
			if (!guiObject2D.hasParent) {
				// Only change top level objects
				guiObject2D.setHidden(true);
			}
		}

		for (let guiObject3D of this.guiObjects3D) {
			guiObject3D.setHidden(true);
		}
	}

	show() {
		for (let guiObject2D of this.guiObjects2D) {
			if (!guiObject2D.hasParent) {
				// Only change top level objects
				guiObject2D.setHidden(false);
			}
		}

		for (let guiObject3D of this.guiObjects3D) {
			guiObject3D.setHidden(false);
		}
	}

	getNew3DText(): TextObject3D {
		const length = this.guiObjects3D.push(new TextObject3D());
		return this.guiObjects3D[length - 1];
	}

	getNew2DText(parentDiv?: Div): TextObject2D {
		const length = this.guiObjects2D.push(new TextObject2D(parentDiv));
		return this.guiObjects2D[length - 1] as TextObject2D;
	}

	getNewCheckbox(parentDiv?: Div): Checkbox {
		const length = this.guiObjects2D.push(new Checkbox(parentDiv));
		return this.guiObjects2D[length - 1] as Checkbox;
	}

	getNewButton(parentDiv?: Div): Button {
		const length = this.guiObjects2D.push(new Button(parentDiv));
		return this.guiObjects2D[length - 1] as Button;
	}

	getNewSlider(parentDiv?: Div): Slider {
		const length = this.guiObjects2D.push(new Slider(parentDiv));
		return this.guiObjects2D[length - 1] as Slider;
	}

	getNewEditText(parentDiv?: Div): EditText {
		const length = this.guiObjects2D.push(new EditText(parentDiv));
		return this.guiObjects2D[length - 1] as EditText;
	}

	getNewProgress(parentDiv?: Div): Progress {
		const length = this.guiObjects2D.push(new Progress(parentDiv));
		return this.guiObjects2D[length - 1] as Progress;
	}

	getNewDiv(parentDiv?: Div): Div {
		const length = this.guiObjects2D.push(new Div(parentDiv));
		return this.guiObjects2D[length - 1] as Div;
	}

	draw() {
		// ---- GUI rendering ----
		if (this.camera != undefined) {
			for (let i = 0; i < this.guiObjects3D.length; i++) {
				if (!this.guiObjects3D[i].removed) {
					this.guiObjects3D[i].draw3D(this.camera.getViewProjMatrix());
				} else {
					this.guiObjects3D.splice(i, 1);
					i--;
				}
			}
		}

		for (let i = 0; i < this.guiObjects2D.length; i++) {
			if (!this.guiObjects2D[i].removed) {
				this.guiObjects2D[i].draw();
			} else {
				this.guiObjects2D.splice(i, 1);
				i--;
			}
		}
		// -----------------------
	}
}
