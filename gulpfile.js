const gulp = require('gulp')
const babel = require('gulp-babel')

gulp.task('default', (done) => {
  gulp.src('src/index.js')
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(gulp.dest('dist'))
  done()
})
