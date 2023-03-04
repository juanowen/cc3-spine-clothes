import { _decorator, Component, Node } from 'cc';
import { DEBUG, EDITOR } from "cc/env";
const { ccclass, property } = _decorator;

@ccclass('SpineClothesEffectBuilder')
export class SpineClothesEffectBuilder {
  public static buildEffectAsset(clothesCount: number, callback: Function) {
    if (EDITOR) {
      const plot: string = this._getFilePlot(clothesCount);

      // @ts-ignore
			Editor.Message.request('asset-db', 'query-uuid', 'db://assets/effects').then((uuid: string) => {  
        if (uuid !== '') {
          this._createEffectFile(plot, callback);
        } else {
          this._createEffectFolderAndFile(plot, callback);
        }
			});
		}
  }

  private static _getFilePlot(clothesCount: number): string {
		let effectTemplate = `
CCEffect %{
  techniques:
  - passes:
    - vert: sprite-vs:vert
      frag: sprite-fs:frag
      depthStencilState:
        depthTest: false
        depthWrite: false
      blendState:
        targets:
        - blend: true
          blendSrc: src_alpha
          blendDst: one_minus_src_alpha
          blendDstAlpha: one_minus_src_alpha
      rasterizerState:
        cullMode: none
      properties:
        alphaThreshold: { value: 0.5 }
        resolution: { value: [0., 0.], editor: { visible: false } }

        ##properties##
}%

CCProgram sprite-vs %{
  precision highp float;
  #include <builtin/uniforms/cc-global>
  #include <builtin/uniforms/cc-local>

  in vec3 a_position;
  in vec2 a_texCoord;
  in vec4 a_color;

  out vec4 v_light;
  out vec2 uv0;

  vec4 vert () {
    vec4 pos = vec4(a_position, 1);
    pos = cc_matWorld * pos;
    pos = cc_matViewProj * pos;
    uv0 = a_texCoord;
    v_light = a_color;
    return pos;
  }
}%

CCProgram sprite-fs %{
  precision highp float;
  #include <builtin/internal/alpha-test>

  in vec4 v_light;
  in vec2 uv0;
  #pragma builtin(local)
  layout(set = 2, binding = 11) uniform sampler2D cc_spriteTexture;

  ##samplers##

  uniform Settings {
    ##uniforms##
  };
    
  vec4 frag () {
    vec4 o = vec4(1, 1, 1, 1);
    o *= texture(cc_spriteTexture, uv0);
    o *= v_light;
    
    vec2 absUV = uv0 * resolution;
    vec2 position;
    vec2 size;
    float angle;

    ##processors##

    ALPHA_TEST(o);
    return o;
  }
}%`;

		let properties = '';
		let samplers = '';
		let uniforms = {
			tint: '',
			position: '    vec2 resolution;\n',
			size: '',
			flipHorizontal: '',
			flipVertical: '',
			angle: ''
		};
		let processors = '';

    for (let i = 0; i < clothesCount; i++) {
			properties += `
        position_${i}: { value: [0., 0.], editor: { visible: false } }
        size_${i}: { value: [0., 0.], editor: { visible: false } }
        angle_${i}: { value: 0., editor: { visible: false } }
        flipHorizontal_${i}: { value: 0., editor: { visible: false } }
        flipVertical_${i}: { value: 0., editor: { visible: false } }
        tint_${i}: { value: [1., 1., 1., 1.], editor: { type: color, visible: false} }
        texture_${i}: { value: white, editor: { visible: false } }
				`;
			samplers += `
  uniform sampler2D texture_${i};`;
			uniforms.tint += `
    vec4 tint_${i};`;
			uniforms.position += `
    vec2 position_${i};`;
			uniforms.size += `
    vec2 size_${i};`;
			uniforms.flipHorizontal += `
    float flipHorizontal_${i};`;
			uniforms.flipVertical += `
    float flipVertical_${i};`;
			uniforms.angle += `
    float angle_${i};`;
			processors += `
    position = position_${i};
    size = size_${i};
    angle = angle_${i};

    if (size.x > 0. && size.y > 0.) {
      vec2 rotSize = size;
      if (angle == 90.) { rotSize = vec2(size.y, size.x); }
      vec4 limits = vec4(position.x - 1., position.x + rotSize.x + 1., position.y - 1., position.y + rotSize.y + 1.);

      if (absUV.x >= limits.r && absUV.x <= limits.g && absUV.y >= limits.b && absUV.y <= limits.a) {
        vec2 uv = vec2((absUV.x - position.x) / rotSize.x, (absUV.y - position.y) / rotSize.y);
        if (angle == 90.) {
          uv = vec2(1. - (absUV.y - position.y) / rotSize.y, (absUV.x - position.x) / rotSize.x);
        }

        if (flipHorizontal_${i} == 1.) uv = vec2(1. - uv.x, uv.y);
        if (flipVertical_${i} == 1.) uv = vec2(uv.x, 1. - uv.y);

        vec4 wearColor = texture(texture_${i}, uv) * tint_${i};
        if (o.a == 0. || wearColor.a == 1.) {
          o = wearColor;
        } else if (wearColor.a != 0.) {
          o = mix(o, wearColor, wearColor.a);
        }
      }
    }
`;
		}

		effectTemplate = effectTemplate.replace('##properties##', properties);
		effectTemplate = effectTemplate.replace('##processors##', processors);
		effectTemplate = effectTemplate.replace('##samplers##', samplers);
		// @ts-ignore
		effectTemplate = effectTemplate.replace('##uniforms##', Object.values(uniforms).join('\n'));

    return effectTemplate;
  }

  private static _createEffectFile(plot: string, callback: Function) {
    // @ts-ignore
    Editor.Message.request('asset-db', 'create-asset', 'db://assets/effects/clothesManager.effect', plot, { overwrite: true }).then(data => {  
      // @ts-ignore
      Editor.Message.request('asset-db', 'query-uuid', 'db://assets/effects/clothesManager.effect').then((uuid: string) => {  
        callback instanceof Function && callback(uuid);
      });
    });
  }

  private static _createEffectFolderAndFile(plot: string, callback: Function) {
    // @ts-ignore
    Editor.Message.request('asset-db', 'create-asset', 'db://assets/effects', null, { overwrite: true }).then(data => {  
      this._createEffectFile(plot, callback);
    });
  }
}


