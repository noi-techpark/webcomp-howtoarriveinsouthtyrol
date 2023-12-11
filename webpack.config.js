// SPDX-FileCopyrightText: 2021 IDM Südtirol Alto Adige <info@idm-suedtirol.com>
//
// SPDX-License-Identifier: CC0-1.0

const webpack = require('webpack');

const TerserJSPlugin = require('terser-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const isDevelopment = process.env.NODE_ENV !== 'production';
const path = require('path');

module.exports = {
    mode: isDevelopment ? 'development' : 'production',
    entry: {
      widget: './src/js/widget.js'
    },
    output: {
        filename: 'js/[name].js',
        chunkFilename: 'js/[name].js',
    },
    performance: {
        hints: false,
    },
    optimization: {
        // splitChunks: {
        //     cacheGroups: {
        //         commons: {
        //             test: /[\\/]node_modules[\\/]/,
        //             name: 'vendors',
        //             chunks: 'initial',
        //         },
        //     },
        // },
        minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
        minimize: !isDevelopment,
    },
    plugins: [
        new CleanWebpackPlugin(),
        // new MiniCssExtractPlugin({
        //     filename: 'css/[name].css',
        //     chunkFilename: 'css/[id].css',
        // })
    ],
    module: {
        rules: [{
                // test: /\.(sa|sc|c)ss$/,
                // use: [{
                //         loader: MiniCssExtractPlugin.loader,
                //         options: {
                //             hmr: isDevelopment,
                //         },
                //     },
                //     'css-loader',
                //     'sass-loader',
                // ],
                test: /\.(s*)css$/,
                use: [{ loader: 'css-loader' }, { loader: 'sass-loader' }]
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]',
                        outputPath: 'images',
                        esModule: false,
                    },
                }, ],
            },
            // {
            //     test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
            //     use: [{
            //         loader: 'file-loader',
            //         options: {
            //             name: '[name].[ext]',
            //             outputPath: 'fonts/',
            //             publicPath: 'dist/fonts/'
            //         }
            //     }]
            // },
        ],
    },
    devServer: {
        publicPath: '/dist/',
        contentBase: [path.join(__dirname, 'src/views'), path.join(__dirname, 'src')],
        watchContentBase: true,
        compress: true,
        port: 9000,
        writeToDisk: true,
        disableHostCheck: true
    },
};