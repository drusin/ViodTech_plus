import { Scene } from 'phaser';

import mapJson from './assets/ship.json';
import tiles from './assets/Tiles.png';
import lightmap from './assets/lightmap.png';
import player_acting from './assets/Dave acting.png'
import door from './assets/door.png'
import assets from './assets/Assets.png'
import lever from './assets/lever.png'
import AnimatedTiles from 'phaser-animated-tiles/dist/AnimatedTiles.min.js';

import lightSwitchSound from './assets/sounds/Okt. 06, 830873-light-switch.ogg';
import lightSwitchSoundAlternative from './assets/sounds/Okt. 06, 830873-light-switch-alternative.ogg';

import { PLAYER_TILESET_KEY } from './entities/player.js';
import Player from './entities/player.js';


import dialog from './dialog/dialog.js';

import stateMachine from './stateMachine.js';

export default class GameScene extends Scene {
	constructor() {
		super({ key: GameScene.KEY });
		this.playerCollider = null;
		this.sounds = {};
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
		this.load.spritesheet('assets',
			assets,
			{ frameWidth: 16, frameHeight: 16 }
		);
		this.load.spritesheet('door',
			door,
			{ frameWidth: 16, frameHeight: 16 }
		);
		this.load.spritesheet('lever',
			lever,
			{ frameWidth: 16, frameHeight: 16 }
		);
		this.load.scenePlugin('animatedTiles', AnimatedTiles, 'animatedTiles', 'animatedTiles');
		
<<<<<<< HEAD
		this.load.image('lightmap', lightmap);
=======
		this.load.audio('light-switch-1', lightSwitchSound);
		this.load.audio('light-switch-2', lightSwitchSoundAlternative);
>>>>>>> light switch soundeffect
	}

	initializeObjects(tilemap) {
		this.speechTriggers = this.physics.add.group();
		this.levers = this.physics.add.group();

		tilemap.getObjectLayer('objects').objects.forEach(obj => {
			const commonSpritePostProcessing = (sprite) => {
				sprite.setDisplaySize(obj.width, obj.height);
				sprite.setOrigin(0, 0);
				// copy custom properties
				obj.properties.forEach(prop => {
					sprite.setData(prop.name, prop.value);
				});
			}
			if (obj.name === "trigger") {
				const sprite = this.physics.add.sprite(obj.x, obj.y, null);
				commonSpritePostProcessing(sprite);
				sprite.depth = -10;
				this.speechTriggers.add(sprite);
			}
			else if (obj.name === "lever") {
				// a freaking 8 year old bug in tiled drove me mad…
				// https://github.com/bjorn/tiled/issues/91
				const posY = obj.gid ? obj.y - obj.height : obj.y;
				const sprite = this.physics.add.sprite(obj.x, posY, 'lever');
				commonSpritePostProcessing(sprite);
				this.levers.add(sprite);
			}
		});
	}
	
	create() {
		this.physics.world.TILE_BIAS = 8;
		this.physics.world.OVERLAP_BIAS = 1; // we don't want to automatically resolve overlaps
		
		const map = this.make.tilemap({ key: 'map' });
		const tileset = map.addTilesetImage('Tiles', 'tiles');
		const animatedTileset = map.addTilesetImage('Assets', 'assets');
		const doorTileset = map.addTilesetImage('door');
		const walkableLayer = map.createStaticLayer('floor', tileset, 0, 0);
		const wallLayer = map.createStaticLayer('walls', tileset, 0, 0);
		wallLayer.setCollisionBetween(1, 999);
		this.doorLayer = map.createDynamicLayer('doors', doorTileset, 0, 0);
		this.doorLayer.setCollisionByProperty({ collision: true });
		this.animatedLayer = map.createDynamicLayer('animated', animatedTileset, 0, 0);
		this.animatedLayer.setCollisionBetween(1, 999);

        this.sys.animatedTiles.init(map);

		this.player = new Player(this);
		this.physics.add.collider(this.player.sprite, wallLayer);
		this.physics.add.collider(this.player.sprite, this.doorLayer);
		this.physics.add.collider(this.player.sprite, this.animatedLayer);

		this.initializeObjects(map);

		dialog.init(this.Dialog, this, this.player);
		stateMachine.init(this.player);
		this.cameras.main.startFollow(this.player.sprite);
		const spotlight = this.make.sprite({
			key: 'lightmap',
			x: 380,
			y: 220,
			add: false
		});

		spotlight.update = () => {
			spotlight.x = Math.round(32 + this.game.config.width - this.cameras.main.scrollX);
			spotlight.y = Math.round(96 + this.game.config.height - this.cameras.main.scrollY);
		}

		console.log(this.cameras.main);

		this.spotlight = spotlight;

		console.log(spotlight);
		this.cameras.main.setMask(new Phaser.Display.Masks.BitmapMask(this, spotlight));

		this.sounds.lightSwitchSound = this.sound.add('light-switch-1');
		this.sounds.lightSwitchSoundAlternative = this.sound.add('light-switch-2');
	}

	update(time, delta) {
		stateMachine.update();
		this.player.update();
		this.spotlight.update();
	}
}