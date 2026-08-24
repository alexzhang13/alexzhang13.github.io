module.exports = {
  content: ["_site/**/*.html", "_site/**/*.js"],
  css: ["_site/assets/css/*.css"],
  output: "_site/assets/css/",
  skippedContentGlobs: ["_site/assets/**/*.html"],
  // Token classes are assembled at runtime (`'tok-' + cls`) so the default
  // extractor never sees them in HTML. Without this, production highlighting
  // is only half-applied.
  safelist: {
    standard: [/^sptc-/, /^tok-/],
  },
};
