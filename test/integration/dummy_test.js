/* global marionette */

'use strict';

marionette('index.html >', function() {
  var assert = require('assert');
  var client = marionette.client();

  setup(function() {
    client.goUrl('file://' + __dirname + '/index.html');
  });

  test('content of page', function() {
    var tests = client.findElement('#title');
    assert.equal(tests.text(), 'Messages');
  });
});
