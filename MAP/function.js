var geocoder;
var map;
var address = "";
var allMarkers = [];
var markerManager;


var clickListener;
var customMarkerEnable = false;

var trafficLayer;
var trafficLayerEnabled = false;
var transitLayer;
var transitLayerEnabled = false;
var bikeLayer;
var bikeLayerEnabled = false;


//Api caller
function initMap() {
  geocoder = new google.maps.Geocoder();
  trafficLayer = new google.maps.TrafficLayer();
  transitLayer = new google.maps.TransitLayer();
  bikeLayer = new google.maps.BicyclingLayer();


  var latlng = new google.maps.LatLng(-34.397, 150.644);
  var mapOptions = {
    zoom: 12,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  google.maps.event.addListener(map, "idle", refreshMarkers); 
  $("#setLocation_btn").trigger("click");
 
  //Display quartiers
  displayDistrictPolygons(mulhouseFrancoisDor,'#FF0000');
  displayDistrictPolygons(croixRougeUnivSudEstOuest,'#00FF00');
  displayDistrictPolygons(croixRougeUnivSudEstOuestBis,'#00FF00');
  displayDistrictPolygons(croixRougeUnivCentreEst, "#0000FF");
  displayDistrictPolygons(croixRougeUnivCentreNord, "#FFFF00");
  var ctaLayer = new google.maps.KmlLayer({
    url: 'temdp.kml',
    map: map
  });
}

function setLocation(address) {
  geocoder = new google.maps.Geocoder();

  if (geocoder) {
    geocoder.geocode({
      'address': address
    }, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (status != google.maps.GeocoderStatus.ZERO_RESULTS) {
          map.setCenter(results[0].geometry.location);
        } else {
          log("No results found", "alert");
        }
      } else {
      	log("Geocode was not successful for the following reason: " + status, "alert");
      }
    });
  }
}

function addMarker(address){
  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {

    	// if we reach QUERY LIMIT we wait 200ms and retry
		if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
			setTimeout(function(){
				addMarker(address)
			}, 1000);
		}

		if(!markerExist(results[0].place_id)){

			//map.setCenter(results[0].geometry.location);

			//Create infowindow
			var infowindow = createInfoWindow(address);

			var marker = new google.maps.Marker({
			    map: map,
			    position: results[0].geometry.location,
			    label: address 
			});
			marker.addListener('click', function() {
			  infowindow.open(map, marker);
			});

			//Set unique id
			marker.id = results[0].place_id;
			addMarkerToList(marker);
		}
		else {
			log("Marker already exist: " + address, "alert");
		}
	} 
	else {
		log('Geocode was not successful for the following reason: ' + status, "alert");
	}
  });
}

function createInfoWindow(address){
	var contentString = 
		'<div id="content">'+
		  '<div id="siteNotice"></div>'+
		  '<h1 id="firstHeading" class="firstHeading">'+ address +'</h1>'+
		  '<div id="bodyContent">'+
		    '<p><b>'+ address +'</b>, Text here.</p>'+
		  '</div>'+
		'</div>';

	return new google.maps.InfoWindow({
		content: contentString
	});
}

function removeMarker(id){
  //Find and remove the marker from the Array
  for (var i = 0; i < allMarkers.length; i++) {
	if (allMarkers[i].id == id) {
		//Remove the marker from Map                  
		allMarkers[i].setMap(null);

		log("Marker removed : " + allMarkers[i].label, "success");
		//Remove the marker from array.
		allMarkers.splice(i, 1);
		return;
	}
  }
}

function markerExist(placeId){
  for (var i = 0; i < allMarkers.length; i++) {
      if (allMarkers[i].id === placeId) {
          return true;
      }
  }

  return false;
}

//Internal Function
function removeMarkerFromElem(elem){

	var id = $(elem).parent().attr("data-id");
	removeMarker(id);

	$(elem).parent().remove();
}

function clearAllMarkers(){   
	// clear map
	for (var i = 0; i < allMarkers.length; i++) {
      //Remove the marker from Map                  
      allMarkers[i].setMap(null);
  	}

	// clear markers array 
	allMarkers = [];

	// clear html list
	$("#markerList .marker:not(#markerReference)").remove();
  	log("All markers cleared", "success");
}

