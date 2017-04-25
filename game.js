
/* 
	game.js

	A metroidvania game, just for laughs and giggles
	by g12345, for LD 38
*/

window.onload = function()
{
	Game.launch("screen");
}

dataFiles = ["font3.png", "blockies.png", "ponies.png", "bullies.png"];
soundFiles = []; 

filesLeft = 10;  

Images = [];
Sounds = [];

musicPlaying = 0;

mx = 0;
my = 0;

TileSize = 32;

map0 = 0;

HP = 10;

totalClicks = 0;

var score = 0;
var clockticks = -1;


KEYS = { LEFT:37, UP:38, RIGHT:39, DOWN:40, SPACE:32, ENTER:13, X:88, C:67, V:86, BACKSPACE:8 };

var Keyboard = function()
{
	var keysPressed = {};
	
	window.onkeydown = function(e) { if (keysPressed[e.keyCode]!=2) {keysPressed[e.keyCode] = 1;} };
	window.onkeyup =   function(e) { keysPressed[e.keyCode] = 0;	};
	this.isDown =      function(keyCode) { return keysPressed[keyCode] === 1; };
	this.waitRelease = function(keyCode) { keysPressed[keyCode] = 2; };
	this.release =     function(keyCode) { keysPressed[keyCode] = 0; };
};



function fileLoaded(filename)
{
	filesLeft --;
	console.log(filename + " loaded.");
}

function loadFile(filename, nr)
{
	var img = new Image();
	img.addEventListener('load', fileLoaded(filename));
	img.src = filename;
	Images.push(img);
}

function loadMusicFile(filename)
{
	var snd = new Audio();
	snd.addEventListener('load', fileLoaded(filename));
	snd.src = filename;
	Sounds.push(snd);
}

// drawImageScaled: draw a scaled image. by euske
function drawImageScaled(ctx, src, sx, sy, sw, sh, dx, dy, dw, dh)
{
  ctx.save();
  ctx.translate(dx+((0 < dw)? 0 : -dw),
		dy+((0 < dh)? 0 : -dh));
  ctx.scale((0 < dw)? 1 : -1,
	    (0 < dh)? 1 : -1);
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0,
		Math.abs(dw), Math.abs(dh));
  ctx.restore();
}

fontSize = 16;
function sprint(screen,x,y,s)
// prints a string at x,y, no wrapping
{
	var px = x;
	var py = y;
	for (var i=0; i<s.length; i++)
	{
		c = s.charCodeAt(i);
		if ( (c>=97) && (c<=122) ) c-=32;
		if ( (c>=32) && (c<=95) )
		screen.drawImage (Images[0], (c-32)*fontSize,0, fontSize,fontSize, px,py, fontSize,fontSize);
		px += fontSize;
	}
}

function sprintnum(screen,x,y,n)
// prints a number at x,y, no wrapping
{
	sprint(screen,x,y,n+'');
}


function is_wall(x,y)
// check if map coord (x,y) is a wall block or not
// monsters doesn't count.
{
	var c;
	c = map0[y][x];
	return (c >= 21);
}

function is_wall2(x,y)
// check if PIXEL coord (x,y) is a wall block or not
// monsters doesn't count.
{
	return is_wall(Math.floor(x/TileSize), Math.floor(y/TileSize));
}


message_timer = 300;
message1 = "Use Arrow Keys to move.";		// these are default messages, you will never really see them
message2 = "Get items to use more abilities!";		// they are set somewhere else instead.

function setMessage(msg1, msg2)
{
	message_timer = 300;
	message1 = msg1;
	message2 = msg2;
}

function is_wall_player(x,y)
// check if map coord (x,y) is a wall block or not
// monsters doesn't count.
// this version is for player, includes taking objects
{
	var c;
	c = map0[y][x];
	
	// water
	/*
Water hoort je niet hier te controleren, want wijzigingen in player.center worden niet opgeslagen.
	if ((c === 5) || ( c === 4 ))
	{
		player.center.x = player.restartcenter.x;
		player.center.y = player.restartcenter.y;
	}
	*/
	// checkpoint
	if (c === 7)
	{
		if (map0[player.restartcenter.y/TileSize][player.restartcenter.x/TileSize] === 8)
			map0[player.restartcenter.y/TileSize][player.restartcenter.x/TileSize] = 7;
		map0[y][x] = 8;
		player.restartcenter.x = x*TileSize;
		player.restartcenter.y = y*TileSize;
		
		setMessage ("Checkpoint stored.", "");
	}
	// double jump item
	if (c === 12)
	{
		map0[y][x] = 0;
		player.doublejumpitem = 1;		
		setMessage ("You can now Double jump!", "");
	}
	// first jump item
	if (c === 9)
	{
		map0[y][x] = 0;
		player.jumpitem = 1;
		setMessage ("Press X to jump.", "");
	}
	// gun item
	if (c === 10)
	{
		map0[y][x] = 0;
		player.gunitem = 1;
		setMessage ("Press C to fire lasers.", "");
	}
	// dash item
	if (c === 14)
	{
		map0[y][x] = 0;
		player.dashitem = 1;
		setMessage ("Press V to dash in midair.", "");
	}
	// updash item
	if (c === 11)
	{
		map0[y][x] = 0;
		player.updashitem = 1;
		setMessage ("Hold Down + V to dash up.", "");
	}
	// keys and doors
	if (c === 18)
	{
		map0[y][x] = 0;
		player.greenkey = 1;
		setMessage ("You found a Green Key.", "");
	}
	if (c === 17)
	{
		map0[y][x] = 0;
		player.redkey = 1;
		setMessage ("You found a Red Key.", "");
	}
	if (c === 19)
	{
		map0[y][x] = 0;
		player.bluekey = 1;
		setMessage ("You found a Blue Key.", "");
	}
	if ( (c === 21) && (player.redkey > 0) )
	{
		map0[y][x] = 0;
	}
	if ( (c === 22) && (player.greenkey > 0) )
	{
		map0[y][x] = 0;
	}
	if ( (c === 23) && (player.bluekey > 0) )
	{
		map0[y][x] = 0;
	}
	
	return (c >= 21);
}

