
var Wam = function(Modules) {

	this.context;
	this.modules = []

	this.colors = {
		body: "#090909",
		title: "#0bc",
		module: "#191919",
		label: "#0bc",
		text: "#000"
	}

	nx.onload = function() {
		nx.colorize("#0bc")
		nx.colorize("fill","#292929")
	}

	for (var key in Modules) {
		this[key] = this.make.bind(this,key)
	}

}

Wam.prototype.init = function() {
	document.body.style.backgroundColor = this.colors.body
}


Wam.prototype.setContext = function(context) {
	this.context = context
}

Wam.prototype.out = function() {
	return { input: this.context.destination }
}

Wam.prototype.route = function(path) {
	for (var i=0;i<path.length;i++) {
		if (i<path.length-1) {
			path[i].output.connect(path[i+1].input)
		}
	}
	var ports = {
		input: path[0].input,
		output: path[path.length-1].output,
		connect: function(out,destination) {
			if (destination.input) {
				out.connect(destination.input)
			} else {
				out.connect(destination)
			}
		}.bind(this,path[path.length-1].output)
	}
	return ports
}
Wam.prototype.join = function() {
	var args = Array.prototype.slice.call(arguments);
	var ports = {
		input: this.context.createGain(),
		output: this.context.createGain()
	}
	for (var i=0;i<args.length;i++) {
		ports.input.connect(args[i].input)
		args[i].output.connect(ports.output)
	}
	return ports
}
Wam.prototype.make = function(type,x,y) {
	var module = new this.rack(type,x,y)
	this.modules.push( module )
	return module

}

Wam.prototype.rack = function (type,x,y) {

	/* create container */

	this.type = type
	this.components = []

	var parent = document.body

	var module = Modules[type]
	var parts = module.interface;

	this.shell = document.createElement("div")
	this.shell.style.border = "solid 1px black"
	this.shell.style.backgroundColor = WAM.colors.module
	this.shell.style.color = WAM.colors.text
	this.shell.style.position = "relative"
	this.shell.style.padding = "15px 5px 4px 5px"
	this.shell.style.display = "inline-block"
	this.shell.style.fontSize = "9px"
	this.shell.style.fontFamily = "helvetica neue"
	this.shell.style.margin = "-1px 0px 0px -1px"
	if (x || y || x==0 || y==0) {
		this.shell.style.position = "absolute"
		this.shell.style.top = y+5+"px"
		this.shell.style.left = x+5+"px"
	}

	parent.appendChild(this.shell)


	var title = document.createElement("div")
	title.style.position="absolute"
	title.style.top="0px"
	title.style.left="0px"
	title.style.width="100%"
	if (module.color) {
		title.style.backgroundColor = WAM.colors.title
		title.style.color = WAM.colors.text
	} else {
		title.style.backgroundColor = WAM.colors.title
		title.style.color = WAM.colors.text
	}

	title.style.letterSpacing = "1px"
	title.style.padding="1px 0px"
	title.style.overflow="hidden"
	title.style.boxSizing="border-box"
	title.style.textAlign="center"
	title.innerHTML = type
	this.shell.appendChild(title)

	var container = document.createElement("div")
	container.style.position = "relative"
	//container.id = rackid

	container.style.width = module.size.w + "px"
	container.style.height = module.size.h + "px"

	this.shell.appendChild(container)

	/* create inputs & outputs & connect() */

	this.input = WAM.context.createGain()
	this.output = WAM.context.createGain()

	this.connect = function(destination,chIn,chOut) {
		this.output.connect(destination.input,chIn,chOut)
	}

	this.events = {}

	this.emit = function(eventType,value) {
		if (this.events[eventType]) {
			var cbs = this.events[eventType]
			for (var i=0;i<cbs.length;i++) {
				cbs[i](value)
			}
		}
	}

	this.on = function(eventType,cb) {
		if (eventType in this.events) {
			this.events[eventType].push(cb)
		} else {
			this.events[eventType] = [ cb ]
		}
	}

	/* create custom module api */

	if (module.custom) {
		for (var key in module.custom) {
			console.log(key)
			this[key] = module.custom[key].bind(this)
			console.log(this)
		}
	}

	/* create interface */

	for (var i=0;i<parts.length;i++) {

		var col = document.createElement("div")

		col.style.position = "absolute"
		col.style.left = parts[i].loc.x + "px"
		col.style.top = parts[i].loc.y + "px"

		container.appendChild(col)

		var widget = nx.add(parts[i].type,{
			parent: col,
			w: parts[i].size ? parts[i].size.w : false,
			h: parts[i].size ? parts[i].size.h : false
		});

		widget.canvas.style.position = "relative"
		widget.canvas.style.display = "block"
		widget.canvas.style.margin = "0 auto"

		var action = parts[i].action
		action = action.bind(this)

		widget.on('*', action)

		if (parts[i].label) {
			var label = document.createElement("div")
			label.innerHTML = parts[i].label
			label.style.textAlign = "center"
			label.style.backgroundColor = WAM.colors.label
			label.style.color = WAM.colors.text
			label.style.border = "solid 1px #000"

			col.appendChild(label)
		}

		this.components.push(widget)

	}

	/* create audio */

	module.audio.bind(this)()

	/* init interface */

	for (var i=0;i<parts.length;i++) {

		if (parts[i].init) {
			parts[i].init.bind(this.components[i])();
		}
		if (parts[i].initial) {
			this.components[i].set(parts[i].initial, true)
		}

	}

	/* return the module */

	return this

}



