import { browser } from 'webextension-polyfill-ts';
import { defaults } from './defaults';
import { updateArrows } from './render/arrows/render';
import { updateHighlights } from './render/highlights/render';
import { initColors } from './state';

// Init colors
browser.storage.sync.get(defaults).then(initColors, console.error);

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

const shapeCallback = (shapes: Element, board: Element, prefix: string): MutationCallback => (_, observer) => {
    if (!document.body.contains(board)) {
        observer.disconnect();
        return;
    }
    updateHighlights(shapes, board);
    updateArrows(shapes, board, prefix);
};

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

