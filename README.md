![Fancyground logo](images/promo.png)

Fancyground is a browser extension that changes the appearance of arrows and circles on [lichess.org](https://lichess.org/).

- Highlight entire squares instead of drawing circles
- Customize arrow and highlight colors
- Arrows no longer cover the pieces that they originate from

Fancyground is available at the **[Chome web store](https://chrome.google.com/webstore/detail/fancyground/emmjdpamcocnkljijkbdlihffabahgjd)** or at **[Firefox add-ons](https://addons.mozilla.org/en-US/firefox/addon/fancyground/)**.

Stock Lichess on the left, Fancyground on the right:

![Fancyground vs stock Lichess comparison](images/comparison.png)

## Drawing arrows with different colors

On Lichess, right click and drag to draw arrows.
Hold shift and/or alt as you draw to change the arrow's color.
Right click in place to highlight squares.

With Firefox, use control instead of shift
because shift right click forces the context menu to appear.

## Building

```bash
npm install
npm run build
```

Generated javascript will be in the `bundled/` folder.
HTML and CSS is in `static/`.

Versions used:
- npm: 7.4.3
- node: v15.7.0

Optional: Madge (generating the module dependency graph) requires graphviz.

### Zipping

The chrome branch strips Firefox-specific features from the manifest and uses manifest version 3 instead of 2.
To package the extension, run the following command:

```bash
zip -r -X -FS "fancyground.zip" bundled static icons manifest.json -x "*.DS_Store"
```

`-x .DS_Store` exists to deal with macOS's hidden files.

## License

The source code for Fancyground is licensed under [GNU GPLv3](LICENSE.txt) or any later version.

The Fancyground icon is licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). It uses maestro chess pieces made by sadsnake1.

The font used in the logo is Crimson Pro licenced under OFL-1.1. That doesn't require attribution, but it's getting some anyway.