Modules = {
	"sine": {
		size: {
			w: 200,
			h: 50
		},
		audio: function() {
			this.toneosc = new Tone.Oscillator(0, "triangle").start();
			this.toneosc.connect(this.output)
			this.output.gain.value = 0.2
			this.frequency = 0
			this.freq = function(freq) {
				if (freq>0) {
					this.components[0].set({value: freq/1000}, true)
				}
			}
			this.vol = function(amp) {
				if (amp>=0) {
					this.components[1].set({value: amp}, true)
				}
			}
			this.start = function() {
				this.toneosc.start()
			}
			this.stop = function() {
				this.toneosc.pause()
			}
		},
		interface: [
		{
			type: "dial",
			label: "freq",
			action: function(data) {
				this.toneosc.frequency.setValueAtTime(data.value * 1000,0)
			},
			initial: {
				value: 0
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
				this.toneosc.volume.value = -50 + data.value*60
			},
			initial: {
				value: 0.75
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
	]},
	"delay": {
		dependencies: [ "Tone" ],
		color: "#1bd",
		size: {
			w: 80,
			h: 50
		},
		audio: function() {
			this.delayline = new Tone.FeedbackDelay(0.25, 0.8)
			this.delayline.connect(this.output)
			this.input.connect(this.delayline)
			this.input.connect(this.output)
		},
		interface: [
		{
			type: "dial",
			label: "fb",
			action: function(data) {
				this.delayline.feedback.value = data.value
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
			label: "time",
			action: function(data) {
				this.delayline.delayTime.value = data.value + 0.01
			},
			size: {
				w: 40,
				h: 40
			},
			init: function() {
			},
			loc: {
				x: 40,
				y: 0
			}
		}
	]},
	"btLooper": {
		dependencies: [ "Tone" ],
		size: {
			w: 200,
			h: 110
		},
		audio: function() {
			this.player = new Tone.Player()
			this.player.loop = true
			this.player.connect(this.output)
		},
		custom: {
			"setFiles": function(list) {
				this.components[1].choices = [];
				this.components[1].init()
				this.components[1].choices = list;
				this.components[1].init()
				this.player.load("./audio/"+list[0],function() {
					this.components[2].setBuffer( this.player._buffer._buffer )
				}.bind(this))
				return this
			}
		},
		interface: [
		{
			type: "toggle",
			label: "",
			action: function(data) {
				if (data.value) {
					this.player.start()
				} else {
					this.player.stop()
				}
			},
			size: {
				w: 20,
				h: 20
			},
			loc: {
				x: 0,
				y: 1
			}
		},
		{
			type: "select",
			label: "",
			action: function(data) {
				if (data.text) {
					this.player.load("./audio/"+data.text,function() {
						this.components[2].setBuffer( this.player._buffer._buffer )
					}.bind(this))
				}
			},
			size: {
				w: 178,
				h: 20
			},
			loc: {
				x: 23,
				y: 1
			},
			init: function() {
			}
		},
		{
			type: "waveform",
			label: "",
			action: function(data) {
				this.player.setLoopPoints(data.starttime/1000, data.stoptime/1000)
			},
			size: {
				w: 200,
				h: 85
			},
			init: function() {
			},
			loc: {
				x: 0,
				y: 25
			}
		}
	]},
	"meter": {
		size: {
			w: 25,
			h: 50
		},
		audio: function() {
			this.components[0].setup(WAM.context,this.input);
			this.input.connect(this.output)
		},
		interface: [
		{
			type: "meter",
			label: "db",
			action: function(data) {

			},
			size: {
				w: 20,
				h: 40
			},
			loc: {
				x: 3,
				y: 0
			}
		}
	]},
	"enveloop": {
		size: {
			w: 130,
			h: 50
		},
		audio: function() {
			this.input.connect(this.output)
			this.components[0].looping = true
			this.components[0].start()
		},
		interface: [
		{
			type: "envelope",
			label: "volume",
			action: function(data) {
				this.input.gain.value = data.amp
			},
			size: {
				w: 90,
				h: 40
			},
			loc: {
				x: 0,
				y: 0
			}
		},
		{
			type: "dial",
			label: "dur",
			action: function(data) {
				this.components[0].duration = data.value * 3000 + 10
			},
			size: {
				w: 40,
				h: 40
			},
			loc: {
				x: 90,
				y: 0
			}
		}
	]},
	"scratch": {
		// needs custom function for loadfile
		size: {
			w: 100,
			h: 100
		},
		audio: function() {
			this.player = new Tone.Player()
			this.player.loop = true
			this.player.load("./audio/beat.mp3",function() {
				this.player.start()
			}.bind(this))
			this.player.connect(this.output)
		},
		interface: [
		{
			type: "vinyl",
			label: "",
			action: function(data) {
				if (data.speed) {
					if (data.speed < 0 && !this.player.reverse) {
						this.player.reverse = true;
					} else if (data.speed >= 0 && this.player.reverse) {
						this.player.reverse = false;
					}
					data.speed = Math.abs(data.speed)
					this.player.playbackRate = data.speed
				}
			},
			size: {
				w: 100,
				h: 100
			},
			loc: {
				x: 0,
				y: 0
			}
		}
	]},
	"mixer4ch": {
		size: {
			w: 200,
			h: 100
		},
		audio: function() {
			this.input = WAM.context.createChannelMerger(4);
			this.splitter = WAM.context.createChannelSplitter(4);

			this.input.connect(this.splitter)

			this.panvol1 = new Tone.PanVol(0.5, -2);
			this.panvol2 = new Tone.PanVol(0.5, -2);
			this.panvol3 = new Tone.PanVol(0.5, -2);
			this.panvol4 = new Tone.PanVol(0.5, -2);
			this.components[8].setup(WAM.context,this.panvol1.output.output);
			this.components[9].setup(WAM.context,this.panvol2.output.output);
			this.components[10].setup(WAM.context,this.panvol3.output.output);
			this.components[11].setup(WAM.context,this.panvol4.output.output);
			this.splitter.connect(this.panvol1,0)
			this.splitter.connect(this.panvol2,1)
			this.splitter.connect(this.panvol3,2)
			this.splitter.connect(this.panvol4,3)


			this.panvol1.output.connect(this.output)
			this.panvol2.output.connect(this.output)
			this.panvol3.output.connect(this.output)
			this.panvol4.output.connect(this.output)

		},
		interface: [
		{
			type: "slider",
			label: "1",
			action: function(data) {
				this.panvol1.volume.value = -50 + data.value*50
			},
			size: {
				w: 20,
				h: 90
			},
			loc: {
				x: 0,
				y: 0
			}
		},
		{
			type: "slider",
			label: "2",
			action: function(data) {
				this.panvol2.volume.value = -50 + data.value*50
			},
			size: {
				w: 20,
				h: 90
			},
			loc: {
				x: 50,
				y: 0
			}
		},
		{
			type: "slider",
			label: "3",
			action: function(data) {
				this.panvol3.volume.value = -50 + data.value*50
			},
			size: {
				w: 20,
				h: 90
			},
			loc: {
				x: 100,
				y: 0
			}
		},
		{
			type: "slider",
			label: "4",
			action: function(data) {
				this.panvol4.volume.value = -50 + data.value*50
			},
			size: {
				w: 20,
				h: 90
			},
			loc: {
				x: 150,
				y: 0
			}
		},
		{
			type: "dial",
			label: "pan",
			action: function(data) {
				this.panvol1.pan.value = data.value
			},
			size: {
				w: 25,
				h: 25
			},
			loc: {
				x: 23,
				y: 0
			}
		},
		{
			type: "dial",
			label: "pan",
			action: function(data) {
				this.panvol2.pan.value = data.value
			},
			size: {
				w: 25,
				h: 25
			},
			loc: {
				x: 73,
				y: 0
			}
		},
		{
			type: "dial",
			label: "pan",
			action: function(data) {
				this.panvol3.pan.value = data.value
			},
			size: {
				w: 25,
				h: 25
			},
			loc: {
				x: 123,
				y: 0
			}
		},
		{
			type: "dial",
			label: "pan",
			action: function(data) {
				this.panvol4.pan.value = data.value
			},
			size: {
				w: 25,
				h: 25
			},
			loc: {
				x: 173,
				y: 0
			}
		},
		{
			type: "meter",
			label: "db",
			action: function(data) {

			},
			size: {
				w: 20,
				h: 50
			},
			loc: {
				x: 25,
				y: 40
			}
		},
		{
			type: "meter",
			label: "db",
			action: function(data) {

			},
			size: {
				w: 20,
				h: 50
			},
			loc: {
				x: 75,
				y: 40
			}
		},
		{
			type: "meter",
			label: "db",
			action: function(data) {

			},
			size: {
				w: 20,
				h: 50
			},
			loc: {
				x: 125,
				y: 40
			}
		},
		{
			type: "meter",
			label: "db",
			action: function(data) {

			},
			size: {
				w: 20,
				h: 50
			},
			loc: {
				x: 175,
				y: 40
			}
		}
	]},
	"FMSeq": {
		size: {
			w: 240,
			h: 185
		},
		audio: function() {
			this.unit = new Tone.PolySynth(4, Tone.FMSynth);
			this.unit.connect(this.output)
		},
		interface: [
		{
			label: "volume",
			type: "dial",
			action: function(data) {
				this.unit.volume.rampTo(-50+data.value*50,1);
			},
			initial: {
				"value": 0.75
			},
			size: {
				w: 40,
				h: 40
			},
			loc: {
				x: 0,
				y: 0
			}
		},{
			label: "harm",
			type: "dial",
			action: function(data) {
				this.unit.harmonicity.value = data.value*5;
			},
			size: {
				w: 40,
				h: 40
			},
			loc: {
				x: 40,
				y: 0
			}
		},{
			label: "mod",
			type: "dial",
			action: function(data) {
				this.unit.modulationIndex.value = data.value*100;
			},
			size: {
				w: 40,
				h: 40
			},
			loc: {
				x: 80,
				y: 0
			}
		},{
			label: "glide",
			type: "dial",
			action: function(data) {
				this.unit.portamento = data.value;
			},
			size: {
				w: 40,
				h: 40
			},
			loc: {
				x: 120,
				y: 0
			}
		},{
			label: "pitch",
			type: "matrix",
			action: function(data) {
				var major = [0,2,4,5,7,9,11,12]
				if (data.list) {
					for (var i=0;i<data.list.length;i++) {
						if (data.list[i]) {
							var note = nx.mtof(major[i]+48)
							this.unit.triggerAttackRelease(note,'64n')
						}
					}
				}
			},
			size: {
				w: 240,
				h: 120
			},
			loc: {
				x: 0,
				y: 55
			},
			init: function() {
				this.col = 16;
				this.row = 8;
				this.init();
				this.sequence(240)
				/*Tone.Transport.setTimeout(function(time){
					this.ToneInt = Tone.Transport.setInterval(function(time){
					    this.jumpToCol(this.place)
					    this.place++;
					    if (this.place>=this.col) {
					    	this.place=0;
					    }
					}.bind(this), "24n");
				}.bind(this),Tone.Transport.nextBeat('1n')) */
			}
		}
	]},
	"microphone": {
		size: { w: 80 , h: 50 },
		audio: function() {
			this.unit = new Tone.Microphone()
			this.unit.connect(this.output)
		},
		interface: [
		{
			label: "volume",
			type: "dial",
			action: function(data) {
				this.unit.volume.value = -50 + data.value*50;
			},
			initial: {
				value: 0.5
			},
			size: { w: 40 , h: 40 },
			loc: { x: 0 , y: 0 }
		},
		{
			label: "on",
			type: "toggle",
			action: function(data) {
				if (data.value) {
					this.unit.start();
				} else {
					this.unit.stop();
				}
			},
			size: { w: 40 , h: 40 },
			loc: { x: 40 , y: 0 }
		}
	]},
}



Modules.clix = {
	size: { w: 375 , h: 150 },
	audio: function() {
		//this.noise = new Tone.Oscillator(0.01,"square").start()
	//	this.noise = new Tone.Player("./audio/click.mp3")
	//	this.noise.retrigger = true
		this.env = new Tone.AmplitudeEnvelope(0.02,0,1,0.02)
		this.noise = new Tone.Signal(1);
		this.filter = new Tone.Filter()
		this.reverb = new Tone.JCReverb(0.3)
		this.gain = new Tone.Volume(47);
		this.reverb.wet.value = 0.1
		this.filter.type = "bandpass"
		this.filter.Q.value = 50
		this.filter.gain.value = 1
		this.noise.connect(this.filter)
		this.filter.connect(this.env)
		this.env.connect(this.gain)
		this.gain.connect(this.reverb)
		this.reverb.connect(this.output)

		this.queue = []
		this.beat = 0;
		this.gains = [1.0, 0.2, 0.3, 0.2, 0.4, 0.1, 0.2, 0.1,
					  0.5, 0.1, 0.3, 0.2, 0.4, 0.1, 0.2, 0.1,
					  0.8, 0.1, 0.3, 0.2, 0.5, 0.1, 0.2, 0.1,
					  0.4, 0.1, 0.3, 0.2, 0.3, 0.1, 0.2, 0.1 ]

		this.interval = setInterval(function() {
			this.beat++;
			this.beat %= 32
			if (this.queue[0]) {
				this.filter.frequency.setValueAtTime(nx.mtof(this.queue[0]),0);
				if (this.noise.value==1) {
					this.noise.setValueAtTime(-1);
					this.env.triggerAttackRelease(0.01,"+0.01",this.gains[this.beat])
				} else {
					this.noise.setValueAtTime(1);
					this.env.triggerAttackRelease(0.01,"+0.01",this.gains[this.beat])
				}
				this.queue = this.queue.slice(1)
			}
		}.bind(this), 100)
	},
	interface: [
	{
		label: "",
		type: "typewriter",
		action: function(data) {
			console.log(data)
			if (data.key=="shift") {
				if (data.on) {
					this.shift = true;
				} else {

					this.shift = false;
				}
			}
			if (data.on) {
				var octave = this.shift ? 12 : 24;
				this.queue.push(data.ascii + octave);
			}
		},
		size: { w: 375 , h: 150 },
		loc: { x: 0 , y: 0 }
	}]
}

Modules.metro = {
	size: { w: 200 , h: 25 },
	audio: function() {
		this.range = [ 100, 100 ]
		this.pulse = mt.interval(100)
		this.pulse.stop()
		this.pulse.event = function() {
			this.pulse.ms( mt.random(this.range[0],this.range[1]) )
			this.emit('bang',1)
			this.components[1].set({press: !this.components[1].val.press})
		}.bind(this)
	},
	interface: [
	{
		type: "toggle",
		action: function(data) {
			if (data.value) {
				this.pulse.start()
				this.emit('on',1)
			} else {
				this.pulse.stop()
				this.components[1].set({press: 0})
				this.emit('off',1)
			}
		},
		size: { w: 25 , h: 25 },
		loc: { x: 0 , y: 0 }
	},
	{
		type: "button",
		action: function(data) {
		},
		size: { w: 25 , h: 25 },
		loc: { x: 30 , y: 0 }
	},
	{
		type: "range",
		action: function(data) {
			this.range = [data.start*10000,data.stop*10000]
		},
		size: { w: 100 , h: 20 },
		loc: { x: 60 , y: 3 }
	},

	/*{
		type: "number",
		action: function(data) {
		},
		size: { w: 50 , h: 20 },
		loc: { x: 60 , y: 3 }
	},
	{
		type: "number",
		action: function(data) {
		},
		size: { w: 50 , h: 20 },
		loc: { x: 115 , y: 3 }
	} */
	]
}


Modules.pitchmatrix = {
	size: { w: 200 , h: 120 },
	audio: function() {
		//	this.emit('bang',1)
		//	this.components[1].set({press: !this.components[1].val.press})
		this.activeNotes = []
		this.major = [0,2,4,5,7,9,11,12]
		this.dump = function() {
			this.emit('dump',this.activeNotes)
		}
	},
	interface: [
		{
			type: "matrix",
			action: function(data) {
				var degree = data.col
				var octave = data.row
				var freq = mt.mtof(this.major[degree]+octave*12+24)
				if (data.level) {
					this.activeNotes.push(freq)
				} else {
					var noteIndex = this.activeNotes.indexOf(freq)
					this.activeNotes.splice(noteIndex,1)
				}
			},
			size: { w: 200, h: 120 },
			loc: { x: 0, y: 0 },
			init: function() {
				this.col = 8;
				this.row = 5;
				this.init()
			}
		}
	],
	api: {
		dump: function() {
			this.emit('dump',this.activeNotes)
		},
		pick: function() {

		}
	}
}




var WAM = new Wam(Modules);