function addMarkerToList(marker){
  allMarkers.push(marker);
  var $clone = $("#markerReference").clone();
  $clone.attr("id", "");
  $clone.children("p").text(marker.label);
  $clone.attr("data-id", marker.id);

  $("#markerReference").after($clone);
  $clone.show();

  //bounce on li hover
  $clone.children(".bounce").hover(function(){
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }, function(){
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    }
  });

  $("#count").text($("#markerList .marker:not(#markerReference)").length);
  log("Marker added : " + marker.label, "success");
}

function bounce(marker) {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }
}

function InsertRandomMarkers(number){
	var addresses = GenerateData(number);
	var durationBetweenInsert = 1000 / 5;  // 1000ms divide by number you want;

	for (var i = 0; i < addresses.length; i++) {
		(function (x) {
			setTimeout(function(){
				var address = addresses[x].city + " " + addresses[x].streetNumber + " " + addresses[x].street;
				addMarker(address);
			}, durationBetweenInsert*x);
	    })(i);
	}
}






//////////////////////////////////////////////////////////////////////////////////////////
//---------------- PLACEMENT DE MARQUEURS PERSONNALISES --------------------------------//
//////////////////////////////////////////////////////////////////////////////////////////


function enableCustomMarker()
{
	clickListener = google.maps.event.addListener(map, "click", function(event) {
	    var latLng = event.latLng;
	    addCustomMarkerOnMap(latLng, - 10);
	    refreshMarkers();
	    alert(event.latLng);
	});

	customMarkerEnable = true;
}

function disableCustomMarker()
{
	google.maps.event.removeListener(clickListener);
	customMarkerEnable = false;
}

//Toggle l'ajout de marqueurs personnalisés
function toggleCustomMarker()
{
	if(customMarkerEnable)
	{
		document.getElementById('customMarkerToggle').className = "btn btn-danger";
		disableCustomMarker();
	}
	else
	{
		document.getElementById('customMarkerToggle').className = "btn btn-success";
		enableCustomMarker();
	}
}


function addCustomMarkerOnMap(latLngCoords, weight)
{

	var shouldHide = false;
	var pinColor = "808080";
	//Creation d'une image pour le marqueur personnalisée
	if(weight < 0) // Custom Marker en bleu
	{
		pinColor = "0000FF";
	}	
	else if(weight > 80)
	{
		pinColor = "A4D252";
	}
	else if(weight > 50)
	{
		pinColor = "FDB024";
	}
	else if(weight > 20)
	{
		pinColor = "FF0000";
	}
	else
	{
		shouldHide = true;
	}


    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
        new google.maps.Size(21, 34),
        new google.maps.Point(0,0),
        new google.maps.Point(10, 34));

	//Creation du marqueur aux coordonnées personnalisées
	var marker = new google.maps.Marker({
	    position: latLngCoords,
	    label: 'Custom Marker ',
	    icon: pinImage,
	    weight: weight,
  	});

	addMarkerToList(marker)
}




//////////////////////////////////////////////////////////////////////////////////////////
//---------------- UTILISATION DE LAYERS POUR LES FLUX   -------------------------------//
//////////////////////////////////////////////////////////////////////////////////////////

function toggleTrafficLayer()
{
	if(trafficLayerEnabled)
	{
		document.getElementById('trafficLayerToggle').className = "btn btn-danger";
		disableTrafficLayer();
	}
	else
	{
		document.getElementById('trafficLayerToggle').className = "btn btn-success";
		enableTrafficLayer();
	}
}

function enableTrafficLayer()
{
	trafficLayer.setMap(map);
	trafficLayerEnabled = true;
}

function disableTrafficLayer()
{
	trafficLayer.setMap(null);
	trafficLayerEnabled = false;
}



function toggleTransitLayer()
{
	if(transitLayerEnabled)
	{
		document.getElementById('transitLayerToggle').className = "btn btn-danger";
		disableTransitLayer();
	}
	else
	{
		document.getElementById('transitLayerToggle').className = "btn btn-success";
		enableTransitLayer();
	}
}

function enableTransitLayer()
{
	transitLayer.setMap(map);
	transitLayerEnabled = true;
}

