let coords = {latitude: 52.294931, longitude: 4.6748620999999995};
let availableParks = [
	{id:'WalibiHolland',name:'Walibi Holland'},
	{id:'Efteling',name:'Efteling',lat:51.6494974,lng:5.0437061},
	{id:'Toverland',name:'Toverland'},
	{id:'Bellewaerde',name:'Bellewaerde'},
	{id:'Phantasialand',name:'Phantasialand'},
	{id:'ChessingtonWorldOfAdventures',name:'Chessington World Of Adventures'},
	{id:'ThorpePark',name:'Thorpe Park'},
	{id:'AsterixPark',name:'Parc-Asterix'},
	{id:'DisneylandParisMagicKingdom',name:'Disneyland Park'},
	{id:'DisneylandParisWaltDisneyStudios',name:'Walt Disney Studios',lat:48.8684275,lng:2.7806859},
	{id:'AltonTowers',name:'Alton Towers'},
	{id:'EuropaPark',name:'Europa Park'}
];
let loadedParks = false;
let parks = [];
let selectedPark = '';
let selectedParkData = {};
let selectedRides = [];
let parkLoc = {lat: 51.6494974, lng: 5.0437061};

let name = '';
let players = [];
let unloadedPlayers = [];

(function () {
	$.getJSON('/ride/getParks.php').done(function(json) {
		console.log('Parks', json);
		if (json.result.length === 0) {
			console.log('0 parks found.');
		}
		for (const park of json.result) {
			park.distance = getDistance(coords, park.latitude, park.longitude);
		}
		json.result.sort((a, b) => (a.distance > b.distance) ? 1 : -1);

		$.each(json.result, function(i, park) {
			const id = park.park_id;
			let photo_name = window.location.origin + `/ride/images/assets/${id}/${id}.png`;
			const name = park.name;
			if (!availableParks.some(o => o.id === id)) {
				photo_name = '/parkvisit/placeholder.png'
				// parks.push({text: name, value: i, selected: false, description: getDistance(coords, park.latitude, park.longitude) + ' km', imageSrc: photo_name});
			}
			parks.push({text: name, id: id, value: i, selected: false, imageSrc: photo_name, lat: parseFloat(park.latitude), lng: parseFloat(park.longitude)});
			if (i + 1 === json.result.length) {
				$('#select-park').ddslick({
					data: parks,
					width: 445,
					imagePosition: "left",
					selectText: "Select the park you want to visit",
					onSelected: function (data) {
						selectedParkData = data.selectedData;
						selectedPark = data.selectedData.text;
						if (availableParks.some(o => o.id === data.selectedData.id && o.hasOwnProperty('lat'))) {
							const a = availableParks.filter(o => o.id === data.selectedData.id)[0];
							parkLoc = {lat: a.lat, lng: a.lng};
						}
						else {
							parkLoc = {lat: data.selectedData.lat, lng: data.selectedData.lng};
						}
						if ($('#party-create-name').val() === '' || selectedPark === '') $('#party-create').addClass('disabled');
						else $('#party-create').removeClass('disabled');
					}
				});
			}
		});
		loadedParks = true;
	}).fail(error => {
		console.error('Load parks', error);
		loadedParks = true;
	});
	setTimeout(() => {
		if (!loadedParks) {
			alert('Failed to load parks, reloading...');
			location.reload();
		}
	}, 2000);

	const script = document.createElement('script');
	script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
	script.defer = true;
	script.async = true;
	document.head.appendChild(script);

	$('#party-join-code, #party-join-name').keyup(function() {
		if ($('#party-join-code').val() === '' || $('#party-join-name').val() === '') $('#party-join').addClass('disabled');
		else $('#party-join').removeClass('disabled');
	});
	$('#party-join-code').keyup(function() {
		if ($(this).val() !== '') partyId = $(this).val();
	});
	$('#party-create-name').keyup(function() {
		if ($(this).val() === '' || selectedPark === '') $('#party-create').addClass('disabled');
		else $('#party-create').removeClass('disabled');
	});
}());

//<editor-fold desc="Maps">
let map;
let panorama;
let markers = [];

