node-pru-adc
============

Fast analog sensor capture for Beaglebone Black

See sibling Python module [beaglebone_pru_adc](http://github.com/pgmmpk/beaglebone_pru_adc) for better documentation.

This module is a JavaScript port of *beaglebone_pru_adc*.

Sample use
----------

{% highlight javascript %}

var pruadc = require('pru-adc');

pruadc(function(err, capture) {
	if (err) {
		return console.log('sadly, it did not work', err);
	}

	// just print timer ticks once a second (should grow at approx 120000 ticks per second)
	var counter = 1000;
	(function ontimer() {
		console.log('pru-adc timer ticks:', capture.timer());

		if (--counter >= 0) {
			setTimeout(ontimer, 1000);
		}
	})();
}
	
});

{% endhighlight %}
