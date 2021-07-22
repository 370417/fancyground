import { lichessColors, Num } from '../../../defaults';
import { getColor } from '../../../state';
import { keyToXY } from '../../common';

export function createDefs(prefix: string): SVGDefsElement {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    for (let num = 1; num <= lichessColors.length; num++) {
        const marker = createMarker(num as Num, prefix);
        defs.insertAdjacentElement('beforeend', marker);
    }
    return defs;
}

export function capId(prefix: string, colorNum: Num): string {
    return `${prefix}arrowhead${colorNum}`;
}

export function getCap(prefix: string, colorNum: Num): string {
    return `url(#${capId(prefix, colorNum)})`;
}

function createMarker(colorNum: Num, prefix: string): SVGMarkerElement {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttributeNS(null, 'd', 'M0,0 V4 L3,2 Z');
    path.setAttributeNS(null, 'fill', getColor('arrow', colorNum));
    path.dataset.colorNum = `${colorNum}`;

    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttributeNS(null, 'id', capId(prefix, colorNum));
    marker.setAttributeNS(null, 'orient', 'auto');
    marker.setAttributeNS(null, 'markerWidth', '4');
    marker.setAttributeNS(null, 'markerHeight', '8');
    marker.setAttributeNS(null, 'refX', '2.05');
    marker.setAttributeNS(null, 'refY', '2.01');
    marker.insertAdjacentElement('beforeend', path);

    return marker;
}

/// Returns the id of the mask if there is a piece to make a mask out of
export function createMask(key: string, flip: boolean, prefix: string, board: Element, defs: SVGDefsElement): string {
    const imageUrl = getPieceImageUrl(key, flip, board);
    if (!imageUrl) return;
    defs.insertAdjacentElement('afterbegin', createFilter(prefix));
    const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
    mask.setAttributeNS(null, 'maskUnits', 'userSpaceOnUse');
    mask.setAttributeNS(null, 'x', '-0.5');
    mask.setAttributeNS(null, 'y', '-0.5');
    mask.setAttributeNS(null, 'width', '8');
    mask.setAttributeNS(null, 'height', '8');
    mask.id = prefix + key;
    mask.insertAdjacentElement('beforeend', createGround());
    mask.insertAdjacentElement('beforeend', createImage(imageUrl, key, flip, prefix));
    defs.insertAdjacentElement('afterbegin', mask);
    return prefix + key;
}

/// Make sure to strip the url('...') because this is going into href="...", not into mask="...".
function getPieceImageUrl(key: string, flip: boolean, board: Element): string | undefined {
    const width = board.getBoundingClientRect().width;
    const piece: HTMLElement = board.querySelector(`piece[style="${createPxTransform(key, flip, width)}"]`);
    if (!piece) return;
    const backgroundImage = getComputedStyle(piece).backgroundImage;
    const split = backgroundImage.split(/['"]/g);
    if (split.length < 2) return;
    return split[1];
}

const toBlackMatrix = `
0 0 0 0 0
0 0 0 0 0
0 0 0 0 0
0 0 0 1 0`;

/// Filter piece images so they are all black
function createFilter(prefix: string): SVGFilterElement {
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttributeNS(null, 'id', prefix + 'toBlack');
    const matrixFilter = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
    matrixFilter.setAttributeNS(null, 'values', toBlackMatrix);
    matrixFilter.setAttributeNS(null, 'type', 'matrix');
    filter.insertAdjacentElement('beforeend', matrixFilter);
    return filter;
}

/// To make a mask that shows everything except a piece, we need a white backdrop
/// that covers the entire viewport
function createGround(): SVGRectElement {
    const ground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    ground.setAttributeNS(null, 'fill', '#fff');
    ground.setAttributeNS(null, 'x', '-0.5');
    ground.setAttributeNS(null, 'y', '-0.5');
    ground.setAttributeNS(null, 'width', '8');
    ground.setAttributeNS(null, 'height', '8');
    return ground;
}

function createImage(url: string, key: string, flip: boolean, prefix: string): SVGImageElement {
    const { x, y } = keyToXY(key, flip);
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttributeNS(null, 'href', url);
    image.setAttributeNS(null, 'width', '1');
    image.setAttributeNS(null, 'height', '1');
    image.setAttributeNS(null, 'filter', `url(#${prefix}toBlack)`);
    // subtract 0.5 so that the corner of the image is in the corner and not
    // in the center of the square
    image.setAttributeNS(null, 'x', `${x - 0.5}`);
    image.setAttributeNS(null, 'y', `${y - 0.5}`);
    return image;
}

function createPxTransform(key: string, flip: boolean, boardSize: number): string {
    let { x, y } = keyToXY(key, flip);
    x *= boardSize / 8;
    y *= boardSize / 8;
    if (!y) return `transform: translate(${x}px);`;
    else return `transform: translate(${x}px, ${y}px);`;
}
