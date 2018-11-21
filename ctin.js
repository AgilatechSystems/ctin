const fs = require('fs');

var config = {};
if (fs.existsSync('config.json')) {
  config = require('./config');
}

module.exports = class CtIn {
  constructor(options) {
    let opts = options || {};

    this.device = {};
    this.device.name = (opts.hasOwnProperty('name')) ? opts.name : 'CtIn';
    this.device.type = (opts.hasOwnProperty('type')) ? opts.type : 'sensor';
    this.device.version = require('./package.json').version;
    this.device.active = false;

    this.device.sampleHz = (config.hasOwnProperty('sampleHz')) ? config.sampleHz : 1000;
    this.device.path = (config.hasOwnProperty('path')) ? config.path : "/sys/bus/iio/devices/iio:device0/";
    this.device.fileTemplate = (config.hasOwnProperty('fileTemplate')) ? config.fileTemplate : "in_voltage<N>_raw";
    this.device.file = null;
    this.device.inputNumber = (config.hasOwnProperty('inputNumber')) ? config.inputNumber : 0;
    this.device.maxCurrent = (config.hasOwnProperty('maxCurrent')) ? config.maxCurrent : 100;
    this.device.calibration = (config.hasOwnProperty('calibration')) ? config.calibration : 0;
    
    // options override config file
    for (const key in opts) {
      if (typeof opts[key] !== 'undefined') {
        this.device[key] = opts[key];
      }
    }

    this.device.calibration = this.device.calibration / 100;

    this.device.parameters = [
      {name: 'current', type: 'float', value: 0 }
    ];

    this.fd = null;
    this.buffer = null;
    this.max = 0xfff;

    this.device.active = this.initialize();

  }

  initialize() {
    // limit the sample to a max of 1000Hz
    if ((this.device.sampleHz > 1000) || (this.device.sampleHz < 1)) {
      console.error(`CtIn: given sample rate (${this.device.sampleHz}Hz) invalid. Resetting to 1000Hz`);
      this.device.sampleHz = 1000;
    }
    
    this.device.file = this.device.path + this.device.fileTemplate.replace('<N>', this.device.inputNumber);

    this.buffer = Buffer.alloc(4);

    if (!fs.existsSync(this.device.file)) {
      return false;
    }

    this.fd = fs.openSync(this.device.file, "r");

    if (this.fd != null) {
      return true;
    }

    return false;
  }

  deviceName() {
    return this.device.name;
  }

  deviceType() {
      return this.device.type;
  }

  deviceVersion() {
      return this.device.version;
  }

  deviceNumValues() {
      return this.device.parameters.length;
  }

  typeAtIndex(idx) {
      return this.device.parameters[idx].type;
  }

  nameAtIndex(idx) {
      return this.device.parameters[idx].name;
  }

  deviceActive() {
      return this.device.active;
  }

  valueAtIndex(idx, callback) {
    if (!this.device.active) {
      callback(`Error: ${this.device.name} is not active`);
      return;
    }
    this.pollAnalogInput((err, val) => {
      callback(null, val);
    });
  }

  valueAtIndexSync(idx) {
    console.error("valueAtIndexSync(idx) is deprecated. Use asynchronous valueAtIndex(idx, callback) instead.")
    if (!this.device.active) {
      console.error(`Error: ${this.device.name} is not active`);
      return 0;
    }
    else {
      return this.device.parameters[0].value;
    }
  }

  pollAnalogInput(callback) {
    var min = this.max;
    var max = 0;
    var val = 0;
    var count = 0;

    // sampleTime in milliseconds
    const sampleTime = Math.round(1000 / this.device.sampleHz);

    // sample the input for one second
    const timer = setInterval( () => {
      fs.readSync(this.fd, this.buffer, 0, 4, 0);
      val = parseInt(this.buffer.toString().trim());
      if (val < min) { min = val }
      else if (val > max) { max = val }
      count++;
  
      if (count > this.device.sampleHz) {
        clearInterval(timer);
        const spread = max - min;
        this.device.parameters[0].value = Math.round( (((spread + (spread * this.device.calibration)) * this.device.maxCurrent) / this.max) * 100) / 100;
        callback(null, this.device.parameters[0].value);
      }
    }, sampleTime);
  }

  sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
  }
}

