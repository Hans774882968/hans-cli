#! /usr/bin/env node

'use strict';

const templateDir = `${__dirname}/../my-templates`
const tplObj = require(templateDir)
const utils = require('../src/utils')

console.log(utils.showJSON(tplObj))