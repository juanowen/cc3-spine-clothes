import { _decorator, Component, Node, sp } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AnimationSwitcher')
export class AnimationSwitcher extends Component {
    private _skeleton: sp.Skeleton = null;
    private _animations: string[] = [];

    start() {
        this._skeleton = this.getComponent(sp.Skeleton);
        if (this._skeleton) {
            const excludeList = ['hit', 'death'];

            // @ts-ignore
            this._animations = Object.keys(this._skeleton._skeletonData._skeletonJson.animations);
            this._animations = this._animations.filter(name => excludeList.indexOf(name) < 0);
            this._startNewAnimation();
        }
    }

    private _startNewAnimation() {
        const rnd = Math.floor(Math.random() * this._animations.length);
        this._skeleton.setAnimation(0, this._animations[rnd], true);

        this.scheduleOnce(() => {
            this._startNewAnimation();
        }, 5);
    }
}


