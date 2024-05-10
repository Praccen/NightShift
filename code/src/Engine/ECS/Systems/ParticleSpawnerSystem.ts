import System from "./System";
import ParticleSpawnerComponent from "../Components/ParticleSpawnerComponent";
import { ComponentTypeEnum } from "../Components/Component";
import PositionComponent from "../Components/PositionComponent";
import { ECSUtils } from "../../Utils/ESCUtils";
import { vec3 } from "gl-matrix";

export default class ParticleSpawnerSystem extends System {
	constructor() {
		super([ComponentTypeEnum.PARTICLESPAWNER]);
	}

	update(dt: number) {
		for (const e of this.entities) {
			let particleComp = <ParticleSpawnerComponent>(
				e.getComponent(ComponentTypeEnum.PARTICLESPAWNER)
			);
			let posComp = <PositionComponent>(
				e.getComponent(ComponentTypeEnum.POSITIONPARENT)
			);
			if (posComp == undefined) {
				posComp = <PositionComponent>e.getComponent(ComponentTypeEnum.POSITION);
			}

			if (particleComp) {
				let currentParticle = Math.floor(
					(particleComp.resetTimer / Math.max(particleComp.lifeTime, 0.00001)) *
						particleComp.particleSpawner.getNumberOfParticles()
				);
				particleComp.resetTimer += dt;
				let endParticle = Math.floor(
					(particleComp.resetTimer / Math.max(particleComp.lifeTime, 0.00001)) *
						particleComp.particleSpawner.getNumberOfParticles()
				);
				for (
					currentParticle;
					currentParticle < endParticle;
					currentParticle++
				) {
					particleComp.particleSpawner.resetParticleStartTime(
						currentParticle %
							particleComp.particleSpawner.getNumberOfParticles()
					);

					if (posComp) {
						particleComp.particleSpawner.setParticleStartPosition(
							currentParticle %
								particleComp.particleSpawner.getNumberOfParticles(),
							vec3.add(
								vec3.create(),
								ECSUtils.CalculatePosition(e),
								particleComp.offset
							)
						);
					}
				}
				if (particleComp.resetTimer > particleComp.lifeTime) {
					particleComp.resetTimer -= particleComp.lifeTime;
				}
			}
		}
	}
}
