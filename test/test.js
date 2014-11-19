/*global window,assert,suite,setup,teardown,sinon,test*/
/*jshint esnext:true*/

suite('GaiaHeader', function() {
  'use strict';

  var GaiaHeader = window['gaia-header'];
  var realGaiaHeaderFontFit;

  setup(function() {
    this.sandbox = sinon.sandbox.create();
    this.container = document.createElement('div');
    document.body.appendChild(this.container);
    this.sandbox.spy(HTMLElement.prototype, 'addEventListener');

    realGaiaHeaderFontFit = window['./lib/font-fit'];
    window['./lib/font-fit'] = window['./test/mocks/mock_font_fit'];
  });

  teardown(function() {
    this.sandbox.restore();
    this.container.remove();

    window['./lib/font-fit'] = realGaiaHeaderFontFit;
  });

  test('It hides the action button if no action type defined', function() {
    this.container.innerHTML = '<gaia-header></gaia-header>';
    var inner = this.container.firstElementChild.shadowRoot.querySelector('.inner');
    assert.isFalse(inner.classList.contains('action-supported'));
  });

  test('It doesn\'t show an action button for unsupported action types', function() {
    this.container.innerHTML = '<gaia-header action="unsupported"></gaia-header>';
    var element = this.container.firstElementChild;
    var inner = element.shadowRoot.querySelector('.inner');
    assert.isFalse(inner.classList.contains('action-supported'));
  });

  test('It adds the correct icon attribute for the action type', function() {
    ['menu', 'close', 'back'].forEach(function(type) {
      this.container.innerHTML = '<gaia-header action="' + type + '"></gaia-header>';
      var element = this.container.firstElementChild;
      var actionButton = element.shadowRoot.querySelector('.action-button');
      assert.isTrue(actionButton.classList.contains('icon-' + type));
    }, this);
  });

  test('Should add a click event listener to the action button if an action defined', function() {
    this.container.innerHTML = '<gaia-header action="menu"></gaia-header>';
    var element = this.container.firstElementChild;
    var actionButton = element.shadowRoot.querySelector('.action-button');
    assert.isTrue(HTMLElement.prototype.addEventListener.withArgs('click').calledOn(actionButton));
  });

  test('Should add the shadow-dom stylesheet to the root of the element', function() {
    this.container.innerHTML = '<gaia-header action="menu"></gaia-header>';
    var element = this.container.firstElementChild;
    assert.ok(element.querySelector('style'));
  });

  test('Should change action button when action changes', function() {
    this.container.innerHTML = '<gaia-header></gaia-header>';
    var element = this.container.firstElementChild;
    var button = element.shadowRoot.querySelector('.action-button');
    element.setAttribute('action', 'back');
    assert.isTrue(button.classList.contains('icon-back'));
    element.setAttribute('action', 'menu');
    assert.isTrue(button.classList.contains('icon-menu'));
  });

  test('triggerAction() should cause a `click` on action button', function() {
    this.clock = sinon.useFakeTimers();
    this.container.innerHTML = '<gaia-header action="menu"></gaia-header>';
    var element = this.container.firstElementChild;
    var callback = sinon.spy();
    element.addEventListener('action', callback);
    element.triggerAction();
    this.clock.tick(1);
    assert.equal(callback.args[0][0].detail.type, 'menu');
    this.clock.restore();
  });

  test('It fails silently when `window.getComputedStyle()` returns null (ie. hidden iframe)', function() {
    this.sandbox.stub(window, 'getComputedStyle').returns(null);
    this.container.innerHTML = '<gaia-header action="menu"><h1>title</h1></gaia-header>';
    var element = this.container.firstElementChild;

    // Insert into DOM to get styling
    document.body.appendChild(element);
  });

  test('rerunFontFit does not b0rk the markup', function() {
    this.container.innerHTML = '<gaia-header action="back"><h1><p>markup</p></gaia-header>';

    var element = this.container.firstElementChild;
    element.rerunFontFit();

    assert.isNotNull(element.querySelector('p'));
  });

  suite('style', function() {
    setup(function() {

      // Create and inject element
      this.container.innerHTML = `
        <gaia-header action="menu">,
          <h1>my title</h1>,
          <button id="my-button">my button</button>,
        </gaia-header>`;

      this.element = this.container.firstElementChild;

      // Insert into DOM to get styling
      document.body.appendChild(this.element);
    });

    teardown(function() {
      document.body.removeChild(this.element);
    });

    test('Should place title after action button', function() {
      var button = this.element.shadowRoot.querySelector('.action-button');
      var title = this.element.querySelector('h1');
      var span = document.createElement('span');

      // Wrap text in span so we can
      // measure postition of text node
      span.appendChild(title.firstChild);
      title.appendChild(span);

      var buttonX = button.getBoundingClientRect().left;
      var titleX = span.getBoundingClientRect().left;

      assert.isTrue(titleX > buttonX);
    });

    test('Should hang other buttons to the right', function() {
      var button = this.element.querySelector('#my-button');

      // Get positions
      var elementRight = this.element.getBoundingClientRect().right;
      var buttonRight = Math.round(button.getBoundingClientRect().right);

      assert.equal(buttonRight, elementRight);
    });

    test('Should never overlap buttons with title', function() {
      var button = this.element.querySelector('#my-button');
      var otherButton = document.createElement('button');
      var title = this.element.querySelector('h1');

      title.textContent = 'really long title really long title really long title';
      otherButton.textContent = 'another button';
      this.element.appendChild(otherButton);

      // Get positions
      var buttonLeft = button.getBoundingClientRect().left;
      var otherButtonleft = otherButton.getBoundingClientRect().left;
      var titleRight = title.getBoundingClientRect().right;

      assert.isTrue(titleRight <= buttonLeft, titleRight + ' <= ' + buttonLeft);
      assert.isTrue(titleRight <= otherButtonleft, titleRight + ' <= ' +  otherButtonleft);
    });
  });

  suite('GaiaHeader#onActionButtonClick()', function(done) {
    setup(function() {
      this.clock = sinon.useFakeTimers();
    });

    teardown(function() {
      this.clock.restore();
    });

    test('Should emit an \'action\' event', function() {
      this.container.innerHTML = '<gaia-header action="menu"></gaia-header>';
      var element = this.container.firstElementChild;
      var callback = sinon.spy();

      element.addEventListener('action', callback);
      element.onActionButtonClick();
      this.clock.tick(1);

      sinon.assert.called(callback);
    });

    test('Should pass the action type as `event.detail.type`', function() {
      this.container.innerHTML = '<gaia-header action="menu"></gaia-header>';
      var element = this.container.firstElementChild;
      var callback = sinon.spy();

      element.addEventListener('action', callback);
      element.onActionButtonClick();
      this.clock.tick(1);

      assert.equal(callback.args[0][0].detail.type, 'menu');
    });
  });
});
