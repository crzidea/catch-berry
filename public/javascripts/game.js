// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
var canvasCenter = {
	x: canvas.width / 2,
	y: canvas.height / 2
}
document.body.appendChild(canvas);

// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
	bgReady = true;
};
bgImage.src = "images/background.png";

// Hero image
var heroReady = false;
var heroImage = new Image();
heroImage.onload = function () {
	heroReady = true;
};
heroImage.src = "images/hero.png";

// Monster image
var monsterReady = false;
var monsterImage = new Image();
monsterImage.onload = function () {
	monsterReady = true;
};
monsterImage.src = "images/monster.png";

// Game objects
var hero = {
	x: canvasCenter.x,
	y: canvasCenter.y,
	speed: 256 // movement in pixels per second
};
var monster = {};
var monstersCaught = 0;

// handel movement
var vector = {
	x: 0,
	y: 0
};
// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
	// keysDown[e.keyCode] = true;
	switch (e.keyCode) {
	case 37: // left
		vector.x = -1;
		break
	case 38: // up
		vector.y = -1;
		break
	case 39: // right
		vector.x = 1;
		break
	case 40: // down
		vector.y = 1;
		break
	}
}, false);

addEventListener("keyup", function (e) {
	// delete keysDown[e.keyCode];
	// switch (e.keyCode) {
	// case 37: // left
	// case 39: // right
	// 	vector.x = 0;
	// 	break
	// case 38: // up
	// case 40: // down
	// 	vector.y = 0;
	// 	break
	// }
}, false);

// Add touch device support
canvas.addEventListener('touchstart', function (e) {
	var touch = e.touches[0];
	var vector = {
		x: touch.clientX,
		y: touch.clientY
	};
	console.log(touch);
})
canvas.addEventListener('touchend', function (e) {
	console.log(e);
})


// Reset the game when the player catches a monster
var reset = function () {
	// hero.x = canvas.width / 2;
	// hero.y = canvas.height / 2;

	// Throw the monster somewhere on the screen randomly
	monster.x = 32 + (Math.random() * (canvas.width - 64));
	monster.y = 32 + (Math.random() * (canvas.height - 64));
};

// Update game objects
var update = function (modifier) {
	// if (38 in keysDown) { // Player holding up
	// 	hero.y -= hero.speed * modifier;
	// }
	// if (40 in keysDown) { // Player holding down
	// 	hero.y += hero.speed * modifier;
	// }
	// if (37 in keysDown) { // Player holding left
	// 	hero.x -= hero.speed * modifier;
	// }
	// if (39 in keysDown) { // Player holding right
	// 	hero.x += hero.speed * modifier;
	// }
	hero.x += vector.x * hero.speed * modifier;
	hero.y += vector.y * hero.speed * modifier;

	// Are they touching?
	if (
		hero.x <= (monster.x + 32) && monster.x <= (hero.x + 32) && hero.y <= (monster.y + 32) && monster.y <= (hero.y + 32)
	) {
		++monstersCaught;
		reset();
	}

	// Are we out?
	if (hero.x >= canvas.width - heroImage.width || hero.x <= 0) {
		vector.x = 0 - vector.x;
	}
	if (hero.y >= canvas.height - heroImage.height || hero.y <= 0) {
		vector.y = 0 - vector.y;
	}

};

// Draw everything
var render = function () {
	if (bgReady) {
		ctx.drawImage(bgImage, 0, 0);
	}

	if (heroReady) {
		ctx.drawImage(heroImage, hero.x, hero.y);
	}

	if (monsterReady) {
		ctx.drawImage(monsterImage, monster.x, monster.y);
	}

	// Score
	ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "24px Helvetica";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("Goblins caught: " + monstersCaught, 32, 32);
};

// The main game loop
var main = function () {
	var now = Date.now();
	var delta = now - then;

	update(delta / 1000);
	render();

	then = now;
	setTimeout(main, 1);
};

// Let's play this game!
reset();
var then = Date.now();
// setInterval(main, 1); // Execute as fast as possible
main();