import gulp from "gulp";
import plumber from "gulp-plumber";
import sass from "gulp-dart-sass";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import browser from "browser-sync";
import getData from "gulp-data";
import posthtml from "gulp-posthtml";
import twig from "gulp-twig";
import lintspaces from "gulp-lintspaces";
import stylint from "stylelint";
import postcssReporter from "postcss-reporter";
import scssSyntax from "postcss-scss";
import include from "gulp-include";

const devMode = process.env.NODE_ENV === "development";
const EDITORCONFIG_CHECKS = ["*.{js,json}", "source/**/*.{twig,js,scss,svg}"];

// HTML

const compileHtml = () => {
  return gulp
    .src("source/layouts/pages/**/*.twig")
    .pipe(
      getData(({ path }) => {
        const page = path
          .replace(/^.*pages(\\+|\/+)(.*)\.twig$/, "$2")
          .replace(/\\/g, "/");

        return {
          devMode,
          page,
        };
      })
    )
    .pipe(twig())
    .pipe(posthtml());
};

const buildHtml = () => {
  return compileHtml().pipe(gulp.dest("source"));
};

// Styles

const styles = () => {
  return gulp
    .src("source/sass/style.scss", { sourcemaps: devMode })
    .pipe(plumber())
    .pipe(include())
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(gulp.dest("source/css", { sourcemaps: "." }))
    .pipe(browser.stream());
};

// Lint styles

const lintStyles = () => {
  return gulp.src("source/sass/**/*.scss").pipe(
    postcss(
      [
        stylint(),
        postcssReporter({
          clearAllMessages: true,
          throwError: !devMode,
        }),
      ],
      { syntax: scssSyntax }
    )
  );
};

// Lint editorconfig

const lintEditorconfig = () => {
  return gulp
    .src(EDITORCONFIG_CHECKS)
    .pipe(lintspaces({ editorconfig: ".editorconfig" }))
    .pipe(lintspaces.reporter({ breakOnWarning: !devMode }));
};

// Server

const server = (done) => {
  browser.init({
    server: {
      baseDir: "source",
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
};

// Watcher

const watcher = () => {
  gulp.watch(EDITORCONFIG_CHECKS, lintEditorconfig);
  gulp.watch("source/sass/**/*.sass", gulp.parallel(styles, lintStyles));
  gulp.watch("source/*.html").on("change", browser.reload);
  gulp.watch("source/layouts/**/*.twig", buildHtml);
};

export const lint = gulp.parallel(compileHtml, lintEditorconfig, lintStyles);

export const build = gulp.parallel(
  buildHtml,
  styles,
  lintEditorconfig,
  lintStyles
);

export default gulp.series(build, server, watcher);
