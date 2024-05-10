import { vec2 } from "gl-matrix";
import Div from "../Div";
import GuiObject from "../GuiObject";

export default class EditText extends GuiObject {
	position: vec2;
	textSize: number;

	private inputNode: HTMLInputElement;
	private label: HTMLLabelElement;
	private onChangeFn: any;

	constructor(parentDiv?: Div) {
		super(parentDiv);
		this.position = vec2.create();
		this.textSize = 42;

		// make an input node and a label node
		this.inputNode = document.createElement("input");
		this.inputNode.type = "text";

		this.label = document.createElement("label");
		this.label.textContent = this.textString;

		this.div.appendChild(this.label);
		this.div.appendChild(this.inputNode);
	}

	getElement(): HTMLDivElement {
		return this.div;
	}

	getInputElement(): HTMLInputElement {
		return this.inputNode;
	}

	onChange(fn: any) {
		this.onChangeFn = fn;
		this.inputNode.addEventListener("change", this.onChangeFn);
	}

	remove() {
		if (this.onChangeFn != undefined) {
			this.inputNode.removeEventListener("change", this.onChangeFn);
		}
		super.remove();
	}

	draw() {
		this.position2D = this.position;
		this.fontSize = this.textSize;
		this.label.textContent = this.textString;
		this.drawObject();
	}
}
