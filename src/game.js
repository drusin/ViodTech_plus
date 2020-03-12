import Phaser from 'phaser';
import GameScene from './GameScene';
import HomeScene from './HomeScene';
import CreditsScene from './CreditsScene';
import Sfx from './sfx';

const config = {
	type: Phaser.AUTO,
	pixelArt: true,
	parent: 'canvas-parent',
	scale: {
		parent: 'phaser',
		mode: Phaser.Scale.FIT,
		width: 320,
		height: 200,
		max: {
			width: 1280,
			height: 800
		}
	},
	physics: {
		default: 'arcade',
		// arcade: { debug: true }
	},
	scene: [HomeScene, GameScene, CreditsScene]
};

const GAME = new Phaser.Game(config);
GAME.globals = { sfx: new Sfx() };

export default GAME;
