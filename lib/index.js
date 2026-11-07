'use strict';

const yunqi = require('./yunqi');
const laws = require('./laws');
const data60 = require('./data60');
const { buildConstitution, yearWarn } = require('./bazi-yunqi');

module.exports = { ...yunqi, laws, data60, buildConstitution, yearWarn };