function is_wall2_player(x,y)
// check if PIXEL coord (x,y) is a wall block or not
// monsters doesn't count.
{
	return is_wall_player(Math.floor(x/TileSize), Math.floor(y/TileSize));
}

var mouseX = 0;
var mouseY = 0;

function getMousePos(canvas, event) 
{
	var rect = canvas.getBoundingClientRect();
	if ((event.pageX != undefined) && (event.pageY != undefined))
	{
		mouseX = event.pageX;
		mouseY = event.pageY;
	}
	else
	{
		mouseX = event.clientX;
		mouseY = event.clientY;
	}
	mouseX -= rect.left;
	mouseY -= rect.top;
}

function mouseClicked(canvas, event)
{
	totalClicks ++;
	getMousePos(canvas, event);
}

Game = {};

people = [];
bullets = [];
bombs = [];

var cat;
var player;

Game.launch = function(canvasId)
{
	var canvas = document.getElementById(canvasId);
	var screen = canvas.getContext('2d');
	var gameSize = { x: canvas.width, y: canvas.height };
	
	// gameMode: 0 = start screen; 1 = game; 3 = win screen; 0 = wait for key; 4 = story 1;
	var gameMode = 0;
	
	player = new Player();
	cat = new Cats();
	people = [ player ];
	people.push ( cat );
	// people.push (new Fly(people[0]));
	
	filesLeft = dataFiles.length + soundFiles.length;
	
	for (var i=0; i<dataFiles.length; i++)
		loadFile(dataFiles[i], i);
	for (var i=0; i<soundFiles.length; i++)
		loadMusicFile(soundFiles[i], i);
	

	score = 0;
	
	{
		totalClicks = 0;
	}

	var update = function()
	{
		if (gameMode === 1)
		{
			for (var i=people.length-1; i>=0; i--)
			{
				people[i].update();
			}
			for (var i=bullets.length-1; i>=0; i--)
			{
				bullets[i].update();
			}
			for (var i=bombs.length-1; i>=0; i--)
			{
				bombs[i].update();
			}
			
			if (people[0].keyb.isDown(KEYS.BACKSPACE))
			{
				
				makeMap();
				score = 0;
			}
		}
		else
		{
			if (people[0].keyb.isDown(KEYS.X))
			{
				if (gameMode === 4) gameMode = 1;
			}
			else
			if (people[0].keyb.isDown(KEYS.ENTER))
			{
				if (gameMode === 0) gameMode = 4;
				if (gameMode === 3) { makeMap(); gameMode = 1; }
				
				if (gameMode === 1)
				{
					clockticks = 0;
					message_timer = 300;
					message1 = "Use Arrow Keys to move.";
					message2 = "Get items to use more abilities!";
				}
			}
		}
	}
	
	var camerax = 0;
	var cameray = 0;
	
	    my = gameSize.y/TileSize;
	    mx = gameSize.x/TileSize;
		my -= 2;
		
	var sy = my;
	var sx = mx;
	
	// Mijn uiteindelijke map grootte: ongeveer 200x100
	
	/* How to export game maps from mappy:
	
		1. Export to Text.
		2. Check Use Name As Prefix
		3. Check Map Array(s)
		4. All Layers, 2D Format
		5. Uncheck everything else
		6. Press OK Button.
		7. Look at kitty01.txt -> save as kitty01.js
		8. Change first line into: " kitty01_map0 = [ "
		9. Replace all { } into [ ]
	*/
	
		// new sizes
		my = 100;
		mx = 200;
		
	
	map0 = new Array(my);
	

	var makeMap = function()
	{
		player = new Player();
		people = [ player ];
		people.push ( cat );
		score = 0;
		clockticks = 0;
		bullets = [];
		bombs = [];
		
		for (var y=0; y<my; y++)
		{
			// map0[y] = new Array(mx);
			map0[y] = (kitty01_map0[y]).slice(0);
		}
		
		// populate map
		for (var y=0; y<my; y++)
		{
			for (var x=0; x<mx; x++)
			{
				var c = 0;
				var p = map0[y][x];
			
				if (p===41)
				{
					people[0].center.x = x*TileSize;
					people[0].center.y = y*TileSize;
					people[0].restartcenter.x = x*TileSize;
					people[0].restartcenter.y = y*TileSize;
					map0[y][x] = 0;
				}
				if (p===42)
				{
					cat.center.x = x*TileSize;
					cat.center.y = y*TileSize;
					map0[y][x] = 0;
				}
				if (p===43)
				{
					var alien1 = new Alien1();
					alien1.center.x = x*TileSize;
					alien1.center.y = y*TileSize;
					people.push(alien1);
					map0[y][x] = 0;
				}
				if (p===44)
				{
					var alien2 = new Alien2();
					alien2.center.x = x*TileSize;
					alien2.center.y = y*TileSize;
					people.push(alien2);
					map0[y][x] = 0;
				}
				if (p===45)
				{
					var alien3 = new Alien3();
					alien3.center.x = x*TileSize;
					alien3.center.y = y*TileSize;
					people.push(alien3);
					map0[y][x] = 0;
				}
			}
		}
		
		// de achtergrond alsnog aanmaken
		for (var y=0; y<my; y++)
		{
			for (var x=0; x<mx; x++)
			{
				// background tiles 0 tot 3
				if (map0[y][x] === 0) map0[y][x] = (x%2) + (y%2)*2;
			}
		}
		
	}

	makeMap();
	
	var draw = function(screen, gameSize, clockticks)
	{
		if (gameMode === 1)
		{

			camerax = (people[0].center.x / TileSize) - (sx/2);
			if (camerax < 0) camerax = 0;
			if (camerax > mx-sx) camerax = mx-sx;

			cameray = (people[0].center.y / TileSize) - (sy/2);
			if (cameray < 0) cameray = 0;
			if (cameray > my-sy) cameray = my-sy;

			var startx = Math.floor(camerax); 
			var restx = Math.floor( (camerax - startx) * TileSize );
			var starty = Math.floor(cameray); 
			var resty = Math.floor( (cameray - starty) * TileSize );
			// console.log(startx, starty);
			
			
			var tnr = 0; var tnr2 = 0;
			for (var x=0; x<=sx; x++)
			for (var y=0; y<=sy; y++)
			{
				if (starty+y<my)
				{
					tnr = map0[starty+y][startx+x];
					if (tnr > 0) { tnr --; }
					tnr2 = 0;
					if (tnr >= 40 || ((tnr >= 6)&&(tnr <24))) { tnr2 = tnr; tnr = 1; }
					screen.drawImage (Images[1], 
						(tnr%8)*TileSize, (Math.floor(tnr/8)) *TileSize, 
						TileSize,TileSize, 
						x*TileSize - restx,y*TileSize - resty, 
						TileSize,TileSize);
					if (tnr2 > 0)
						screen.drawImage (Images[1], 
							(tnr2%8)*TileSize, (Math.floor(tnr2/8)) *TileSize, 
							TileSize,TileSize, 
							x*TileSize - restx,y*TileSize - resty, 
							TileSize,TileSize);
				}
			}

			for (var i=people.length-1; i>=0; i--)
				people[i].draw(screen, camerax, cameray);
			for (var i=bullets.length-1; i>=0; i--)
				bullets[i].draw(screen, camerax, cameray);
			for (var i=bombs.length-1; i>=0; i--)
				bombs[i].draw(screen, camerax, cameray);
			
			// remove dead stuff
			for (var i=people.length-1; i>=0; i--)
				if (!people[i].alive) people.splice(i,1);
			for (var i=bullets.length-1; i>=0; i--)
				if (!bullets[i].alive) bullets.splice(i,1);
			for (var i=bombs.length-1; i>=0; i--)
				if (!bombs[i].alive) bombs.splice(i,1);
			
			screen.fillStyle="teal";
			screen.fillRect(0,gameSize.y-2*TileSize, gameSize.x, gameSize.y);

	//		sprint (screen, 16, 384-8-32, "Score: " + score + " center Y: " + people[0].center.y);
			sprint (screen, 16, 384-8-32-8, "X: " + player.center.x + " Y: " + player.center.y);
			
			var secs = (Math.floor( clockticks / 60 ) % 60);
			if (secs<10) secs = '0'+secs;
			sprint (screen, 16, 384-32, "Time: " + Math.floor( clockticks / 3600 ) + ":" + secs );
			drawitems(screen);
	//		sprint (screen, 16, 384-8-32, "Score: " + score);
	//		sprint (screen, 16, 384-8-16-32, "MouseX: " + mouseX + " MouseY: " + mouseY );
	//		sprint (screen, 16, 384-8-32, "Total Clicks: " + totalClicks );

			// END OF GAME TESTING
			if ( (Math.abs (player.center.x - cat.center.x)<15) && (Math.abs (player.center.y - cat.center.y)<15) ) gameMode = 3;

			// On screen messages
			if ( message_timer > 0 )
			{
				var x = Math.floor((gameSize.x - message1.length * fontSize)/2);
				sprint (screen, x, 104, message1);
				x = Math.floor((gameSize.x - message2.length * fontSize)/2);
				sprint (screen, x, 168+64, message2);
				message_timer --;
			}

		}

		if ((gameMode === 3) && (clockticks%50 === 5))
		{
			// screen.fillStyle="black";
			// screen.fillRect(0,0, gameSize.x, gameSize.y);
			
			sprint (screen, 30, 140, "Well Done,");
			sprint (screen, 30, 180, "You have found the Package!");
			
			sprint (screen, 30, 230, "Press ENTER to restart.");
		}
		
		if ((gameMode === 0) && (clockticks%50 === 5))
		{
			screen.fillStyle="black";
			screen.fillRect(0,0, gameSize.x, gameSize.y);
			
			sprint (screen, 80, 100, "Wrong Delivery");
			//sprint (screen, 16, 170, "Keys are LEFT and RIGHT");
			//sprint (screen, 16, 190, "Backspace to reset");
			sprint (screen, 80, 230, "Press ENTER to start.");
			sprint (screen, 80, 270, "Made for Ludum Dare 38.");
			//sprint (screen, 16, 270, "Made for Ludum Dare 34.");
//			sprint (screen, 16, 384-8-32, "Total Clicks: " + totalClicks );
		}
		
		if ((gameMode === 4) && (clockticks%50 === 5))
		{
			screen.fillStyle="black";
			screen.fillRect(0,0, gameSize.x, gameSize.y);
			
			sprint (screen, 42, 060, "It's always like this...");
			sprint (screen, 42, 100, "This area has 2 rooms, and");
			sprint (screen, 42, 140, "they delivered the package");
			sprint (screen, 42, 180, "at the wrong rooms again...");
			sprint (screen, 42, 220, "Now you have to get it back!");

			sprint (screen, 42, 300, "Press X key to start.");
			sprint (screen, 42, 340, "Made for Ludum Dare 38.");
		}
	}
	
	var tick = function()
	{
		if (filesLeft === 0)
		{
			// console.log ("All files loaded");
			update();
			clockticks ++;
			draw(screen, gameSize, clockticks);
			
			if (gameMode === 1)
			{
				touchplayer();
				killmonsters();
			}
			
			if (!musicPlaying)
			{
				musicPlaying = 1;
				if (Sounds.length > 0)
				{
					Sounds[0].loop = true;
					Sounds[0].play();
				}
			}
		}
		requestAnimationFrame(tick);
	}

	// This to start a game
	tick();
};

