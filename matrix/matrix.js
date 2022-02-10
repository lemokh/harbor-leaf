onload = function() {
			// based on
			// https://codepen.io/P3R0/pen/MwgoKv
			// https://www.pubnub.com/developers/realtime-data-streams/twitter-stream/

			// visualization settings
			var maxMessages = 10240;

			var font_size = 16;

			var minSpeed = 22;
			var maxSpeed = 99;
			var speedStep = 11;
			var currentSpeed = 88;
			
			var maxStepsToResetColumn = 200;

			var twitterMessages = []; // data stack (queue)
			var messages = []; // current printed data
			
			var a = document.getElementById("a");

			var c = document.getElementById("c");
			var ctx = c.getContext("2d");

			//making the canvas full screen
			c.height = window.innerHeight;
			c.width = window.innerWidth;
			
			// limits
			var columns = Math.floor(c.width / font_size);
			var rows = Math.floor(c.height / font_size);
			var middle = Math.floor(columns / 2);
			
			// x is the x coordinate or column number
			for (var x = 0; x < columns; x++)
				messages.push({ y: Math.floor(Math.random() * rows), offset: 0, symbols: [] });
			
			var timerId = setInterval(draw, currentSpeed);
			
			mouseState = { x: -1, y: -1 };
			currentColumnState = { };
			
			function setColumnState(column)
			{
				currentColumnState.column = column;
				currentColumnState.messageEnd = false;
				currentColumnState.steps = 0;
			}
			
			function resetColumnState()
			{
				setColumnState(-1);
			}
			
			resetColumnState();
			
			function updateColumnState(e) 
			{
				var column = Math.floor(e.clientX / font_size);
				if (currentColumnState.column != column)
				{
					setColumnState(column);
				}
			}
			
			function onClick(e)
			{
				updateColumnState(e);
				var message = messages[currentColumnState.column];
				if (message.url)
				{
					window.open(message.url, '_blank');
				}
			}
			
			function toggleAudio()
			{
				if (a.paused)
				{
					a.play();
				}
				else
				{
					a.pause();
				}
			}
			
			onmousemove = updateColumnState;
			onclick = onClick;
			onkeyup = function(e) 
			{
				if (e.keyCode == 32)
				{
					toggleAudio();
				}
			}

			//drawing the characters
			function draw() 
			{
				// Update column state
				var currentColumn = currentColumnState.column;
				if (currentColumn > 0)
				{
					currentColumnState.steps++;
					if (currentColumnState.steps > maxStepsToResetColumn)
					{
						resetColumnState();
						currentColumn = -1;
					}
				}
				
				// Fade old symbols away one step
				if (currentColumn > 0)
				{
					//Black BG for the canvas
					//translucent BG to show trail
					ctx.fillStyle = "rgba(0, 0, 0, 0.10)";
					ctx.fillRect(0, 0, currentColumn * font_size, c.height);
					ctx.fillRect((currentColumn + 1) * font_size, 0,  c.width, c.height);
				}
				else
				{
					//Black BG for the canvas
					//translucent BG to show trail
					ctx.fillStyle = "rgba(0, 0, 0, 0.10)";
					ctx.fillRect(0, 0, c.width, c.height);
				}

				ctx.fillStyle = "#4F4"; //green text
				ctx.font = font_size + 'px "Unifont", "Courier New", "Courier"';
				ctx.textAlign = "center";

				// draw new letters
				for (var i = 0; i < columns; i++) 
				{
					// iterate from middle of the screen
					var x = i % 2 == 1 ? middle + (Math.floor(i / 2) + 1) : middle - Math.floor(i / 2);

					if (x >= columns || x == currentColumn)
						continue;
					
					var message = messages[x];
					
					if (message.offset < message.symbols.length)
					{
						var symbol = message.symbols[message.offset];
						
						if (symbol)
							ctx.fillText(symbol, (x * font_size) + (font_size / 2), message.y * font_size);
							
						message.offset++;
					}
					else
					{
						var startNewColumn = Math.random() > 0.95;
						if (twitterMessages.length > 0 && startNewColumn)
						{
							var twitterMessage = twitterMessages.pop();
							var symbols = getSymbols(twitterMessage.text);
							
							message.url = twitterMessage.url;
							message.offset = 0;
							message.symbols = symbols;
						}
					}
					
					//incrementing Y coordinate
					if (message.y >= rows)
						message.y = 1;
					else
						message.y++;
				}
				
				// adjust speed
				if (twitterMessages.length > (columns * 2))
				{
					if (currentSpeed > minSpeed)
					{
						currentSpeed -= speedStep; // speed up
						
						clearInterval(timerId);
						timerId = setInterval(draw, currentSpeed);
					}
				}
				else if (twitterMessages.length < (columns / 2))
				{
					if (currentSpeed < maxSpeed)
					{
						currentSpeed += speedStep; // slow down
						
						clearInterval(timerId);
						timerId = setInterval(draw, currentSpeed);
					}
				}
			}
			
			// Take language from url hash parameter
			language = window.location.hash.substr(1).toLowerCase();

			function addTwitterMessage(msg) {
				var messageUrl = "https://twitter.com/" + msg.user.screen_name + "/status/" + msg.id_str;
				twitterMessages.push({ text: msg.text, url: messageUrl });
			}

			PUBNUB.init({
				subscribe_key: 'sub-c-78806dd4-42a6-11e4-aed8-02ee2ddab7fe',
				ssl: true
			}).subscribe({
				channel: 'pubnub-twitter',
				message: function(msg) {
					// skip if there are too many messages (events)
					if (twitterMessages.length < maxMessages)
					{
						if (!language || msg.lang == language)
						{
							addTwitterMessage(msg);
						}
					}
				}
			});

		}