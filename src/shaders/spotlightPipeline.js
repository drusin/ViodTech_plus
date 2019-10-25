import Phaser from 'phaser';

/**
 * to run this:
 * c+p this to GameScene.create:
this.playerSpotlight = this.game.renderer.addPipeline('PlayerSpotlight', new SpotlightPipeline(this.game));
this.playerSpotlight.setFloat1('r', 0.05);
this.playerSpotlight.setFloat2('resolution', this.game.config.width, this.game.config.height);
this.cameras.main.setRenderToTexture(this.playerSpotlight);

 * c+p this to player.update:
this.scene.playerSpotlight.setFloat1('tx', this.sprite.x / this.scene.game.config.width);
this.scene.playerSpotlight.setFloat1('ty', 1 - this.sprite.y / this.scene.game.config.height);
 
 
 promising reading material: https://ncase.me/sight-and-light/
 */

export default class SpotlightPipeline extends Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline {
    constructor(game) {
        super({
            game,
            renderer: game.renderer,
            fragShader: `
                precision mediump float;
                uniform vec2  resolution;
                uniform vec2 pos[1000];
                uniform float r;
                uniform sampler2D uMainSampler;
                varying vec2 outTexCoord;
                vec3 makeCircle(vec2 st, float resolutionRatio, vec3 col){
                    float realPct = 1.0;
                    for (int i = 0; i < 5; i++) {
                        float d = distance(st, vec2(pos[i].x, pos[i].y / resolutionRatio));
                        float pct = smoothstep(r - 0.1, r + 0.1, d);
                        // returnVal = returnVal * vec3(1.0 - pct);
                        realPct = realPct * pct;
                    }
                    // float d = distance(st, center);
                    // float pct = smoothstep(r - 0.1, r + 0.1, d);
                    // return vec3(1.0 - pct) * col;
                    return col * vec3(1.0 - realPct);
                }
                void main(void) {
                    float resolutionRatio = resolution.x / resolution.y; //needed to get circle instead of ellipse
                    
                    vec2 st = vec2(gl_FragCoord.x / (resolution.x), gl_FragCoord.y / (resolution.y * resolutionRatio));
                    vec4 color = texture2D(uMainSampler, outTexCoord);
                    gl_FragColor = color * vec4(makeCircle(st, resolutionRatio, vec3(1.0)), 1.0);
                }
            `
        });
    }
};