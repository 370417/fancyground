import { ColorName, defaults, Shape } from '../defaults';

export class Swatches {
    private readonly container: HTMLElement;
    private originalColors = new Map<ColorName, string>();
    private opacities = new Map<Shape, string>();
    private _activeColorName: ColorName = 'arrow_color_1';

    /**
     * colorRgb is the new color's value in string rgb form.
     * originalColor is the same color but in it's original string form.
     */
    onSwitchActiveColor: (colorRgb: string, originalColor: string, opacity: string) => void;

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

    get activeShape(): Shape {
        if (this._activeColorName.startsWith('square')) return 'square';
        else return 'arrow';
    }

    setColorsAndOpacities(state: { [s: string]: string }): void {
        for (let i = 0; i < this.container.children.length; i++) {
            const swatch = this.container.children[i] as HTMLElement;
            const color = state[swatch.dataset.name];
            swatch.style.background = color;
            this.originalColors.set(swatch.dataset.name as ColorName, color);
        }
        this.opacities.set('square', state.square);
        this.opacities.set('arrow', state.arrow);
    }

    /** Set the value of the active color. It can be empty string to set the default color */
    setColor(color: string): void {
        const activeSwatches = this.container.getElementsByClassName('active');
        if (activeSwatches.length !== 1) return;
        const swatch = activeSwatches[0] as HTMLElement;
        this.originalColors.set(this._activeColorName, color);
        swatch.style.background = color || defaults[this._activeColorName];
    }

    setOpacity(opacity: string): void {
        this.opacities.set(this.activeShape, opacity);
    }

    /** Change which color is the active color */
    switchActiveColor(colorName: ColorName, propagate?: true): void {
        this._activeColorName = colorName;
        let activeColorRgb: string | undefined;
        for (let i = 0; i < this.container.children.length; i++) {
            const swatch = this.container.children[i] as HTMLElement;
            if (swatch.dataset.name === colorName) {
                swatch.classList.add('active');
                activeColorRgb = getComputedStyle(swatch).backgroundColor;
            } else {
                swatch.classList.remove('active');
            }
        }
        if (this.onSwitchActiveColor && propagate && activeColorRgb) {
            this.onSwitchActiveColor(
                activeColorRgb,
                this.originalColors.get(colorName),
                this.opacities.get(this.activeShape),
            );
        }
    }
}
