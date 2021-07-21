import { getColor, getOpacity } from '../../state';
import {  keyRegex, keyToXY } from '../common';

export function updateHighlights(shapes: Element, board: Element): void {
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

function createNewHighlightContainer(board: Element): HTMLDivElement {
    const div = document.createElement('div');
    div.classList.add('fancyground-highlights');
    board.insertAdjacentElement('beforeend', div);
    return div;
}

function getCircleKey(circle: Element): string | undefined {
    const hash = circle.getAttribute('cgHash');
    if (!hash) return;
    const key = hash.match(keyRegex);
    if (key.length === 0) return;
    return key[0];
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

function createTransform(key: string, flip: boolean): string {
    const { x, y } = keyToXY(key, flip);
    return `translate(${100 * x}%,${100 * y}%)`;
}
