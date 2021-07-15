export type Num = 1 | 2 | 3 | 4;
export type Shape = 'square' | 'arrow';

export type ColorName = `${Shape}_color_${Num}`;

export type Defaults = {
    [name in ColorName]: string
};

export const defaults: Defaults = {
    'arrow_color_1': '#15781BD8', // green
    'arrow_color_2': '#C60B0BD8', // red
    'arrow_color_3': '#0080C6D8', // blue
    'arrow_color_4': '#FFC20ED8', // yellow
    'square_color_1': '#E69000AA', // '#97233FAA',
    'square_color_2': '#003088AA', // '#125740AA',
    'square_color_3': '#990018AA', // '#773141AA',
    'square_color_4': '#125740AA', // '#4F2683AA',
};

export const lichessColors = [
    '#15781B',
    '#882020',
    '#003088',
    '#e68f00',
];
