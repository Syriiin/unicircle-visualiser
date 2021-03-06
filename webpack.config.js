const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const FilterChunkWebpackPlugin = require('filter-chunk-webpack-plugin');

module.exports = {
    name: 'standalone',
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            inlineSource: '.js$'
        }),
        new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin),
        new FilterChunkWebpackPlugin({
            patterns: [
                'bundle.js'
            ]
        })
    ]
};
