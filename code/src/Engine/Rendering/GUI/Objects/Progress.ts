import GuiObject from "./GuiObject";
import Div from "./Div";
import { vec2 } from "gl-matrix";

export default class Progress extends GuiObject {
	position: vec2;
	size: number;

	private progressNode: HTMLProgressElement;

	constructor(parentDiv?: Div) {
		super(parentDiv);

		this.position = vec2.create();
		this.size = 42;

		// make a text node for its content
		this.progressNode = document.createElement("progress");
		this.div.appendChild(this.progressNode);
	}

	getProgressElement(): HTMLProgressElement {
		return this.progressNode;
	}

	draw(): void {
		this.position2D = this.position;
		this.fontSize = this.size;
		this.progressNode.textContent = this.textString;
		this.drawObject();
	}
}
