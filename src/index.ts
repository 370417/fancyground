import { browser } from 'webextension-polyfill-ts';
import { ColorName, defaults, lichessColors, Num, Shape } from './defaults';

const colors: {
    [K in ColorName]: string | [string, number]
} = defaults;

// Init colors
browser.storage.sync.get(defaults).then(newColors => {
    Object.assign(colors, newColors);
    for (const colorName in newColors) {
        colors[colorName as ColorName] = splitAlpha(newColors[colorName]);
    }
}, console.error);

function getColorNum(lichessColor: string): Num {
    const i = lichessColors.indexOf(lichessColor);
    if (i < 0) return 1;
    else return (i + 1) as Num;
}

// Get the custom color that corresponds to the normal shape color on lichess
function getColor(shape: Shape, lichessColor: string): string {
    const colorName: ColorName = `${shape}_color_${getColorNum(lichessColor)}`;
    const colorField = colors[colorName];
    if (typeof colorField === 'string') return colorField;
    else return colorField[0];
}

function getOpacity(shape: Shape, lichessColor: string): number {
    const colorName: ColorName = `${shape}_color_${getColorNum(lichessColor)}`;
    const colorField = colors[colorName];
    if (typeof colorField === 'string') return 1;
    else return colorField[1];
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
    let opaqueColor = sections.join(',');
    // get rid of errant letter a
    if (opaqueColor.charAt(3) === 'a') opaqueColor.slice(0, 3) + opaqueColor.slice(4);
    return [opaqueColor, alpha];
}

// Keep track of already-found chessground elements
// without leaking memory (hopefully)
const chessgrounds = new WeakSet<Element>();

// Rememeber, this is a live collection.
const cgContainers = document.body.getElementsByTagName('cg-container');

function findNewChessgrounds() {
    for (let i = 0; i < cgContainers.length; i++) {
        const cgContainer = cgContainers[i];
        if (!chessgrounds.has(cgContainer)) {
            chessgrounds.add(cgContainer);
            watchChessground(cgContainer);
        }
    }
}

new MutationObserver(findNewChessgrounds).observe(document.body, {
    childList: true,
    subtree: true,
});

const keyRegex = /[abcdefgh][12345678]/g;

const shapeCallback = (shapes: Element, board: Element, prefix: string): MutationCallback => (_, observer) => {
    if (!document.body.contains(board)) {
        observer.disconnect();
        return;
    }
    updateCircles(shapes, board);
    updateArrows(shapes, board, prefix);
};

function updateCircles(shapes: Element, board: Element) {
    const highlightContainer = board.querySelector('div.fancyground-highlights') || createNewHighlightContainer(board);
    highlightContainer.innerHTML = '';
    const circles = shapes.getElementsByTagName('circle');
    const flip = !!board.closest('.orientation-black');
    for (let i = 0; i < circles.length; i++) {
        const key = getCircleKey(circles[i]);
        if (!key) return;
        const color = circles[i].getAttribute('stroke');
        const translucent = circles[i].getAttribute('opacity') !== '1';
        createHighlight(key, highlightContainer, flip, color, translucent);
    }
}

function updateArrows(shapes: Element, board: Element, prefix: string) {
    const svg = board.querySelector('svg') || createNewSvg(board);
    svg.innerHTML = '';
    svg.insertAdjacentElement('afterbegin', createDefs(prefix));
    const arrows = shapes.getElementsByTagName('line');
    const flip = !!board.closest('.orientation-black');
    for (let i = 0; i < arrows.length; i++) {
        const uci = getArrowUci(arrows[i]);
        const color = arrows[i].getAttribute('stroke');
        const coords = uciToCoords(uci, flip);
        const maskId = createMask(uci.slice(0, 2), flip, prefix, board, svg);
        const arrow = createArrow(shortenTip(coords), svg, getCap(prefix, color), color);
        if (maskId) {
            arrow.setAttributeNS(null, 'mask', `url(#${maskId})`);
        }
    }
}

let uniqueCounter = 0;

function watchChessground(cgContainer: Element) {
    // create a unique prefix to avoid conflicts between multiple chessgrounds
    const prefix = `board${uniqueCounter}_`;
    uniqueCounter += 1;

    const shapes = cgContainer.getElementsByClassName('cg-shapes');
    const board = cgContainer.getElementsByTagName('cg-board');
    if (!shapes.length || !board.length) return;
    const callback = shapeCallback(shapes[0], board[0], prefix);
    const observer = new MutationObserver(callback);
    observer.observe(shapes[0], {
        childList: true,
        subtree: true,
    });
    callback([], observer);
}

function getCircleKey(circle: Element): string | undefined {
    const hash = circle.getAttribute('cgHash');
    if (!hash) return;
    const key = hash.match(keyRegex);
    if (key.length === 0) return;
    return key[0];
}

function getArrowUci(arrow: Element): string | undefined {
    const hash = arrow.getAttribute('cgHash');
    if (!hash) return;
    const keys = hash.match(keyRegex);
    if (keys.length < 2) return;
    return `${keys[0]}${keys[1]}`;
}

function keyToXY(key: string, flip: boolean): { x: number, y: number } {
    const xy = {
        x: 'abcdefgh'.indexOf(key[0]),
        y: '87654321'.indexOf(key[1]),
    };
    if (flip) {
        xy.x = 7 - xy.x;
        xy.y = 7 - xy.y;
    }
    return xy;
}

