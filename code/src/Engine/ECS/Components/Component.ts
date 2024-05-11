import ObjectPlacer from "../../../Game/ObjectPlacer";
import Div from "../../Rendering/GUI/Objects/Div";
import EditText from "../../Rendering/GUI/Objects/Text/EditText";
import { OverlayRendering } from "../../Rendering/GUI/OverlayRendering";
import { input } from "../../../Game/GameMachine";
import Checkbox from "../../Rendering/GUI/Objects/Checkbox";

export enum ComponentTypeEnum {
	BOUNDINGBOX,
	CAMERAFOCUS,
	COLLISION,
	GRAPHICS,
	MESHCOLLISION,
	MOVEMENT,
	PARTICLESPAWNER,
	POINTLIGHT,
	POSITION,
	POSITIONPARENT,
}

export class Component {
	private _type: ComponentTypeEnum;

	constructor(type: ComponentTypeEnum) {
		this._type = type;
	}

	destructor(): void {}

	get type(): ComponentTypeEnum {
		return this._type;
	}

	updateGui(overlayRendering: OverlayRendering, parentDiv: Div, objectPlacer: ObjectPlacer) {}

	protected addTextEdit(
		overlayRendering: OverlayRendering,
		div: Div,
		label: string,
		variable: string[],
		index?: number
	) {
		let propEditText = overlayRendering.getNewEditText(div);
		propEditText.textString = label;
		propEditText.textSize = 20;
		propEditText.scaleWithWindow = true;

		let object = this;
		for (let step of variable) {
			object = object[step];
			if (object == undefined) {
				return;
			}
		}

		if (index == undefined) {
			propEditText.getInputElement().value = object.toString();
		} else {
			propEditText.getInputElement().value = object[index].toString();
		}
	}

	protected addCheckbox(
		overlayRendering: OverlayRendering,
		div: Div,
		label: string,
		variable: string[],
		index?: number
	) {
		let propCheckbox = overlayRendering.getNewCheckbox(div);
		propCheckbox.textString = label;
		propCheckbox.textSize = 20;
		propCheckbox.scaleWithWindow = true;

		let object = this;
		for (let step of variable) {
			object = object[step];
			if (object == undefined) {
				return;
			}
		}

		if (index == undefined) {
			propCheckbox.getInputElement().checked = Boolean(object);
		} else {
			propCheckbox.getInputElement().checked = Boolean(object[index]);
		}
	}

	protected updateTextEdit(div: Div, label: string, variable: string[], index?: number) {
		for (let child of div.children) {
			if (child.textString == label) {
				if ((<EditText>child).getInputElement() != document.activeElement) {
					let object = this;
					for (let step of variable) {
						object = object[step];
						if (object == undefined) {
							return;
						}
					}

					if (index == undefined) {
						(<EditText>child).getInputElement().value = object.toString();
					} else {
						(<EditText>child).getInputElement().value = object[index].toString();
					}
				} else {
					let val: any = parseFloat((<EditText>child).getInputElement().value);
					if (input.mouseRightClicked) {
						let mouseChange = input.mousePosition.x - input.mousePosition.previousX;
						input.mousePosition.previousX = input.mousePosition.x;
						if (input.keys["SHIFT"]) {
							val += mouseChange * 0.01;
						} else {
							val += mouseChange * 0.1;
						}
						val = Math.round(val * 100) / 100;
						(<EditText>child).getInputElement().value = val.toString();
					}

					let object = this;
					let prev = null;
					for (let step of variable) {
						prev = object;
						object = object[step];
						if (object == undefined) {
							return;
						}
					}

					if (index == undefined && typeof object == "number") {
						prev[variable[variable.length - 1]] = val;
					} else {
						if (typeof object[index] == "number") {
							object[index] = val;
						}
					}
				}
			}
		}
	}

	protected updateCheckbox(div: Div, label: string, variable: string[], index?: number) {
		for (let child of div.children) {
			if (child.textString == label) {
				if ((<Checkbox>child).getInputElement() != document.activeElement) {
					let object = this;
					for (let step of variable) {
						object = object[step];
						if (object == undefined) {
							return;
						}
					}

					if (index == undefined) {
						(<Checkbox>child).getInputElement().checked = Boolean(object);
					} else {
						(<Checkbox>child).getInputElement().checked = Boolean(object[index]);
					}
				} else {
					let val: any = (<Checkbox>child).getInputElement().checked;
					let object = this;
					let prev = null;
					for (let step of variable) {
						prev = object;
						object = object[step];
						if (object == undefined) {
							return;
						}
					}

					if (index == undefined && typeof object == "boolean") {
						prev[variable[variable.length - 1]] = val;
					} else {
						if (typeof object[index] == "boolean") {
							object[index] = val;
						}
					}
				}
			}
		}
	}
}
