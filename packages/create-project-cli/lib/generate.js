const chalk = require('chalk')
// const ejs = require('ejs')
const fs = require('fs-extra')
const path = require('path')
// const { isBinaryFileSync  } = require('isbinaryfile')
// const debug = require('debug')('faiz:cli-generate')
const { logWithSpinner, stopSpinner } = require('../util/spinner')
const writeFileTree = require('../util/writeFileTree')
const getNpmLatestVersion = require('../util/getNpmLatestVersion')

/**
 * Render template files into the virtual files tree object.
 *
 * @param {string | object | FileMiddleware} source -
 *   Can be one of:
 *   - relative path to a directory;
 *   - Object hash of { sourceTemplate: targetFile } mappings;
 *   - a custom file middleware function.
 * @param {object} [additionalData] - additional data available to templates.
 * @param {object} [ejsOptions] - options for ejs.
 *
 * 渲染 ejs 模板
 */
async function render(source, additionalData = {}, ejsOptions = {}) {
  const baseDir = path.resolve(__dirname, '../')  // path/node_modules/faiz-cli
  source = path.resolve(baseDir, source) // path/node_modules/faiz-cli/templates/vue
  let files = {}

  const globby = require('globby')
  const _files = await globby(['**/*'], { cwd: source })

  debug('template files', _files)

  for (const rawPath of _files) {
    // 下划线开头的文件转为.   _gitignore -> .gitignore
    const targetPath = rawPath.split('/').map(fileName => {
      fileName = fileName.replace(/^(_)(\w)(\w*)/, (match, p1, p2, p3) => {
        if (p2 === '_') return p2 + p3
        return '.' + p2 + p3
      })
      return fileName
    }).join('/')

    const sourcePath = path.resolve(source, rawPath) // path/node_modules/faiz-cli/templates/vue/src/App.vue
    const fileContent = renderFile(sourcePath, additionalData, ejsOptions)
    if (Buffer.isBuffer(fileContent) || fileContent.trim()) {
      files[targetPath] = fileContent
    }
  }

  return files
}

/**
 * @fileName 模板文件路径   path/node_modules/@vue/cli-service/generator/template/_gitignore
 * @data  数据 options rootOptions plugins additionalData
 * @ejsOptions ejs 配置  ejsOptions = {}
 *
 * 渲染文件
 */
function renderFile(fileName, data = {}, ejsOptions = {}) {
  // 检测是否为二进制文件
  if (isBinaryFileSync(fileName)) return fs.readFileSync(fileName)  // return buffer

  const template = fs.readFileSync(fileName, 'utf-8')
  return ejs.render(template, data, ejsOptions)
}

/**
 * 生成 package.json 文件内容
 * @param {*} appName
 */
async function renderPackageJson(appName) {
  try {
    const npmPkgs = ['vue', 'vue-property-decorator', '@wuge/create-project-cli' ]
    const npmPkgsVersion = await getNpmLatestVersion(npmPkgs)
    debugger
    // 生成 package.json
    const pkg = {
      name: appName,
      version: '1.0.0',
      author: '',
      main: 'src/index.js',
      private: true,
      scripts: {
        dev: 'faiz serve',
        test: 'faiz test',
        build: 'faiz build',
      },
      dependencies: {
        vue: `^${npmPkgsVersion.vue}`,
        "vue-property-decorator": `^${npmPkgsVersion['vue-property-decorator']}`,
      },
      devDependencies: {
        "@wuge/create-project-cli": `^${npmPkgsVersion['@wuge/create-project-cli']}`,
        // vue-template-compiler 与 vue 版本号同步
        "vue-template-compiler": `^${npmPkgsVersion.vue}`,
      },
      eslintConfig: {},
    }
    return pkg
  } catch (error) {
    console.log('=== 网络异常 ===', error)
    process.exit(1)
  }
}

/**
 * 下载 npm 包
 */
async function pkgInstall(targetDir) {
  const execa = require('execa')
  try {
    await execa('npm', ['install', '--loglevel', 'error' ], {
      cwd: targetDir,
    })
  } catch (error) {
    console.log('=== npm install error ===', error)
  }
}

module.exports = async function(appName, dest) {
  console.log('before creating......')

  logWithSpinner(`✨`, `Creating project in ${chalk.yellow(dest)}.`)

  const pkg = await renderPackageJson(appName)
  await writeFileTree(dest, {
    'package.json': JSON.stringify(pkg, null, 3),//缩进一个tab键
  })

  // const files = await render('./templates/vue', {
  //   options: { appName } // ejs data
  // })
  // debug('files', Object.keys(files))
  // await writeFileTree(dest, files)

  // await pkgInstall(dest)


  stopSpinner()
  // console.log(`🎉  Successfully created project ${chalk.yellow(appName)}.`)
  // console.log()

}