function initialize() {
	const myStyle = [
		// {
		// 	featureType: "administrative",
		// 	elementType: "geometry",
		// 	stylers: [
		// 		{visibility: "off"}
		// 	]
		// },
		// {
		// 	featureType: "poi",
		// 	stylers: [
		// 		{visibility: "off"}
		// 	]
		// },
		// {
		// 	featureType: "road",
		// 	elementType: "labels.icon",
		// 	stylers: [
		// 		{visibility: "off"}
		// 	]
		// },
		// {
		// 	featureType: "transit",
		// 	stylers: [
		// 		{visibility: "off"}
		// 	]
		// }
		
		// {
		// 	featureType: "all",
		// 	elementType: "labels",//hides all labels
		// 	stylers: [
		// 		{ visibility:'off' }
		// 	]
		// }

		{
			elementType: "labels",
			stylers: [{visibility: "off"}]
		},
		{
			featureType: "administrative",
			elementType: "geometry",
			stylers: [{visibility: "off"}]
		},
		{
			featureType: "administrative.land_parcel",
			stylers: [{visibility: "off"}]
		},
		{
			featureType: "administrative.neighborhood",
			stylers: [{visibility: "off"}]
		},
		{
			featureType: "poi",
			stylers: [{visibility: "off"}]
		},
		{
			featureType: "road",
			elementType: "labels.icon",
			stylers: [{visibility: "off"}]
		},
		{
			featureType: "transit",
			stylers: [{visibility: "off"}]
		}
	];

	map = new google.maps.Map(document.getElementById('map'), {
		center: parkLoc,
		zoom: 18,
		mapTypeId: 'hybrid',
		zoomControl: false,
		mapTypeControl: false,
		scaleControl: false,
		streetViewControl: false,
		rotateControl: false,
		fullscreenControl: false
	});
	google.maps.event.addListener(map, 'maptypeid_changed', function() {
		this.setOptions({styles: myStyle});
	});
	google.maps.event.trigger(map,'maptypeid_changed');
	// map.mapTypes.set('mystyle', new google.maps.StyledMapType(myStyle, { name: 'My Style' }));
	panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), {
		position: parkLoc,
		addressControl: false,
		linksControl: false,
		panControl: false,
		zoomControlOptions: {
			style: google.maps.ZoomControlStyle.SMALL
		},
		enableCloseButton: false,
		pov: {
			heading: 165,
			pitch: 7,
			zoom: 1
		}
	});

	const location = new google.maps.Marker({
		position: parkLoc,
		title: "You are here.",
		map: map,
		icon: {
			path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
			scale: 6,
			fillColor: "red",
			fillOpacity: 0.8,
			strokeWeight: 2,
			rotation: 0
		}
	});
	$('#map .gm-style > div > div > div > div > canvas').first().css('transform',`rotate(${panorama.getPov().heading}deg)`);

	unloadedPlayers.forEach(p => {
		const i = players.findIndex(o => o.uuid === p.uuid);
		if (i > -1) {
			players[i].marker = new google.maps.Marker({
				position: {lat: p.lat, lng: p.lng},
				title: p.name,
				map: map,
				icon: {
					path: google.maps.SymbolPath.CIRCLE,
					scale: 6,
					fillColor: getRandomColor(),//"green",
					fillOpacity: 0.8,
					strokeWeight: 2,
					rotation: 0
				}
			});
			//http://map-icons.com/
			// players[i].marker = new Marker({
			// 	map: map,
			// 	position: {lat: p.lat, lng: p.lng},
			// 	title: p.name,
			// 	icon: {
			// 		path: SQUARE_ROUNDED,
			// 		fillColor: '#00CCBB',
			// 		fillOpacity: 1,
			// 		strokeColor: '',
			// 		strokeWeight: 0
			// 	},
			// 	map_icon_label: `<span id="${p.uuid}" class="map-icon map-icon-location-arrow"></span>`
			// });
			// setTimeout(() => {
			// 	console.log($('#' + p.uuid));
			// 	$('#' + p.uuid).css('transform',`rotate(${p.heading}deg)`)
			// }, 50);
		}
	});
	unloadedPlayers = [];

	loadMarkers(selectedParkData.id).then(rides => {
		selectedRides = [...rides];
		rides.forEach(ride => {
			let btn = `<p><b><a class="btn btn-primary" onclick="ride('${ride.ride_id}')" tabindex="-1">Ride</a></b></p>`;
			if (ride.onride_video == null) btn = '';
			const contentString =
`<div id="content">
	<div id="siteNotice"></div>
	<h1 id="firstHeading" class="firstHeading">${ride.name}</h1>
	<div id="bodyContent">
		<p>${ride.description}</p>
		${btn}
	</div>
</div>`;
			const infoWindow = new google.maps.InfoWindow({
				content: contentString
			});
			const mapMarker = new google.maps.Marker({
				position: {lat: parseFloat(ride.latitude), lng: parseFloat(ride.longitude)},
				map: map,
				title: ride.name
			});
			const panoMarker = new google.maps.Marker({
				position: {lat: parseFloat(ride.latitude), lng: parseFloat(ride.longitude)},
				map: panorama,
				title: ride.name
			});

			google.maps.event.clearListeners(panoMarker,'click');
			bindInfoWindow(panoMarker, panorama, infoWindow, contentString);
			panoMarker.addListener('click', function() {
				console.log('Open ' + ride.name);
				infoWindow.open(panorama, panoMarker);
			});
			markers.push({
				name: ride.name,
				mapMarker: mapMarker,
				panoMarker: panoMarker,
				content: contentString,
				infoWindow: infoWindow
			});
			console.log('Added ride ' + ride.name);
			if (rides.length === markers.length) console.log('Markers',markers);
		});

		setTimeout(() => {
			map.setOptions({styles: myStyle});
			google.maps.event.trigger(map,'maptypeid_changed');
			$('.dismissButton').trigger('click');
		}, 1000);
		setTimeout(() => $('.dismissButton').trigger('click'), 2000);

		panorama.addListener('position_changed', function() {
			const pos = panorama.getPosition();
			// console.log('position_changed', pos);
			location.setPosition(pos);
			map.setCenter(pos);
			if (connected) changePosition(pos.lat(), pos.lng(), panorama.getPov().heading);
			setTimeout(() => $('#map .gm-style > div > div > div > div > canvas').first().css('transform',`rotate(${panorama.getPov().heading}deg)`), 10);
		});

		panorama.addListener('pov_changed', function() {
			// console.log('pov_changed', panorama.getPov());
			$('#map .gm-style > div > div > div > div > canvas').first().css('transform',`rotate(${panorama.getPov().heading}deg)`);
		});
	});
}

