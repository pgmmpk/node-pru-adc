var prussdrv = require('prussdrv'),
	fs = require('fs');

function slots(callback) {
	fs.readdir('/sys/devices', function(err, files) {
		if (err) {
			return callback(err);
		}

		var bone_capemgr;
		files.forEach(function(f) {
			if (f.slice(0, 'bone_capemgr.'.length) === 'bone_capemgr.') {
				bone_capemgr = f;
				return false;
			}
		});

		if (bone_capemgr === undefined) {
			return callback(new Error('Can not find /sys/devices/bone_capemgr.*/slots'));
		}

		callback(null, '/sys/devices/' + bone_capemgr + '/slots');
	});
}

function ensureLoaded(fragment, callback) {

	slots(function(err, slots) {
		if (err) {
			return callback(err);
		}

		fs.readFile(slots, function(err, data) {
			if (err) {
				return callback(err);
			}

			var found = false;
			data.toString().split('\n').forEach(function(line) {
				if (line.search(fragment) != -1) {
					found = true;
					return false;
				}
			});

			if (!found) {
				fs.writeFile(slots, fragment, callback);
			} else {
				callback(null);
			}
		});
	});
}

function init(callback) {
	ensureLoaded('BB-BONE-PRU-01', function(err) {
		if (err) {
			return callback(err);
		}

		ensureLoaded('BB-ADC', function(err) {
			if (err) {
				return callback(err);
			}

			setTimeout(function() {
				try {
					callback(null, Capture());
				} catch(err) {
					return callback(err);
				}

			}, 500);  // FIXME: do we need this delay??
		});
	});
}

