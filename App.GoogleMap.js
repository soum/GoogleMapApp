'use strict'

//Markup depencies starts here

var $body = $('body'),
	$findbylocation = $body.find('form[id*="storelocator"]'),
	$formType = $body.find('input[name*="submissionFormat"]'),
	$storeResult = $('#result'),
	$location = $('.use-my-location'),
	$lat = $findbylocation.find('input[name*="latitude"]'),
	$lng = $findbylocation.find('input[name*="longitude"]'),
	$zip = $findbylocation.find('input[name*="location"]'),
	$map = $('#map'),
	msg   = window.Resources,
	url =  window.Urls;
	
//Markup depencies starts here

var map;
window.initMap = function() {

	app.setMapObj(56.4260545, -115.0927734, 5);

}

var storeLocator = function(){};

storeLocator.prototype.setMapObj = function(lat, lng, zoom){
	map = new google.maps.Map(document.getElementById('map'), {
	  center: {lat: lat, lng: lng},
	  zoom: zoom
	});

	return map;
}

storeLocator.prototype.renderStores = function(o, data){

	var formObj = this.objectToString(data);
	var x = '';

	$.each(o, function(k, d){
		x += '<div>';
		x += '<a href="' + d.link + '">' + d.storeName + '</a>';
		x += '<div>' + d.address1 + '</div>';
		x += d.address2 ? '<div>' + d.address2 + '</div>' : '';
		x += '<div>' + d.city + '</div>';
		x += '<div>' + d.state + '</div>';
		x += '<div>' + d.postalCode + '</div>';
		x += '<div>' + d.phone + '</div>';
		x += '<a href="' + url.storeDetail;
		x += '?StoreID=' + d.ID;
		x += '&context=storeLocator';
		x += '&' + formObj;
		x += '">' + msg.STORELOCATOR_VIEWSTOREDETAIL + '</a>';
		x += '</div><hr>';
		
	});
	
	return x;
}

storeLocator.prototype.objectToString = function(f){

	var str = '';
	for(var i in f){
		if(f[i] !== ''){
			str += i + '=' + f[i] + '&';
		}
	}
	str = str.replace(/&\s*$/, "");
	return str;

}

storeLocator.prototype.getStores = function(data, url, format) {

	var ajax = $.ajax({
		type: "POST",
		url: url.getStores,
		data: data,
		context: this,
		dataType: "html",
			success: function (d) {

			var o = {};
			//debugger;
			if(format === 'json'){
				
				if(this.isJSON(d)){

					o = JSON.parse(d);
					var stores = this.renderStores(o, data);
					$storeResult.html(stores);
					this.addStoresToMap(o);

				}else{
					$storeResult.html(d);
				}
				
			}
			//to do: write case to handle html
			
		}
	});

	return ajax;
	
};

//this method tests if response is a valid stringified json
//no store found response returns raw html

 storeLocator.prototype.isJSON = function(jsonStr){
    try {
        var o = JSON.parse(jsonStr);
    }
    catch (e) { 
    	return false;
    }

    return true;
};

storeLocator.prototype.loadApi = function(){

    var apiKey = window.SitePreferences.googleAddressLookup;
    var protocol = window.location.protocol;

    //caching to avoid loading multiple instances of the api per session
    $.ajax({
		url: protocol + '//maps.googleapis.com/maps/api/js?key=' + apiKey + '&callback=initMap',
		cache: true,
		dataType: 'script',
		success: function(){window.autocompleteIsLoaded = true;},
		error: function(){window.apiLoadFailure = true;}
	});
	
}

//add stores to the map

storeLocator.prototype.addStoresToMap = function(response){

	var offsetVal = 4000;
	
	//response = [{lat: 53.7266683,lng: -127.6476206}]
	var infowindow = new google.maps.InfoWindow();

	//reset map zoom level with first coordinate from the response

	this.setMapObj(response[0].lat, response[0].lng, 11);

	$.each(response, function(key, d) {
		var latLng = new google.maps.LatLng(d.lat, d.lng); 
		// Creating a marker and putting it on the map
		var marker = new google.maps.Marker({
			//map: map,
		    position: latLng,
		    title: d.storeName
		    //icon:image,
		});
		marker.setMap(map);
		var i;
		google.maps.event.addListener(marker, 'click', (function(marker, i) {
			var _x = '';
			return function() {

				//talk to nicki to add correct markup
				_x += d.address1;
				_x += d.city;
				_x += d.state;
				_x += d.postalCode;
				
				//talk to nicki to add correct markup
				infowindow.setContent('<div>'+ _x +'</div>');
				infowindow.open(map, marker);
			}
		})(marker, i));

	});

}

storeLocator.prototype.serializeForm = function(obj){
	
	var data = {};
	$(obj).serializeArray().map(function(x){
		data[x.name] = x.value;
	});

	return data;
}

var app = new storeLocator();

//load map api
if($map.length > 0){

	app.loadApi();

}

//search
$findbylocation.on('submit', function(e) {
	e.preventDefault();
	
	//if javascript is enabled 
	//the form submit attribute is set to be ajax
	//if expecting html already parsed set $formType.val('');
	$formType.val('ajax');
	var data = app.serializeForm($(this));
	
	app.getStores(data, url, 'json');
	
	
});

//find by location
$location.on('click', function(){

	$formType.val('ajax');
	
	//$lat.val(53.541191);
	//$lng.val(-113.580515);
	$zip.val('');

	navigator.geolocation.getCurrentPosition(function(location) {

		var lat = location.coords.latitude;
		var lng = location.coords.longitude;

		$lat.val(lat);
		$lng.val(lng);

		var data = app.serializeForm($findbylocation);
		console.log(data)
		app.getStores(data, url, 'json');

		
	});

})


module.exports = storeLocator;



