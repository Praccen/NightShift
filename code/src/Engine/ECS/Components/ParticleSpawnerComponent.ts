import { vec3 } from "gl-matrix";
import ObjectPlacer from "../../../Game/ObjectPlacer";
import Div from "../../Rendering/GUI/Objects/Div";
import ParticleSpawner from "../../Objects/GraphicsObjects/ParticleSpawner";
import { OverlayRendering } from "../../Rendering/GUI/OverlayRendering";
import { Component, ComponentTypeEnum } from "./Component";

export default class ParticleSpawnerComponent extends Component {
	lifeTime: number;
	resetTimer: number;
	particleSpawner: ParticleSpawner;
	offset: vec3;

	constructor(particleSpawner: ParticleSpawner) {
		super(ComponentTypeEnum.PARTICLESPAWNER);

		this.lifeTime = 1.0;
		this.resetTimer = 0.0;
		this.particleSpawner = particleSpawner;
		this.offset = vec3.create();
	}

	addToGui(
		overlayRendering: OverlayRendering,
		parentDiv: Div,
		objectPlacer: ObjectPlacer
	) {
		let addTextEdit = (label: string, vec: vec3, index: number) => {
			let propEditText = overlayRendering.getNewEditText(parentDiv);
			propEditText.textString = label;
			propEditText.textSize = 20;
			propEditText.scaleWithWindow = true;
			propEditText.getInputElement().value = vec[index].toString();
			propEditText.onChange((ev) => {
				vec[index] = parseFloat(propEditText.getInputElement().value);
			});
			objectPlacer.makeCheckpoint();
		};

		addTextEdit("OffsetX", this.offset, 0);
		addTextEdit("OffsetY", this.offset, 1);
		addTextEdit("OffsetZ", this.offset, 2);
	}

	destructor(): void {
		this.particleSpawner.setNumParticles(0);
	}
}
