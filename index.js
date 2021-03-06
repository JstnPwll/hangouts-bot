var events = require('events');

module.exports = function(username, password, onlineStatus) {
	events.EventEmitter.call(this);

	var xmpp = require('node-xmpp');
	var that = this;

	this.connection = connection = new xmpp.Client({
		jid: username,
		password: password,
		host: "talk.google.com"
	});

	this.connection.on('online', function() {
		connection.send(new xmpp.Element('presence', {})
			.c('show')
			.t('chat')
			.up()
			.c('status')
			.t(onlineStatus || 'Online')
		);
		
		var roster_elem = new xmpp.Element('iq', {
			'from': connection.jid,
			'type': 'get',
			'id': 'google-roster'
		}).c('query', {
			'xmlns': 'jabber:iq:roster',
			'xmlns:gr': 'google:roster',
			'gr:ext': '2'
		});

		connection.send(roster_elem);

		that.emit('online');
	});

	this.connection.on('stanza', function(stanza) {
		if (stanza.is('message') && (stanza.attrs.type !== 'error') && (stanza.getChildText('body'))) {
			that.emit('message',
				stanza.attrs.from,
				stanza.getChildText('body')
			);
		}

		if(stanza.is('presence') && stanza.attrs.type === 'subscribe') {
			that.emit('stanza',
				stanza.attrs.from
			);			
			stanza.attrs.to = stanza.attrs.from;
			delete stanza.attrs.from;

			connection.send(stanza);
		}
	});

	this.connection.on('error', function(e) {
		console.log(e);
	});

	this.sendMessage = function(to, message) {
		var stanza = new xmpp.Element('message',
			{
				to: to,
				type: 'chat'
			})
			.c('body')
			.t(message);

		this.connection.send(stanza);
	}

	return this;
}

module.exports.prototype.__proto__ = events.EventEmitter.prototype;