function drawitem (screen, x, y, imageindex)
{
	screen.drawImage (Images[1], 
		(imageindex%8)*TileSize, Math.floor(imageindex/8)*TileSize,		// hardcoded numbers from Images[1]
		TileSize,TileSize, 
		x*TileSize + 320, y, 			// hardcoded screen coords
		TileSize,TileSize);
}

function drawitems(screen)
{
	var items = [player.jumpitem, player.gunitem, player.doublejumpitem, player.dashitem, player.updashitem];
	var itemimages = [8, 9, 11, 13, 10];
	
	for (var i=0; i<items.length; i++)
		if (items[i]>0) drawitem(screen, i, 384-32, itemimages[i]);
	
	items = [player.redkey, player.greenkey, player.bluekey];
	itemimages = [16, 17, 18];
	
	for (var i=0; i<items.length; i++)
		if (items[i]>0) drawitem(screen, i, 384-64, itemimages[i]);
	
}

function touchplayer()
{
	var px1, px2, py1, py2;

	px1 = player.center.x+2; px2 = player.center.x+TileSize-3;
	py1 = player.center.y+2; py2 = player.center.y+TileSize-3;
		
	var hit = false;
	
	for (var i=people.length-1; i>=2; i--)
	{
		if (py2 < people[i].center.y+2) continue;
		if (py1 > people[i].center.y+TileSize-3) continue;
		if (px2 < people[i].center.x+2) continue;
		if (px1 > people[i].center.x+TileSize-3) continue;
		hit = true; break;
	}

	if (!hit)
		for (var j=bombs.length-1; j>=0; j--)
		{
			if (bombs[j].fizz) continue;
			if (py2 < bombs[j].center.y+2) continue;
			if (py1 > bombs[j].center.y+bombs[j].size.y-3) continue;
			if (px2 < bombs[j].center.x+2) continue;
			if (px1 > bombs[j].center.x+bombs[j].size.x-3) continue;
			bombs[j].dying();
			hit = true; 
			break;
		}

	if (hit) 
	{
		// player has been hit!
		player.center.x = player.restartcenter.x;
		player.center.y = player.restartcenter.y;
	}
}

