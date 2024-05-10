import { vec2 } from "gl-matrix";
import Div from "./Div";
import GuiObject from "./GuiObject";

export default class Button extends GuiObject {
	position: vec2;
	textSize: number;

	private inputNode: HTMLInputElement;
	private onClickFunction: any;

	constructor(parentDiv?: Div) {
		super(parentDiv);
		this.position = vec2.create();
		this.textSize = 42;

		// make an input node and a label node
		this.inputNode = document.createElement("input");
		this.inputNode.type = "button";
		this.inputNode.className = "button";

		this.div.appendChild(this.inputNode);
	}

	getElement(): HTMLDivElement {
		return this.div;
	}

	getInputElement(): HTMLInputElement {
		return this.inputNode;
	}

	onClick(fn: any) {
		this.onClickFunction = fn;
		this.inputNode.addEventListener("click", this.onClickFunction);
	}

	remove(): void {
		if (this.onClickFunction != undefined) {
			this.inputNode.removeEventListener("click", this.onClickFunction);
		}
		super.remove();
	}

	draw() {
		this.position2D = this.position;
		this.inputNode.value = this.textString;
		this.fontSize = this.textSize;

		this.drawObject();
	}
}
