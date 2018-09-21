export default class UniversalTilt {
  constructor(elements, settings = {}) {
    if (elements.length > 0) {
      this.init(elements, settings);
      return;
    } else if (elements.length === 0) {
      return;
    } else {
      this.element = elements;
    }

    this.settings = this.settings(settings);

    this.reverse = this.settings.reverse ? -1 : 1;

    if (this.settings.shine) this.shine();

    this.element.style.transform = `perspective(${
      this.settings.perspective
    }px)`;

    this.addEventListeners();
  }

  init(elements, settings) {
    for (const element of elements) {
      this.universalTilt = new UniversalTilt(element, settings);
    }
  }

  isMobile() {
    if (
      typeof window !== 'undefined' &&
      window.DeviceMotionEvent &&
      'ontouchstart' in document.documentElement &&
      this.settings.mobile
    ) {
      return true;
    }
  }

  addEventListeners() {
    if (this.isMobile()) {
      window.addEventListener('devicemotion', e => this.onDeviceMove(e));
    } else {
      if (typeof this.settings['position-base'] === `object`) {
        this.base = this.settings['position-base'];
      } else if (this.settings['position-base'] === 'element') {
        this.base = this.element;
      } else if (this.settings['position-base'] === 'window' && typeof window !== 'undefined') {
        this.base = window;
      }

      this.base.addEventListener('mouseenter', e => this.onMouseEnter(e));
      this.base.addEventListener('mousemove', e => this.onMouseMove(e));
      this.base.addEventListener('mouseleave', e => this.onMouseLeave(e));
    }
  }

  onMouseEnter(e) {
    this.updateElementPosition();
    this.transitions();

    if (typeof this.settings.onMouseEnter === 'function') {
      this.settings.onMouseEnter(this.element);
    }
  }

  onMouseMove(e) {
    if (typeof window !== 'undefined') {
      this.event = e;
      this.updateElementPosition();
      window.requestAnimationFrame(() => this.update());

      if (typeof this.settings.onMouseMove === 'function') {
        this.settings.onMouseMove(this.element);
      }
    }
  }

  onMouseLeave(e) {
    if (typeof window !== 'undefined') {
      this.transitions();

      window.requestAnimationFrame(() => this.reset());

      if (typeof this.settings.onMouseLeave === 'function') {
        this.settings.onMouseLeave(this.element);
      }
    }
  }

  onDeviceMove(e) {
    this.update();
    this.updateElementPosition();
    this.transitions();

    if (typeof this.settings.onDeviceMove === 'function') {
      this.settings.onDeviceMove(this.element);
    }
  }

  reset() {
    this.event = {
      pageX: this.left + this.width / 2,
      pageY: this.top + this.height / 2
    };

    if (this.settings.reset) {
      this.element.style.transform = `perspective(${
        this.settings.perspective
      }px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translate3d(0, 0, 0)`;
    }

    if (this.settings.shine && !this.settings['shine-save']) {
      Object.assign(this.shineElement.style, {
        transform: 'rotate(180deg) translate3d(-50%, -50%, 0)',
        opacity: '0'
      });
    }
  }

  getValues() {
    let x, y;

    if (this.isMobile()) {
      x = this.event.accelerationIncludingGravity.x / 4;
      y = this.event.accelerationIncludingGravity.y / 4;

      let stateX, stateY;

      if (window.orientation === 90) {
        stateX = (1.0 + x) / 2;
        stateY = (1.0 - y) / 2;

        y = stateX;
        x = stateY;
      } else if (window.orientation === -90) {
        stateX = (1.0 - x) / 2;
        stateY = (1.0 + y) / 2;

        y = stateX;
        x = stateY;
      } else if (window.orientation === 0) {
        stateY = (1.0 + y) / 2;
        stateX = (1.0 + x) / 2;

        y = stateY;
        x = stateX;
      } else if (window.orientation === 180) {
        stateY = (1.0 - y) / 2;
        stateX = (1.0 - x) / 2;

        y = stateY;
        x = stateX;
      }
    } else {
      // find element vertical & horizontal center
      if (this.settings['position-base'] === 'element') {
        x = (this.event.clientX - this.left) / this.width;
        y = (this.event.clientY - this.top) / this.height;
      } else if (this.settings['position-base'] === 'window' && typeof window !== 'undefined') {
        x = this.event.clientX / window.innerWidth;
        y = this.event.clientY / window.innerHeight;
      }
    }

    // set movement for axis
    x = Math.min(Math.max(x, 0), 1);
    y = Math.min(Math.max(y, 0), 1);

    const tiltX = (this.settings.max / 2 - x * this.settings.max).toFixed(2);
    const tiltY = (y * this.settings.max - this.settings.max / 2).toFixed(2);

    const angle = Math.atan2(x - 0.5, 0.5 - y) * (180 / Math.PI);

    return {
      tiltX: this.reverse * tiltX,
      tiltY: this.reverse * tiltY,
      angle
    };
  }

  updateElementPosition() {
    const rect = this.element.getBoundingClientRect();

    this.width = this.element.offsetWidth;
    this.height = this.element.offsetHeight;
    this.left = rect.left;
    this.top = rect.top;
  }

  update() {
    const values = this.getValues();

    this.element.style.transform = `perspective(${this.settings.perspective}px)
      rotateX(${
        this.settings.disabled && this.settings.disabled.toUpperCase() === 'X'
          ? 0
          : `${this.settings.disabled ? 0 : values.tiltY}`
      }deg)
      rotateY(${
        this.settings.disabled && this.settings.disabled.toUpperCase() === 'Y'
          ? 0
          : `${this.settings.disabled ? 0 : values.tiltX}`
      }deg)
      translate3d(${
        this.settings.translate && this.settings.translateFactor && typeof window !== `undefined`
        ? (this.event.clientX - (window.innerWidth / 2)) * this.settings.translateFactor
        : 0
      }px ,${
        this.settings.translate && this.settings.translateFactor && typeof window !== `undefined`
        ? (this.event.clientY - (window.innerHeight / 2)) * this.settings.translateFactor
        : 0
      }px, 0)
      scale3d(${this.settings.scale}, ${this.settings.scale}, ${
      this.settings.scale
    })`;

    if (this.settings.shine) {
      Object.assign(this.shineElement.style, {
        transform: `rotate(${values.angle}deg) translate3d(-50%, -50%, 0)`,
        opacity: `${this.settings['shine-opacity']}`
      });
    }

    this.element.dispatchEvent(
      new CustomEvent('tiltChange', {
        detail: values
      })
    );
  }

  shine() {
    const shineOuter = document.createElement('div');
    const shineInner = document.createElement('div');

    shineOuter.classList.add('shine');
    shineInner.classList.add('shine-inner');

    shineOuter.appendChild(shineInner);
    this.element.appendChild(shineOuter);

    this.shineWrapper = this.element.querySelector('.shine');
    this.shineElement = this.element.querySelector('.shine-inner');

    Object.assign(this.shineWrapper.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      height: '100%',
      width: '100%',
      overflow: 'hidden'
    });

    // set style for shine element
    Object.assign(this.shineElement.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      'pointer-events': 'none',
      'background-image':
        'linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
      width: `${this.element.offsetWidth * 2}px`,
      height: `${this.element.offsetWidth * 2}px`,
      transform: 'rotate(180deg) translate3d(-50%, -50%, 0)',
      'transform-origin': '0% 0%',
      opacity: '0'
    });
  }

  transitions() {
    clearTimeout(this.timeout);

    this.element.style.transition = `all ${this.settings.speed}ms ${
      this.settings.easing
    }`;

    if (this.settings.shine) {
      this.shineElement.style.transition = `opacity ${this.settings.speed}ms ${
        this.settings.easing
      }`;
    }

    this.timeout = setTimeout(() => {
      this.element.style.transition = '';
      if (this.settings.shine) this.shineElement.style.transition = '';
    }, this.settings.speed);
  }

  settings(settings) {
    const defaults = {
      'position-base': 'element', // element, window or DOM element
      reset: true, // enable/disable element position reset after mouseout
      mobile: true, // enable/disable tilt effect on mobile devices with gyroscope (tilt effect on touch is always enabled)

      shine: false, // add/remove shine effect on mouseover
      'shine-opacity': 0, // shine opacity (0-1) (shine value must be true)
      'shine-save': false, // save/reset shine effect on mouseout (shine value must be true)

      max: 35, // max tilt value
      perspective: 1000, // tilt effect perspective
      scale: 1.0, // element scale on mouseover
      disabled: null, // disable axis (X or Y)
      reverse: false, // reverse tilt effect directory
      translate: false, // transform element position to follow mouse
      translateFactor: 0.01, // the factor by which the element is transformed

      speed: 300, // transition speed
      easing: 'cubic-bezier(.03, .98, .52, .99)', // transition easing

      onMouseEnter: null, // call function on mouse enter
      onMouseMove: null, // call function on mouse move
      onMouseLeave: null, // call function on mouse leave
      onDeviceMove: null // call function on device move
    };

    const custom = {};

    for (const setting in defaults) {
      if (setting in settings) {
        custom[setting] = settings[setting];
      } else if (this.element.getAttribute(`data-${setting}`)) {
        const attribute = this.element.getAttribute(`data-${setting}`);
        try {
          custom[setting] = JSON.parse(attribute);
        } catch (err) {
          custom[setting] = attribute;
        }
      } else {
        custom[setting] = defaults[setting];
      }
    }

    return custom;
  }
}

if (typeof document !== 'undefined') {
  new UniversalTilt(document.querySelectorAll('[tilt]'));
}

let scope;

if (typeof window !== 'undefined') scope = window;
else if (typeof global !== 'undefined') scope = global;

if (scope && scope.jQuery) {
  const $ = scope.jQuery;

  $.fn.universalTilt = function(options) {
    new UniversalTilt(this, options);
  };
}
