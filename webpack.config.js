const debug = process.env.NODE_ENV !== "production";
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, "src"),
    devtool: debug ? "inline-sourcemap" : false,
    entry: {
        main: "./app/main.js",
        vendor: [
            'react', 'react-dom', 'jquery', 'moment',
            // 'jquery-ui', 'bootstrap',
            'react-bootstrap', 'lodash'
          ]
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use : ['style-loader', 'css-loader']

            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel-loader"
            },
            {
                test: /\.(woff2?|svg)$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        name: 'fonts/[name].[ext]'
                    }
                }]
            },
        ],
    },
    devServer : {
        contentBase: './dist',
        compress: true,
        port: 9002,
        stats: 'errors-only',
        open: true,
        hot: true,
    },
    output: {
        path: path.resolve(__dirname ,"dist"),
        filename: "[name].bundle.js",
        publicPath: '/'
    },
    plugins: [
        new HtmlWebpackPlugin({
            title:'React js',
            template:'./index.html' ,
            minify : {
                collapseWhitespace : false
            },
            hash : true
        }),
        new CopyWebpackPlugin([   
            {from: './index.html'},        
            {from: './assets', to: './assets'},    
          ]),
        new webpack.HotModuleReplacementPlugin(),
    ]
};