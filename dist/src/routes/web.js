'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

var initWebRoutes = function initWebRoutes(app) {
    router.get('/', function (req, res) {
        return res.send('Hello World');
    });
};

module.exports = initWebRoutes;