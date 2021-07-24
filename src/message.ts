import { ColorName, Shape } from './defaults';

export type Message = {
    property: 'color',
    colorName: ColorName,
    color: string,
} | {
    property: 'opacity',
    shape: Shape,
    // We model opacity as a string instead of a number because we don't need
    // to manipulate it. To us, it's just an arbitrary css value.
    opacity: string,
};
