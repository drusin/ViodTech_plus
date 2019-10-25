import { Scene } from 'phaser';

import mapJson from './assets/ship.json';
import tiles from './assets/Tiles.png';
import player_acting from './assets/Dave acting.png'
import daveLying from './assets/Dave-lying.png'
import critter_eating from './assets/Critter.png'
import door from './assets/door.png'
import assets from './assets/Assets.png'
import lever from './assets/lever.png'
import lights from './assets/Lights.png'
import furniture from './assets/Furniture.png'
import bigAssets from './assets/Big-assets.png'
import smallAssets from './assets/Small-assets.png'
import AnimatedTiles from 'phaser-animated-tiles/dist/AnimatedTiles.min.js';

import { PLAYER_TILESET_KEY } from './entities/player.js';
import { CRITTER_KEY } from './entities/critter.js';
import Player from './entities/player.js';
import Critter from './entities/critter.js';

import dialog from './dialog/dialog.js';

import stateMachine from './stateMachine.js';

import constants from './constants.js';

import lightmap_bedroom_dark from './assets/Lights/bedroom-dark.png';
import lightmap_bedroom_emergency from './assets/Lights/bedroom-emergency.png';
import lightmap_all_emergency from './assets/Lights/all-emergency.png';
import lightmap_full_lights_no_pipe from './assets/Lights/full-lights-pipe-broken.png';
import lightmap_full_lights from './assets/Lights/full-lights.png';

import { runInThisContext } from 'vm';
import SpotlightPipeline from "./shaders/spotlightPipeline";

export default class GameScene extends Scene {
	constructor() {
		super({ key: GameScene.KEY });
		this.playerCollider = null;
	}
	
	static get KEY() {
		return 'game-scene'
	}

	preload() {
		this.load.image('tiles', tiles);
		this.load.tilemapTiledJSON('map', mapJson);
		this.load.spritesheet(PLAYER_TILESET_KEY,
			player_acting,
			{ frameWidth: 32, frameHeight: 32 }
		);
		this.load.spritesheet(CRITTER_KEY,
			critter_eating,
			{ frameWidth: 16, frameHeight: 16 }
		);
		this.load.spritesheet('assets',
			assets,
			{ frameWidth: 16, frameHeight: 16 }
		);
		this.load.spritesheet('door',
			door,
			{ frameWidth: 16, frameHeight: 32 }
		);
		this.load.spritesheet('lever',
			lever,
			{ frameWidth: 16, frameHeight: 16 }
		);
		this.load.spritesheet('lights',
			lights,
			{ frameWidth: 16, frameHeight: 16 }
		);
		this.load.spritesheet('smallAssets',
			smallAssets,
			{ frameWidth: 16, frameHeight: 16 }
		);
		this.load.spritesheet('bigAssets',
			bigAssets,
			{ frameWidth: 16, frameHeight: 16 }
		);
		this.load.spritesheet('furniture',
			furniture,
			{ frameWidth: 16, frameHeight: 16 }
		);
		this.load.scenePlugin('animatedTiles', AnimatedTiles, 'animatedTiles', 'animatedTiles');
		
		this.load.image('bedroom-dark', lightmap_bedroom_dark);
		this.load.image('bedroom-emergency', lightmap_bedroom_emergency);
		this.load.image('all-emergency', lightmap_all_emergency);
		this.load.image('full-lights-pipe-broken', lightmap_full_lights_no_pipe);
		this.load.image('full-lights', lightmap_full_lights);

		this.load.image('dave-lying', daveLying);

        this.game.globals.sfx.createSounds(this.sound);
	}

	initializeObjects(tilemap) {
		this.speechTriggers = this.physics.add.group();
		this.doorTriggers = this.physics.add.group();
		this.levers = this.physics.add.group();
		this.audioAreas = this.physics.add.group();

		this.autoTriggers = this.physics.add.group();
		this.physics.add.overlap(this.player.sprite, this.autoTriggers, (left, right) => {
			const trigger = left === this.player.sprite ? right : left;
			dialog.show(trigger.getData("action"));
			trigger.destroy();
		})

		const commonSpritePostProcessing = (sprite, obj) => {
			sprite.setDisplaySize(obj.width, obj.height);
			sprite.setOrigin(0, 0);
			sprite.name = obj.name;
			// copy custom properties
			if (obj.properties) {
				obj.properties.forEach(prop => {
					sprite.setData(prop.name, prop.value);
				});
			}
		}

		const objectsLayer1 = tilemap.getObjectLayer('objects').objects;
		const objectsLayer2 = tilemap.getObjectLayer('otherObjects').objects;
		const objects = objectsLayer1.concat(objectsLayer2)
		objects.forEach(obj => {
			if (obj.type === "door-trigger") {
				const sprite = this.physics.add.sprite(obj.x, obj.y, null);
				commonSpritePostProcessing(sprite, obj);
				sprite.depth = -10;
				this.doorTriggers.add(sprite);
			}
			else if (obj.type === "speech-trigger") {
				const sprite = this.physics.add.sprite(obj.x, obj.y, null);
				commonSpritePostProcessing(sprite, obj);
				sprite.depth = -10;
				sprite.getData('automatic') ? this.autoTriggers.add(sprite) : this.speechTriggers.add(sprite);
			}
			else if (obj.type === "lever") {
				// a freaking 8 year old bug in tiled drove me mad…
				// https://github.com/bjorn/tiled/issues/91
				const posY = obj.gid ? obj.y - obj.height : obj.y;
				const sprite = this.physics.add.sprite(obj.x, posY, 'lever');
				commonSpritePostProcessing(sprite, obj);
				this.levers.add(sprite);
			}
		});
		
		tilemap.getObjectLayer('soundAreas').objects.forEach(obj => {
			if (obj.type === "audio-area") {
				const sprite = this.physics.add.sprite(obj.x, obj.y, null);
				commonSpritePostProcessing(sprite, obj);
				sprite.depth = -10;
				this.audioAreas.add(sprite);
			}
		});
	}
	
