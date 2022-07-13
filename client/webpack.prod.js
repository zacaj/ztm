// production config
const { merge } = require("webpack-merge");
const { resolve } = require("path");

const commonConfig = require("./webpack.config");

module.exports = merge(commonConfig, {
  mode: "production",
  output: {
    filename: "js/bundle.[contenthash].min.js",
    path: resolve(__dirname, "dist"),
    publicPath: "/ztm/",
  },
  devtool: "source-map",
  externals: {
    react: "React",
    "react-dom": "ReactDOM",
  },
});