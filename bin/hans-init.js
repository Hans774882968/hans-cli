#! /usr/bin/env node

'use strict';

const program = require('commander')
const ora = require('ora')
const chalk = require('chalk')
const download = require('download-git-repo')
const templateDir = `${__dirname}/../my-templates`
const tplObj = require(templateDir)

program.usage('<template-name> [project-name]')
program.parse(process.argv)

if (program.args.length < 1) return program.help()
let [tplName, projName] = program.args
if (!tplObj[tplName]) {
  console.log(chalk.red(`\n 模板“${tplName}”不存在！\n `))
  return
}
if (!projName) {
  console.log(chalk.red('\n 项目名不能为空！\n '))
  return
}

console.log(chalk.white('\n 开始下载模板...\n'))
const spinner = ora('下载中...')
spinner.start()

new Promise(resolve => {
  let url = tplObj[tplName]
  if (url.substr(4) === 'http') url = `direct:${url}`
  download(url, projName, err => resolve(err))
}).then(err => {
  if (err) {
    spinner.fail()
    console.log(chalk.red(` 项目初始化失败！${err}`))
    return
  }
  spinner.succeed()
  console.log(chalk.green('\n 项目初始化成功！'))
  console.log(chalk.blue(`\n To get started\n\n    cd ${projName} \n`))
})