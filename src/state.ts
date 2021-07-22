import { ColorName, defaults, Num, Shape } from './defaults';

const colors: {
    [K in ColorName]: string
} = defaults;

export function initColors(newColors: { [s: string]: string }): void {
    Object.assign(colors, newColors);
    for (const colorName in newColors) {
        colors[colorName as ColorName] = newColors[colorName];
    }
}

// Get the custom color that corresponds to the normal shape color on lichess
export function getColor(shape: Shape, colorNum: Num): string {
    const colorName: ColorName = `${shape}_color_${colorNum}`;
    return colors[colorName];
}

export function getOpacity(shape: Shape, colorNum: Num): number {
    const colorName: ColorName = `${shape}_color_${colorNum}`;
    const colorField = colors[colorName];
    if (typeof colorField === 'string') return 1;
    else return colorField[1];
}

// Only updates the colors in memory.
// Updating stored colors should be done elsewhere.
export function setColor(shape: Shape, colorNum: Num, color: string): void {
    const colorName: ColorName = `${shape}_color_${colorNum}`;
    colors[colorName] = color;
}
