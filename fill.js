var canvas = document.getElementsByTagName("canvas")[0]; 
var ctx = canvas.getContext("2d"); 

var imgData =  ctx.createImageData(canvas.width, canvas.height); 
var pixelData = imgData.data; 

var pixelWidth = canvas.width; 
var pixelHeight = canvas.height; 

var mouse = {x:0,y:0,down:false}; 

//clear image 
for(var i = 0; i < pixelData.length; i+=4) {
	pixelData[i+3] = 255; 
}

function setPixel(x,y,color) {
	var i = 4 * ( x + y * pixelWidth ); 
	pixelData[i+0] = (color >> 16) & 0xFF; 
	pixelData[i+1] = (color >> 8) & 0xFF; 
	pixelData[i+2] = (color) & 0xFF; 
	pixelData[i+3] = 0xFF; 
}
       
function getPixel(x,y) {
	if(x<0 || y<0 || x >= pixelWidth || y >= pixelHeight) {
		return -1; 
	}

	var i = 4 * ( x + y * pixelWidth ); 
	var r = pixelData[i+0];
	var g = pixelData[i+1];
	var b = pixelData[i+2];
	return (r<<16) | (g<<8) | b; 
}

function brush(x,y,color, size) {
	for(var dx = -size; dx < size; dx++) {
		for(var dy = -size; dy < size; dy++) {
			setPixel(x + dx, y + dy, color); 
		}
	}
}

function flush() {
	ctx.putImageData(imgData, 0, 0); 
}

canvas.onmousemove = function(ev) {
	mouse.x = ev.clientX;  
	mouse.y = ev.clientY;  

	if(mouse.down) {
		brush(mouse.x, mouse.y, 0x00FF00, 10); 	
		flush(); 
	}
}; 

canvas.onmousedown = function(ev) {
	mouse.down = true; 
	canvas.onmousemove(ev); 
}

canvas.onmouseup = function(ev) {
	mouse.down = false; 
	canvas.onmousemove(ev); 
}

var stackmax = 1000;
function fill(x,y,newcolor) {
	var stack = 0; 
	function recfill(x, y, oldcolor, newcolor) {
		if(getPixel(x,y) === oldcolor && stack < stackmax) {
			stack++;
			setPixel(x,y,newcolor); 

			recfill(x-1,y, oldcolor, newcolor);
			recfill(x+1,y, oldcolor, newcolor);
			recfill(x,y-1, oldcolor, newcolor);
			recfill(x,y+1, oldcolor, newcolor);
		}
			
		stack--; 
	}

	var oldcolor = getPixel(x,y) && 0xFFFFFF; 

	if(newcolor === oldcolor) {
		return; 
	}

	recfill(x,y,oldcolor,newcolor); 
}

function seedfill(x, y, nv) {
	"use strict"; 

	function Segment(y,xl,xr,dy) {
		this.y=y;
		this.xl=xl;
		this.xr=xr; 
		this.dy=dy;
	}	

	var pixelread = getPixel; 
	var pixelwrite = setPixel; 

	var win = { x0 : 0, y0 : 0, x1 : canvas.width - 1, y1 : canvas.height - 1 }; 		

	var MAX = 10000; 

	#define PUSH(Y, XL, XR, DY)	/* push new segment on stack */ \
    if (sp<MAX && Y+(DY)>=win.y0 && Y+(DY)<=win.y1) \
    {_sp = stack[sp]; _sp.y = Y; _sp.xl = XL; _sp.xr = XR; _sp.dy = DY; sp++;}

	#define POP(Y, XL, XR, DY)	/* pop segment off stack */ \
    {_sp = stack[sp]; sp--; Y = _sp.y+(DY = _sp.dy); XL = _sp.xl; XR = _sp.xr;}

	var l=0,x1=0,x2=0,dy=0;
	var stack = new Array(MAX); /* of Segment */ 	
	var sp = 0; 

	for(var i = 0; i !== MAX; i++) 
		stack[i] = new Segment(0,0,0,0); 

	var _sp = stack[0]; /* current Segment */ 

	var ov = pixelread(x,y); 
	if(ov === nv || x < win.x0 || x > win.x1 || y < win.y0 || y>win.y1) {
		return; 
	}

	PUSH(y  ,x, x, 1);
	PUSH(y+1,x, x,-1); 

	while(sp > 1) {
		POP(y,x1,x2,dy); 
		for(x=x1; x >= win.x0 && pixelread(x,y) === ov; x--) {
			pixelwrite(x,y,nv); 
		} 

		if(x >= x1) {
			for(x++; x<=x2 && pixelread(x,y) !== ov; x++)
				;
			l = x; 
			if(x > x2) continue; 
		} 
		else {
			l = x+1; 

			if(l<x1)  { 
				PUSH(y,l,x1-1, -dy);
			}
			x = x1+1; 
		}
				
		do {
			for(; x <= win.x1 && pixelread(x,y) === ov; x++) {
				pixelwrite(x,y,nv); 
			}

			PUSH(y,l,x-1,dy); 

			if(x > x2+1) {
				PUSH(y, x2+1, x-1, -dy); 
			}

			for(x++; x<=x2 && pixelread(x,y) !== ov; x++)
			{}

			l = x; 
		} while(x <= x2); 
	}


	#undef PUSH
	#undef POP
}

var btnRec = document.createElement("button"); 
var btnSeed = document.createElement("button"); 

btnRec.innerHTML = "recursive"; 
btnSeed.innerHTML = "seedfill"; 

btnRec.onclick = function() {
	try { 
		fill(400,300,0xFF0000); 
	} catch(e) {
		alert(e.message || e); 
	}
	flush(); 
};

btnSeed.onclick = function() {
	try { 
		seedfill(400,300,0xFF0000); 
	} catch(e) {
		alert(e.message || e); 
	}
	flush(); 
};

document.body.appendChild(btnRec); 
document.body.appendChild(btnSeed); 

flush(); 
