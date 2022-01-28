'use strict';

function showJSON(tplObj) {
  return JSON.stringify(tplObj, null, '  ')
}

module.exports = {
  showJSON
}