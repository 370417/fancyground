import { ColorName, defaults, Num, Shape } from './defaults';

const colors: {
    [K in ColorName]: string | [string, number]
} = defaults;

export function initColors(newColors: { [s: string]: string }): void {
    Object.assign(colors, newColors);
    for (const colorName in newColors) {
        colors[colorName as ColorName] = splitAlpha(newColors[colorName]);
    }
}

// Get the custom color that corresponds to the normal shape color on lichess
export function getColor(shape: Shape, colorNum: Num): string {
    const colorName: ColorName = `${shape}_color_${colorNum}`;
    const colorField = colors[colorName];
    if (typeof colorField === 'string') return colorField;
    else return colorField[0];
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

// We can allow users to specify opacity using a transparent color instead of
// needing to support a separate opacity setting. This simplifies the settings
// page but doesn't quite work with arrows because the arrow's line and arrowhead
// are two separate elements. When they are translucent, they don't combine well
// together. To deal with this, we extract the alpha out from the color, and
// we use an opaque color + opacity.
// This function turns a translucent color into [opaque color, opacity] where
// opacity ranges from 0 to 1.
function splitAlpha(color: string): [string, number] {
    const div = document.createElement('div');
    div.style.color = color;
    // at least in firefox, the div needs to be in the dom for getComputedStyle to work
    document.body.insertAdjacentElement('beforeend', div);
    // convert color to rgb or rgba
    const rgbColor = getComputedStyle(div).color;
    document.body.removeChild(div);
    // bail if the conversion didn't work as expected
    if (rgbColor.slice(0, 3) !== 'rgb') return [color, 1];
    const sections = rgbColor.split(',');
    // if color has no alpha component
    if (sections.length == 3) return [color, 1];
    const alpha = Number(sections[3].match(/[\d.]+/)[0]);
    // erase the alpha in the color string
    sections.splice(3, 1);
    sections[2] += ')';
    const opaqueColor = sections.join(',');
    // get rid of errant letter a
    if (opaqueColor.charAt(3) === 'a') opaqueColor.slice(0, 3) + opaqueColor.slice(4);
    return [opaqueColor, alpha];
}