function createTransform(key: string, flip: boolean): string {
    const { x, y } = keyToXY(key, flip);
    return `translate(${100 * x}%,${100 * y}%)`;
}

function createPxTransform(key: string, flip: boolean, boardSize: number): string {
    let { x, y } = keyToXY(key, flip);
    x *= boardSize / 8;
    y *= boardSize / 8;
    if (!y) return `transform: translate(${x}px);`;
    else return `transform: translate(${x}px, ${y}px);`;
}

type Coords = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
};

function uciToCoords(uci: string, flip: boolean): Coords {
    const { 'x': x1, 'y': y1 } = keyToXY(uci, flip);
    const { 'x': x2, 'y': y2 } = keyToXY(uci.slice(2), flip);
    return { x1, y1, x2, y2 };
}

/// Trim the tip of a coords object so that the arrow doesn't reach
/// all the way to the center of the square. We do this so that multiple
/// arrows pointing to the same square don't overlap in an ugly way.
/// In regular chessground, the trim amount is half as much if an arrow
/// points to a square that no other arrow points to. But here we choose
/// to use this amount of trim for all arrows so that drawing new arrows
/// can't shorten existing arrows.
function shortenTip({ x1, y1, x2, y2 }: Coords): Coords {
    // Treat coords as a vector from tail to tip
    const dx = x2 - x1;
    const dy = y2 - y1;
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    const scale = (magnitude - 160 / 512) / magnitude;
    return {
        x1,
        y1,
        x2: x1 + dx * scale,
        y2: y1 + dy * scale,
    };
}

function createHighlight(key: string, board: Element, flip: boolean, lichessColor: string, translucent: boolean): HTMLElement {
    const highlight = document.createElement('highlight');
    const color = getColor('square', lichessColor);
    let opacity = getOpacity('square', lichessColor);
    if (translucent) opacity *= 0.25;
    highlight.dataset.key = key;
    highlight.style.background = color;
    highlight.style.opacity = `${opacity}`;
    highlight.style.transform = createTransform(key, flip);
    board.insertAdjacentElement('beforeend', highlight);
    return highlight;
}

function createNewHighlightContainer(board: Element): HTMLDivElement {
    const div = document.createElement('div');
    div.classList.add('fancyground-highlights');
    board.insertAdjacentElement('beforeend', div);
    return div;
}

function createNewSvg(board: Element): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('fancyground-arrows')
    svg.setAttribute('viewBox', '-0.5 -0.5 8 8');
    board.insertAdjacentElement('beforeend', svg);
    return svg;
}

function createArrow(coords: Coords, svg: Element, cap: string, lichessColor: string): SVGLineElement {
    const arrow = document.createElementNS('http://www.w3.org/2000/svg','line');
    const color = getColor('arrow', lichessColor);
    const opacity = getOpacity('arrow', lichessColor);
    arrow.setAttributeNS(null, 'x1', `${coords.x1}`);
    arrow.setAttributeNS(null, 'y1', `${coords.y1}`);
    arrow.setAttributeNS(null, 'x2', `${coords.x2}`);
    arrow.setAttributeNS(null, 'y2', `${coords.y2}`);
    arrow.setAttributeNS(null, 'marker-end', cap);
    arrow.setAttributeNS(null, 'stroke', color);
    arrow.setAttributeNS(null, 'opacity', `${opacity}`);
    svg.insertAdjacentElement('beforeend', arrow);
    return arrow;
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

/// Returns the id of the mask if there is a piece to make a mask out of
function createMask(key: string, flip: boolean, prefix: string, board: Element, svg: SVGElement): string {
    const imageUrl = getPieceImageUrl(key, flip, board);
    if (!imageUrl) return;
    svg.insertAdjacentElement('afterbegin', createFilter(prefix));
    const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
    mask.setAttributeNS(null, 'maskUnits', 'userSpaceOnUse');
    mask.setAttributeNS(null, 'x', '-0.5');
    mask.setAttributeNS(null, 'y', '-0.5');
    mask.setAttributeNS(null, 'width', '8');
    mask.setAttributeNS(null, 'height', '8');
    mask.id = prefix + key;
    mask.insertAdjacentElement('beforeend', createGround());
    mask.insertAdjacentElement('beforeend', createImage(imageUrl, key, flip, prefix));
    svg.insertAdjacentElement('afterbegin', mask);
    return prefix + key;
}

function createMarker(lichessColor: string, prefix: string): SVGMarkerElement {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttributeNS(null, 'd', 'M0,0 V4 L3,2 Z');
    path.setAttributeNS(null, 'fill', getColor('arrow', lichessColor));

    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttributeNS(null, 'id', capId(prefix, lichessColor));
    marker.setAttributeNS(null, 'orient', 'auto');
    marker.setAttributeNS(null, 'markerWidth', '4');
    marker.setAttributeNS(null, 'markerHeight', '8');
    marker.setAttributeNS(null, 'refX', '2.05');
    marker.setAttributeNS(null, 'refY', '2.01');
    marker.insertAdjacentElement('beforeend', path);

    return marker;
}

function createDefs(prefix: string): SVGDefsElement {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    lichessColors.forEach(lichessColor => {
        const marker = createMarker(lichessColor, prefix);
        defs.insertAdjacentElement('beforeend', marker);
    });
    return defs;
}

function capId(prefix: string, lichessColor: string): string {
    return `${prefix}arrowhead${getColorNum(lichessColor)}`;
}

function getCap(prefix: string, lichessColor: string): string {
    return `url(#${capId(prefix, lichessColor)})`;
}
