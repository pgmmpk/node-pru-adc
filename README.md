node-pru-adc
============

Fast analog sensor capture for Beaglebone Black

See sibling Python module [beaglebone_pru_adc](http://github.com/pgmmpk/beaglebone_pru_adc) for more documentation.

This module is a JavaScript port of *beaglebone_pru_adc*.

Sample use
----------

```javascript

var pruadc = require('pru-adc');

pruadc(function(err, capture) {
	if (err) {
		return console.log('sadly, it did not work', err);
	}
	
	capture.start() // you must start it before reading!

	// just print timer ticks once a second (should grow at approx 120000 ticks per second)
	var counter = 1000;
	(function ontimer() {
		console.log('pru-adc timer ticks:', capture.timer());

		if (--counter >= 0) {
			setTimeout(ontimer, 1000);
		}
	})();
});
```

API
---

### Obtaining capture object asynchronously

`pru-adc` module exports asynchronous function that provides callback with `capture` object. In fact, this is the only function
being exported by the module.

```javascript
require('pru-adc')(function(err, capture) {
	// we get here when initialization is complete.
	// if err is not null, initialization failed.
	// else you will get capture object that you can use to
	// capture ADC values...
});
```

Typical use of `capture` object is:

1. configure capture by specifying wheel encoder pins, thresholds, EMA_POW and other parameters.
2. call capture.start() to start ADC capture
3. periodically call capture.read() to read current values
4. when finished, call capture.stop() to stop ADC capture

### capture.emaPow()

Gets/sets averaging parameter EMA_POW. Value of zero means "no averaging". When averaging is enabled, PRU firmware will
apply EMA (Exponential Moving Averaging) filter to the AIN signals (with exception of AINs that are assigned to wheel encoders).

Default value is 0 (no averaging)

Setting it to value `X` means averaging with EMA period of 2**X. Reasonable values are between 1 and 10. For example, setting
EMA_POW to 8 will enable EMA-filtering with period of 256 ADC scans (256/121000 seconds).

### capture.encoder0Pin()

Getter/setter. If set to a value in range 0-7, assigns corresponding AIN pin as wheel encoder 0 pin. Firmware treats such pins
in a special way - applies Schmitt-trigger filter and delay filter to produce reliable wheel encoder readings (ticks).

If this parameter is set to any number outside of the 0-7 range, encoder logic will not be activated. Default is 255 (not active).

### capture.encoder1Pin()

Getter/setter. Controls whicg AIN pin is used as wheel encoder pin 1. See description of `capture.encoder0Pin()` above for more
information how this works.

### capture.encoder0Threshold()

Getter/setter. This is Schmitt-trigger filtering threshold (sometimes also called "hysteresis"). Use calibration procedure to decide
on threshold value.

### captire.encoder1Threshold()

Getter/setter. This is Schmitt-trigger filtering threshold (sometimes also called "hysteresis"). Use calibration procedure to decide
on threshold value.


### capture.encoder0Delay(), capture.encoder1Delay()

Getter/setter. Configures additional "delay" filtering. The gioal of this filter is to suppress short-lived noise spikes. It works
by requiring a certain number of repeats before flipping Schmitt trigger. Reasonable value is 50, that requires that a condition that
otherwise would flip the state of Schmitt trigger persists for 50 ADC scans.

Default is 0, that means that delay filtering is not employed.

### capture.start()

Starts ADC capture. PRU will continuously read data from all AIN ports at approximately 121000 scans per second.

### capture.timer()

Returns the number of ADC scans that were performed since the start. Since frequency of ADC scans is constant (about 121000 scans per second)
this value gives ADC "timeline", and can be used for measuring time intervals.

### capture.values()

Returns an array of 8 numbers that represent ADC readings from pins AIN0..AIN7. If some of these pins are assigned to wheel encoders,
the corresponding value will be zero.

### capture.encoder0Values(), capture.encoder1Values()

Returns an array of 5 numbers representing raw wheel encoder data (for debugging purposes and calibration). Normally high-level
functions `capture.encoder0Ticks()`, `capture.encoder1Ticks()`, `capture.encoder0Speed()`, `capture.encoder1Speed()` are used to get
encoder-related information.

### capture.encoder0Ticks(), capture.encoder1Ticks()

Returns the number of ticks that were registered for this wheel encoder. Tick is registered on high-to-low edge of the signal.

### capture.encoder0Speed(), capture.encoder1Speed()

Returns an inverse of the wheel speed. Namely, it returns the number of ADC scans that happened during the last tick period. Since
frequency of ADC scans is constant (approximately 121000 per second), this number gives the inverse speed in ticks per ADC scan.

### capture.stop()

License
-------
MIT