function killmonsters()
{
	var px1, px2, py1, py2;
	var hit;
	
	for (var i=people.length-1; i>=2; i--)
	{
		px1 = people[i].center.x+2; px2 = people[i].center.x+TileSize-3;
		py1 = people[i].center.y+2; py2 = people[i].center.y+TileSize-3;
		
		hit = false;
		
		for (var j=bullets.length-1; j>=0; j--)
		{
			if (bullets[j].fizz) continue;
			if (py2 < bullets[j].center.y+2) continue;
			if (py1 > bullets[j].center.y+bullets[j].size.y-3) continue;
			if (px2 < bullets[j].center.x+2) continue;
			if (px1 > bullets[j].center.x+bullets[j].size.x-3) continue;
			bullets[j].dying();
			hit = true; 
			break;
		}
		
		if (hit)
		{
			// monster has been hit by player bullet.
//			people[i].alive = false;
			people[i].shot();
		}
	}
	
}

function create_debris(x, y)
{
	for (var k=0; k<5; ++k)
	{
		var d = new Debris();
		d.center.x = x+8;
		d.center.y = y+8;
		bullets.push(d);
	}
}

/*
	TODO :
	
	. Need a name for this game
	
	v Explosions when monster got killed
	v death by water
	v Helpful Text on screen
	v Ending
	v Start Screen
	v Timer
	v Monster Throwing Bombs
	v Kill player if hit by monster bombs
	v Eye Monster
	v Enemy HP
	v Items
	v dash ability + dash item
	v Checkpoints
	v Kill player if touches water
	v Map afmaken
	v doors / keys
*/