function disableTransitLayer()
{
	transitLayer.setMap(null);
	transitLayerEnabled = false;
}


function toggleBikeLayer()
{
	if(bikeLayerEnabled)
	{
		document.getElementById('bikeLayerToggle').className = "btn btn-danger";
		disableBikeLayer();
	}
	else
	{
		document.getElementById('bikeLayerToggle').className = "btn btn-success";
		enableBikeLayer();
	}
}

function enableBikeLayer()
{
	bikeLayer.setMap(map);
	bikeLayerEnabled = true;
}

function disableBikeLayer()
{
	bikeLayer.setMap(null);
	bikeLayerEnabled = false;
}


//////////////////////////////////////////////////////////////////////////////////////////
//									MARKERS MANAGEMENT									//
//////////////////////////////////////////////////////////////////////////////////////////

var maxAreaMarkerCount = 20;

function refreshMarkers()
{
	sortMakers(allMarkers);
}

function sortMakers(markers)
{
	var temp = [];
	var keptMarkers = [];



	markers.forEach(function(element,index)
	{
		element.setMap(null); // On l'enleve de l'affichage

		if(map.getBounds().contains(element.position)) // Si le marqueur est dans notre zone
		{
			temp.push(element); // On l'ajoute dans le tableau à trier
		}
	});

	temp.sort(compareWeight); // Classement des marqueurs en fonction de leur score dans l'ordre décroissant

	for(var i = 0; i< temp.length &&  i < maxAreaMarkerCount; i++)
	{
		keptMarkers.push(temp[i]);
	}


	keptMarkers.forEach(function(keptMarker,x){
		keptMarker.setMap(map); // On reaffiche les marqueurs gardés 
	});


}


//////////////////////////////////////////////////////////////////////////////////////////
//									GENERATION MARQUEURS								//
//////////////////////////////////////////////////////////////////////////////////////////

function generateMarkers(number)
{
	var bounds = map.getBounds();
	var minX = Math.min(bounds.getNorthEast().lng(),bounds.getSouthWest().lng());
	var minY = Math.min(bounds.getNorthEast().lat(),bounds.getSouthWest().lat());
	var maxX = Math.max(bounds.getNorthEast().lng(),bounds.getSouthWest().lng());
	var maxY = Math.max(bounds.getNorthEast().lat(),bounds.getSouthWest().lat());

	//alert("Generating coord between ( " + minX + " < x < " + maxX + " ) - ( " + minY + " < y < " + maxY + " )");

	for(var i = 0; i< number ; i++)
	{	
		var coordX = randRange(minX,maxX);
		var coordY = randRange(minY,maxY);

		//alert("Coord x : " + coordX + " , Coord y : " + coordY);

		var coords = new google.maps.LatLng({lat: coordY, lng: coordX}); 
		addCustomMarkerOnMap(coords,randInt(0,100));
	}

	refreshMarkers();
}



function randRange(min , max)
{
	return (Math.random() * (max - min )) + min;
}


function randInt(min, max)
{
	return Math.floor(Math.random() * (max - min + 1 )) + min;
}

//////////////////////////////////////////////////////////////////////////////////////////
//									MARQUEURS SPECIFIQUES								//
//////////////////////////////////////////////////////////////////////////////////////////
function showRestaurants()
{
	displaySpecificMarkers('restaurant');
}

function showSchools()
{
	displaySpecificMarkers('school');
}

function showHotels()
{
	displaySpecificMarkers('stores');//Stores == Hotels pour Maps apparement
}


function displaySpecificMarkers(markerType)
{
	var request = 
	{
	    location: map.getCenter(),
	    radius: '6000',
	    types: [markerType]
  	};

  service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, callback);
}

function callback(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createPlaceMarker(results[i]);
    }
  }
}


function createPlaceMarker(place) {
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location,
    icon: {
      url: 'http://maps.gstatic.com/mapfiles/circle.png',
      anchor: new google.maps.Point(10, 10),
      scaledSize: new google.maps.Size(10, 17)
    }
  });
}

/////////////////////////////////////////////////////////////////
//				POLYGONES POUR AFFICHAGE DES QUARTIERS			/
/////////////////////////////////////////////////////////////////

