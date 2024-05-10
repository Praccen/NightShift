import ObjectPlacer from "../../../Game/ObjectPlacer";
import Div from "../../Rendering/GUI/Objects/Div";
import GraphicsBundle from "../../Objects/GraphicsBundle";
import { OverlayRendering } from "../../Rendering/GUI/OverlayRendering";
import { Component, ComponentTypeEnum } from "./Component";
import Game from "../../../Game/States/Game";

export default class GraphicsComponent extends Component {
	bundle: GraphicsBundle;

	constructor(bundle: GraphicsBundle) {
		super(ComponentTypeEnum.GRAPHICS);
		this.bundle = bundle;
	}

	destructor(): void {
		Game.getInstanceNoSa().rendering.scene.deleteGraphicsBundle(this.bundle);
	}

	updateGui(
		overlayRendering: OverlayRendering,
		parentDiv: Div,
		objectPlacer: ObjectPlacer
	) {
		for (let i = 1; i < parentDiv.children.length; i++) {
			if (parentDiv.children[i].textString == ComponentTypeEnum[this.type]) {
				// Next should be a div that should hold the text edits
				if ((<Div>parentDiv.children[i + 1]).children.length == 0) {
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"EmissionR",
						["object", "emissionColor"],
						0
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"EmissionG",
						["object", "emissionColor"],
						1
					);
					this.addTextEdit(
						overlayRendering,
						<Div>parentDiv.children[i + 1],
						"EmissionB",
						["object", "emissionColor"],
						2
					);
				} else {
					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"EmissionR",
						["object", "emissionColor"],
						0
					);
					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"EmissionG",
						["object", "emissionColor"],
						1
					);
					this.updateTextEdit(
						<Div>parentDiv.children[i + 1],
						"EmissionB",
						["object", "emissionColor"],
						2
					);
				}
			}
		}
	}
}
