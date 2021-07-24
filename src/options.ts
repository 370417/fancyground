import { browser, Runtime } from 'webextension-polyfill-ts';
import { Picker } from './options/color-picker';
import { defaults, ColorName, Shape } from './defaults';
import { Message } from './message';
import { Swatches } from './options/swatches';

let port: Runtime.Port | undefined;

function saveColor(colorName: ColorName, color: string) {
    browser.storage.sync.set({
        [colorName]: color,
    }).catch(console.error);
}

function saveOpacity(shape: Shape, opacity: string) {
    browser.storage.sync.set({
        [shape]: opacity,
    }).catch(console.error);
}

// Send updated color info to content scripts.
// This is separate from saveColor because we want to call it more often.
// We call sendColor on mousemove and we only call saveColor on mouseup.
function sendColor(colorName: ColorName, color: string) {
    const message: Message = { property: 'color', color, colorName };
    port?.postMessage(message);
}

function sendOpacity(shape: Shape, opacity: string) {
    const message: Message = { property: 'opacity', shape, opacity };
    port?.postMessage(message);
}

const colorInput = document.getElementById('color-input') as HTMLInputElement;
const opacityInput = document.getElementById('opacity-input') as HTMLInputElement;

colorInput.addEventListener('input', function() {
    const color = this.value || defaults[swatches.activeColorName];
    if (CSS.supports('color', color)) {
        sendColor(swatches.activeColorName, color);
        saveColor(swatches.activeColorName, color);
        // easy way to rerender swatch and picker
        swatches.setColor(this.value);
        swatches.switchActiveColor(swatches.activeColorName, true);
    }
});

opacityInput.addEventListener('input', function() {
    const shape = swatches.activeShape;
    const opacity = this.value || defaults[shape];
    if (CSS.supports('opacity', opacity)) {
        sendOpacity(shape, opacity);
        saveOpacity(shape, opacity);
        swatches.setOpacity(opacity);
    }
});

restoreState();

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
    swatches.setColor(color);
    sendColor(swatches.activeColorName, color);
    colorInput.value = color;
};

picker.saveColor = color => {
    saveColor(swatches.activeColorName, color);
};

swatches.onSwitchActiveColor = (colorRgb: string, originalColor: string, opacity: string) => {
    picker.setColorRgbStr(colorRgb);
    colorInput.value = originalColor;
    colorInput.placeholder = defaults[swatches.activeColorName];
    opacityInput.value = opacity;
    opacityInput.placeholder = defaults[swatches.activeShape];
};

function restoreState() {
    browser.storage.sync.get(defaults).then(state => {
        swatches.setColorsAndOpacities(state);
        swatches.switchActiveColor('arrow_color_1', true);
        colorInput.value = state[swatches.activeColorName];
        opacityInput.value = state[swatches.activeShape];
    }, console.error);
}