var Player = function()
{
	this.alive = true;
	this.size = { x: 32, y: 32 };
	this.center = { x: 400, y: 1500 };
	this.restartcenter = { x: 400, y: 1500 };
	this.keyb = new Keyboard();
	this.counter = 0;
	this.frame1 = 0;
	this.framenr = 1;
	this.type = 0; // player type = 0
	
	this.onfloor = 0; // 0 = falling, 1 = onfloor, 2 = jumping
	this.hold = 0; // how long has the player holding a key?
	this.dir = 1;  // which direction is the player holding?
	this.inair = 0; // 0 = allow to jump, 1 = in the air
	this.gravity = 0; // current player gravity
	this.dashing = 0; // nr = dashing steps, 0 = normal
	this.updashing = 0; // nr = updashing steps, 0 = normal
	
	this.jumpitem = 0; // 1 = player has jump item
	this.doublejumpitem = 0; // 1 = player has doublejump item
	this.gunitem = 0; // 1 = player has gun
	this.dashitem = 0; // 1 = player has dash item
	this.updashitem = 0; // 1 = player has updash item
	
	this.greenkey = 0; // 1 = player has green key
	this.redkey = 0;   // 1 = player has red key
	this.bluekey = 0;  // 1 = player has blue key
	
	this.doublejump = this.doublejumpitem; // 1 = player allow to double jump once
	this.bulletdelay = 8; // delay until bullets may fire
}

Player.prototype =
{
	update: function()
	{
		this.framenr = 0;
		
		is_wall2_player(this.center.x, this.center.y);
		
		var nx = this.center.x;
		var ny = this.center.y;
		
		if (this.dashing != 0)
		{
			nx += Math.floor(this.dir*TileSize/2);
			this.dashing --;
			if (this.dashing < 0) this.dashing = 0;
		}
		else
		if (this.updashing != 0)
		{
			ny -= Math.floor(TileSize/2);
			this.updashing --;
			if (this.updashing < 0) this.updashing = 0;
		}
		else // not dashing
		{
			if (this.keyb.isDown(KEYS.V) && this.inair==1 && this.dashing==0 && this.dashitem!=0 && this.updashing==0)
			{
				this.dashing = 64;  // max movement -> 32 blocks
			}
			else
			if (this.keyb.isDown(KEYS.V) && this.keyb.isDown(KEYS.DOWN) && this.inair==0 && this.updashing==0 && this.updashitem!=0 && this.dashing ==0)
			{
				this.updashing = 32;  // max movement -> 16 blocks
			}
		
			if (this.keyb.isDown(KEYS.LEFT)) 		{ nx -= 4; this.dir = -1; this.framenr = 1; }
			else if (this.keyb.isDown(KEYS.RIGHT)) 	{ nx += 4; this.dir = 1;  this.framenr = 1;}
		
			if ( (this.jumpitem===1) && (this.keyb.isDown(KEYS.X)) )
				if ( (this.inair === 0) || ( (this.gravity >= -5) && (this.doublejump > 0) ) )
				{ 
					if (this.inair > 0) this.doublejump --; 
					this.gravity = -12; this.inair = 1; 
					this.keyb.waitRelease(KEYS.X);
				}
		
			ny += this.gravity;
			if (this.inair != 0) this.gravity += .5;
			if (this.gravity > 16) 
			{
				this.gravity = 16;
				ny = Math.round(ny/16)*16;
			}
		}
	
		if (nx < 0) nx = 0;
		if (nx+TileSize > mx*TileSize) nx = (mx-1)*TileSize;
		if (ny < 0) ny = 0;
		if (ny+TileSize > my*TileSize) ny = (my-1)*TileSize;
		
		nx = Math.round(nx);
		ny = Math.round(ny);
		
		var ttl = is_wall2_player (nx               , ny     );
		var ttr = is_wall2_player (nx + TileSize - 1, ny     );
		var tbla = is_wall2_player (nx               , ny + TileSize-1 );
		var tbra = is_wall2_player (nx + TileSize - 1, ny + TileSize-1 );
		
		if ((ttl||tbla) && (nx<this.center.x))
		{
			// nx = Math.floor(nx/TileSize)*TileSize+TileSize;
			nx = this.center.x;
			if (this.dashing>0)
			{
				this.dashing = 0;
				nx = Math.floor((nx+1)/TileSize)*TileSize;
			}
		}
		
		if ((ttr||tbra) && (nx>this.center.x))
		{
			// nx = Math.floor(nx/TileSize)*TileSize;
			nx = this.center.x;
			if (this.dashing>0)
			{
				this.dashing = 0;
				nx = Math.floor((nx-1)/TileSize)*TileSize+TileSize;
			}
		}

		ttl = is_wall2_player (nx               , ny     );
		ttr = is_wall2_player (nx + TileSize - 1, ny     );
		var tbl = is_wall2_player (nx               , ny + TileSize );
		var tbr = is_wall2_player (nx + TileSize - 1, ny + TileSize );
		
		if ((tbl||tbr) && (ny>this.center.y))
		{
			ny = Math.floor(ny/TileSize)*TileSize;
			this.gravity = 0; this.inair = 0; this.doublejump = this.doublejumpitem;
		}
		
		if ((ttl||ttr) && (ny<this.center.y))
		{
			ny = Math.floor(ny/TileSize)*TileSize+TileSize;
			this.gravity = 0; this.inair = 0;
		}
		
		if (!tbl && !tbr) this.inair = 1;
		
		this.center.x = nx;
		this.center.y = ny;
		
		// extra check als je precies middenin het water valt
		var q = map0[Math.floor((ny+TileSize/2)/TileSize)][Math.floor((nx+TileSize/2)/TileSize)];
		if (q===4 || q===5) { this.center.x = this.restartcenter.x; this.center.y = this.restartcenter.y; }
		
		this.counter++;
		this.counter %= 40;

		if (this.gunitem===1 && this.keyb.isDown(KEYS.C) && this.bulletdelay===0)
		{  
			var bullet = new Bullet();
			bullet.dir = this.dir;
			bullet.center.x = this.center.x + 8; // 8 = 32 (TileSize - Bullet.size.x)/2
			bullet.center.y = this.center.y + 4; // 4 = 32 (TileSize - Bullet.size.y)/2 - 4
			bullets.push(bullet);
			this.bulletdelay = 9;
			this.keyb.waitRelease(KEYS.C);
		}
		if (this.bulletdelay > 0) this.bulletdelay--;
	},
	
	draw: function(screen, camerax, cameray)
	{
		// sprint (screen, 16,8,"Hello World!");
		// sprintnum (screen, 16,24,32769);
		distanceToEnd = mx - this.center.x/32 - 2;
//		sprint (screen, 16, 8, "Distance: " + distanceToEnd + 'm');
//		sprint (screen, 16, 384-8-16, "Hold: " + this.hold + " State: " + this.onfloor + ' ');
/*
		screen.drawImage (Images[2], this.framenr*32, 0,
							this.size.x,this.size.y, 
							this.center.x-(camerax*TileSize),this.center.y-(cameray*TileSize), 
							this.size.x,this.size.y);
*/					
		var t = (this.dir!=0 ? this.dir : 1);
		drawImageScaled (screen, Images[2], this.framenr*32, 0,
							this.size.x,this.size.y, 
							this.center.x-(camerax*TileSize),this.center.y-(cameray*TileSize), 
							t * this.size.x,this.size.y);
	}
}

