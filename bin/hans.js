#! /usr/bin/env node

'use strict';

const program = require('commander')

program
  .version(require('../package').version)
  .usage('<command> [options]')
  .command('init', '选择一个模板，生成一个新项目')
  .command('add', '添加一个模板')
  .command('delete', '删除一个模板')
  .command('show', '展示已有模板')

program.parse(process.argv)