	create() {
		this.physics.world.TILE_BIAS = 8;
		this.physics.world.OVERLAP_BIAS = 1; // we don't want to automatically resolve overlaps
		
		const map = this.make.tilemap({ key: 'map' });
		const tileset = map.addTilesetImage('Tiles', 'tiles');
		const animatedTileset = map.addTilesetImage('Assets', 'assets');
		const lightsTileset = map.addTilesetImage('Lights', 'lights');
		const doorTileset = map.addTilesetImage('door');
		const furnitureTileset = map.addTilesetImage('Furniture', 'furniture');
		const smallAssetsTileset = map.addTilesetImage('Small-assets', 'smallAssets');
		const bigAssetsTileset = map.addTilesetImage('Big-assets', 'bigAssets');

		this.walkableLayer = map.createStaticLayer('floor', tileset, 0, 0);
		
		const wallLayer = map.createStaticLayer('walls', tileset, 0, 0);
		wallLayer.setCollisionBetween(1, 999);
		const furnitureLayer = map.createStaticLayer('furniture', furnitureTileset, 0, 0);
		furnitureLayer.setCollisionBetween(1, 999);

		this.doorLayer = map.createDynamicLayer('doors', doorTileset, 0, 0);
		this.doorLayer.setCollisionByProperty({ closed: true });
		this.animatedLayer = map.createDynamicLayer('animated', animatedTileset, 0, 0);
		this.animatedLayer.setCollisionBetween(1, 999);
		this.lampLayer = map.createDynamicLayer('lamps', lightsTileset, 0, 0);
		this.smallAssetsLayer = map.createDynamicLayer('small-assets', smallAssetsTileset, 0, 0);
		this.bigAssetsLayer = map.createDynamicLayer('big-assets', bigAssetsTileset, 0, 0);
		this.brokenPipesLayer = map.createDynamicLayer('broken-pipes', animatedTileset, 0, 0);
		this.generatorsOffLayer = map.createDynamicLayer('generators-off', animatedTileset, 0, 0);
		this.generatorBrokenLayer = map.createDynamicLayer('generator-broken', animatedTileset, 0, 0);
		this.generatorBrokenLayer.visible = false;
		this.ducttapeGoneLayer = map.createDynamicLayer('ducttape-gone', furnitureTileset, 0, 0);
		this.ducttapeGoneLayer.visible = false;

		this.emergencyLightsBedroomLayer = map.createDynamicLayer('emergency-lights-bedroom', lightsTileset, 0, 0);
		this.emergencyLightsBedroomLayer.visible = false;

		this.emergencyLightsGeneratorLayer = map.createDynamicLayer('emergency-lights-generator', lightsTileset, 0, 0);
		this.emergencyLightsGeneratorLayer.visible = false;

        this.sys.animatedTiles.init(map);

		this.player = new Player(this);
		this.physics.add.collider(this.player.sprite, wallLayer);
		this.physics.add.collider(this.player.sprite, furnitureLayer);
		this.physics.add.collider(this.player.sprite, this.doorLayer);
		this.physics.add.collider(this.player.sprite, this.animatedLayer);

		this.critter = new Critter(this);
		this.critterCollider = this.physics.add.collider(this.critter.sprite, this.player.sprite, (left, right) => {
			const player = left === this.player.sprite ? left : right;
			player.y = 98;
			player.anims.play('standing', true)
			dialog.show('critter-001');
		});
		this.critter.sprite.visible = false;
		this.critterCollider.active = false;

		this.initializeObjects(map);


		dialog.init(this.Dialog, this, this.player);
		stateMachine.init(this.player);
		this.cameras.main.startFollow(this.player.sprite);
		
		this.setLightmask('bedroom-dark');

		this.daveLying = this.make.sprite({
			key: 'dave-lying',
			x: constants.START_X,
			y: constants.START_Y,
		});
		this.daveLying.scaleX = 0.25;
		this.daveLying.scaleY = 0.25;

		this.player.sprite.visible = false;

		dialog.show('speech-awakening');
		// dialog.show('critter-001');
		// dialog.show('generator-console');
		
		
		this.playerSpotlight = this.game.renderer.addPipeline('PlayerSpotlight', new SpotlightPipeline(this.game));
		this.playerSpotlight.setFloat1('r', 0.05);
		this.playerSpotlight.setFloat2('resolution', this.game.config.width, this.game.config.height);
		// this.playerSpotlight.setFloat2('resolution', this.game.config.width, this.game.config.height);
		this.cameras.main.setRenderToTexture(this.playerSpotlight);
	}

	setLightmask(key) {
		const lightMask = this.make.sprite({
			key: key,
			x: 380,
			y: 220,
			add: false
		});

		lightMask.update = () => {
			lightMask.x = Math.round(32 + this.game.config.width - this.cameras.main.scrollX);
			lightMask.y = Math.round(96 + this.game.config.height - this.cameras.main.scrollY);
		}
		this.lightMask = lightMask;

		// this.cameras.main.setMask(new Phaser.Display.Masks.BitmapMask(this, lightMask));

	}

	update(time, delta) {
		stateMachine.update();
		this.critter.update();
		this.lightMask.update();
	}
}