var Cats = function()
{
	this.size = { x: TileSize, y: TileSize };
	this.center = { x: 0, y: 0 };
	this.alive = true;
	this.animcounter = 0;
	this.animation = [0]; // [0,1,0,2];
	this.animstartY = 32;
	this.dir = 1;
	this.framecounter = 7;
}

Cats.prototype =
{
	update: function()
	{
		/* niet nodig
		this.framecounter ++;
		if (this.framecounter >= 20)
		{
			this.framecounter = 0;
			this.animcounter ++;
			if (this.animcounter >= this.animation.length) {this.animcounter = 0;}
		}
		*/
	},
	
	draw: function(screen, camerax, cameray)
	{
		var t = (this.dir!=0 ? this.dir : 1);
		drawImageScaled (screen, Images[2], this.animation[this.animcounter]*TileSize, this.animstartY,
							this.size.x,this.size.y, 
							this.center.x-(camerax*TileSize),this.center.y-(cameray*TileSize), 
							t * this.size.x,this.size.y);
	}
}


var Alien1 = function()
{
	this.alive = true;
	this.hp = 3;
	this.size = { x: TileSize, y: TileSize };
	this.center = { x: 0, y: 0 };
	this.animcounter = 0;
	this.animation = [0,1,2,3];
	this.animstartY = 32*2;
	this.dir = 1;
	this.framecounter = 5; // Math.floor(Math.random()*15)+1; 
	
	this.velocity = { x: 1, y: 0 };
}

Alien1.prototype =
{
	update: function()
	{
		var nx = this.center.x + this.velocity.x;
		var ny = this.center.y + this.velocity.y;
		
		if (!is_wall2(nx+TileSize/2, ny+TileSize)) this.velocity.x = -this.velocity.x;
		else
		if (is_wall2(nx, ny)) this.velocity.x = -this.velocity.x;
		else
		if (is_wall2(nx+TileSize-1, ny)) this.velocity.x = -this.velocity.x;
		
		this.center.x = nx;
		this.center.y = ny;
		
		this.dir = (this.velocity.x > 0 ? 1 : -1);
		
		this.framecounter ++;
		if (this.framecounter >= 20)
		{
			this.framecounter = 0;
			this.animcounter ++;
			if (this.animcounter >= this.animation.length) {this.animcounter = 0;}
		}
	},
	
	shot: function()
	{
		this.hp --;
		this.velocity.x = -(this.velocity.x);
		if (this.hp < 1)
		{
			this.alive = false;
			create_debris(this.center.x, this.center.y);
		}
	},
	
	draw: function(screen, camerax, cameray)
	{
		if ( ( Math.abs(this.center.x - camerax*TileSize) > 1000 ) || ( Math.abs(this.center.y - cameray*TileSize) > 1000 ) ) return;
		var t = (this.dir!=0 ? this.dir : 1);
		drawImageScaled (screen, Images[2], this.animation[this.animcounter]*TileSize, this.animstartY,
							this.size.x,this.size.y, 
							this.center.x-(camerax*TileSize),this.center.y-(cameray*TileSize), 
							t * this.size.x,this.size.y);
	}
}

