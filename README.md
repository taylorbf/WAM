#WAM: Web Audio Modules

![Demo Image](images/pic.png)
<br>*A sine oscillator module connected to a delay module*

**WAM** is a collection of modular computer music components –– each including an audio engine & GUI –– built by web audio community members.

WAM is designed to assist building expressive musical instruments in the browser.


## Building an Instrument

#### Assigning Context

Given a context *ctx*:

```js
WAM.setContext( ctx )
```



#### Invoking Individual Modules

Individual modules can be added to your project using **WAM.*moduleName*()** and connected to each other (or to any web audio node) using `.connect()`

```js
var mySine = WAM.sine()
var myDelay = WAM.delay()
mySine.connect(myDelay)
myDelay.connect( WAM.out() )
```

By default, modules are positioned on the page relative to each other, within the flow of the document. To place a module precisely on the page, specify x/y when creating the module. `WAM.sine(100,200)` will create a module 100 px from the left and 200 px from the top of the document.

#### Chaining Modules (recommended)

Groups of modules can be created and chained using `WAM.route()`. This way you don't need to `.connect()` every module.

```js
var rack1 = WAM.route([
	WAM.sine(),
	WAM.delay(),
	WAM.out()
])
```

Creates the audiograph:

![AudioGraph](images/graph1.png)

More complex audiographs can be created using WAM.join()

```js
var rack1 = WAM.route([
	WAM.join( WAM.sine(), WAM.sine(), WAM.sine() ),
	WAM.delay(),
	WAM.out()
])
```

...creates the audiograph:

![AudioGraph](images/graph2.png)

and this...

```js
var rack1 = WAM.route([
	WAM.join( WAM.sine(), WAM.sine(), WAM.sine() ),
	WAM.join( WAM.delay(), WAM.delay() ),
	WAM.out()
])
```

...creates the audiograph:

![AudioGraph](images/graph3.png)

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

Modules are written as JS object literals within WAM.js. Each object follows the same pattern of properties and methods.

The sine oscillator module looks like this:

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
			location: {
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
			location: {
				x: 40,
				y: 0
			}
		}
	]
}
```

## Anatomy of a Module

Each module has the following properties, which may be useful:

##### this.input

Gain node forming the audio input to the current module. This is connected to by other modules.

##### this.output

Gain node forming the audio output of the current module. This connects to ther modules.

##### this.shell

The &lt;div&gt; containing the module.

##### this.components

An array of the NexusUI interface components in this module.

##### this.type

The type of this module (i.e. "sine").


## Anatomy of WAM


##### WAM.context

AudioContext, set with `WAM.setContext()`

##### WAM.modules

Array of modules created within the current project.

