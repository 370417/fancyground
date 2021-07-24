type Hsv = {
    /** hue [0, 360] */
    h: number;
    /** saturation [0, 1] */
    s: number;
    /** value [0, 1] */
    v: number;
};

type Rgb = {
    /** red [0, 1] */
    r: number;
    /** green [0, 1] */
    g: number;
    /** blue [0, 1] */
    b: number;
}

function hsvToRgb({ h, s, v}: Hsv): Rgb {
    // Adjust hue to ramp sinusoidally instead of linearly
    h /= 60; // [0, 6]
    const sextantHue = h % 1;
    h += sinEase(sextantHue) - sextantHue;

    // from https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB_alternative
    function f(n: 1 | 3 | 5) {
        const k = (n + h) % 6;
        return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    }

    return {
        r: f(5),
        g: f(3),
        b: f(1),
    };
}

function rgbToHsv({ r, g, b }: Rgb): Hsv {
    const v = Math.max(r, g, b);
    const chroma = v - Math.min(r, g, b);
    let s = 0;
    if (v > 0) s = chroma / v;
    let h = hue({ r, g, b }, v, chroma);
    const sextantHue = h % 1;
    h += invSinEase(sextantHue) - sextantHue;
    h *= 60;
    return { h, s, v };
}

// Returned hue is in the range [0, 6]
function hue({ r, g, b }: Rgb, v: number, chroma: number): number {
    let h = 0;
    if (chroma === 0) h = 0;
    else if (v === r) h = (g - b) / chroma;
    else if (v === g) h = 2 + (b - r) / chroma;
    // else v === b
    else if (v === b) h = 4 + (r - g) / chroma;
    // h can be slightly too small/large here
    h = (h + 6) % 6;
    return h;
}

// Input and output both range in [0, 1]
function sinEase(n: number): number {
    return 0.5 - Math.cos(n * Math.PI) / 2;
}

// Input and output both range in [0, 1]
function invSinEase(n: number): number {
    return Math.acos(1 - 2 * n) / Math.PI;
}

const size = 256;
const buffer = new ArrayBuffer(size * size * 4);

function renderSlice(hue: number, ctx: CanvasRenderingContext2D): void {
    const pixels = new Int32Array(buffer);
    
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const index = row * size + col;
            const hsv = {
                h: hue,
                s: col / (size - 1),
                v: 1 - row / (size - 1),
            };
            const rgb = hsvToRgb(hsv);
            pixels[index] = packRgba(rgb);
        }
    }
    
    const bytes = new Uint8ClampedArray(buffer);
    ctx.putImageData(new ImageData(bytes, size, size), 0, 0);
}

/**
 * Represent an rgb color as four bytes in rgba order (a is always 0xff).
 * 
 * Accounts for native endianness.
 */
const packRgba = (function (): (rgb: Rgb) => number {
    const buffer = new ArrayBuffer(4);
    const bytes = new Uint8Array(buffer);
    const int = new Uint32Array(buffer);
    int[0] = 0xff;
    const isLittleEndian = bytes[0] === 0xff;
    if (isLittleEndian) {
        return (rgb: Rgb): number => (rgb.r * 0xff << 0) | (rgb.g * 0xff << 8) | (rgb.b * 0xff << 16) | 0xff000000;
    } else {
        return (rgb: Rgb): number => (rgb.r * 0xff << 24) | (rgb.g * 0xff << 16) | (rgb.b * 0xff << 8) | 0x000000ff;
    }
})();

const colorPunctuation = /[)(,]/g;

// Turn "rgb(r, g, b)" or "rgba(r, g, b, a)" into an Rgb object
function parseRgb(rgbStr: string): Rgb {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, r, g, b] = rgbStr.split(colorPunctuation);
    return {
        r: Number(r) / 255,
        g: Number(g) / 255,
        b: Number(b) / 255,
    };
}

function rgbToString(rgb: Rgb): string {
    const r = Math.round(rgb.r * 255);
    const g = Math.round(rgb.g * 255);
    const b = Math.round(rgb.b * 255);
    return `rgb(${r}, ${g}, ${b})`;
}

export class Picker {
    private readonly ctx: CanvasRenderingContext2D;
    /** thumb for hue */
    private readonly hThumb: HTMLElement;
    /** thumb for saturation/value */
    private readonly svThumb: HTMLElement;
    private hsv: Hsv = {
        h: 0,
        s: 1,
        v: 1,
    };

    onRender?: (colorStr: string) => void;
    saveColor?: (colorStr: string) => void;

    constructor(
        canvas: HTMLCanvasElement,
        svThumb: HTMLElement,
        slider: HTMLElement,
        hThumb: HTMLElement,
    ) {
        this.ctx = canvas.getContext('2d');
        this.hThumb = hThumb;
        this.svThumb = svThumb;

        // event handling for hue slider

        const readHueFromMouse = ({ clientY }: MouseEvent) => {
            const { height, top } = slider.getBoundingClientRect();
            let y = (clientY - top) / height;
            if (y < 0) y = 0;
            if (y > 1) y = 1;
            this.hsv.h = y * 360;
            this.render(true);
        };
        
        let draggingHue = false;

        slider.addEventListener('mousedown', event => {
            draggingHue = true;
            readHueFromMouse(event);
        });

        window.addEventListener('mousemove', event => {
            if (!draggingHue) return;
            readHueFromMouse(event);
        });

        window.addEventListener('mouseup', () => {
            if (draggingHue && this.saveColor) this.saveColor(rgbToString(hsvToRgb(this.hsv)));
            draggingHue = false;
        });

        // event handling for 2d color slice

        const readSVFromMouse = ({ clientX, clientY }: MouseEvent) => {
            const { width, height, top, left } = canvas.getBoundingClientRect();
            let x = (clientX - left) / width;
            let y = (clientY - top) / height;
            if (x < 0) x = 0;
            if (x > 1) x = 1;
            if (y < 0) y = 0;
            if (y > 1) y = 1;
            this.hsv.s = x;
            this.hsv.v = 1 - y;
            this.render(true);
        };

        let draggingSlice = false;

        // Attach to the parent so that events get caught from the canvas and the thumb
        canvas.parentElement.addEventListener('mousedown', event => {
            draggingSlice = true;
            readSVFromMouse(event);
        });

        window.addEventListener('mousemove', event => {
            if (!draggingSlice) return;
            readSVFromMouse(event);
        });

        window.addEventListener('mouseup', () => {
            if (draggingSlice && this.saveColor) this.saveColor(rgbToString(hsvToRgb(this.hsv)));
            draggingSlice = false;
        });
    }

    setColorRgbStr(rgbStr: string): void {
        const hsv = rgbToHsv(parseRgb(rgbStr));
        this.hsv = hsv;
        this.render();
    }

    private render(propagate?: true): void {
        this.hThumb.style.top = `${-12 + this.hsv.h * 256 / 360}px`;
        renderSlice(this.hsv.h, this.ctx);

        this.svThumb.style.top = `${(1 - this.hsv.v) * 256}px`;
        this.svThumb.style.left = `${this.hsv.s * 256}px`;

        const color = rgbToString(hsvToRgb(this.hsv));
        this.svThumb.style.background = color;
        if (this.hsv.s + (1 - this.hsv.v) < 0.25) {
            this.svThumb.style.borderColor = '#000';
        } else {
            this.svThumb.style.borderColor = '#fff';
        }
        
        if (this.onRender && propagate) {
            this.onRender(color);
        }
    }
}