var Alien2 = function()
{
	this.alive = true;
	this.hp = 1;
	this.size = { x: TileSize, y: TileSize };
	this.center = { x: 0, y: 0 };
	this.animcounter = 0;
	this.animation = [0,1,2,3];
	this.animstartY = 32*3;
	this.dir = 1;
	this.framecounter = 3;
	
	this.velocity = { x: 0, y: 1 };
}

Alien2.prototype =
{
	update: function()
	{
		var nx = this.center.x + this.velocity.x;
		var ny = this.center.y + this.velocity.y;
		
		if ((is_wall2(nx, ny)) || (is_wall2(nx, ny+TileSize-1))) 
		{
			this.velocity.y = -this.velocity.y;
			this.dir = (Math.random()>=0.5 ? 1 : -1);
		}
		
		this.center.x = nx;
		this.center.y = ny;
		
		this.framecounter ++;
		if (this.framecounter >= 10)
		{
			this.framecounter = 0;
			this.animcounter ++;
			if (this.animcounter >= this.animation.length) {this.animcounter = 0;}
		}
	},
	
	shot: function()
	{
		this.hp --;
		if (this.hp < 1)
		{
			this.alive = false;
			create_debris(this.center.x, this.center.y);
		}
	},
	
	draw: function(screen, camerax, cameray)
	{
		if ( ( Math.abs(this.center.x - camerax*TileSize) > 1000 ) || ( Math.abs(this.center.y - cameray*TileSize) > 1000 ) ) return;
		var t = (this.dir!=0 ? this.dir : 1);
		drawImageScaled (screen, Images[2], this.animation[this.animcounter]*TileSize, this.animstartY,
							this.size.x,this.size.y, 
							this.center.x-(camerax*TileSize),this.center.y-(cameray*TileSize), 
							t * this.size.x,this.size.y);
	}
}

var Alien3 = function()
{
	this.alive = true;
	this.hp = 3;
	this.size = { x: TileSize, y: TileSize };
	this.center = { x: 0, y: 0 };
	this.animcounter = 0;
	this.animation = [1,2,1,3];
	this.animstartY = 32*4;
	this.dir = 1;
	this.framecounter = Math.floor(Math.random()*15)+1; // 11;
	
	this.velocity = { x: 1, y: 0 };
}

Alien3.prototype =
{
	update: function()
	{
		this.framecounter ++;
		if (this.framecounter >= 15)
		{
			this.framecounter = 0;
			this.animcounter ++;
			if (this.animcounter >= this.animation.length) {this.animcounter = 0;}
			if ((this.animcounter === 2) && (Math.random()<0.4))
			{
				var bomb = new Bomb();
				bomb.center.x = this.center.x + 8;
				bomb.center.y = this.center.y + 16;
				bombs.push(bomb);
				this.dir = -this.dir;
			}
		}
	},
	
	shot: function()
	{
		this.hp --;
		this.velocity.x = -(this.velocity.x);
		if (this.hp < 1)
		{
			this.alive = false;
			create_debris(this.center.x, this.center.y);
		}
	},
	
	draw: function(screen, camerax, cameray)
	{
		if ( ( Math.abs(this.center.x - camerax*TileSize) > 1000 ) || ( Math.abs(this.center.y - cameray*TileSize) > 1000 ) ) return;
		var t = (this.dir!=0 ? this.dir : 1);
		drawImageScaled (screen, Images[2], this.animation[this.animcounter]*TileSize, this.animstartY,
							this.size.x,this.size.y, 
							this.center.x-(camerax*TileSize),this.center.y-(cameray*TileSize), 
							t * this.size.x,this.size.y);
	}
}

var Bullet = function()
{
	this.alive = true;
	this.fizz = false;
	this.size = { x: 16, y: 16 };
	this.center = { x: 0, y: 0 };
	this.animcounter = 0;
	this.animation = [0];
	this.endanimation = [1,2,3];
	this.animstartY = 0;
	this.dir = 1;
	this.framecounter = 0;
	
	this.velocity = { x: 5, y: 0 };
}

Bullet.prototype =
{
	update: function()
	{
		if (!this.alive) return;
		
		var nx = this.center.x + this.dir * this.velocity.x;
		var ny = this.center.y + this.velocity.y;
		
		if ( (this.dir === 1) && ( is_wall2(nx+15, ny+7) || is_wall2(nx+15, ny+10) ) )
		{
			this.dying();
		}
		if ( (this.dir === -1) && ( is_wall2(nx, ny+7) || is_wall2(nx, ny+10) ) )
		{
			this.dying();
		}
		
		this.center.x = nx;
		this.center.y = ny;
		
		if (this.animation.length > 1)
		{
			this.framecounter ++;
			if (this.framecounter >= 7)
			{
				this.framecounter = 0;
				this.animcounter ++;
				if (this.animcounter >= this.animation.length) {this.alive = false;}
			}
		}
	},
	
	dying: function()
	{
		this.animation = this.endanimation;
		this.velocity = { x: 0, y: 0 };
		this.fizz = true;
	},
	
	draw: function(screen, camerax, cameray)
	{
		if (!this.alive) return;
		if ( ( Math.abs(this.center.x - camerax*TileSize) > 1000 ) || ( Math.abs(this.center.y - cameray*TileSize) > 1000 ) ) return;
		
		var t = (this.dir!=0 ? this.dir : 1);
		drawImageScaled (screen, Images[3], this.animation[this.animcounter]*this.size.x, this.animstartY,
							this.size.x,this.size.y, 
							this.center.x-(camerax*TileSize),this.center.y-(cameray*TileSize), 
							t * this.size.x,this.size.y);
	}
}

