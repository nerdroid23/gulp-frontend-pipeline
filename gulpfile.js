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
const browsersync = require('browser-sync').create();
const gulpif = require('gulp-if');
const purgecss = require('@fullhuman/postcss-purgecss');
const stylelint = require('gulp-stylelint');
const eslint = require('gulp-eslint');

let isProd = false;

const activateProd = (done) => {
  isProd = true;
  done();
};

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
  APP_SCRIPTS: {
    INPUT: './resources/js/**/*.js',
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
    `${PATHS.FONTS.OUTPUT}**/*`,
    `${PATHS.IMAGES.OUTPUT}**/*`,
    `${PATHS.STYLES.OUTPUT}**/*`,
    `${PATHS.LIB_SCRIPTS.OUTPUT}**/*`,
    `${PATHS.VIEWS.OUTPUT}**/*`,
    `!${PATHS.DIST}/*.md`,
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
  const plugins = [
    autoprefixer(),
    ...(isProd
      ? [
          cssnano(),
          purgecss({
            content: [`${PATHS.VIEWS.ROOT}**/*.html`],
            keyframes: true,
            whitelistPatterns: [
              /popover/,
              /tooltip/,
              /modal/,
              /fade/,
              /show/,
              /hide/,
              /alert/,
            ],
          }),
        ]
      : []),
  ];

  const stylelintConfig = {
    failAfterError: true,
    fix: true,
    reporters: [{ formatter: 'string', console: true }],
  };

  src(PATHS.STYLES.INPUT)
    .pipe(gulpif(isProd, sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(stylelint(stylelintConfig))
    .pipe(postcss(plugins))
    .pipe(gulpif(isProd, concat('app.min.css')))
    .pipe(gulpif(!isProd, concat('app.css')))
    .pipe(gulpif(isProd, sourcemaps.write('.')))
    .pipe(dest(PATHS.STYLES.OUTPUT));

  done();
}

function jsTask(done) {
  src(PATHS.LIB_SCRIPTS.INPUT, { allowEmpty: true })
    .pipe(concat('libs.js'))
    .pipe(dest(PATHS.LIB_SCRIPTS.OUTPUT));

  src([PATHS.APP_SCRIPTS.INPUT, `!${PATHS.LIB_SCRIPTS.INPUT}`], {
    allowEmpty: true,
  })
    .pipe(gulpif(isProd, sourcemaps.init()))
    .pipe(gulpif(!isProd, concat('app.js')))
    .pipe(gulpif(isProd, concat('app.min.js')))
    .pipe(eslint.format())
    .pipe(eslint.failOnError())
    .pipe(gulpif(isProd, terser()))
    .pipe(gulpif(isProd, sourcemaps.write('.')))
    .pipe(dest(PATHS.APP_SCRIPTS.OUTPUT));

  done();
}

function templateEngineTask(done) {
  const getTemplateData = (file) => {
    const filename = `${path.basename(file.path)}.json`;

    try {
      return JSON.parse(fs.readFileSync(PATHS.VIEWS.DATA + filename));
    } catch (e) {
      //
    }

    return {};
  };

  const getDefaultData = () => {
    return JSON.parse(
      fs.readFileSync(PATHS.VIEWS.DATA + path.basename('default.json')),
    );
  };

  src(PATHS.VIEWS.INPUT)
    .pipe(data(getTemplateData))
    .pipe(data(getDefaultData))
    .pipe(
      nunjucksRender({
        path: [PATHS.VIEWS.ROOT],
      }),
    )
    .pipe(dest(PATHS.VIEWS.OUTPUT));

  done();
}

function browserSyncReload(done) {
  browsersync.reload();
  done();
}

function browserSyncServe(done) {
  const config = {
    open: false,
    server: ['./dist', PATHS.VIEWS.OUTPUT],
    serveStatic: ['./dist', PATHS.VIEWS.OUTPUT],
    serveStaticOptions: {
      extensions: ['html'], // pretty urls
    },
  };

  browsersync.init(config);
  done();
}

function watchTask() {
  watch(
    [
      PATHS.IMAGES.INPUT,
      PATHS.LIB_SCRIPTS.INPUT,
      PATHS.APP_SCRIPTS.INPUT,
      PATHS.STYLES.INPUT,
      `${PATHS.VIEWS.ROOT}**/*.html`,
    ],
    series(imgTask, cssTask, jsTask, templateEngineTask, browserSyncReload),
  );
}

exports.clean = cleanTask;

exports.build = series(
  activateProd,
  cleanTask,
  imgTask,
  fontsTask,
  parallel(cssTask, jsTask, templateEngineTask),
);

exports.default = series(
  cleanTask,
  imgTask,
  fontsTask,
  parallel(cssTask, jsTask, templateEngineTask),
  browserSyncServe,
  watchTask,
);
