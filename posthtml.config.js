const { getPosthtmlBemLinter } = require("posthtml-bem-linter");
const { getPosthtmlW3cValidator } = require("posthtml-w3c-validator");
const minifyHtml = require("htmlnano");

const devMode = process.env.NODE_ENV === "development";

const getSourceName = (filename) =>
  filename.replace(/^.*pages(\\+|\/+)(.*)\.twig$/, "$2").replace(/\\/g, "/");

const plugins = [
  getPosthtmlW3cValidator({
    forceOffline: true,
    getSourceName,
  }),
  getPosthtmlBemLinter({
    getSourceName,
  }),
];

if (!devMode) {
  plugins.push(minifyHtml({ collapseWhitespace: "aggressive" }));
}

module.exports = {
  plugins,
};