var Bomb = function()
{
	this.alive = true;
	this.fizz = false;
	this.size = { x: 16, y: 16 };
	this.center = { x: 0, y: 0 };
	this.animcounter = 0;
	this.animation = [1,2];
	this.endanimation = [1,2,3];
	this.animstartY = 0;
	this.dir = 1;
	this.framecounter = 0;
	
	this.velocity = { x: 0, y: 4 };
}

Bomb.prototype =
{
	update: function()
	{
		if (!this.alive) return;
		
		var nx = this.center.x + this.dir * this.velocity.x;
		var ny = this.center.y + this.velocity.y;
		
		if ( (!this.fizz) && ( is_wall2(nx+7, ny+7) ) )
		{
			this.dying();
		}
		
		this.center.x = nx;
		this.center.y = ny;
		
		this.framecounter ++;
		if (this.framecounter >= 7)
		{
			this.framecounter = 0;
			this.animcounter ++;
			if (this.animcounter >= this.animation.length)
			{
				this.animcounter = 0;
				if (this.fizz) {this.alive = false;}
			}
		}
	},
	
	dying: function()
	{
		this.animation = this.endanimation;
		this.velocity = { x: 0, y: 0 };
		this.fizz = true;
		this.framecounter = 0;
		this.animcounter = 0;
	},
	
	draw: function(screen, camerax, cameray)
	{
		if (!this.alive) return;
		if ( ( Math.abs(this.center.x - camerax*TileSize) > 1000 ) || ( Math.abs(this.center.y - cameray*TileSize) > 1000 ) ) return;
		
		var t = (this.dir!=0 ? this.dir : 1);
		drawImageScaled (screen, Images[3], this.animation[this.animcounter]*this.size.x, this.animstartY,
							this.size.x,this.size.y, 
							this.center.x-(camerax*TileSize),this.center.y-(cameray*TileSize), 
							t * this.size.x,this.size.y);
	}
}

var Debris = function()
{
	this.alive = true;
	this.fizz = true;
	this.size = { x: 16, y: 16 };
	this.center = { x: 0, y: 0 };
	this.animcounter = 0;
	this.animation = [0,1,2,3];
	this.animstartY = 16;
	this.dir = 1;
	this.framecounter = 0;
	
	this.direction = Math.random()*2*Math.PI;
	this.velocity = { x: 4*Math.sin(this.direction), y: 4*Math.cos(this.direction) };
}

Debris.prototype =
{
	update: function()
	{
		if (!this.alive) return;
		
		var nx = this.center.x + this.velocity.x;
		var ny = this.center.y + this.velocity.y;
		
		this.center.x = nx;
		this.center.y = ny;
		
		this.framecounter ++;
		if (this.framecounter >= 7)
		{
			this.framecounter = 0;
			this.animcounter ++;
			if (this.animcounter >= this.animation.length)
			{
				this.animcounter = 0;
				if (this.fizz) {this.alive = false;}
			}
		}
	},
	
	dying: function()
	{
		this.animation = this.endanimation;
		this.velocity = { x: 0, y: 0 };
		this.fizz = true;
		this.framecounter = 0;
		this.animcounter = 0;
	},
	
	draw: function(screen, camerax, cameray)
	{
		if (!this.alive) return;
		if ( ( Math.abs(this.center.x - camerax*TileSize) > 1000 ) || ( Math.abs(this.center.y - cameray*TileSize) > 1000 ) ) return;
		
		drawImageScaled (screen, Images[3], this.animation[this.animcounter]*this.size.x, this.animstartY,
							this.size.x,this.size.y, 
							this.center.x-(camerax*TileSize),this.center.y-(cameray*TileSize), 
							this.size.x,this.size.y);
	}
}

var Fly = function(player)
{
	this.size = { x: 16, y: 8 };
	this.center = { x: Math.floor(Math.random()*(50-2)*TileSize), y: Math.floor(Math.random()*(50-2)*TileSize) };
	this.player = player;
	this.counter = 0;
}

Fly.prototype =
{
	update: function()
	{

		if (this.center.x < this.player.center.x+8) this.center.x += 1;
		if (this.center.y < this.player.center.y+10) this.center.y += 1;
		if (this.center.x > this.player.center.x+8) this.center.x -= 1;
		if (this.center.y > this.player.center.y+10) this.center.y -= 1;
		
		if ( (this.center.x === this.player.center.x+8) && (this.center.y === this.player.center.y+10) )
			this.center = { x: Math.floor(Math.random()*(mx-2)*TileSize), y: Math.floor(Math.random()*(my-2)*TileSize) };
			//this.center = { x: Math.floor(Math.random()*300)*2, y: Math.floor(Math.random()*200)*2 };
		
		this.counter ++;
		this.counter %= 40;
	},
	
	draw: function(screen, camerax, cameray)
	{
		screen.drawImage (Images[1], 16+(this.counter >= 20?16:0), 0, this.size.x,this.size.y, 
							this.center.x-(camerax*TileSize),this.center.y-(cameray*TileSize), 
							this.size.x,this.size.y);
	}
}

