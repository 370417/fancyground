export type Num = 1 | 2 | 3 | 4;
export type Shape = 'square' | 'arrow';

export type ColorName = `${Shape}_color_${Num}`;

export type Defaults = {
    [name in ColorName]: string;
} & {
    [K in Shape]: string;
};

export const defaults: Defaults = {
    arrow_color_1: '#15781B', // green
    arrow_color_2: '#C60B0B', // red
    arrow_color_3: '#0080C6', // blue
    arrow_color_4: '#FFC20E', // yellow
    square_color_1: '#E69000',
    square_color_2: '#003088',
    square_color_3: '#990018',
    square_color_4: '#125740',
    arrow: '0.85',
    square: '0.65',
};

export const lichessColors = [
    '#15781B',
    '#882020',
    '#003088',
    '#e68f00',
];

export function getColorNum(lichessColor: string): Num {
    const i = lichessColors.indexOf(lichessColor);
    if (i < 0) return 1;
    else return (i + 1) as Num;
}
