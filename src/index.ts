import { browser, Runtime } from 'webextension-polyfill-ts';
import { defaults, Num } from './defaults';
import { ColorMessage } from './message';
import { updateArrowColor, updateArrows } from './render/arrows/render';
import { updateHighlightColor, updateHighlights } from './render/highlights/render';
import { initColors, setColor } from './state';

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

function shapeCallback(
    shapes: Element,
    board: Element,
    prefix: string,
    listener: PortListener,
    openPorts: Set<Runtime.Port>,
): MutationCallback {
    return (_, observer) => {
        if (!document.body.contains(board)) {
            observer.disconnect();
            openPorts.forEach(port => port.onMessage.removeListener(listener));
            openPorts.clear();
            return;
        }
        updateHighlights(shapes, board);
        updateArrows(shapes, board, prefix);
    };
}

let uniqueCounter = 0;

function watchChessground(cgContainer: Element) {
    // create a unique prefix to avoid conflicts between multiple chessgrounds
    const prefix = `board${uniqueCounter}_`;
    uniqueCounter += 1;

    const shapes = cgContainer.getElementsByClassName('cg-shapes');
    const board = cgContainer.getElementsByTagName('cg-board');
    if (!shapes.length || !board.length) return;

    const openPorts = new Set<Runtime.Port>();

    const listener = portListener(board[0]);
    const callback = shapeCallback(shapes[0], board[0], prefix, listener, openPorts);

    browser.runtime.onConnect.addListener(port => {
        port.onMessage.addListener(listener);
        openPorts.add(port);
        port.onDisconnect.addListener(port => {
            port.onMessage.removeListener(listener);
            openPorts.delete(port);
        });
    });

    const observer = new MutationObserver(callback);
    observer.observe(shapes[0], {
        childList: true,
        subtree: true,
    });
    callback([], observer);
}

type PortListener = (message: ColorMessage) => void;

// Listen to color changes from options.html
function portListener(board: Element): PortListener {
    return (message: ColorMessage) => {
        if (message.colorName.startsWith('square')) {
            const colorNum = Number(message.colorName.slice(-1)) as Num;
            setColor('square', colorNum, message.color);
            updateHighlightColor(board, colorNum, message.color);
        } else if (message.colorName.startsWith('arrow')) {
            const colorNum = Number(message.colorName.slice(-1)) as Num;
            setColor('arrow', colorNum, message.color);
            updateArrowColor(board, colorNum, message.color);
        }
    };
}
