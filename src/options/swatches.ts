import { ColorName } from '../defaults';

export class Swatches {
    private readonly container: HTMLElement;
    private _activeColorName: ColorName = 'arrow_color_1';

    onSwitchActiveColor: (colorName: ColorName, color: string) => void;

    constructor(container: HTMLElement) {
        this.container = container;

        for (let i = 0; i < this.container.children.length; i++) {
            const swatch = this.container.children[i] as HTMLElement;
            swatch.addEventListener('click', () => {
                this.switchActiveColor(swatch.dataset.name as ColorName, true);
            });
        }
    }

    get activeColorName(): ColorName {
        return this._activeColorName;
    }

    setColors(colors: { [s: string]: string }): void {
        for (let i = 0; i < this.container.children.length; i++) {
            const swatch = this.container.children[i] as HTMLElement;
            swatch.style.background = colors[swatch.dataset.name];
        }
    }

    /** Set the value of the active color and return it's colorName */
    setColor(color: string): ColorName {
        const activeSwatches = this.container.getElementsByClassName('active');
        if (activeSwatches.length !== 1) return;
        const swatch = activeSwatches[0] as HTMLElement;
        swatch.style.background = color;
        return swatch.dataset.name as ColorName;
    }

    /** Change which color is the active color */
    switchActiveColor(colorName: ColorName, propagate?: true): void {
        this._activeColorName = colorName;
        let activeColor: string | undefined;
        for (let i = 0; i < this.container.children.length; i++) {
            const swatch = this.container.children[i] as HTMLElement;
            if (swatch.dataset.name === colorName) {
                swatch.classList.add('active');
                activeColor = getComputedStyle(swatch).backgroundColor;
            } else {
                swatch.classList.remove('active');
            }
        }
        if (this.onSwitchActiveColor && propagate && activeColor) {
            this.onSwitchActiveColor(colorName, activeColor);
        }
    }
}
