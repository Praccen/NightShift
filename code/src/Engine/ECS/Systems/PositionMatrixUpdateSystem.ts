import System from "./System";
import { ComponentTypeEnum } from "../Components/Component";
import PositionComponent from "../Components/PositionComponent";
import { mat4 } from "gl-matrix";

export default class PositionMatrixUpdateSystem extends System {
	constructor() {
		super([ComponentTypeEnum.POSITION]);
	}

	update(dt: number) {
		for (const e of this.entities) {
			// TODO: Add locic for position parent if that is ever needed. Or redo the whole position parent thing because it is not very nice to work with.

			let posComp = <PositionComponent>(
				e.getComponent(ComponentTypeEnum.POSITION)
			);

			mat4.identity(posComp.matrix);
			posComp.calculateMatrix(posComp.matrix);
		}
	}
}