async function loadMarkers(park) {
	const r = await $.ajax({
			url: '/ride/getrides.php',
			type: 'POST',
			data: {park_id: park},
			dataType: 'json',
			cache: false
	});
	console.log('loadMarkers', r);
	return r.result;
}
//</editor-fold>

//<editor-fold desc="Websocket">
if (location.protocol !== 'http:')
	location.href = 'http:' + window.location.href.substring(window.location.protocol.length);

const ws = new WebSocket(`ws://${ip}:18190/uuid=${createUUID()}`);
var connected = false;
const status = $('#status');
const $chat = $('.chat');

let partyId = '';

ws.onopen = function() {
	console.log('Open WebSocket');
	status.append(`<br><b title="${getTime()}">Open WebSocket</b>`);
};

function connect() {
	name = $('#party-create-name').val() === '' ? $('#party-join-name').val() : $('#party-create-name').val();
	if (name !== '') {
		if (!connected) {
			if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
				ws.send(JSON.stringify({status: 'ok', event: 'connecting', data: name}));
				console.log('Connecting');
				status.append(`<br><span title="${getTime()}"><i class="far fa-hourglass"></i> <b>Connecting:</b> ${name}</span>`);
			}
			else location.reload();
		}
		else {
			console.error('Already connected!');
			status.append(`<br><span title="${getTime()}"><i class="far fa-exclamation-triangle"></i> <b>Already connected!</b></span>`);
		}
	}
	else {
		console.error('No player');
		status.append(`<br><span title="${getTime()}"><i class="far fa-exclamation-triangle"></i> <b>Not connected:</b> no player</span>`);
	}
}

