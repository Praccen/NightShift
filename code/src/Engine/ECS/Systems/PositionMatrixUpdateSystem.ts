import System from "./System";
import { ComponentTypeEnum } from "../Components/Component";
import PositionComponent from "../Components/PositionComponent";
import { mat4 } from "gl-matrix";
import PositionParentComponent from "../Components/PositionParentComponent";

export default class PositionMatrixUpdateSystem extends System {
	constructor() {
		super([ComponentTypeEnum.POSITION]);
	}

	update(dt: number) {
		for (const e of this.entities) {
			let posComp = <PositionComponent>e.getComponent(ComponentTypeEnum.POSITION);

			let posParentComp = <PositionParentComponent>e.getComponent(ComponentTypeEnum.POSITIONPARENT);

			if (posComp) {
				mat4.identity(posComp.matrix);

				if (posParentComp) {
					posParentComp.calculateMatrix(posComp.matrix);
					mat4.copy(posParentComp.matrix, posComp.matrix);
				}

				posComp.calculateMatrix(posComp.matrix);
			}
		}
	}
}
