import Phaser from 'phaser';
import GameScene from './GameScene';

const config = {
	type: Phaser.AUTO,
	pixelArt: true,
	parent: 'canvas-parent',
	scale: {
		parent: 'phaser',
		mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
		width: 320,
		height: 200,
		max: {
			width: 1280,
			height: 800
		}
	},
	physics: {
		default: 'arcade',
		arcade: { debug: true }
	},
	scene: [GameScene]
};

new Phaser.Game(config);