import { ReadonlyVec3, quat, vec3 } from "gl-matrix";
import { ComponentTypeEnum } from "../Engine/ECS/Components/Component";
import PositionComponent from "../Engine/ECS/Components/PositionComponent";
import Entity from "../Engine/ECS/Entity";
import Game from "./States/Game";
import BoundingBoxComponent from "../Engine/ECS/Components/BoundingBoxComponent";
import GraphicsComponent from "../Engine/ECS/Components/GraphicsComponent";
import MovementComponent from "../Engine/ECS/Components/MovementComponent";
import CollisionComponent from "../Engine/ECS/Components/CollisionComponent";
import { ECSUtils } from "../Engine/Utils/ESCUtils";
import Ray from "../Engine/Physics/Shapes/Ray";

export default class Spider {
    private game: Game;

    private bodyEntity: Entity;
    private bodyPosComp: PositionComponent;
    private bodyMovComp: MovementComponent;
    private legEntities: Array<Entity>;

    private targetPos: vec3;

    constructor(game: Game) {
        this.game = game;
        this.targetPos = vec3.fromValues(0.0, 10.0, -25.0);
    
        this.bodyEntity = game.ecsManager.createEntity();
        this.bodyPosComp = this.game.ecsManager.addComponent(this.bodyEntity, new PositionComponent()) as PositionComponent;
        vec3.set(this.bodyPosComp.origin, 0.0, -0.5, 0.0);
        vec3.set(this.bodyPosComp.scale, 2.0, 2.0, 4.0);
        let bodyBoundingBoxComp = this.game.ecsManager.addComponent(this.bodyEntity, new BoundingBoxComponent(this.bodyPosComp.matrix)) as BoundingBoxComponent;
        let bodyGraphComp = this.game.ecsManager.addComponent(this.bodyEntity, new GraphicsComponent(this.game.rendering.scene.getNewMesh("Assets/objs/cube.obj", "CSS:rgb(221, 137, 164)", "CSS:rgb(0,0,0)"))) as GraphicsComponent;
        bodyBoundingBoxComp.setup(bodyGraphComp.bundle.graphicsObject);

        this.bodyMovComp = this.game.ecsManager.addComponent(this.bodyEntity, new MovementComponent()) as MovementComponent;
        vec3.zero(this.bodyMovComp.constantAcceleration);
        this.bodyMovComp.drag = 0.0;

        let collisionComp = this.game.ecsManager.addComponent(this.bodyEntity, new CollisionComponent()) as CollisionComponent;
        collisionComp.mass = 100.0;
        collisionComp.isImmovable = true;
    }

    respawn() {
        vec3.set(this.bodyPosComp.position, 0.0, 5.0, -20.0);
        vec3.zero(this.bodyMovComp.velocity);
    }

    setTarget(targetPos: ReadonlyVec3) {
        vec3.copy(this.targetPos, targetPos);
    }

    update(dt: number) {
        if (vec3.squaredDistance(this.targetPos, this.bodyPosComp.position) > 0.1) {
            let top = vec3.add(vec3.create(), this.bodyPosComp.position, vec3.fromValues(0.0, this.bodyPosComp.scale[1], 0.0));
            let dir = vec3.sub(vec3.create(), this.targetPos, this.bodyPosComp.position);
            dir[1] = 0.0;
            vec3.normalize(dir, dir);

            // vec3.scale(this.bodyMovComp.velocity, dir, 30.0);
            
            let collisionObjects = this.game.objectPlacer.getEntitiesOfType("Box || Box Gray");
            let ray = new Ray();
            ray.setStartAndDir(top, vec3.add(vec3.create(), dir, vec3.fromValues(0.0, -1.0, 0.0)));
            let rayResult = ECSUtils.RayCastAgainstEntityList(ray, collisionObjects, 4.0);
            if (rayResult.eId > -1) {
                vec3.scale(this.bodyMovComp.velocity, dir, rayResult.distance * 2.0);
                this.bodyMovComp.velocity[1] += (3.0 - rayResult.distance) * 2.0;
            }
            else {
                // ray.setStartAndDir(vec3.scaleAndAdd(vec3.create(), top, dir, 1.0), vec3.scaleAndAdd(vec3.create(), vec3.fromValues(0.0, -1.0, 0.0), dir, -1.0));
                // let rayResult = ECSUtils.RayCastAgainstEntityList(ray, collisionObjects, 3.0);
                // if (rayResult.eId > -1) {
                //     vec3.scale(this.bodyMovComp.velocity, dir, 3.0 / rayResult.distance);
                //     this.bodyMovComp.velocity[1] -= rayResult.distance;
                // }
                this.bodyMovComp.accelerationDirection[1] = -3.0;
            }
            
		    let yaw = Math.atan2(dir[0], dir[2]);
            let pitch = Math.asin(vec3.normalize(vec3.create(), this.bodyMovComp.velocity)[1]);
            quat.identity(this.bodyPosComp.rotation);
            quat.rotateY(this.bodyPosComp.rotation, this.bodyPosComp.rotation, yaw);
            quat.rotateX(this.bodyPosComp.rotation, this.bodyPosComp.rotation, -pitch);
            // quat.setAxisAngle(this.bodyPosComp.rotation, vec3.fromValues(0.0, 1.0, 0.0), yaw);
        }
        else {
            vec3.zero(this.bodyMovComp.velocity);
        }
       
    }
}