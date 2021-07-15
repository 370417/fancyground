import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [
    {
        input: 'js/index.js',
        output: {
            file: 'bundled/index.js',
            format: 'iife',
        },
        plugins: [commonjs(), nodeResolve()],
    },
    {
        input: 'js/options.js',
        output: {
            file: 'bundled/options.js',
            format: 'iife',
        },
        plugins: [commonjs(), nodeResolve()],
    },
];