ws.onmessage = function(msg) {
	// console.log(msg.data);
	let json = JSON.parse(msg.data);
	console.info('msg',json);
	if (json.status === 'ok') {
		if (json.eventType === 'action') {
			if (json.event === 'joined_party') {
				let player = json.data;
				status.append(`<br><span title="${getTime()}"><i class="fas fa-plus-square"></i> <i>${player.name} has joined the party.</i></span>`);
				status.animate({scrollTop: status.height()}, 'fast');
				if (map != null) {
					player.marker = new google.maps.Marker({
						position: {lat: player.lat, lng: player.lng},
						title: player.name,
						map: map,
						icon: {
							path: google.maps.SymbolPath.CIRCLE,
							scale: 6,
							fillColor: getRandomColor(),//"green",
							fillOpacity: 0.8,
							strokeWeight: 2,
							rotation: 0
						}
					});
					// player.marker = new Marker({
					// 	map: map,
					// 	position: {lat: player.lat, lng: player.lng},
					// 	title: player.name,
					// 	icon: {
					// 		path: SQUARE_ROUNDED,
					// 		fillColor: '#00CCBB',
					// 		fillOpacity: 1,
					// 		strokeColor: '',
					// 		strokeWeight: 0
					// 	},
					// 	map_icon_label: `<span id="${player.uuid}" class="map-icon map-icon-location-arrow"></span>`
					// });
					// setTimeout(() => {
					// 	console.log(2,$('#' + player.uuid));
					// 	$('#' + player.uuid).css('transform',`rotate(${player.heading}deg)`)
					// }, 10);
				}
				else {
					unloadedPlayers.push(player);
				}
				players.push(player);
				$('#players').text('You, ' + players.map(o => o.name).join(', '));
			}
			else if (json.event === 'left_party') {
				const index = players.findIndex(o => o.uuid === json.data.uuid);
				if (index > -1) {
					status.append(`<br><span title="${getTime()}"><i class="fas fa-minus-square"></i> <i>${players[index].name} has left the party.</i></span>`);
					status.animate({ scrollTop: status.height() }, 'fast');
					let marker = players[index].marker;
					marker.setMap(null);
					players.splice(index, 1);
					if (players.length === 0) $('#players').text('You');
					else $('#players').text('You, ' + players.map(o => o.name).join(', '));
				}
			}
			else if (json.event === 'changed_location') {
				const player = players.filter(p => p.uuid === json.data.uuid)[0];
				if (player != null) {
					const marker = player.marker;
					marker.setPosition({lat: json.data.lat, lng: json.data.lng});
					setTimeout(() => $('#' + player.uuid).css('transform',`rotate(${json.data.heading}deg)`), 10);
				}
			}
			else if (json.event === 'ride') {
				const ride = selectedRides.filter(r => r.ride_id === json.data && r.onride_video != null)[0];
				console.log('ride: ', json.data, ride);
				if (ride != null) {
					status.append(`<br><i title="${getTime()}">Riding ${ride.name}.</i>`);
					status.animate({ scrollTop: status.height() }, 'fast');
					// $('#video').append(`<iframe class="embed-responsive-item" id="player" type="text/html" src="http://www.youtube.com/embed/${ride.onride_video}?enablejsapi=1&origin=http://www.maximumfx.nl/"></iframe>`);//autoplay=1&
					$('#video').show();
					let player = new YT.Player('player', {
						width: window.innerWidth - rem(24),
						height: window.innerHeight,
						videoId: ride.onride_video,
						events: {
							'onReady': event => {
								// console.log('onReady', event);
								// $('#video').show();
								event.target.playVideo();
							},
							'onStateChange': event => {
								// console.log('onStateChange', event);
								if (event.data === YT.PlayerState.ENDED) {
									console.log('End ride');
									$('#video').hide();
									$('#video').empty().append('<div id="player"></div>');
								}
							}
						}
					});
					console.log(player);
				}
			}
		}
		else if (json.eventType === 'read') {
			if (json.event === 'connecting') {
				connected = true;
				$('#connect').text('Connected').removeClass('btn-primary').addClass('btn-success');
				status.append(`<br><span title="${getTime()}"><i class="far fa-check"></i> <b>Connected:</b> ${name}</span>`);
			}
			else if (json.event === 'create_party') {
				partyId = json.data;
				$('#party-id').text('#' + json.data);
			}
			else if (json.event === 'join_party') {
				partyId = json.data;
				$('#party-id').text('#' + json.data);
				$('#welcome').hide();
				$('#main').show();
				initialize();
			}
		}
	}
	else if (json.status === 'message') {
		if (json.eventType === 'read') {
			if (json.event === 'chat') {
				let chatMsg = json.data;
				status.append(`<br><span title="${getTime()}"><b>${chatMsg.name}:</b> ${chatMsg.message}</span>`);
				$chat.animate({ scrollTop: $chat.height() }, 'fast');
			}
		}
	}
	else if (json.status === 'error') {
		console.error(json.data);
		alert(json.data);//TODO toasts
	}
};

