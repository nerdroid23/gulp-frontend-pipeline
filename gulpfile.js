const path = require('path');
const fs = require('fs');
const del = require('del');

const { dest, src, series, parallel, watch, lastRun } = require('gulp');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');
const imagemin = require('gulp-imagemin');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const sourcemaps = require('gulp-sourcemaps');
const data = require('gulp-data');
const nunjucksRender = require('gulp-nunjucks-render');

const PATHS = {
  DIST: './dist/**',
  FONTS: {
    INPUT: './resources/fonts/**/*.{eot,ttf,woff,svg}',
    OUTPUT: './dist/fonts/',
  },
  IMAGES: {
    INPUT: './resources/img/**/*.{png,gif,jpg,jpeg,svg}',
    OUTPUT: './dist/img/',
  },
  STYLES: {
    INPUT: './resources/scss/main.scss',
    OUTPUT: './dist/css/',
  },
  LIB_SCRIPTS: {
    INPUT: './resources/js/lib/*.js',
    OUTPUT: './dist/js/',
  },
  MAIN_SCRIPT: {
    INPUT: './resources/js/main.js',
    OUTPUT: './dist/js/',
  },
  VIEWS: {
    DATA: './resources/views/data/',
    INPUT: './resources/views/*.html',
    OUTPUT: './dist/html/',
    ROOT: './resources/views/',
  },
};

function cleanTask(done) {
  del([
    PATHS.FONTS.OUTPUT + '**/*',
    PATHS.IMAGES.OUTPUT + '**/*',
    PATHS.STYLES.OUTPUT + '**/*',
    PATHS.LIB_SCRIPTS.OUTPUT + '**/*',
    PATHS.VIEWS.OUTPUT + '**/*',
    '!' + PATHS.DIST + '/*.md',
  ]);

  done();
}

function imgTask(done) {
  src(PATHS.IMAGES.INPUT, { since: lastRun(imgTask) })
    .pipe(imagemin())
    .pipe(dest(PATHS.IMAGES.OUTPUT));

  done();
}

function fontsTask(done) {
  src(PATHS.FONTS.INPUT, { allowEmpty: true }).pipe(dest(PATHS.FONTS.OUTPUT));
  done();
}

function cssTask(done) {
  /* set up purgecss here */
  const plugins = [autoprefixer(), cssnano()];

  src(PATHS.STYLES.INPUT)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(concat('app.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(PATHS.STYLES.OUTPUT));

  done();
}

function jsTask(done) {
  src(PATHS.LIB_SCRIPTS.INPUT, { allowEmpty: true })
    .pipe(concat('libs.js'))
    .pipe(dest(PATHS.LIB_SCRIPTS.OUTPUT));

  src(PATHS.MAIN_SCRIPT.INPUT)
    .pipe(sourcemaps.init())
    .pipe(concat('app.js'))
    .pipe(terser())
    .pipe(sourcemaps.write('.'))
    .pipe(dest(PATHS.MAIN_SCRIPT.OUTPUT));

  done();
}

function templateEngineTask(done) {
  const getTemplateData = (file) => {
    return JSON.parse(
      fs.readFileSync(PATHS.VIEWS.DATA + path.basename(file.path) + '.json')
    );
  };

  const getDefaultData = () => {
    return JSON.parse(
      fs.readFileSync(PATHS.VIEWS.DATA + path.basename('default.json'))
    );
  };

  src(PATHS.VIEWS.INPUT)
    .pipe(data(getTemplateData))
    .pipe(data(getDefaultData))
    .pipe(
      nunjucksRender({
        path: [PATHS.VIEWS.ROOT],
      })
    )
    .pipe(dest(PATHS.VIEWS.OUTPUT));

  done();
}

function watchTask() {
  watch(
    [
      PATHS.DATA,
      PATHS.FONTS.INPUT,
      PATHS.IMAGES.INPUT,
      PATHS.LIB_SCRIPTS.INPUT,
      PATHS.MAIN_SCRIPT.INPUT,
      PATHS.STYLES.INPUT,
    ],
    parallel(fontsTask, imgTask, cssTask, jsTask, templateEngineTask)
  );
}

/* set up browsersync */

exports.clean = cleanTask;
exports.css = cssTask;
exports.js = jsTask;
exports.fonts = fontsTask;
exports.template = templateEngineTask;

exports.build = series(
  cleanTask,
  imgTask,
  fontsTask,
  parallel(cssTask, jsTask, templateEngineTask)
);

exports.default = series(
  cleanTask,
  imgTask,
  fontsTask,
  parallel(cssTask, jsTask, templateEngineTask),
  watchTask
);
