import { _decorator, Component, Enum, EffectAsset, sp, Material, v2, SpriteFrame, Color, color, log, CCClass } from 'cc';
import { DEBUG, EDITOR } from "cc/env";
const { ccclass, property, requireComponent, executeInEditMode, executionOrder } = _decorator;

import { SpineClothesEffectBuilder } from "./SpineClothesEffectBuilder";


const SlotsEnum = {
    'EmptySlot': 0
};

@ccclass('SpineClothesHelper')
class SpineClothesHelper {
	@property({ type: Enum(SlotsEnum) })
	public slotName = SlotsEnum.EmptySlot;
	@property({ type: SpriteFrame })
	public spriteFrame: SpriteFrame = null;
	@property({ visible() { return this.isValid() } })
	public flipHorizontal: boolean = false;
	@property({ visible() { return this.isValid() } })
	public flipVertical: boolean = false;
	@property({ visible() { return this.isValid() } })
	public tint: Color = color(255, 255, 255);

	public isValid(): boolean {
		return this.spriteFrame !== null && this.slotName !== 0;
	}
}

@ccclass('SpineClothesManager')
@requireComponent(sp.Skeleton)
@executeInEditMode
@executionOrder(0)
export class SpineClothesManager extends Component {
	@property({ 
		type: EffectAsset,
		tooltip: 'Effect asset which will be used for skeleton material. Generated automatically when changing the "Clothes" property.'
	})
	public spineEffect: EffectAsset = null;

	@property({
		tooltip: 'Click here if you change skeleton data to update slot list in "Clothes" property.'
	})
	get updateSlotList() {
		return this._updateSlotList;
	}
	set updateSlotList(value: boolean) {
		this._updateSlotList = false;
		this._UPDATE_SLOT_LIST();
	}
	
	@property({ 
		type: [SpineClothesHelper],
		tooltip: 'Clothes settings'
	})
	get clothes() {
		return this._clothes;
	}
	set clothes(value) {
		this._clothes = value;
		this._CREATE_EFFECT_ASSET();
	}

	@property
	private _clothes: SpineClothesHelper[] = [];
	private _material: Material = null;
	private _skeleton: sp.Skeleton = null;
	private _slots: Array<any> = null;
	private _updateSlotList: boolean = false;

	onLoad() {
		this._skeleton = this.getComponent(sp.Skeleton);
		// @ts-ignore
		this._slots = this._skeleton.attachUtil._skeleton.slots;
		
		this._UPDATE_SLOT_LIST();
		this._CREATE_EFFECT_ASSET();
	}

	start() {
		if (!EDITOR) {
			this.wearClothes();
		}
	}

	wearClothes() {
		if (this._skeleton && this.spineEffect) {
			let slotIndex = 0;

			this._material = new Material();
			this._material.initialize({
				effectAsset: this.spineEffect,
				defines: { USE_RGBE_CUBEMAP: true }
			});

			const pass = this._material.passes[0];

			if (this._material.getProperty('resolution') !== undefined) {
				const texture = this._skeleton.skeletonData.textures[0];
				const resolution = v2(texture.width, texture.height);
				pass.setUniform(pass.getHandle('resolution'), resolution);
			}

			this.clothes.filter(config => config.isValid()).forEach(config => {
				const slot = this._slots.find(slot => slot.data.attachmentName === config.slotName);
				if (slot && config.spriteFrame) {
					const region: any = slot.attachment.region;
					if (this._material.getProperty('position_' + slotIndex) !== undefined) {
						const position = v2(region.x, region.y);
						pass.setUniform(pass.getHandle('position_' + slotIndex), position);
					}
					if (this._material.getProperty('size_' + slotIndex) !== undefined) {
						const size = v2(region.width, region.height);
						pass.setUniform(pass.getHandle('size_' + slotIndex), size);
					}
					if (this._material.getProperty('angle_' + slotIndex) !== undefined) {
						const angle = region.degrees;
						pass.setUniform(pass.getHandle('angle_' + slotIndex), angle);
					}
					if (this._material.getProperty('flipHorizontal_' + slotIndex) !== undefined) {
						const flipHorizontal = config.flipHorizontal;
						pass.setUniform(pass.getHandle('flipHorizontal_' + slotIndex), +flipHorizontal);
					}
					if (this._material.getProperty('flipVertical_' + slotIndex) !== undefined) {
						const flipVertical = config.flipVertical;
						pass.setUniform(pass.getHandle('flipVertical_' + slotIndex), +flipVertical);
					}
					if (this._material.getProperty('tint_' + slotIndex) !== undefined) {
						const tint = config.tint;
						pass.setUniform(pass.getHandle('tint_' + slotIndex), tint);
					}
					if (this._material.getProperty('texture_' + slotIndex) !== undefined) {
						const texture = config.spriteFrame.texture;//._texture;
						this._material.setProperty('texture_' + slotIndex, texture);
					}

					slotIndex++;
				} 
			});
					
			this._skeleton.customMaterial = this._material;
		}
	}

	_UPDATE_SLOT_LIST() {
        if (EDITOR && this._slots) {
			const enumList = this._slots.filter(s => s.data.attachmentName !== null).map(s => {
				return {
					name: s.data.attachmentName,
					value: s.data.attachmentName
				}
			});

            CCClass.Attr.setClassAttr(SpineClothesHelper, 'slotName', 'enumList', enumList);

			// clear slotName if new slot list doesn't include it
			this.clothes.forEach((helper: SpineClothesHelper) => {
				const targetSlot = enumList.find(element => element.name === helper.slotName);
				if (!targetSlot) {
					helper.slotName = 0;
				}
			});
        }
    }

	_CREATE_EFFECT_ASSET() {
		SpineClothesEffectBuilder.buildEffectAsset(this.clothes.length, (uuid: string) => {
			if (uuid !== '') {
				const effectAsset = new EffectAsset();
				effectAsset.initDefault(uuid);
				this.spineEffect = effectAsset;
			}
		});
	}
}

