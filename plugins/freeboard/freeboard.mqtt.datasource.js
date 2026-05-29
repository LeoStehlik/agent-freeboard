// MQTT datasource plugin, adapted from joed74/freeboard-mqtt.
(function()
{
	var mqttDatasource = function(settings, updateCallback)
	{
		var self = this;
		var data = {};
		var client;
		var currentSettings = settings;

		function configuredTopics()
		{
			return _.filter(currentSettings.topics || [], function(entry)
			{
				return entry && entry.topic && entry.topic.length > 0;
			});
		}

		function brokerURL()
		{
			var transport = location.protocol == "https:" ? "wss" : "ws";
			return currentSettings.server.replace("%HOST%", location.host).replace("%WS%", transport);
		}

		function disconnect()
		{
			if(!_.isUndefined(client))
			{
				client.onConnectionLost = function() {};
				client.onMessageArrived = function() {};

				if(client.isConnected())
				{
					client.disconnect();
				}

				client = undefined;
			}
		}

		function publishUpdate()
		{
			updateCallback(_.clone(data));
		}

		function onConnect()
		{
			client.onConnectionLost = onConnectionLost;
			client.onMessageArrived = onMessageArrived;

			_.each(configuredTopics(), function(entry)
			{
				client.subscribe(entry.topic);

				if(entry.topic.search(/[+#]/g) == -1 && _.isUndefined(data[entry.topic]))
				{
					data[entry.topic] = {};
				}
			});

			data.connected = true;
			publishUpdate();
		}

		function onConnectionLost(responseObject)
		{
			if(responseObject.errorCode !== 0)
			{
				console.log("MQTT connection lost: " + responseObject.errorMessage);
			}

			data.connected = false;
			publishUpdate();
		}

		function onMessageArrived(message)
		{
			var payload = message.payloadString;
			var value;

			try
			{
				value = JSON.parse(payload);
			}
			catch(e)
			{
				value = payload;
			}

			if(!value || typeof value !== "object")
			{
				value = { payload: payload };
			}

			if(message.properties && message.properties.userProperties)
			{
				_.each(message.properties.userProperties, function(propertyValue, propertyName)
				{
					value[propertyName] = propertyValue;
				});
			}

			data[message.destinationName] = value;
			publishUpdate();
		}

		function onFailure(message)
		{
			data.connected = false;
			publishUpdate();
			console.log("MQTT connection failed: " + message.errorMessage);
		}

		function connect()
		{
			disconnect();

			var clientId = currentSettings.client_id + "_" + Math.floor(Math.random() * 100000 + 1);

			try
			{
				data = { connected: false };
				publishUpdate();

				client = new Paho.Client(brokerURL(), clientId);
				client.connect({
					timeout: 3,
					onSuccess: onConnect,
					onFailure: onFailure,
					reconnect: true,
					cleanSession: true
				});
			}
			catch(e)
			{
				console.log(e.toString());
			}
		}

		self.send = function(name, value)
		{
			if(!_.isUndefined(client) && client.isConnected())
			{
				var message = new Paho.Message(String(value));
				var matches = name.match(/\[[^\s\[\]]+\]/g);

				if(matches)
				{
					message.destinationName = matches[0].replace(/[\[\]\"\']/g, "") + "/set";
				}
				else
				{
					message.destinationName = name.replace(/[\[\]\"\']/g, "") + "/set";
				}

				client.send(message);
			}
		};

		self.onSettingsChanged = function(newSettings)
		{
			currentSettings = newSettings;
			connect();
		};

		self.updateNow = function()
		{
			publishUpdate();
		};

		self.onDispose = function()
		{
			disconnect();
		};

		connect();
	};

	freeboard.loadDatasourcePlugin({
		type_name: "paho_mqtt_js",
		display_name: "MQTT",
		description: "Receive data from an MQTT broker over WebSockets.",
		external_scripts: [
			"plugins/thirdparty/paho-mqtt.js"
		],
		settings: [
			{
				name: "server",
				display_name: "Broker WebSocket URL",
				type: "text",
				description: "Use ws:// or wss://. %HOST% expands to this page host, and %WS% chooses ws/wss from the page protocol.",
				required: true
			},
			{
				name: "client_id",
				display_name: "Client ID",
				type: "text",
				default_value: "freeboard",
				required: true
			},
			{
				name: "topics",
				display_name: "Topics",
				description: "Topics to subscribe to. MQTT wildcards are allowed.",
				type: "array",
				required: true,
				settings: [
					{
						name: "topic",
						display_name: "Topic",
						type: "text",
						required: true
					}
				]
			}
		],
		newInstance: function(settings, newInstanceCallback, updateCallback)
		{
			newInstanceCallback(new mqttDatasource(settings, updateCallback));
		}
	});
}());
