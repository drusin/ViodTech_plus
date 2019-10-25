export const PLAYER_TILESET_KEY = 'chara';
import constants from '../constants.js';

export default class Player {
	constructor(scene) {
        this.sprite = scene.physics.add.sprite(constants.START_X, constants.START_Y, PLAYER_TILESET_KEY);
        this.sprite.setSize(16, 16);
        this.createAnimations(scene);
        this.cursorkeys = scene.input.keyboard.addKeys("W,A,S,D,LEFT,UP,RIGHT,DOWN,SPACE,ENTER");
        this.dialogs = scene.Dialog;
        this.scene = scene;
        this.game = scene.game;
        this.wearsSpaceSuit = false;
    }

    createAnimations(scene) {
        scene.anims.create({
            key: 'walking',
            frames: scene.anims.generateFrameNumbers(PLAYER_TILESET_KEY, { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1
        });
        scene.anims.create({
            key: 'putOnSpaceSuit',
            frames: scene.anims.generateFrameNumbers(PLAYER_TILESET_KEY, { start: 8, end: 11 }),
            frameRate: 2,
            repeat: 0
        });
        scene.anims.create({
            key: 'walkingInSpaceSuit',
            frames: scene.anims.generateFrameNumbers(PLAYER_TILESET_KEY, { start: 12, end: 15 }),
            frameRate: 3,
            repeat: 0
        });
        scene.anims.create({
            key: 'standing',
            frames: scene.anims.generateFrameNumbers(PLAYER_TILESET_KEY, { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1
        });
        scene.anims.create({
            key: 'standingInSpaceSuit',
            frames: scene.anims.generateFrameNumbers(PLAYER_TILESET_KEY, { start: 12, end: 12 }),
            frameRate: 1,
            repeat: -1
        });
    }

    _updateAnimation() {
        if (this.sprite.body.velocity.x != 0 || this.sprite.body.velocity.y != 0) {
            if (this.wearsSpaceSuit) {
                this.sprite.anims.play('walkingInSpaceSuit', true);
            }
            else {
                this.sprite.anims.play('walking', true);
            }

            // rotate sprite according to body and correct different rotation systems
            this.sprite.rotation = this.sprite.body.angle + Math.PI / 2;
        }
        else {
            if (this.wearsSpaceSuit) {
                this.sprite.anims.play('standingInSpaceSuit', true);
            }
            else {
                this.sprite.anims.play('standing', true);
            }
        }
    }

    _updateWalkingSound() {
        const walkingRate = this.wearsSpaceSuit ? 1.0 * (constants.spaceSuiteMovementMultiplier + 0.2) : 1.0;

        const tileStandingOn = this.scene.walkableLayer.getTileAtWorldXY(this.sprite.x, this.sprite.y);
        const currentFloorType = tileStandingOn.properties['floorType'];

        if (!this._isMoving(this.sprite.body.velocity)) {
            this.game.globals.sfx.notMoving();
        }
        else {
            this.game.globals.sfx.walking(currentFloorType, walkingRate, this.wearsSpaceSuit);
        }
    }

    _isMoving(velocity) {
        return velocity.x != 0 || velocity.y != 0;
    }

    update() {
        this._updateAnimation();
        // this.scene.playerSpotlight.setFloat1('tx', this.sprite.x / this.scene.game.config.width);
        // this.scene.playerSpotlight.setFloat1('ty', 1 - this.sprite.y / this.scene.game.config.height);
        let numbers = [0.5, 0.5, 0, 0, 0, 1, 1, 0, 1, 1];
        this.scene.playerSpotlight.setFloat2v('pos', new Float32Array(numbers));
        // this.scene.playerSpotlight.setFloat1('ty', new Float32Array([0.5]));
    }
}