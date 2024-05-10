import { vec2 } from "gl-matrix";
import Div from "./Div";
import GuiObject from "./GuiObject";

export default class Checkbox extends GuiObject {
	position: vec2;
	textSize: number;

	private inputNode: HTMLInputElement;
	private label: HTMLLabelElement;

	constructor(parentDiv?: Div) {
		super(parentDiv);
		this.position = vec2.create();
		this.textSize = 42;

		// make an input node and a label node
		let container = document.createElement("label");
		container.className = "checkboxContainer";

		this.label = document.createElement("label");

		this.inputNode = document.createElement("input");
		this.inputNode.type = "checkbox";

		let checkmarkNode = document.createElement("span");
		checkmarkNode.className = "checkmark";

		container.appendChild(this.label);
		container.appendChild(this.inputNode);
		container.appendChild(checkmarkNode);

		this.div.appendChild(container);
	}

	getElement(): HTMLDivElement {
		return this.div;
	}

	getInputElement(): HTMLInputElement {
		return this.inputNode;
	}

	getChecked(): boolean {
		return this.inputNode.checked;
	}

	draw() {
		this.position2D = this.position;
		this.fontSize = this.textSize;
		this.label.textContent = this.textString;
		this.drawObject();
	}
}
