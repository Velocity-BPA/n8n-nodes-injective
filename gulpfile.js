const gulp = require('gulp');
const rename = require('gulp-rename');

gulp.task('build:icons', function () {
  return gulp
    .src('nodes/**/*.svg')
    .pipe(rename({ dirname: '' }))
    .pipe(gulp.dest('dist/nodes/Injective'));
});

gulp.task('default', gulp.series('build:icons'));