var mulhouseFrancoisDor = [
	{lat: 49.2402908 , lng: 4.0099498 },
	{lat: 49.2404073 , lng: 4.0099932 },
	{lat: 49.2408922 , lng: 4.0101689 },
	{lat: 49.2420777 , lng: 4.0070997 },
	{lat: 49.2426826 , lng: 4.0078681 },
	{lat: 49.2432897 , lng: 4.0073032 },
	{lat: 49.2435626 , lng: 4.0069254 },
	{lat: 49.2438447 , lng: 4.0065175 },
	{lat: 49.2440540 , lng: 4.0062133 },
	{lat: 49.2442179 , lng: 4.0059631 },
	{lat: 49.2442362 , lng: 4.0059223 },
	{lat: 49.2447562 , lng: 4.0050261 },
	{lat: 49.2447741 , lng: 4.0049961 },
	{lat: 49.2447891 , lng: 4.0050359 },
	{lat: 49.2452122 , lng: 4.0062474 },
	{lat: 49.2456354 , lng: 4.0074589 },
	{lat: 49.2459449 , lng: 4.0083450 },
	{lat: 49.2468166 , lng: 4.0086809 },
	{lat: 49.2476883 , lng: 4.0090167 },
	{lat: 49.2477659 , lng: 4.0090466 },
	{lat: 49.2486391 , lng: 4.0093729 },
	{lat: 49.2495123 , lng: 4.0096993 },
	{lat: 49.2503856 , lng: 4.0100256 },
	{lat: 49.2512588 , lng: 4.0103520 },
	{lat: 49.2517945 , lng: 4.0105522 },
	{lat: 49.2526843 , lng: 4.0107486 },
	{lat: 49.2535740 , lng: 4.0109449 },
	{lat: 49.2530664 , lng: 4.0116628 },
	{lat: 49.2530433 , lng: 4.0117358 },
	{lat: 49.2507646 , lng: 4.0131896 },
	{lat: 49.2488621 , lng: 4.0128776 },
	{lat: 49.2486378 , lng: 4.0128183 },
	{lat: 49.2484857 , lng: 4.0127329 },
	{lat: 49.2481988 , lng: 4.0126449 },
	{lat: 49.2475257 , lng: 4.0124944 },
	{lat: 49.2467263 , lng: 4.0124101 },
	{lat: 49.2463668 , lng: 4.0123907 },
	{lat: 49.2460882 , lng: 4.0123852 },
	{lat: 49.2453234 , lng: 4.0124526 },
	{lat: 49.2452064 , lng: 4.0124641 },
	{lat: 49.2447732 , lng: 4.0125503 },
	{lat: 49.2442235 , lng: 4.0127044 },
	{lat: 49.2436914 , lng: 4.0128999 },
	{lat: 49.2432142 , lng: 4.0130965 },
	{lat: 49.2427088 , lng: 4.0133201 },
	{lat: 49.2422051 , lng: 4.0134613 },
	{lat: 49.2419891 , lng: 4.0134845 },
	{lat: 49.2418541 , lng: 4.0134956 },
	{lat: 49.2414037 , lng: 4.0135005 },
	{lat: 49.2410810 , lng: 4.0134941 },
	{lat: 49.2408840 , lng: 4.0135040 },
	{lat: 49.2405503 , lng: 4.0135249 },
	{lat: 49.2402074 , lng: 4.0135608 },
	{lat: 49.2398923 , lng: 4.0136095 },
	{lat: 49.2396944 , lng: 4.0136317 },
	{lat: 49.2398484 , lng: 4.0134837 },
	{lat: 49.2399035 , lng: 4.0133475 },
	{lat: 49.2401830 , lng: 4.0121858 },
	{lat: 49.2403144 , lng: 4.0115279 },
	{lat: 49.2403520 , lng: 4.0113364 },
	{lat: 49.2403448 , lng: 4.0111166 },
	{lat: 49.2402993 , lng: 4.0101147 },
	{lat: 49.2402908 , lng: 4.0099498 },


];

