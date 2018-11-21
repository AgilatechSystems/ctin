## Driver for CtIn sensor

##### This driver has been thoroughly tested on BBB but no other platforms

### Install
```
npm install @agilatech/ctin
```

### Usage
##### Load the module and create an instance
```
const Ctin = require('@agilatech/ctin');
const ctin = new Ctin();
// creates an driver with all default options, including analog input 0. 

if (ctin.isActive()) {
    ctin.valueAtIndex(0, (err, val) => {
        if (!err) {
            const current = val;
        }
    });
}
```

**Options**
```
Ctin([options])
```
The constructor can be supplied with options to specify certain driver characteristics. The options object allows the following parameters:
* name : The name given to this particular driver instance. Defaults to 'CtIn'.
* type : The type given to this particular driver instance. Defaults to 'sensor'.
* sampleHz : The sample rate for the input signal ranging from 1 to 1000. Defaults to 1000.
* path : The absolute path to the raw input files. Defaults to sys/bus/iio/devices/iio:device0/
* fileTemplate : Template for the raw input files. '<N> is replaced by the input number.  Defaults to in_voltage<N>_raw
* inputNumber : The number of the input from 0-6. Defaults to 0.
* maxCurrent : The maximum current in Amps the electronics are sized to handle. Defaults to 100
* calibration : A calibration correction percentage to be applied to the measurement. Defaults to 0
  


Most options are fairly self-explanitory, but these require further explanation:

##### maxCurrent
The mximum expected current is defined by the hardware, specifically the pickup coil and the burden resistor.  The formula is ((0.9 / &lt;burden resistor ohms&gt;) * &lt;pickup coil turns&gt;) / 1.414. For example, if using a pickup with 2000 turns with a 15 ohm burden resistor, the max current would be 84.9A = (( 0.9 / 15) * 2000 ) / 1.414.

##### calibration
A calibration factor is necessary to correct for tolerance in resistor values, pickup variations, and A-to-D sample errors. The calibration is simply a percentage which is applied to the raw sample before other calculations are performed. The actual correction in amps is dependent on the maxCurrent. As an illustration, if the maxCurrent is 100, and the uncorrected raw value would indicate a 50A reading, then a calibration of 2 would result in a corrected output value of 51A.



### Get basice device info
```
const name = ctin.deviceName();  // returns string with name of device
const type = ctin.deviceType();  // returns string with type of device
const version = ctin.deviceVersion(); // returns this driver software version
const active = ctin.deviceActive(); // true if initialized and acgtive, false if inactive
const numVals =  ctin.deviceNumValues(); // returns the number of paramters sensed
```

### Take measurement and load results in device object
```
Ctin.pollAnalogInput(callback)
```
Asyncronously polls the device, stores the results in the device parameters object, and then calls the callback. The given callback function conforms to the standard (err, val) pattern.  Upon completion, the device object may also be examined for new values.


#### device object
The Ctin.device object contains basic information about the device itself, and also the 'parameters' array. The 'parameters' array contains the name, data type, and current value of each parameter for the device.
```
Ctin.device.parameters[0] = {
    name: 'current',
    type: 'float',
    value: <current in amp>
    }
```


### Get individual parameter values by index
Asynchronously:
```
ctin.valueAtIndex(index, (err, value) => {
    if (!err) {
        val = value;
    }
});
```


### Operation Notes
This driver is specific to the Beaglebone Black and its variants, and has not been tested on other devices and platforms.  It will likely require some modifications to work with analog input boards for RPi and others. 

The Beaglebone Black was chosen because it includes 7 analog inputs standard without the need for add-on boards or electronics. The BBB analog input voltage range is 1.8V total, which is how the 0.9 comes from in determining the maxCurrent (the signal centered at 0.9, ranging from a low of 0 to a high of 1.8).

Also, the deafult path and filenames of the raw analog input files are specific to the BBB.


### Improvements Roadmap
In the future we plan to allow this driver to be used on other platforms by just modifying some configuration.



### Copyright
Copyright © 2018 Agilatech. All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.



sampleHz from 1 - 1000
calibration = 

0.9v / 10 ohm * 2000 = 180 P2P
180 / 1.414 = 127.3 RMS
Max current then is ^

a 12 ohm resistor would give max current of 106A, too close
an 11 ohm resistor would give max current of 115A, probably okay, but special order
