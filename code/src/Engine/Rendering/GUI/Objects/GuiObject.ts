import { vec2 } from "gl-matrix";
import { windowInfo } from "../../../../main";
import Div from "./Div";

export default class GuiObject {
	protected position2D: vec2;
	protected fontSize: number;
	scaleWithWindow: boolean;
	textString: string;
	center: boolean;

	removed: boolean;

	private divContainerElement: HTMLElement;
	protected div: HTMLDivElement;

	readonly hasParent: boolean;

	constructor(parentDiv?: Div) {
		this.removed = false;
		this.position2D = vec2.create();
		this.fontSize = 42;
		this.scaleWithWindow = true;
		this.textString = "";
		this.center = false;

		// look up the guicontainer
		this.divContainerElement = <HTMLElement>(
			document.getElementById("guicontainer")
		);

		// make the div
		this.div = document.createElement("div");

		// assign it a CSS class
		this.div.className = "floating-div";

		if (parentDiv != undefined) {
			parentDiv.appendChild(this);
			this.div.style.position = "relative";
			this.hasParent = true;
		} else {
			// add it to the divcontainer
			this.divContainerElement.appendChild(this.div);
			this.hasParent = false;
		}
	}

	getElement(): HTMLDivElement {
		return this.div;
	}

	getHidden(): boolean {
		return this.div.hidden;
	}

	setHidden(hidden: boolean) {
		this.div.hidden = hidden;
	}

	toggleHidden(): boolean {
		this.div.hidden = !this.div.hidden;
		return this.div.hidden;
	}

	remove() {
		this.div.remove();
		this.removed = true;
	}

	protected drawObject() {
		this.div.style.left = this.position2D[0] * 100 + "%";
		this.div.style.top = this.position2D[1] * 100 + "%";
		if (this.scaleWithWindow) {
			this.div.style.fontSize =
				this.fontSize * (windowInfo.resolutionHeight / 1080.0) + "px";
		} else {
			this.div.style.fontSize = this.fontSize + "px";
		}

		if (this.center) {
			this.div.style.transform = "translate(-50%,-50%)";
		}
	}

	draw() {}
}
