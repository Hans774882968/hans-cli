#! /usr/bin/env node

'use strict';

const inquirer = require('inquirer')// 交互式命令行
const chalk = require('chalk')
const fs = require('fs')
const templateDir = `${__dirname}/../my-templates`
const tplObj = require(templateDir)
const utils = require('../src/utils')

const questions = [
  {
    name: 'name',
    type: 'input',
    message: '请输入待添加模板名称',
    validate(val) {
      if (val === '') {
        return '模板名称不能为空！'
      } else if (tplObj[val]) {
        return '该模板名称已存在！'
      }
      return true
    }
  },
  {
    name: 'url',
    type: 'input',
    message: '请输入模板url',
    validate (val) {
      if (val === '') return '模板url不能为空！'
      return true
    }
  }
]

inquirer.prompt(questions).then(answers => new Promise(resolve => {
  let {name, url} = answers
  // 过滤Unicode字符
  tplObj[name] = url.replace(/[\u0000-\u0019]/g, '')
  // 把模板信息写入my-templates.json
  fs.writeFile(
    `${templateDir}.json`,
    utils.showJSON(tplObj),
    'utf-8',
    err => resolve({name, url, err})
  )
})).then(({name, url, err}) => {
  if (err) console.log(err)
  console.log('\n')
  console.log(chalk.green(`模板“${name}”（url：${url}）添加成功！`))
  console.log(chalk.hex('#FFA500')('当前模板列表：\n'))
  console.log(utils.showJSON(tplObj))
  console.log('\n')
})