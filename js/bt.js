mt = {}


/*  @method  toPolar
    @description Receives cartesian coordinates and returns polar coordinates as an object with 'radius' and 'angle' properties.
    @param {float} [x] 
    @param {float} [y] 
*/
mt.toPolar = function(x,y) {
  var r = Math.sqrt(x*x + y*y);

  var theta = Math.atan2(y,x);
  if (theta < 0.) {
    theta = theta + (2 * Math.PI);
  }
  return {radius: r, angle: theta};
}

/*  @method  toCartesian
    @description Receives polar coordinates and returns cartesian coordinates as an object with 'x' and 'y' properties.
    @param {float} [radius] 
    @param {float} [angle] 
*/
mt.toCartesian = function(radius, angle){
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  return {x: radius*cos, y: radius*sin*-1};
}


/*  @method  clip
    @description Limits a number to within low and high values.
    @param {float} [input value] 
    @param {float} [low limit] 
    @param {float} [high limit]
*/
mt.clip = function(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

/*  @method prune
    @description Limits a float to within a certain number of decimal places
    @param {float} [input value] 
    @param {integer} [max decimal places] 
*/

mt.prune = function(data, scale) {
  if (typeof data === "number") {
    data = parseFloat(data.toFixed(scale));
  } else if (data instanceof Array) {
    for (var i=0;i<data.length;i++) {
      if (typeof data[i]=="number") {
        data[i] = parseFloat(data[i].toFixed(scale));
      }
    }
  }
  return data;
}


/** @method scale 
    @description Scales an input number to a new range of numbers
    @param {float} [input value] 
    @param {float} [low1]  input range (low)
    @param {float} [high1] input range (high)
    @param {float} [low2] output range (low)
    @param {float} [high2] output range (high)
    ```js
    nx.scale(5,0,10,0,100) // returns 50
    nx.scale(5,0,10,1,2) // returns 1.5
    ```
*/
mt.scale = function(inNum, inMin, inMax, outMin, outMax) {
  return (((inNum - inMin) * (outMax - outMin)) / (inMax - inMin)) + outMin;  
}

/** @method invert 
    @description Equivalent to nx.scale(input,0,1,1,0). Inverts a normalized (0-1) number. 
    @param {float} [input value]  
    
*/
mt.invert = function (inNum) {
  return scale(inNum, 1, 0, 0, 1);
}


/** @method mtof 
    @description MIDI to frequency conversion. Returns frequency in Hz.
    @param {float} [MIDI] MIDI value to convert
    
*/
mt.mtof = function(midi) {
  return Math.pow(2, ((midi-69)/12)) * 440;
}




/** @method interp 
    @description Interpolate between two numbers, using 0-1 as input. 
    @param {float} [lookup]  0-1 location between values  
    @param {float} [point1]  value to interpolate from (0) 
    @param {float} [point2]  value to interpolate to (1)   
*/
mt.interp = function(loc,min,max) {
  return loc * (max - min) + min;  
}

/* @method rcolor 
  @description Get a random color value   
*/
mt.rcolor = function() {
  return "rgb(" + mt.random(255) + "," + mt.random(255) + "," + mt.random(255) + ")";
}



mt.VariableSpeedInterval = function(rate,func) {
	this.rate = rate
	this.on = true;
	this.event = func ? func : function() { };
	this.pulse = function() {
		if (this.on) {
			this.time.last = new Date().getTime()
			this.event();
			//var delay = force ? force : this.rate
			this.timeout = setTimeout(this.pulse.bind(this),eval(this.rate))
		}
	}
	this.stop = function() {
		this.on = false;
	}
	this.start = function() {
		this.on = true;
		this.pulse();
	}
	this.time = {
		last: false,
		cur: false
	}
	this.ms = function(newrate) {
		var oldrate = this.rate;
		this.rate = newrate;

		this.time.cur = new Date().getTime()
		if (this.time.cur - this.time.last > newrate) {
			clearTimeout(this.timeout)
			this.pulse();
		} else if (newrate < oldrate) {
			clearTimeout(this.timeout)
			var delay = this.rate - (this.time.cur - this.time.last);
			if (delay < 0 ) { delay = 0 }
			this.timeout = setTimeout(this.pulse.bind(this),delay)
		}
	}
	this.start();
}


/*
 * @method interval 
 * @description  interval with controllable speed / interval time
 * @param {number} [rate] 
 * @param {function} [callback]
 */
mt.interval = function(rate,func) {
	var _int = new mt.VariableSpeedInterval(rate,func)
	return _int;
}

/* use like this:
    // func is optional
	var x = interval(50, function() {   bla ... })
	x.ms(100);
	x.stop()
	// later
	x.start()
	//can change function midway
	x.event = function() { ... }

*/


/**
 * Returns a random entry from the arguments
 */
mt.pick = function() {

  return arguments[mt.random(arguments.length)]

}

/**
 * A major scale
 * @type {Array}
 */
mt.major = [1/1,9/8,5/4,4/3,3/2,5/3,15/8]

/**
 * returns an octave multiplier (i.e. octave(0) return 1, octave (-1) returns 0.5)
 * @param  {integer} num Octave
 */
mt.octave = function(num) {
  return Math.pow(2,num)
}



mt.getCol = function(index,limit) {
  return index%limit;
}

mt.getRow = function(index,limit) {
  return Math.floor(index/limit);
}

mt.pick = function(array) {
  return array[mt.random(array.length)];
}


/** @method r 
    @description Returns a random integer between two given scale parameters. If only one argument, uses 0 as the minimum.
    @param {float} [min] Lower limit of random range. 
    @param {float} [max] Upper limit of random range.   
*/
mt.r = mt.random = function(bound1,bound2) {
  if (!bound2) {
    bound2 = bound1
    bound1 = 0
  }
  var low = Math.min(bound1,bound2)
  var high = Math.max(bound1,bound2)
  return Math.floor(Math.random()*(high-low)+low)
}
/** @method rf
    @description Returns a random float between 0 and a given scale parameter. If only one argument, uses 0 as the minimum.
    @param {float} [min] Lower limit of random range. 
    @param {float} [max] Upper limit of random range.   
*/
mt.rf = function(bound1,bound2) {
  if (!bound2) {
    bound2 = bound1
    bound1 = 0
  }
  var low = Math.min(bound1,bound2)
  var high = Math.max(bound1,bound2)
  return Math.random()*(high-low)+low
}

/** @method cycle 
    @description Count a number upwards until it reaches a maximum, then send it back to a minimum value.<br>
    I.e. cycle(x,0,5) will output 0,1,2,3,4,5,0,1,2... if called many times in succession
    @param {float} [min] Lower limit of random range.
    @param {float} [min] Lower limit of random range. 
    @param {float} [max] Upper limit of random range.   
*/
mt.cycle = function(input,min,max) {
  input++;
  if (input >= max) {
    input = min;
  }
  return input;
}

mt.loadScript = function (url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    script.onreadystatechange = callback;
    script.onload = callback;

    head.appendChild(script);
}


window.SmartMatrix = function(cols,rows) {

  this.rows = rows;
  this.cols = cols;

  this.row = 0;
  this.col = 0;

  this.index = 0;
  this.max = this.rows * this.cols;

  this.advance = function() {
  
    this.index++;

    if (this.index >= this.max ) {
      this.index = 0;
    }

    this.getCoordinate(this.index);

  }

  this.getCoordinate = function(index) {
    this.index = index;
    this.row = Math.floor(index/this.cols)
    this.col = index - (this.row * this.cols)
    this.ping();
  }

  this.ping = function() {
    return {
      row: this.row,
      col: this.col
    }
  }

  this.advanceRow = function() {
    this.row++
    if (this.row >= this.rows) {
      this.row = 0
    }
    this.setIndex()
    this.ping()
  }

  this.advanceCol = function() {
    this.col++
    if (this.col >= this.cols) {
      this.col = 0
    }
    this.setIndex()
    this.ping()
  }

  this.setIndex = function() {
    this.index = this.col + (this.row * this.cols)
  }

  //have a 'translate index to row' func, same for col
  //have a 'step through' function that returns an object with next row/col
  //have a 'step row' that goes to next in row, then cycles around
  //have a 'steo col' that goes through col and cycles around

}
