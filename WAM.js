
var Wam = function(Modules) {

	this.context;
	this.modules = []

	nx.onload = function() {
		nx.colorize("black")
	}

	for (var key in Modules) {
		this[key] = this.make.bind(this,key)
	}

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
/*
Wam.prototype.route = function(path) {
	for (var i=0;i<path.length;i++) {
		if (Array.isArray(path[i])) {
			path[i] = WAM.route(path[i])
		}
		if (i<path.length-1) {
			path[i].output.connect(path[i+1].input)
		}
	}
	var ports = {
		input: path[0].input,
		output: path[path.length-1].output
	}

	return ports

} */
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
	this.shell.style.position = "relative"
	this.shell.style.padding = "20px 5px 5px 5px"
	this.shell.style.display = "inline-block"
	this.shell.style.fontSize = "10px"
	this.shell.style.fontFamily = "helvetica neue"
	this.shell.style.margin = "-1px 0px 0px -1px"
	if (x || y || x==0 || y==0) {
		this.shell.style.position = "absolute"
		this.shell.style.top = y+"px"
		this.shell.style.left = x+"px"
	}

	parent.appendChild(this.shell)


	var title = document.createElement("div")
	title.style.position="absolute"
	title.style.top="0px"
	title.style.left="0px"
	title.style.width="100%"
	title.style.backgroundColor="#eee"
	title.style.padding="3px 0px"
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

	/* create inputs & outputs */

	this.input = WAM.context.createGain()
	this.output = WAM.context.createGain()

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

		if (parts[i].initial) {
			widget.set(parts[i].initial, true)
		}

		if (parts[i].label) {
			var label = document.createElement("div")
			label.innerHTML = parts[i].label
			label.style.textAlign = "center"
			label.style.backgroundColor = "#eee"
			label.style.border = "solid 1px white"

			col.appendChild(label)
		}

		if (parts[i].init) {
			parts[i].init.bind(widget)();
		}

		this.components.push(widget)

	}

	/* create audio */

	module.audio.bind(this)()

	/*var closer = document.createElement("div")
	closer.setAttribute("class", "closer")
	closer.innerHTML = "x"
//	container.appendChild(closer)
	closer.onclick = function() {
		if (container.className.indexOf("wall")>=0) {
			//shelf.wall.kill()
			//destroys widget when wall is killed, not when indiv media are killed.
			for (var i=0;i<shelf.widgets.length;i++) {
				shelf.widgets[i].destroy();
			}
			shelf.remove()
		} else {
		//	widget.media.kill()
			parent.removeChild(container)
		}
		
	} */

	//racks.push(newrack)

	return this

}



Modules = {
	"sine": { 
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
	]},
	"delay": { 
		dependencies: [ "Tone" ],
		size: {
			w: 80,
			h: 52
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
			h: 120
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
			label: "on",
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
				y: 0
			}
		},
		{
			type: "select",
			label: "file",
			action: function(data) {
				if (data.text) {
					this.player.load("./audio/"+data.text,function() {
						this.components[2].setBuffer( this.player._buffer._buffer )
					}.bind(this))
				}
			},
			size: {
				w: 174,
				h: 20
			},
			loc: {
				x: 25,
				y: 0
			},
			init: function() {
			}
		},
		{
			type: "waveform",
			label: "loop",
			action: function(data) {
				this.player.setLoopPoints(data.starttime/1000, data.stoptime/1000)
			},
			size: {
				w: 200,
				h: 70
			},
			init: function() {
			},
			loc: {
				x: 0,
				y: 37
			}
		}
	]}, 
	"meter": {
		size: {
			w: 20,
			h: 62
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
				h: 50
			},
			loc: {
				x: 0,
				y: 0
			}
		}
	]}
}




var WAM = new Wam(Modules);