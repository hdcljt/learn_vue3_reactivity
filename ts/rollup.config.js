import ts from 'rollup-plugin-typescript2'

export default {
    input: 'effect.ts',
    output: {
        file: 'lib/effect.js',
        format: 'es'
    },
    plugins: [ts()]
}
