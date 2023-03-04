import { _decorator, Component, Node, SpriteFrame, Sprite, Color } from 'cc';
const { ccclass, property } = _decorator;
import { SpineClothesManager } from './SpineClothesManager';

@ccclass('SwitchButton')
export class SwitchButton extends Component {
    @property({ type: SpineClothesManager })
    public clothesManager: SpineClothesManager = null;
    @property
    public clothesIndex: number = 0;
    @property({ type: SpriteFrame })
    public spriteFrame: SpriteFrame = null;

    private _isActive: boolean = false;
    private _backRenderSprite: Sprite = null;

    start() {
        this._backRenderSprite = this.getComponentInChildren(Sprite);

        if (this.clothesManager && this.spriteFrame) {
            this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        } else {
            this.node.active = false;
        }
    }
    
    onTouchStart() {
        this._isActive = !this._isActive;

        const helper = this.clothesManager.clothes[this.clothesIndex];
        helper.spriteFrame = this._isActive ? this.spriteFrame : null;
        this.clothesManager.wearClothes();

        if (this._backRenderSprite) {
            this._backRenderSprite.color = this._isActive ? new Color(7, 255, 47) : new Color(163, 9, 126);
            this._backRenderSprite.node.setPosition(0, this._isActive ? 1 : -1); 
            this._backRenderSprite.node.children[0].setPosition(0, this._isActive ? 19 : -19); 
        }
    }
}


