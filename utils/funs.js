var mkdirp = require('mkdirp');
var os = require('os');
var fs = require('fs');
var path = require('path');
var readline = require('readline');
var sortedObject = require('sorted-object');
var util = require('util');
/**
 * 
 * 
 * @param {any} from 
 * @param {any} to 
 */
function copy_template(from, to) {
  from = path.join(__dirname, '..', 'templates', from);
  write(to, fs.readFileSync(from, 'utf-8'));
}

/**
 * Create an app name from a directory path, fitting npm naming requirements.
 *
 * @param {String} pathName
 */

function createAppName(pathName) {//去除非法app命名
  return path.basename(pathName)
    .replace(/[^A-Za-z0-9\.()!~*'-]+/g, '-')
    .replace(/^[-_\.]+|-+$/g, '')
    .toLowerCase()
}

/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */

function emptyDirectory(path, fn) {
  fs.readdir(path, function(err, files){
    if (err && 'ENOENT' != err.code) throw err;
    fn(!files || !files.length);
  });
}
/**
 * Load template file.
 */

function loadTemplate(name) {
  return fs.readFileSync(path.join(__dirname, '..', 'templates', name), 'utf-8');//加载文件
}
/**
 * Display a warning similar to how errors are displayed by commander.
 * 控制台警告
 * @param {String} message
 */

function warning(message) {
  console.error()
  message.split('\n').forEach(function (line) {
    console.error('  warning: %s', line)
  })
  console.error()
}

/**
 * echo str > path. 将字符串写到到某个文件里面
 *
 * @param {String} path
 * @param {String} str
 */

function write(path, str, mode) {
  fs.writeFileSync(path, str, { mode: mode || 0666 });
  console.log('   \x1b[36mcreate\x1b[0m : ' + path);
}


/**
 * Mkdir -p.
 * 创建文件夹
 * @param {String} path
 * @param {Function} fn
 */

function mkdir(path, fn) {//创建文件夹
  mkdirp(path, 0755, function(err){
    if (err) throw err;
    console.log('   \033[36mcreate\033[0m : ' + path);
    fn && fn();
  });
}


/**
 * Generate a callback function for commander to warn about renamed option.
 *
 * @param {String} originalName
 * @param {String} newName
 */

function renamedOption(originalName, newName) {
  return function (val) {
    warning(util.format("option `%s' has been renamed to `%s'", originalName, newName))
    return val
  }
}

/**
 * Graceful exit for async STDIO 异步stdio的优雅退出
 */

function exit(code) {
  // flush output for Node.js Windows pipe bug
  // https://github.com/joyent/node/issues/6247 is just one bug example
  // https://github.com/visionmedia/mocha/issues/333 has a good discussion
  function done() {
    if (!(draining--)) _exit(code);
  }

  var draining = 0;
  var streams = [process.stdout, process.stderr];

  exit.exited = true;

  streams.forEach(function(stream){
    // submit empty write request and wait for completion
    draining += 1;
    stream.write('', done);
  });

  done();
}
/**
 * Determine if launched from cmd.exe
 */

function launchedFromCmd() {
  return process.platform === 'win32'
    && process.env._ === undefined;
}

/**
 * Create application at the given directory `path`.
 *
 * @param {String} path
 */

function createApplication(app_name, path,program) {
  var wait = 8; //

  console.log();
  function complete() {
    if (--wait) return;//由于是异步，所以当所有文档写完之后，再进行执行
    var prompt = launchedFromCmd() ? '>' : '$';//如果是win32平台

    console.log();
    console.log('   install dependencies:');
    console.log('     %s cd %s && npm install', prompt, path);
    console.log();
    console.log('   run the app:');

    if (launchedFromCmd()) {
      console.log('     %s SET DEBUG=%s:* & npm start', prompt, app_name);
    } else {
      console.log('     %s DEBUG=%s:* npm start', prompt, app_name);
    }

    console.log();
  }



  // JavaScript 原始文件
  var app = loadTemplate('js/app.js');
  var www = loadTemplate('js/www');
  var index = loadTemplate('js/routes/index.js');
  var users = loadTemplate('js/routes/users.js');

  // CSS
  var css = loadTemplate('css/style.css');
  var less = loadTemplate('css/style.less');
  var stylus = loadTemplate('css/style.styl');
  var compass = loadTemplate('css/style.scss');
  var sass = loadTemplate('css/style.sass');
 
  // CONFIG
  var dbconfig = loadTemplate('config/db.js');
  //loadMVC
  var student = loadTemplate('models/Student.js');
  var studentCtrl = loadTemplate('controllers/studentCtrl.js');
  //MOCK 数据
  var mock = loadTemplate('mock/mock.js');

    ////创建文件夹
  mkdir(path, function(){

    //写mockjs
    write(path + '/mock.js',mock);
   
    //MVC文件夹
    mkdir(path + '/models',function(){
      write(path + '/models/Student.js',student);
      complete();
    });

    mkdir(path + '/controllers',function(){
      write(path + '/controllers/studentCtrl.js',studentCtrl)
      complete();
    });

    //配置文件
    mkdir(path + '/config',function(){
      write(path + '/config/db.js',dbconfig);
      complete();
    });

    //静态文件夹
    mkdir(path + '/public');
    mkdir(path + '/public/javascripts');
    mkdir(path + '/public/images');
    mkdir(path + '/public/stylesheets', function(){
      switch (program.css) {
        case 'less':
          write(path + '/public/stylesheets/style.less', less);
          break;
        case 'stylus':
          write(path + '/public/stylesheets/style.styl', stylus);
          break;
        case 'compass':
          write(path + '/public/stylesheets/style.scss', compass);
          break;
        case 'sass':
          write(path + '/public/stylesheets/style.sass', sass);
          break;
        default:
          write(path + '/public/stylesheets/style.css', css);
      }
      complete();
    });

    mkdir(path + '/routes', function(){
      write(path + '/routes/index.js', index);
      write(path + '/routes/users.js', users);
      complete();
    });

    mkdir(path + '/views', function(){
      switch (program.view) {
        case 'ejs':
          copy_template('ejs/index.ejs', path + '/views/index.ejs');
          copy_template('ejs/error.ejs', path + '/views/error.ejs');
          break;
        case 'jade':
          copy_template('jade/index.jade', path + '/views/index.jade');
          copy_template('jade/layout.jade', path + '/views/layout.jade');
          copy_template('jade/error.jade', path + '/views/error.jade');
          break;
        case 'hjs':
          copy_template('hogan/index.hjs', path + '/views/index.hjs');
          copy_template('hogan/error.hjs', path + '/views/error.hjs');
          break;
        case 'hbs':
          copy_template('hbs/index.hbs', path + '/views/index.hbs');
          copy_template('hbs/layout.hbs', path + '/views/layout.hbs');
          copy_template('hbs/error.hbs', path + '/views/error.hbs');
          break;
        case 'pug':
          copy_template('pug/index.pug', path + '/views/index.pug');
          copy_template('pug/layout.pug', path + '/views/layout.pug');
          copy_template('pug/error.pug', path + '/views/error.pug');
          break;
        case 'twig':
          copy_template('twig/index.twig', path + '/views/index.twig');
          copy_template('twig/layout.twig', path + '/views/layout.twig');
          copy_template('twig/error.twig', path + '/views/error.twig');
          break;
        case 'vash':
          copy_template('vash/index.vash', path + '/views/index.vash');
          copy_template('vash/layout.vash', path + '/views/layout.vash');
          copy_template('vash/error.vash', path + '/views/error.vash');
          break;
      }
      complete();
    });

    // CSS Engine support
    switch (program.css) {
      case 'less':
        app = app.replace('{css}', eol + 'app.use(require(\'less-middleware\')(path.join(__dirname, \'public\')));');
        break;
      case 'stylus':
        app = app.replace('{css}', eol + 'app.use(require(\'stylus\').middleware(path.join(__dirname, \'public\')));');
        break;
      case 'compass':
        app = app.replace('{css}', eol + 'app.use(require(\'node-compass\')({mode: \'expanded\'}));');
        break;
      case 'sass':
        app = app.replace('{css}', eol + 'app.use(require(\'node-sass-middleware\')({\n  src: path.join(__dirname, \'public\'),\n  dest: path.join(__dirname, \'public\'),\n  indentedSyntax: true,\n  sourceMap: true\n}));');
        break;
      default:
        app = app.replace('{css}', '');
    }

    
    // Template support
    app = app.replace('{views}', program.view);

    // package.json
    var pkg = {
        name: app_name
      , version: '0.0.0'
      , private: true
      , scripts: { start: 'node ./bin/www' }
      , dependencies: {
          'express': '~4.14.0',
          'body-parser': '~1.15.2',
          'cookie-parser': '~1.4.3',
          'debug': '~2.2.0',
          'morgan': '~1.7.0',
          'serve-favicon': '~2.3.0',
          "mockjs": "^1.0.1-beta3",
          "mongoose": "^4.13.12"
      }
    }  

    switch (program.view) {
      case 'jade':
        pkg.dependencies['jade'] = '~1.11.0';
        break;
      case 'ejs':
        pkg.dependencies['ejs'] = '~2.5.2';
        break;
      case 'hjs':
        pkg.dependencies['hjs'] = '~0.0.6';
        break;
      case 'hbs':
        pkg.dependencies['hbs'] = '~4.0.1';
        break;
      case 'pug':
        pkg.dependencies['pug'] = '~2.0.0-beta6';
        break;
      case 'twig':
        pkg.dependencies['twig'] = '~0.9.5';
        break;
      case 'vash':
        pkg.dependencies['vash'] = '~0.12.2';
        break;
      default:
    }

    // CSS Engine support
    switch (program.css) {
      case 'less':
        pkg.dependencies['less-middleware'] = '~2.2.0';
        break;
      case 'compass':
        pkg.dependencies['node-compass'] = '0.2.3';
        break;
      case 'stylus':
        pkg.dependencies['stylus'] = '0.54.5';
        break;
      case 'sass':
        pkg.dependencies['node-sass-middleware'] = '0.9.8';
        break;
      default:
    }

    // sort dependencies like npm(1)
    pkg.dependencies = sortedObject(pkg.dependencies);//排序依赖

    // write files
    write(path + '/package.json', JSON.stringify(pkg, null, 2) + '\n');
    write(path + '/app.js', app);
    mkdir(path + '/bin', function(){
      www = www.replace('{name}', app_name);
      write(path + '/bin/www', www, 0755);
      complete();
    });

    if (program.git) {
      write(path + '/.gitignore', fs.readFileSync(__dirname + '/../templates/js/gitignore', 'utf-8'));
    }

    complete();
  });
}

module.exports = {
  copy_template,
  createAppName,
  emptyDirectory,
  loadTemplate,
  warning,
  write,
  mkdir,
  renamedOption,
  exit,
  createApplication
}