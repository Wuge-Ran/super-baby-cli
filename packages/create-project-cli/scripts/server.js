process.env.NODE_ENV = 'development'

const chalk = require('chalk')
const ora = require('ora')
const webpack = require('webpack')
const getWebpackConfig = require('../webpack/dev.conf')

const spinner = ora('Starting development server...')

function createDevServer (webpackConfig) {
  const compiler = webpack(webpackConfig)

  const DevServer = require('webpack-dev-server')
  const devServer = new DevServer(compiler, {
    port: 3002,
    historyApiFallback: {
      rewrites: [{ from: /./, to: '/index.html' }],
    },
    hot: true,
    open: true,
  })

  return devServer
}

async function serve() {
  spinner.start()

  const webpackConfig = getWebpackConfig()
  const devServer = createDevServer(webpackConfig)

  // Ctrl + C 触发
  //sigint 程序终止(interrupt)信号, 在用户键入INTR字符(通常是baiCtrl-C)时发出 。
  //sigterm 程序结束(terminate)信号, 与SIGKILL不同的是该信号可以被阻塞和处理. 通常用来要求程序自己正常退出. shell命令kill缺省产生这个信号。
  ;['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, () => {
      devServer.close()
      process.exit()
    })
  })
  spinner.stop();
  return devServer.listen('3002', err => {
    if (err) return console.log(err)
  })
}

module.exports = function(...args) {
  return serve().catch(err => {
    console.error(chalk.red(`serve error`, err))
    process.exit(1)
  })
}