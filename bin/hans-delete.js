#! /usr/bin/env node

'use strict';

const inquirer = require('inquirer')// 交互式命令行
const chalk = require('chalk')
const fs = require('fs')
const templateDir = `${__dirname}/../my-templates`
let tplObj = require(templateDir)
const utils = require('../src/utils')

// 把模板信息写入my-templates.json
function writeTpl(name) {
  return new Promise(resolve => {
    fs.writeFile(
      `${templateDir}.json`,
      utils.showJSON(tplObj),
      'utf-8',
      err => resolve(name ? {name, err} : {err})
    )
  })
}

function deletedInfo(err, name) {
  if (err) console.error(err)
  console.log('\n')
  if (name) console.log(chalk.green(`模板“${name}”删除成功！`))
  else console.log(chalk.green(`模板清空成功！`))
  console.log(chalk.blue('当前模板列表：\n'))
  console.log(utils.showJSON(tplObj))
  console.log('\n')
}

function main() {
  if (!Object.keys(tplObj).length) {
    console.log(chalk.red('当前模板列表已为空！'))
    return
  }

  let [isAll,] = process.argv.slice(2)
  if (isAll === 'all') {
    tplObj = {}
    writeTpl().then(({err}) => deletedInfo(err))
    return
  }

  const questions = [
    {
      name: 'name',
      type: 'input',
      message: '请输入待删除模板名称',
      validate(val) {
        if (val === '') {
          return '模板名称不能为空！'
        } else if (!tplObj[val]) {
          return '该模板名称不存在！'
        }
        return true
      }
    }
  ]

  inquirer.prompt(questions).then(answers => {
    let {name} = answers
    delete tplObj[name]
    return writeTpl(name)
  }).then(({name, err}) => deletedInfo(err, name))
}

main()