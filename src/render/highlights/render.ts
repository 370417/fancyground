import { getColorNum, Num } from '../../defaults';
import { getColor, getOpacity } from '../../state';
import { keyToXY } from '../common';

export function updateHighlights(shapes: Element, board: Element): void {
    const highlightContainer = board.querySelector('div.fancyground-highlights') || createNewHighlightContainer(board);
    highlightContainer.innerHTML = '';
    const circles = shapes.querySelectorAll('g[cgHash]'); // also includes arrows which later get filtered out
    const flip = !!board.closest('.orientation-black');
    for (let i = 0; i < circles.length; i++) {
        const circleElement = circles[i].querySelector('circle');
        const cgHash = circles[i].getAttribute('cgHash');
        // cgHash format for circles is number,number,square,color
        // where square is algebraic like e4
        // and color is yellow, red, blue, or green
        // Except for circles which are actively being pressed down, in which case the
        // format presumably is number,number,true,square,color
        const cgHashParts = cgHash.split(',').filter(val => val != 'true');
        // Filter out arrows (which should have a length of 5)
        if (cgHashParts.length != 4) continue;
        const key = cgHashParts[2];
        const color = cgHashParts[3];
        const translucent = circleElement.getAttribute('opacity') !== '1';
        createHighlight(key, highlightContainer, flip, color, translucent);
    }
}

export function updateHighlightColor(board: Element, colorNum: Num, newColor: string): void {
    const highlights = board.getElementsByTagName('highlight');
    for (let i = 0; i < highlights.length; i++) {
        const highlight = highlights[i] as HTMLElement;
        if (highlight.dataset.colorNum === `${colorNum}`) {
            highlight.style.background = newColor;
        }
    }
}

export function updateHighlightColorAll(board: Element): void {
    const highlights = board.getElementsByTagName('highlight');
    for (let i = 0; i < highlights.length; i++) {
        const highlight = highlights[i] as HTMLElement;
        const colorNum = Number(highlight.dataset.colorNum) as Num;
        highlight.style.background = getColor('square', colorNum);
    }
}

export function updateHighlightOpacity(board: Element): void {
    const containers = board.getElementsByClassName('fancyground-highlights');
    if (containers.length === 0) return;
    const container = containers[0] as HTMLElement;
    container.style.opacity = getOpacity('square');
}

function createNewHighlightContainer(board: Element): HTMLDivElement {
    const div = document.createElement('div');
    div.classList.add('fancyground-highlights');
    div.style.opacity = getOpacity('square');
    board.insertAdjacentElement('beforeend', div);
    return div;
}

function createHighlight(key: string, board: Element, flip: boolean, lichessColor: string, translucent: boolean): HTMLElement {
    const highlight = document.createElement('highlight');
    const colorNum = getColorNum(lichessColor);
    const color = getColor('square', colorNum);
    let opacity = '1';
    if (translucent) opacity = '0.25';
    highlight.dataset.colorNum = `${colorNum}`;
    highlight.style.background = color;
    highlight.style.opacity = opacity;
    highlight.style.transform = createTransform(key, flip);
    board.insertAdjacentElement('beforeend', highlight);
    return highlight;
}

function createTransform(key: string, flip: boolean): string {
    const { x, y } = keyToXY(key, flip);
    return `translate(${100 * x}%,${100 * y}%)`;
}
