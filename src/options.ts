import { browser, Runtime } from 'webextension-polyfill-ts';
import { Picker } from './options/color-picker';
import { defaults, ColorName } from './defaults';
import { ColorMessage } from './message';
import { Swatches } from './options/swatches';

let port: Runtime.Port | undefined;

function saveColor(colorName: ColorName, color: string) {
    browser.storage.sync.set({
        [colorName]: color,
    }).then(undefined, console.error);
}

// Send updated color info to content scripts.
// This is separate from saveColors because we want to call it more often.
function sendColor(colorName: ColorName, color: string) {
    const message: ColorMessage = { color, colorName };
    port?.postMessage(message);
}

// document.querySelectorAll('input').forEach(input => {
//     const colorName = input.closest('label').dataset.colorName as ColorName;
//     input.addEventListener('input', () => {
//         if (CSS.supports('color', input.value)) {
//             input.setCustomValidity('');
//             if (!saveColors) return;
//             sendColor(colorName, input.value);
//             saveColor(colorName, input.value);
//         } else {
//             input.setCustomValidity('Invalid color');
//         }
//     });
// });

document.getElementsByTagName('button')[0].addEventListener('click', () => {
    swatches.setColors(defaults);

    // easy way to rerender picker
    swatches.switchActiveColor(swatches.activeColorName, true);

    for (const colorName in defaults) {
        sendColor(colorName as ColorName, defaults[colorName as ColorName]);
        saveColor(colorName as ColorName, defaults[colorName as ColorName]);
    }
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

const picker = new Picker(
    document.getElementsByTagName('canvas')[0],
    document.getElementById('thumb'),
    document.getElementById('slider'),
    document.querySelector('#slider svg'),
);

const swatches = new Swatches(
    document.getElementById('swatches'),
);

picker.onRender = color => {
    const colorName = swatches.setColor(color);
    sendColor(colorName, color);
};

picker.saveColor = color => {
    saveColor(swatches.activeColorName, color);
};

swatches.onSwitchActiveColor = (colorName: ColorName, color: string) => {
    picker.setColorRgbStr(color);
};

function restoreColors() {
    browser.storage.sync.get(defaults).then(colors => {
        swatches.setColors(colors);
        swatches.switchActiveColor('arrow_color_1', true);
    }, console.error);
}
