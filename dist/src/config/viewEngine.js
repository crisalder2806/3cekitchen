'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var configViewEngine = function configViewEngine(app) {
    app.use(_express2.default.static('./src/public'));
    app.set('view engine', 'ejs');
    app.set('views', './src/views');
};

module.exports = configViewEngine;