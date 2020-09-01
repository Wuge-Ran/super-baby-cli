#!/usr/bin/env node
//chalk插件，他的作用是在控制台中输出不同的颜色的字
const chalk = require('chalk')
//semver插件，是用来对特定的版本号做判断的
const semver = require('semver')

// 检查 node 版本
function checkNodeVersion(wanted, id) {
  if (!semver.satisfies(process.version, wanted)) {
    console.log(chalk.red(
      `You are using Node ${process.version}, but this version of ${id} requires Node ${wanted}.
      \nPlease upgrade your Node version.`
    ))
    process.exit(1)
  }
}
checkNodeVersion(require('../package.json').engines.node, 'create-project-cli');

const program = require('commander');
program
  .version(require('../package.json').version,'-v')
  .usage('<command> [options] ')


// create
program
  .command('new <app-name>')
  .description('create a new project powered by super-baby-cli')
  .action(appName => {
    require('../scripts/create')(appName)
  })



//parse输出
program.parse(process.argv)