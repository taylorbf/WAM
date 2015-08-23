
var Wam = function() {

	this.context;
	this.modules = []

}


Wam.prototype.setContext = function(context) {
	this.context = context
}

Wam.prototype.make = function(type) {
	var module = new this.rack(type)
	this.modules.push( module )
	return module

}

Wam.prototype.rack = function (type) {

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

	parent.appendChild(this.shell)


	var title = document.createElement("div")
	title.style.position="absolute"
	title.style.top="0px"
	title.style.left="0px"
	title.style.width="100%"
	title.style.backgroundColor="#eee"
	title.style.padding="3px 10px"
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

	/* create audio */

	module.audio.bind(this)()

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
		}

		col.appendChild(label)

		if (parts[i].init) {
			parts[i].init.bind(this,widget)();
		}

		this.components.push(widget)

	}

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


var WAM = new Wam();


/*
	this.input
	this.output	
 */


Modules = {
	"sine": { 
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
			init: function() {
			},
			loc: {
				x: 40,
				y: 0
			}
		}
	]}
}