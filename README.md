[csdn](https://blog.csdn.net/hans774882968/article/details/122738428)

项目地址：https://github.com/Hans774882968/hans-cli

环境：Windows10

相信很多人都是通过vue-cli第一次认识前端脚手架。我们通过`npm install -g vue-cli`命令全局安装脚手架后，再执行`vue create project-name`就能初始化一个vue项目。那么我们能不能写一个自己的脚手架，方便地初始化一个项目？答案不仅是肯定的，难度还不大！

#### 用到的工具

##### commander

用来编写指令和处理命令行。例：

```js
const program = require('commander')

program
  .version(require('../package').version)
  .usage('<command> [options]')
  .command('init', '选择一个模板，生成一个新项目')

program.parse(process.argv)
```

##### inquirer

交互式命令行工具。例：

```js
const inquirer = require('inquirer')
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
  }
]
inquirer.prompt(questions).then(answers => {})
```

##### chalk

用来修改控制台输出内容样式。例：

```js
console.log(chalk.green('字符串'))
console.log(chalk.hex('#FFA500')('字符串'))//橙色
```

##### ora

在控制台展示转圈圈的效果。例：

```js
const spinner = ora('下载中...')
spinner.start()
spinner.succeed()
```

##### download-git-repo

用来下载远程模板，默认支持GitHub、GitLab和Bitbucket。gitee有验证码，暂时没找到解决方案……

要写一个爬虫来搞定gitee挺麻烦的，以后再说吧……

```js
const download = require('download-git-repo')
download(repository, destination, options, callback)
// 或者
download(repository, destination, callback)
```

- repository：远程仓库地址。
- destination：存放下载的文件路径。
- options：一些选项，比如headers自定义请求头。`{ clone: Boolean }`表示用http download或者git clone的形式下载。如果用http download，那么url应该是zip的。
- callback：下载完毕的回调。

#### 开工

##### 项目结构

```
bin
  hans.js等
src
  utils.js
package.json
my-templates.json
```

空项目`npm init`生成`package.json`。

`package.json`依赖项：

```json
  "dependencies": {
    "chalk": "^2.4.2",
    "commander": "^2.19.0",
    "download-git-repo": "^1.1.0",
    "inquirer": "^6.2.2",
    "ora": "^3.2.0"
  }
```

`npm install`即可。

我们知道`node ./bin/index.js`即可执行js，那么怎么实现`hans init`这种命令的效果？

定义`package.json`的bin选项

```json
  "bin": {
    "hans": "./bin/hans.js",
    "hans-init": "./bin/hans-init.js",
    "hans-add": "./bin/hans-add.js",
    "hans-delete": "./bin/hans-delete.js",
    "hans-show": "./bin/hans-show.js"
  }
```

bin的作用是指定每个命令所对应的可执行文件的位置。之后，在**项目根目录**执行

```
npm link
```

`hans`、`hans-init`等命令就会挂载到全局。

每次对bin选项进行修改，都要重新link。而每次link之前都记得要unlink（项目根目录）。

```
npm unlink
```

执行link后，你可以在`<node.exe的目录>/node_global`下看到hans、hans.cmd和hans.ps1等脚本，在`<node.exe的目录>/node_global/node_modules`下看到hans-cli的快捷方式（我的操作系统是Windows10）。

接下来，试着在power shell执行`hans`命令，我们会遇到一个常见错误：

操作系统用了microsoft jscript，而非node来解释我们的js文件！

#### 修复常见错误

最开始发现，修改hans、hans.cmd和hans.ps1是有用的。

hans

```
#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")

case `uname` in
    *CYGWIN*|*MINGW*|*MSYS*) basedir=`cygpath -w "$basedir"`;;
esac

if [ -x "$basedir/node" ]; then
  "$basedir/node"  "$basedir/node_modules/hans-cli/bin/hans.js"   "$@"
  ret=$?
else 
  node  "$basedir/node_modules/hans-cli/bin/hans.js"   "$@"
  ret=$?
fi
exit $ret
```

hans.cmd

```
@ECHO off
SETLOCAL
CALL :find_dp0

IF EXIST "%dp0%\node.exe" (
  SET "_prog=%dp0%\node.exe"
) ELSE (
  SET "_prog=node"
  SET PATHEXT=%PATHEXT:;.JS;=;%
)

"%_prog%"  "%dp0%\node_modules\hans-cli\bin\hans.js"   %*
ENDLOCAL
EXIT /b %errorlevel%
:find_dp0
SET dp0=%~dp0
EXIT /b
```

hans.ps1

```
#!/usr/bin/env pwsh
$basedir=Split-Path $MyInvocation.MyCommand.Definition -Parent

$exe=""
if ($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows) {
  # Fix case when both the Windows and Linux builds of Node
  # are installed in the same directory
  $exe=".exe"
}
$ret=0
if (Test-Path "$basedir/node$exe") {
  & "$basedir/node$exe"  "$basedir/node_modules/hans-cli/bin/hans.js" $args
  $ret=$LASTEXITCODE
} else {
  & "node$exe"  "$basedir/node_modules/hans-cli/bin/hans.js" $args
  $ret=$LASTEXITCODE
}
exit $ret
```

参考：http://ourjs.com/wiki/view/nodejs/02_code_management_and_deployment

但是这种愚蠢的手动改文件的做法，我们怎么可能会满意？

在寻找解决方案的过程中，我找到了一些和该错误比较相关的链接

- https://stackoverflow.com/questions/10396305/npm-package-bin-script-for-windows
- https://github.com/cucumber/cucumber-js/issues/60

**实验表明，只有StackOverflow链接那个赞最少的解决方案是有用的**！

尝试了**StackOverflow链接那个赞最少的解决方案**发现，`#! /usr/bin/env node`虽然对Windows没有意义，但在Windows下也可以解决这个常见错误！原因很简单：查看`npm link`生成的hans.cmd，发现

```
IF EXIST "%dp0%\node.exe" (
  SET "_prog=%dp0%\node.exe"
) ELSE (
  SET "_prog=node"
  SET PATHEXT=%PATHEXT:;.JS;=;%
)
```

被自动生成了！也就是说，`npm link`会读取你的文件头，然后生成这段cmd代码。不得不感慨，`npm link`的开发者是优秀的产品经理！

##### 常见错误的解决方案

在每个命令对应的可执行文件的开头，加上`#! /usr/bin/env node`。**这一行的后面一定要留一个空行**！

#### 代码简介

##### hans.js

```js
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
```

只执行`hans`，会打印帮助信息；执行`hans init`则会找到`hans-init.js`来执行。

我们的模板保存在`my-templates.json`，例：

```json
{
  "acm模板": "Hans774882968/acm_template"
}
```

hans-add.js、hans-delete.js和hans-show.js都只是对`my-templates.json`的增删改查。

##### hans-add.js

```js
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
```

##### hans-delete.js

```js
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
```

把回调函数作为参数的这些老式API会造成回调地狱，让人很不爽。我尽力地使用Promise来改造它们了，但是效果也就那样，那个`name`是我们复用代码的主要阻碍。

- 执行`hans delete all <后续参数被忽略>`将删除所有模板。
- 执行`hans delete <不等于all的字符串>`等同于执行`hans delete`。
- 执行`hans delete`，将问你要删除的模板名称，然后进行删除。

##### hans-show.js

```js
#! /usr/bin/env node

'use strict';

const templateDir = `${__dirname}/../my-templates`
const tplObj = require(templateDir)
const utils = require('../src/utils')

console.log(utils.showJSON(tplObj))
```

展示模板信息。

##### hans-init.js

```js
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
```

用download-git-repo库来下载模板。下文“效果”把我的acm模板下载到本地。

这里对url的处理很水，就是默认下载GitHub仓库了；以`http`开头的url就加一个`direct:`。个人认为这个库很乐色，不如自己写一个爬虫……

#### 效果

```
PS C:\Users\admin\Desktop> hans add
? 请输入待添加模板名称 1
? 请输入模板url 1


模板“1”（url：1）添加成功！
当前模板列表：

{
  "1": "1",
  "acm模板": "Hans774882968/acm_template",
  "acm模板gitee": "https://gitee.com/pretend-not-to-be-a-gentleman/acm_template/repository/archive/master.zip"
}


PS C:\Users\admin\Desktop> hans init acm模板 acm模板

 开始下载模板...

√ 下载中...

 项目初始化成功！

 To get started

    cd acm模板

PS C:\Users\admin\Desktop>
```

#### 发布到npm

参考一下参考链接就行，很简单。这个项目离真正的实用还是有一定距离，~~就不污染npm了~~。

参考：https://juejin.cn/post/6844903807919325192
