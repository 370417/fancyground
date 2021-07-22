import { browser, Runtime } from 'webextension-polyfill-ts';
import { defaults, ColorName } from './defaults';
import { ColorMessage } from './message';

let port: Runtime.Port | undefined;

function saveColor(colorName: string, color: string) {
    browser.storage.sync.set({
        [colorName]: color,
    }).then(() => {
        const preview: HTMLElement = document.querySelector(`[data-color-name="${colorName}"] .color-preview`);
        if (!preview) return;
        preview.style.background = color;
    }, console.error);
}

// Whether or not to call saveColor on input events.
// This allows us to turn off saving temporarily so that the initial
// restoreColors call does not waste a redundant write to storage.
let saveColors = true;

function restoreColors() {
    browser.storage.sync.get(defaults).then(colors => {
        saveColors = false;
        for (const colorName in colors) {
            const preview: HTMLElement = document.querySelector(`[data-color-name="${colorName}"] .color-preview`);
            preview.style.background = colors[colorName];
            
            const input = document.querySelector(`[data-color-name="${colorName}"] input`) as HTMLInputElement;
            if (input.value === '') {
                input.value = colors[colorName];
            }
        }
        saveColors = true;
    }, console.error);
}

// Send updated color info to content scripts.
// This is separate from saveColors because we want to call it more often.
function sendColor(colorName: ColorName, color: string) {
    const message: ColorMessage = { color, colorName };
    port?.postMessage(message);
}

document.querySelectorAll('input').forEach(input => {
    const colorName = input.closest('label').dataset.colorName as ColorName;
    input.addEventListener('input', () => {
        if (CSS.supports('color', input.value)) {
            input.setCustomValidity('');
            if (!saveColors) return;
            sendColor(colorName, input.value);
            saveColor(colorName, input.value);
        } else {
            input.setCustomValidity('Invalid color');
        }
    });
});

document.getElementsByTagName('button')[0].addEventListener('click', () => {
    document.querySelectorAll('input').forEach(input => {
        const colorName = input.closest('label').dataset.colorName as ColorName;
        input.value = defaults[colorName];
        input.setCustomValidity('');
        sendColor(colorName, input.value);
        saveColor(colorName, input.value);
    });
});

restoreColors();

// Start sending updates to the current tab
browser.tabs.query({
    active: true,
    currentWindow: true,
}).then(tabs => {
    if (tabs.length === 0) return;
    port = browser.tabs.connect(tabs[0].id);
    port.onDisconnect.addListener(() => port = undefined);
}, console.error);
