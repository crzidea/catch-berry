function game(res) {
	var monstersCaught = res.score || 0;
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

	var edge = 32;
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

	// Monster image
	var trapReady = false;
	var trapImage = new Image();
	trapImage.onload = function () {
		trapReady = true;
	};
	trapImage.src = "images/trap.png";

	// Game objects
	var hero = {
		x: canvasCenter.x,
		y: canvasCenter.y,
		turningX: false,
		turningY: false,
		speed: 256 // movement in pixels per second
	};
	var monster = {};
	var trap = {};

	var xhr = new XMLHttpRequest;
	xhr.onload = function () {
		try {
			monstersCaught = JSON.parse(xhr.response).score;
		} catch (e) {
			console.log(e);
		};
	}

	// Movement
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

	// Add touch device support
	canvas.addEventListener('touchstart', function (e) {
		var touch = e.touches[0];
		var canvas = document.getElementsByTagName('canvas')[0];
		vector = {
			x: touch.pageX - canvas.offsetTop > hero.x ? 1 : -1,
			y: touch.pageY - canvas.offsetLeft > hero.y ? 1 : -1
		};
	})
	// canvas.addEventListener('touchend', function (e) {
	//   console.log(e);
	// })


	// Reset the game when the player catches a monster
	var reset = function () {

		// Throw the monster somewhere on the screen randomly
		monster.x = 64 + (Math.random() * (canvas.width - 160));
		monster.y = 64 + (Math.random() * (canvas.height - 160));

		if (checkCollision(monster)) {
			return reset();
		}

		// Get trap position
		/**
		 * x:     y:
		 * 0 0 0  0 1 2
		 * 1   1  0   2
		 * 2 2 2  0 1 2
		 */
		do {
			var posX = Math.floor(Math.random() * 3);
			var posY = Math.floor(Math.random() * 3);
		} while (posX == posY && 1 == posX)

		trap.x = monster.x + edge * (posX - 1);
		trap.y = monster.y + edge * (posY - 1);

		if (checkCollision(trap)) {
			return reset();
		}

	};


	var score = function () {
		xhr.open('post', '/api/score', true);
		xhr.send();
	}

	var checkCollision = function (thing) {
		return hero.x <= (thing.x + edge) &&
			thing.x <= (hero.x + edge) &&
			hero.y <= (thing.y + edge) &&
			thing.y <= (hero.y + edge)
	}

	// Update game objects
	var update = function (modifier) {
		hero.x += vector.x * hero.speed * modifier;
		hero.y += vector.y * hero.speed * modifier;

		// Are they touching?
		if (checkCollision(monster)) {
			score();
			reset();
		}

		if (checkCollision(trap)) {
			hero.x = canvasCenter.x;
			hero.y = canvasCenter.y;
			vector.x = vector.y = 0;
			reset();
		}

		// Are we out?
		if (hero.x + edge * 2 >= canvas.width) {
			vector.x = -1;
		} else if (hero.x - edge <= 0) {
			vector.x = 1;
		}
		if (hero.y + edge * 2 >= canvas.height) {
			vector.y = -1;
		} else if (hero.y - edge <= 0) {
			vector.y = 1;
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

		if (trapReady) {
			ctx.drawImage(trapImage, trap.x, trap.y);
		}

		// Score
		ctx.fillStyle = "rgb(250, 250, 250)";
		ctx.font = "24px Helvetica";
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText("Goblins caught: " + monstersCaught, edge, edge);
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


	// use channel
	var channel = new Channel(res.chOpts);
	channel.onmessage = function (msg) {
		var top3 = JSON.parse(msg.data);
		console.log(top3);
	}
}