ws.onclose = function() {
	console.log('Closed WebSocket');
	if (connected) {
		alert('Connection lost');
		location.reload();
	}
	else alert('Server down');
	connected = false;
	status.append(`<br><b title="${getTime()}">Closed WebSocket</b>`);
};

ws.onerror = function(evt) {
	console.error('error',evt);
};
//</editor-fold>

//<editor-fold desc="Functions">
const openSection = page => {
	$('#welcome [data-page]').hide();
	$(`#welcome [data-page="${page}"]`).show();
};

const chat = (message = $('#chat').val()) => {
	ws.send(JSON.stringify({status: 'ok', eventType: 'action', event: 'chat', data: message}));
	$('#chat').val('');
};
const createParty = (parkId = selectedPark) => {
	if (!connected) connect();
	setTimeout(() => ws.send(JSON.stringify({status: 'ok', eventType: 'action', event: 'create_party', data: parkId})), 50);
	setTimeout(() => joinParty(), 100);
};
const joinParty = (id = partyId) => {
	if (!connected) connect();
	id = id.replace('#', '');
	let data;
	if (panorama != null) data = {party:id,lat:panorama.getPosition().lat(),lng:panorama.getPosition().lng(),heading:panorama.getPov().heading};
	else data = {party:id,lat:parkLoc.lat,lng:parkLoc.lng,heading:0};
	ws.send(JSON.stringify({status: 'ok', eventType: 'action', event: 'join_party', data: data}));
};
var changePosition = (lat, lng, heading) => {
	ws.send(JSON.stringify({status: 'ok', eventType: 'action', event: 'change_location', data: {party:partyId,lat:lat,lng:lng,heading:heading}}));
};
var ride = (rideId) => {
	if (!rideId) console.error('No rideId provided!');
	else ws.send(JSON.stringify({status: 'ok', eventType: 'action', event: 'ride', data: rideId}));
};
//</editor-fold>

//<editor-fold desc="Help functions">
function getDistance(coords, latitude, longitude) {
	return round(getDistanceFromLatLonInKm(coords.latitude, coords.longitude, latitude, longitude), 1);
}
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
	const R = 6371; // Radius of the earth in km
	const dLat = deg2rad(lat2-lat1);  // deg2rad below
	const dLon = deg2rad(lon2-lon1);
	const a =
		Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
		Math.sin(dLon/2) * Math.sin(dLon/2)
	;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	return R * c; // Distance in km
}
function deg2rad(deg) {
	return deg * (Math.PI/180)
}
function round(value, precision) {
	const multiplier = Math.pow(10, precision || 0);
	return Math.round(value * multiplier) / multiplier;
}
function doesFileExist(urlToFile) {
	$.ajax({
		url: urlToFile,
		type: 'HEAD',
		error: function() {
			return false;
		},
		success: function() {
			return true;
		}
	});
}
function bindInfoWindow(marker, mapOrStreetViewObject, infoWindowObject, html) {
	google.maps.event.addListener(marker, 'click', function() {
		infoWindowObject.setContent(html);
		infoWindowObject.open(mapOrStreetViewObject, marker);
	});
}
function createUUID() {
	let dt = new Date().getTime();
	const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (dt + Math.random() * 16) % 16 | 0;
		dt = Math.floor(dt / 16);
		return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
	return uuid;
}
function getRandomColor() {
	const letters = '0123456789ABCDEF';
	let color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}
function rem(value) {
	return value * getRootElementFontSize();
}
function getRootElementFontSize() {
	return parseFloat(getComputedStyle(document.documentElement).fontSize);
}
function getTime() {
	let date = new Date();
	return date.getHours() + ':' + ((date.getMinutes() < 10) ? '0' + date.getMinutes() : date.getMinutes());
}
//</editor-fold>