var croixRougeUnivSudEstOuest = [
	{lat: 49.2400935 , lng: 4.0098910 },
	{lat: 49.2402102 , lng: 4.0099070 },
	{lat: 49.2402908 , lng: 4.0099498 },
	{lat: 49.2402993 , lng: 4.0101147 },
	{lat: 49.2403448 , lng: 4.0111166 },
	{lat: 49.2403520 , lng: 4.0113364 },
	{lat: 49.2403144 , lng: 4.0115279 },
	{lat: 49.2401830 , lng: 4.0121858 },
	{lat: 49.2399035 , lng: 4.0133475 },
	{lat: 49.2398484 , lng: 4.0134837 },
	{lat: 49.2396944 , lng: 4.0136317 },
	{lat: 49.2395855 , lng: 4.0136433 },
	{lat: 49.2374180 , lng: 4.0138329 },
	{lat: 49.2369993 , lng: 4.0138597 },
	{lat: 49.2361947 , lng: 4.0139077 },
	{lat: 49.2357261 , lng: 4.0139246 },
	{lat: 49.2351073 , lng: 4.0139537 },
	{lat: 49.2341808 , lng: 4.0140042 },
	{lat: 49.2337301 , lng: 4.0140365 },
	{lat: 49.2319400 , lng: 4.0141524 },
	{lat: 49.2319098 , lng: 4.0134654 },
	{lat: 49.2317676 , lng: 4.0122009 },
	{lat: 49.2316916 , lng: 4.0117176 },
	{lat: 49.2316676 , lng: 4.0112640 },
	{lat: 49.2316592 , lng: 4.0111952 },
	{lat: 49.2316808 , lng: 4.0107563 },
	{lat: 49.2317737 , lng: 4.0104012 },
	{lat: 49.2321716 , lng: 4.0089414 },
	{lat: 49.2323377 , lng: 4.0084353 },
	{lat: 49.2324110 , lng: 4.0082733 },
	{lat: 49.2325572 , lng: 4.0079865 },
	{lat: 49.2330788 , lng: 4.0070081 },
	{lat: 49.2330796 , lng: 4.0069121 },
	{lat: 49.2330890 , lng: 4.0068573 },
	{lat: 49.2328660 , lng: 4.0044902 },
	{lat: 49.2328414 , lng: 4.0042028 },
	{lat: 49.2327653 , lng: 4.0025524 },
	{lat: 49.2328173 , lng: 4.0017036 },
	{lat: 49.2330037 , lng: 4.0009109 },
	{lat: 49.2330958 , lng: 4.0006381 },
	{lat: 49.2333249 , lng: 4.0001209 },
	{lat: 49.2335800 , lng: 3.9997153 },
	{lat: 49.2338700 , lng: 3.9993351 },
	{lat: 49.2338981 , lng: 3.9993082 },
	{lat: 49.2336748 , lng: 3.9991268 },
	{lat: 49.2321226 , lng: 3.9978708 },
	{lat: 49.2317990 , lng: 3.9975538 },
	{lat: 49.2325307 , lng: 3.9967560 },
	{lat: 49.2332623 , lng: 3.9959583 },
	{lat: 49.2333212 , lng: 3.9959746 },
	{lat: 49.2342060 , lng: 3.9962179 },
	{lat: 49.2350908 , lng: 3.9964612 },
	{lat: 49.2359755 , lng: 3.9967045 },
	{lat: 49.2368602 , lng: 3.9969478 },
	{lat: 49.2377451 , lng: 3.9971912 },
	{lat: 49.2386298 , lng: 3.9974345 },
	{lat: 49.2395145 , lng: 3.9976779 },
	{lat: 49.2393169 , lng: 3.9976249 },
	{lat: 49.2392057 , lng: 3.9978455 },
	{lat: 49.2380336 , lng: 4.0014889 },
	{lat: 49.2380146 , lng: 4.0016121 },
	{lat: 49.2380143 , lng: 4.0016533 },
	{lat: 49.2380392 , lng: 4.0019009 },
	{lat: 49.2381096 , lng: 4.0020808 },
	{lat: 49.2384103 , lng: 4.0026907 },
	{lat: 49.2384280 , lng: 4.0027185 },
	{lat: 49.2383917 , lng: 4.0027577 },
	{lat: 49.2375000 , lng: 4.0038745 },
	{lat: 49.2369653 , lng: 4.0045437 },
	{lat: 49.2360750 , lng: 4.0056537 },
	{lat: 49.2364497 , lng: 4.0066867 },
	{lat: 49.2383181 , lng: 4.0083459 },
	{lat: 49.2400935 , lng: 4.0098910 },
	

];
var croixRougeUnivSudEstOuestBis =[
	{lat: 49.2403993 , lng: 3.9979212 },
	{lat: 49.2412841 , lng: 3.9981646 },
	{lat: 49.2421688 , lng: 3.9984080 },
	{lat: 49.2420893 , lng: 3.9986728 },
	{lat: 49.2420932 , lng: 3.9987388 },
	{lat: 49.2415783 , lng: 3.9990378 },
	{lat: 49.2410611 , lng: 3.9986365 },
	{lat: 49.2404319 , lng: 3.9979316 },
	{lat: 49.2403993 , lng: 3.9979212 },
];

