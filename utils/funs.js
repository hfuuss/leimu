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
  var wait = 3; //调用几次mkdir的回调，就执行几次

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



  //  加载模板 原始文件
  var App = loadTemplate('react-simple/app/Home/App.js');
  var App2 = loadTemplate('react-simple/app/Home/App2.js');
  var entry = loadTemplate('react-simple/app/entry.js');
  var index = loadTemplate('react-simple/index.html');
  var package = loadTemplate('react-simple/package.json');
  var readme = loadTemplate('react-simple/README.md');
  var webpackConfig = loadTemplate('react-simple/webpack.config.js');


 
    ////创建文件夹
  mkdir(path, function(){
    //创建app
    mkdir(path + '/app',function(){

      mkdir(path + '/app/Home',function(){
        write(path + '/app/Home/App.js',App);
        write(path + '/app/Home/App2.js',App2);
        complete();
      });
      
      write(path + '/app/entry.js',entry);
      complete();
    })
    
    //创建dist
    mkdir(path + '/dist');
    //写入index等
    write(path + '/index.html',index);
    write(path + '/package.json',package);
    write(path + '/README.md',readme);
    write(path + '/webpack.config.js',webpackConfig);

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