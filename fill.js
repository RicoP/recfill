var canvas = document.getElementsByTagName("canvas")[0]; 
var ctx = canvas.getContext("2d"); 

var imgData =  ctx.createImageData(canvas.width, canvas.height); 
var pixelData = imgData.data; 

var pixelWidth = canvas.width; 
var pixelHeight = canvas.height; 

var mouse = {x:0,y:0,down:false}; 

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
	for(var dx = size; dx--;) {
		for(var dy = size; dy--;) {
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

function seedfill(x, y, nv, win, pixelread, pixelwrite) {
	var start, x1, x2, dy;
	var ov;

	function Segment(x,xl,xr,dy) {
		this.x = x; 
		this.xl = xl; 
		this.xr = xr; 
		this.dy = dy; 
	};

	var max = 10000;
	var stack = new Array /* of Segment*/ (max); 
	var sp=0;

	for(var i = max; i--;) {
		stack[i] = new Segment(0,0,0,0); 
	}
	
	function push(y,xl,xr,dy) {
		if(sp < max && y + dy >= 0 && y + dy < win.width) {
			stack[sp].y = y; 
			stack[sp].xl = xl; 
			stack[sp].xr = xr; 
			stack[sp].dy = dy; 
		}
	}

	function pop(segment) {
		var s = stack[--sp]; 
		segment.dy = s.dy = dy; 
		segment.y = s.y + s.dy; 
		segment.xl = s.xl;
		segment.xr = s.xr; 
	}

	//BEGIN procedure fill 
	ov = pixelread(x,y); 
	if(ov === nv || x<0 || y<0 || x>=win.width || y>=win.height) {
		return; 
	}

	push(y,x,x,1); 
	push(y+1,x,x,-1); 

	var currentSegment = new Segment(0,0,0,0); 

	while(sp > 0) {
		pop(segment); 
		y = segment.y; 
		x1 = segment.xl;
		x2 = segment.xr; 
		dy = segment.dy; 
		x = x1; 
		while(x >= 0 && pixelread(x,y) === ov) {
			pixelwrite(x,y,nv); 
			x--;
		}

		if(x >= xl) goto skip; 

		start = x+1;

		if(start < x1) {
			push(y, start, x1-1, -dy); 			
		}

		x=x1+1;

		for(;;) {
			while( x < win.widtd && pixelread(x,y) === ov) {
				pixelwrite(x,y,nv); 
				x++;
			}

			push(y, start, x-1, dy); 
			if(x > x2+1) {
				push(y, x2+1, x-1, dy); // ???!!!
				
			skip: 
				
				x++; 
				while( x <= x2 && pixelread(x,y) !== ov) {
					x++; 					
				}

				start = x; 

			}
		}

	}
}


/*

*/

setTimeout(function() {


	try { 	
		fill(400,300,0xFF0000); 
	} catch(e) {
	}
		
	flush(); 
}, 5000);