function Capture() {

	prussdrv.init();
	
	var capture = {
		OFF: {
			FLAG        : 0x0008,
			TIMER       : 0x0004,
			EMA_POW     : 0x001c,
			VALUES      : 0x0020,
			ENC0_PIN    : 0x0040,
			ENC1_PIN    : 0x0041,
			ENC0_THRESH : 0x0044,
			ENC1_THRESH : 0x0084,
			ENC0_VALUES : 0x0048,
			ENC1_VALUES : 0x0088,
			ENC0_TICKS  : 0x0054,
			ENC1_TICKS  : 0x0094,
			ENC0_SPEED  : 0x0058,
			ENC1_SPEED  : 0x0098,
			ENC0_DELAY  : 0x0060,
			ENC1_DELAY  : 0x00a0,
			SCOPE_ADDR  : 0x000c,
			SCOPE_OFFSET: 0x0010,
			SCOPE_SIZE  : 0x0014,
			DEBUG       : 0x0018
		}
	};

	[
		0xbeef1965,  // eye
		0,           // timer
		0,           // flags
		0,           // scope.addr
		0,           // scope.offset
		0,           // scope.length
		0,           // reserved
		0,           // ema_pow
		0,           // ain_ema[8]
		0,           //
		0,           //
		0,           //
		0,           //
		0,           //
		0,           //
		0,           //
		0x0000ffff,  // enc

		0,           // threshold
		0,           // raw
		0,           // min
		0,           // max
		0,           // ticks
		0,           // speed
		0,           // acc
		0,           // delay
		0,           // uptick_time
		0,           // downtick_time
		0,           // reserved[6]
		0,           //
		0,           //
		0,           //
		0,           //
		0,           //

		0,           // threshold
		0,           // raw
		0,           // min
		0,           // max
		0,           // ticks
		0,           // speed
		0,           // acc
		0,           // delay
		0,           // uptick_time
		0,           // downtick_time
		0,           // reserved[6]
		0,           //
		0,           //
		0,           //
		0,           //
		0            //
	].forEach(function(value, index) {
		prussdrv.setDataRAMInt(index, value);
	});

	function setWord(offset, value) {
		if (offset % 4 !== 0) {
			throw new Error('offset must be multiple of 4 (word-aligned)');
		}

		offset /= 4;
		prussdrv.setDataRAMInt(offset, value);
	}

	function getWord(offset) {
		if (offset % 4 !== 0) {
			throw new Error('offset must be multiple of 4 (word-aligned)');
		}

		offset /= 4;
		return prussdrv.getDataRAMInt(offset);		
	}

	capture.start = function() {
		prussdrv.execute(__dirname + '/firmware/firmware.bin');
	};

	capture.stop = function() {
		setWord(capture.OFF.FLAG, 1);  // exit flag
	};

	capture.close = function() {
		prussdrv.close();
	};

	capture.timer = function() {
		return getWord(capture.OFF.TIMER);
	};

	capture.ema_pow = function(value) {
		
		if (value === undefined) {
			return getWord(capture.OFF.EMA_POW);
		
		} else {
			
			if (value < 0 || value > 31) {
				throw new Error('value out of range (expected 0..31)');
			}

			setWord(capture.OFF.EMA_POW, value);
			return capture;
		}
	};

	capture.values = function() {
		return [
			getWord(capture.OFF.VALUES +  0),
			getWord(capture.OFF.VALUES +  4),
			getWord(capture.OFF.VALUES +  8),
			getWord(capture.OFF.VALUES + 12),
			getWord(capture.OFF.VALUES + 16),
			getWord(capture.OFF.VALUES + 20),
			getWord(capture.OFF.VALUES + 24),
			getWord(capture.OFF.VALUES + 28)
		];
	};

	capture.encoder0Pin = function(value) {

		if (value === undefined) {
			return getWord(capture.OFF.ENC0_PIN) & 0xff;
		} else {
			var packed = getWord(capture.OFF.ENC0_PIN) & 0xffffff00 + value & 0xff;
			setWord(capture.OFF.ENC0_PIN, packed);
			return capture;
		}
	};

	capture.encoder1Pin = function(value) {

		if (value === undefined) {
			return (getWord(capture.OFF.ENC0_PIN) >> 8) & 0xff;
		} else {
			var packed = (getWord(capture.OFF.ENC0_PIN) & 0xffff00ff) + ((value & 0xff) << 8);
			setWord(capture.OFF.ENC0_PIN, packed);
			return capture;
		}
	};

	capture.encoder0Threshold = function(value) {

		if (value === undefined) {
			return getWord(capture.OFF.ENC0_THRESH);
		} else {
			setWord(capture.OFF.ENC0_THRESH, value);
			return capture;
		}
	};

	capture.encoder1Threshold = function(value) {

		if (value === undefined) {
			return getWord(capture.OFF.ENC1_THRESH);
		} else {
			setWord(capture.OFF.ENC1_THRESH, value);
			return capture;
		}
	};

	capture.encoder0Values = function() {
		return [
			getWord(capture.OFF.ENC0_VALUES +  0),
			getWord(capture.OFF.ENC0_VALUES +  4),
			getWord(capture.OFF.ENC0_VALUES +  8),
			getWord(capture.OFF.ENC0_VALUES + 12),
			getWord(capture.OFF.ENC0_VALUES + 16)
		];
	};

	capture.encoder1Values = function() {
		return [
			getWord(capture.OFF.ENC1_VALUES +  0),
			getWord(capture.OFF.ENC1_VALUES +  4),
			getWord(capture.OFF.ENC1_VALUES +  8),
			getWord(capture.OFF.ENC1_VALUES + 12),
			getWord(capture.OFF.ENC1_VALUES + 16)
		];
	};

	capture.encoder0Delay = function(value) {

		if (value === undefined) {
			return getWord(capture.OFF.ENC0_DELAY);

		} else {
			setWord(capture.OFF.ENC0_DELAY, value);
		}
	};

	capture.encoder1Delay = function(value) {

		if (value === undefined) {
			return getWord(capture.OFF.ENC1_DELAY);

		} else {
			setWord(capture.OFF.ENC1_DELAY, value);
		}
	};

	capture.encoder0Ticks = function() {
		return getWord(capture.OFF.ENC0_TICKS);
	};

	capture.encoder1Ticks = function() {
		return getWord(capture.OFF.ENC1_TICKS);
	};

	capture.encoder0Speed = function() {
		return getWord(capture.OFF.ENC0_SPEED);
	};

	capture.encoder1Speed = function() {
		return getWord(capture.OFF.ENC1_SPEED);
	};

	return capture;
}

module.exports = init;
