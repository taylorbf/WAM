#WAM: Web Audio Modules

![Demo Image](pic.png)
<br>*A sine oscillator module connected to a delay module*

**WAM** is a collection of modular computer music components –– each including an audio engine & GUI –– built by web audio community members.

WAM is designed to assist building expressive musical instruments in the browser.


## Assigning Context

If using Tone:

```js
WAM.setContext( Tone.Context )
```

## Building an Instrument using WAM Modules

#### Individually

Individual modules can be created using **WAM.*moduleName*()** and connected using `.connect()`

```js
var mySine = WAM.sine()
var myDelay = WAM.delay()
mySine.connect(myDelay)
myDelay.connect( WAM.out() )
```

#### Chaining (recommended)

Groups of modules can created and chained using `WAM.route()`. This way you don't need to `.connect()` every module.

```js
var rack1 = WAM.route([
	WAM.sine(),
	WAM.delay(),
	WAM.out()
])
```

Creates the audiograph:

(audiograph1 image goes here)

More complex audiographs can be created using WAM.join()

```js
var rack1 = WAM.route([
	WAM.join( WAM.sine(), WAM.sine(), WAM.sine() ),
	WAM.delay(),
	WAM.out()
])
```

Creates the audiograph:

(audiograph1 image goes here)

You can also connect routes together.

```js

var rack1 = WAM.route([
	WAM.join( WAM.sine(), WAM.sine(), WAM.sine() ),
	WAM.delay()
])

var rack2 = WAM.route([
	WAM.join( WAM.sine(), WAM.sine(), WAM.sine() ),
	WAM.delay()
])

var rack3 = WAM.route([
	WAM.reverb(),
	WAM.out()
])

rack1.connect(rack3)
rack2.connect(rack3)
```


## Contributing Modules

**All users are encouraged to add modules to WAM. I am accepting all pull requests of working modules.** 

Modules are designed in JSON format within WAM.js. The JSON for the sine oscillator module looks like this:

```js
Modules.sine = { 
	dependencies: [ "Tone" ],
	size: {
		w: 80,
		h: 52
	},
	audio: function() {
		this.toneosc = new Tone.Oscillator(440, "sine").start();
		this.toneosc.connect(this.output)
	},
	interface: [
		{
			type: "dial",
			label: "freq",
			action: function(data) {
				this.toneosc.frequency.value = data.value * 1000
			},
			size: {
				w: 40,
				h: 40
			},
			loc: {
				x: 0,
				y: 0
			}
		},
		{
			type: "dial",
			label: "vol",
			action: function(data) {
				this.toneosc.volume.value = -100 + data.value*100
			},
			size: {
				w: 40,
				h: 40
			},
			loc: {
				x: 40,
				y: 0
			}
		}
	]
}
```
