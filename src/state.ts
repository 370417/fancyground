/**
 * Hold state in memory for content scripts.
 * Options pages should not use this module.
 */

import { ColorName, Defaults, defaults, Num, Shape } from './defaults';

const state = defaults;

export function initState(newState: Defaults): void {
    for (const colorName in defaults) {
        state[colorName as ColorName] = newState[colorName as ColorName];
    }
    state.arrow = newState.arrow;
    state.square = newState.square;
}

// Get the custom color that corresponds to the normal shape color on lichess
export function getColor(shape: Shape, colorNum: Num | 0): string {
    if (colorNum === 0) return '#4a4a4a'; // for gray arrows in analysis
    const colorName: ColorName = `${shape}_color_${colorNum}`;
    return state[colorName];
}

export function getOpacity(shape: Shape): string {
    return state[shape];
}

// Only updates the colors in memory.
// Updating stored colors should be done elsewhere.
export function setColor(shape: Shape, colorNum: Num, color: string): void {
    const colorName: ColorName = `${shape}_color_${colorNum}`;
    state[colorName] = color;
}

export function setOpacity(shape: Shape, opacity: string): void {
    state[shape] = opacity;
}
