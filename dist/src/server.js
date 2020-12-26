'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _viewEngine = require('./config/viewEngine');

var _viewEngine2 = _interopRequireDefault(_viewEngine);

var _web = require('./routes/web');

var _web2 = _interopRequireDefault(_web);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('dotenv').config();


var app = (0, _express2.default)();

// config view engine
(0, _viewEngine2.default)(app);

// use body parser to post data
app.use(_bodyParser2.default.json());
app.use(_bodyParser2.default.urlencoded({ extended: true }));

// init all web routes
(0, _web2.default)(app);

var port = process.env.PORT || 8080;

app.listen(port, function () {
    console.log('App is running at the port ' + port);
});