var croixRougeUnivCentreEst = [
	{lat: 49.2402908 , lng: 4.0099498 },
	{lat: 49.2402102 , lng: 4.0099070 },
	{lat: 49.2400935 , lng: 4.0098910 },
	{lat: 49.2383181 , lng: 4.0083459 },
	{lat: 49.2364497 , lng: 4.0066867 },
	{lat: 49.2360750 , lng: 4.0056537 },
	{lat: 49.2369653 , lng: 4.0045437 },
	{lat: 49.2375000 , lng: 4.0038745 },
	{lat: 49.2383917 , lng: 4.0027577 },
	{lat: 49.2384280 , lng: 4.0027185 },
	{lat: 49.2386178 , lng: 4.0024888 },
	{lat: 49.2398107 , lng: 4.0029376 },
	{lat: 49.2402800 , lng: 4.0038118 },
	{lat: 49.2417483 , lng: 4.0067088 },
	{lat: 49.2420777 , lng: 4.0070997 },
	{lat: 49.2408922 , lng: 4.0101689 },
	{lat: 49.2404073 , lng: 4.0099932 },
	{lat: 49.2402908 , lng: 4.0099498 },

];

var croixRougeUnivCentreNord = [
	{lat: 49.2421688 , lng: 3.9984080 },
	{lat: 49.2424779 , lng: 3.9987600 },
	{lat: 49.2426106 , lng: 3.9989026 },
	{lat: 49.2430467 , lng: 3.9998764 },
	{lat: 49.2434315 , lng: 4.0011174 },
	{lat: 49.2435195 , lng: 4.0014015 },
	{lat: 49.2439427 , lng: 4.0026129 },
	{lat: 49.2443659 , lng: 4.0038244 },
	{lat: 49.2447891 , lng: 4.0050359 },
	{lat: 49.2447741 , lng: 4.0049961 },
	{lat: 49.2447562 , lng: 4.0050261 },
	{lat: 49.2442362 , lng: 4.0059223 },
	{lat: 49.2442179 , lng: 4.0059631 },
	{lat: 49.2440540 , lng: 4.0062133 },
	{lat: 49.2438447 , lng: 4.0065175 },
	{lat: 49.2435626 , lng: 4.0069254 },
	{lat: 49.2432897 , lng: 4.0073032 },
	{lat: 49.2426826 , lng: 4.0078681 },
	{lat: 49.2420777 , lng: 4.0070997 },
	{lat: 49.2417483 , lng: 4.0067088 },
	{lat: 49.2402800 , lng: 4.0038118 },
	{lat: 49.2398107 , lng: 4.0029376 },
	{lat: 49.2386178 , lng: 4.0024888 },
	{lat: 49.2384280 , lng: 4.0027185 },
	{lat: 49.2384103 , lng: 4.0026907 },
	{lat: 49.2381096 , lng: 4.0020808 },
	{lat: 49.2380392 , lng: 4.0019009 },
	{lat: 49.2380143 , lng: 4.0016533 },
	{lat: 49.2380146 , lng: 4.0016121 },
	{lat: 49.2380336 , lng: 4.0014889 },
	{lat: 49.2392057 , lng: 3.9978455 },
	{lat: 49.2393169 , lng: 3.9976249 },
	{lat: 49.2395145 , lng: 3.9976779 },
	{lat: 49.2403993 , lng: 3.9979212 },
	{lat: 49.2404319 , lng: 3.9979316 },
	{lat: 49.2410611 , lng: 3.9986365 },
	{lat: 49.2415783 , lng: 3.9990378 },
	{lat: 49.2420932 , lng: 3.9987388 },
	{lat: 49.2420893 , lng: 3.9986728 },
	{lat: 49.2421688 , lng: 3.9984080 },
];


function displayDistrictPolygons(bounds, fillColor)
{
	 var district = new google.maps.Polygon({
    paths: bounds,
    strokeColor: '#FF0000',
    strokeOpacity: 0.4,
    strokeWeight: 1,
    fillColor: fillColor,
    fillOpacity: 0.25
  });
	 district.setMap(map);
}

//////////////////////////////////////////////////////////////////
//							UTILS			 					//
//////////////////////////////////////////////////////////////////

function log(text, type){
	$("#log .content").prepend("<p class='"+ type +"'>"+ text +"</p>");
}

//Data generator
var streets = 
	["allee chantal delpla droulers", "allee des pervenches", "allee des picards", "allee ronsard", 
	"avenue benoit frachon", "avenue cook", "avenue d epernay", "avenue de laon", 
	"avenue de reims", "avenue de rethel", "avenue des nelmonts", "avenue du general eisenhower", 
	"avenue georges clemenceau", "avenue georges hodin", "avenue jean jaures", "avenue john kennedy", 
	"avenue leon blum", "avenue nationale", "boulevard charles arnould", "boulevard de la paix", "boulevard de monteve", 
	"boulevard louis barthou", "boulevard lundy", "boulevard pasteur", "boulevard pommery", "boulevard saint marceaux", "boulevard vasco de gama", 
	"chemin de reims", "chemin de varlager", "cour de la gare", "galerie des baleares", "grande place", "place de la mairie", "place de la republique", 
	"place de lisieux", "place des argonautes", "place drouet d erlon", "place du forum", "place jean moulin", "place mozart", "place rene clair", 
	"place stalingrad", "promenade du peignage", "route de cernay", "route de dormans", "route de reims", "route de witry", "rue adrien senechal", 
	"rue albert reville", "rue albert schweitzer", "rue albert thomas", "rue alfred de musset", "rue alphonse daudet", "rue andre pingat", 
	"rue arthur honegger", "rue boucton favreaux", "rue buirette", "rue camille lenoir", "rue ceres", "rue chanzy", "rue charles de gaulle", 
	"rue charles peguy", "rue clovis", "rue clovis chezel", "rue cognacq jay", "rue colasse", "rue d alsace lorraine", "rue d estienne d orves", 
	"rue de betheny", "rue de bizerte", "rue de cernay", "rue de courlancy", "rue de dunkerque", "rue de l universite", "rue de la baltique", "rue de la paix", 
	"rue de la traverse", "rue de neufchatel", "rue de reims", "rue de salzbourg", "rue de savoye", "rue de sebastopol", "rue de vesle", "rue des capucins", 
	"rue des crayeres", "rue des monts coupes", "rue des sculpteurs jacques", "rue desbureaux", "rue docteur lemoine", "rue du barbatre", "rue du cadran saint pierre", 
	"rue du chalet", "rue du cloitre", "rue du colonel fabien", "rue du dauphine", "rue du docteur albert schweitzer", "rue du general carre", "rue du jard", "rue du mont d arene", "rue du ruisselet"];

var numberStreetMin = 1;
var numberStreetMax = 200;

function GenerateData(numberItems){
	var numberItems = (typeof numberItems == 'undefined' || numberItems <= 0) ? 10 : numberItems;

	var city = $('#setLocation_text').val();

	var addressJson = [];
	for (var i = 0; i < numberItems; i++) {
		var street = streets[Math.floor(Math.random()*streets.length)];
		var streetNumber = Math.floor(Math.random() * numberStreetMax) + numberStreetMin;

		addressJson[i] = {
			"city" : city,
			"street" : street,
			"streetNumber" : streetNumber
		};
	}

	return addressJson;
}


//UTILS
function compareWeight(a, b) {
  return b.weight-a.weight;
}
