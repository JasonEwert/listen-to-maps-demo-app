class SearchMap { 
	_view;
	_viewDivId = "viewDiv";

	// the map div's name
	set viewDivId(viewDivId)   { this._viewDivId = viewDivId };
	get viewDivId()            { return this._viewDivId };


	async loadMap() {
		const viewDiv = this._viewDivId;
		var view;

	try{
		require([
			"esri/Map",
			"esri/views/MapView",
			"esri/Basemap",
			"esri/widgets/BasemapToggle",
			"esri/widgets/ScaleBar",
			"esri/layers/FeatureLayer",
            "esri/layers/MapImageLayer",
			"esri/rest/find",
			 "esri/rest/support/FindParameters",
			"esri/Graphic",
			"esri/layers/GraphicsLayer",
            "esri/rest/identify",
            "esri/rest/support/IdentifyParameters",
			"esri/core/reactiveUtils"
			],
		function(Map, MapView, Basemap, BasemapToggle, 
				 ScaleBar,
				  FeatureLayer,
                  MapImageLayer,
				  find, FindParameters,
				  Graphic, GraphicsLayer,
                  identify, IdentifyParameters,
				  reactiveUtils
				) {
				
					let wimnLayer = new MapImageLayer({
                        url: "https://pca-gis02.pca.state.mn.us/arcgis/rest/services/WIMN/wimn_tempo/MapServer",
                        title: "Sites",
                        sublayers: [
                            {
                                id: 5,
                                title: "MPCA Sites",
                                popupTemplate: {
                                    title: "MPCA Sites",
                                    content: "Site ID: {mpca_id_list} <br /> Site name: {name} <br />needs more work to replacate WIMN"
                                }
                            },
                            {
                                id: 3,
                                title: "MPCA Sites",
                                popupTemplate: {
                                    title: "MPCA Sites",
                                    content: "Site ID: {mpca_id_list} <br /> Site name: {name} <br />needs more work to replacate WIMN"
                                }
                            },
                            {
                                id: 1,
                                title: "MPCA Sites",
                                popupTemplate: {
                                    title: "MPCA Sites",
                                    content: "Site ID: {mpca_id_list} <br /> Site name: {name} <br />needs more work to replacate WIMN"
                                }
                            }
                        
                        ]
                    });
					
                    // the search results graphic
					const graphicsLayer = new GraphicsLayer();
					
					// symbology templates
                    let pointSymbol = {
					  type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
                      style: "square",
                      color: [ 0, 255, 255, 0.6 ],
                      size: "18px",
                      outline: {  // autocasts as new SimpleLineSymbol()
                        color: [ 255, 255, 0 ],
                        width: 1  // points
                      }
					};

                    //graphic layer to hold the map center point icon
                    const mapCenterGraphic = new GraphicsLayer({
                        id: "mapCenterGraphic",
                        listMode: "hide"
                    });

                    let boxSymLg = {
                        type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
                        color: [0, 255, 224, 0],
                        style: 'square',
                        outline: {
                            color: [0, 255, 224],
                            width: 2
                        },
                        size: 80
                    };


                    /*****************************************************************
                     * make the map already!
                     *****************************************************************/

                    const map = new Map({
                        basemap: "hybrid", //"gray-vector", //"satellite", //"topo-vector", //"satellite", //"hybrid", //"streets-vector",
                        layers: [ graphicsLayer, wimnLayer, mapCenterGraphic]
                    });

                    view = new MapView({
                        container: viewDiv,
                        map: map,
                        center: [-94.5, 46.1],
                        zoom: 8
                    });
					
					/*****************************************************************
					* The Search (using Find)
					*****************************************************************/

					let resultsDiv = document.getElementById("results");
					let resultsListDiv = document.getElementById("searchResults");	
					let findUrl = "https://pca-gis02.pca.state.mn.us/arcgis/rest/services/WIMN/wimn_tempo/MapServer";
					
					const params = new FindParameters({
					  layerIds: [1],
					  searchFields: ["name"],
					  returnGeometry: true
					});
					
					function doFind() {
					  params.searchText = document.getElementById("searchText").value;
					  find.find(findUrl, params).then(showResults).catch(rejectedPromise);				  
					}
					
                    
					function showResults(response) {
					  
                      const results = response.results;

                      // the restults list is using the following style:
                      // ul{ list-style-type: none; }
                      // this will display the list without bullets, it is still read as "list of n items"
					  resultsListDiv.innerHTML = "<ul id='searchResultsList'; tabindex='0';></ul>";
                      let resultsList = document.getElementById("searchResultsList");

					  // If no results are returned from the find, notify the user
					  if (results.length === 0) {
                        let li = document.createElement('li')
                        li.innerHTML = "<p>No results found.</p>"
						resultsList.appendChild(li)
						return;
					  }
					  
					  graphicsLayer.removeAll();

					  // Loop through each result in the response and add as a row in the table
					  results.forEach(function (findResult, i) {
						
                        let resultText;
						let name = findResult.feature.attributes["name"];
						let status = findResult.feature.attributes["active_flag"];
                        let industry = findResult.feature.attributes["industrial_classification"];
                        let programs = findResult.feature.attributes["program_name_list"];
                        let ids = findResult.feature.attributes["mpca_id_list"];
                        let activities = findResult.feature.attributes["activity_list"];

						let shp = findResult.feature.geometry;

                        if(industry == "Null"){
                            resultText = "<li><h3>" + name + "</h3>" + "<p>This site is in the following programs: " + programs + "</p></li>"
                        } else {
                            resultText = "<li><h3>" + name + "</h3>" + "<p>This site is in the " + industry + " industry.</br>It is in the following programs: " +  programs + "</p><li>"
                        };

						//resultsListDiv.innerHTML += (resultText)
                        let li = document.createElement('li')
                        li.innerHTML = resultText
						resultsList.appendChild(li)

                        addGeom(shp);
						
					  });

                      // use .focus() rather than ARIA live regions.
                      // resultsDiv.setAttribute('aria-live', 'polite');
                      // resultsDiv.setAttribute('aria-atomic', 'true'); // reread the entire div, not just the cahnged content.

                      resultsDiv.focus(); // requires a tabindex
                     // resultsList.focus(); // requires a tabindex

					}
										
					function addGeom (geom) {
						
						let pointGraphic = new Graphic({
							  geometry: geom,
							  symbol: pointSymbol
							});
							
							graphicsLayer.add(pointGraphic);

                    
							view.center = geom;
							view.zoom = 16;
						
					};

					
					function rejectedPromise(error) {
					  console.error("Promise didn't resolve: ", error.message);
					}
					
					document.getElementById("findBtn").addEventListener("click", doFind);
					

					/*****************************************************************
                     * basemap toggle
                     *****************************************************************/

                    let basemapTopo = new Basemap({
                    portalItem: {
                        //id: "931d892ac7a843d7ba29d085e0433465"  // USGS topo
						id: "55ebf90799fa4a3fa57562700a68c405" // streets
                    }
                    });

                    let basemapToggle = new BasemapToggle({
                    view: view,
                    nextBasemap: basemapTopo //"terrain" //"topo-vector"
                    });


                    /*****************************************************************
                     * scale bar
                     *****************************************************************/

                    let scaleBar = new ScaleBar({
                    view: view,
                    unit: "non-metric"
                    });


                    /*****************************************************************
                     * map description div
                     *****************************************************************/
                            let mapDescription  = document.createElement("div");
            
                            mapDescription.id = "mapDescription";
                            mapDescription.setAttribute('aria-live', 'assertive');
                            mapDescription.setAttribute('tabindex', '-1'); // if 0 this is read every time, if -1 only changes are read (desired functionality)
                            mapDescription.style.width = "100%";
                            mapDescription.style.padding = "2px",
                            mapDescription.style.backgroundColor = "rgba(255, 255, 255, 0.8)"; // from the credits styles
                            mapDescription.style.backgroundBlendMode;
                            mapDescription.style.fontSize = "12px";
                    
                            view.ui.add(mapDescription, {position: "bottom-left"});

                    /*****************************************************************
                     * watch for view changes and update the div
                     *****************************************************************/
            document.addEventListener('keyup', handleMapSelect);
                    // Watch view's updating event and run the identify on update
                    reactiveUtils.watch(
                        () => [view.stationary, view.zoom],
                        function ([stationary, zoom]){
                        // Only run the query when the view is stationary
                            if(stationary){
                
                                // options for the map description
                                let searchTolerance = 100;
                                executeIdentifyCTU(searchTolerance);
                                //addMapCenterGraphic(searchTolerance); // adds the query tollarance graphic
                                /*
								if (zoom > 15){
									executeIdentifyPOI(searchTolerance, [1,3, 5])
								} else {
									executeIdentifyCTU(searchTolerance)
								};
                                */
                                
                            }
                        }
                    );
            
                    function addMapCenterGraphic(boxSize) {
            
                        let boxSymLg = {
                            type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
                            color: [0, 255, 224, 0],
                            style: 'square',
                            outline: {
                                color: [0, 255, 224],
                                width: 2
                            },
                            size: boxSize
                        };
                        
                        let center_latLng = view.center;
                        let y = center_latLng.latitude;
                        let x = center_latLng.longitude;
                        let point = {
                            type: "point", 
                            x: x,
                            y: y
                        };
            
                        mapCenterGraphic.removeAll();

                        function addGraphic (){
                            mapCenterGraphic.add(new Graphic({
                                geometry: point,
                                symbol: boxSymLg
                            }));
                        }

                        setTimeout( addGraphic, 100 )
            
                    };
            
                    function executeIdentifyCTU(tolerance) {
            
                        let div = document.getElementById('mapDescription');
            
                        // Set the parameters for the identify
                        let params = new IdentifyParameters();
                        params.tolerance = tolerance;
                        params.layerIds = [0,5];
                        params.layerOption = "visible";
                        params.width = view.width;
                        params.height = view.height;
                        params.geometry = view.center;
                        params.mapExtent = view.extent;
                        params.returnGeometry = false;
            
                        let divStr = "";    
                        let zoomL = view.zoom;
                        let scale;
            
                        if(zoomL < 5){
                            scale = "world"
                        } else if (zoomL >=5 && zoomL < 6){
                            scale = "country"
                        }else if (zoomL >=6 && zoomL < 9){
                            scale = "state"
                        }else if (zoomL >=9 && zoomL < 12){
                            scale = "county"
                        }else if (zoomL >=12 && zoomL < 14){
                            scale = "township"
                        }else if (zoomL >=14 && zoomL < 16){
                            scale = "city"
                        }else if (zoomL >=16 ){
                            scale = "building"
                        };
            
                        let divStrScale = "is set to a " + scale + " scale.";
            
                        //divStr="<p>This " + JSON.stringify(map.basemap.title) + " map is set to a " + scale + " scale. It contains the following locations. </p></br>";
                        //divStr="<p>The map is set to a " + scale + " scale. It contains the following locations. </p></br>";
            
                        if (zoomL <= 8) {
            
                            div.innerHTML = "The map " + divStrScale; //". Zoom in to query cities, townships, and counties";
            
                        } else {
            
                            divStr = "The map covers ";

                            // This function returns a promise that resolves to an array of features
                            identify
                                .identify("https://pca-gis02.pca.state.mn.us/arcgis/rest/services/Geo/searchx/MapServer", params)
                                .then(function (response) {
                
                                var results = response.results;
                
                                results.map(function (result) {
                
                                    let feature = result.feature;					
                                    let layerName = result.layerName;
                
                                    if (layerName === "Cities & Townships") {
                
                                        let name = feature.attributes.MCD_NAME;
                                        let type = feature.attributes.TYPE;
                    
                                        if ( divStr.includes(name) == false){
                    
                                            if ( type === "Township"){
                                                divStr = divStr +  name + " " + type +", ";
                                            } else {
                                                divStr = divStr +  name + ", ";
                                            };
                                        };
                
                                    } else if (layerName === "Counties") {
                
                                        let name = feature.attributes.NAME;
                                        if ( divStr.includes(name) == false){
                                            divStr = divStr + name + " County, ";
                                        };
                
                                    };
                                });
                
                                div.innerHTML = divStr + "it " + divStrScale;
                                });      
                        };
                    };


                    /*****************************************************************
                     * keyboard acces to features
                     *****************************************************************/
                    const btnKeyboard = document.createElement("div");
						
             //       btnKeyboard.title = "Keyboard acces to map features";
                    btnKeyboard.id = "infoTool";
                    btnKeyboard.setAttribute('tabindex', '0');
                    btnKeyboard.classList.add("esri-widget--button","esri-widget", "esri-interactive");
                    // icons: esri-icon-search esri-icon-locate esri-icon-description
                    btnKeyboard.innerHTML = "<span aria-hidden='true' role='presentation' class='esri-icon esri-icon-search'></span>"
                    btnKeyboard.innerHTML += "<span class='esri-icon-font-fallback-text'>Query button, use the i key to query map features.</span>";
                    //view.ui.add(btnKeyboard, "top-left"); 

                    /********* Functions for using keyboard to click features on the map and open a popup *************/
                    
                    //set up container for displaying keyboard instructions to the user
                    const userNoteInfo = document.createElement("div");
                    
                    userNoteInfo.className = "userNote";
                    userNoteInfo.innerHTML="<p><ol><li>Press the <b>i</b> key to get a list of sites.</li><li> Use <b>arrows</b> to move the map</li><li>Press the <b>+</b> key to zoom in</li><li>Press the <b>-</b> key to zoom out</li></ol></p>";
                    userNoteInfo.classList.add("esri-widget");
                    userNoteInfo.setAttribute('tabindex', '0'); // not sure about this.it doesn't recieve focus after the tool is opened, the map gets it. Maybe set to -1?
             //       userNoteInfo.setAttribute('aria-live', 'assertive');
                    
                    //add an event listener to the view information button
                    btnKeyboard.addEventListener("keypress", function(event) {
                        if (event.key === "Enter") {
                        event.preventDefault();
                        document.getElementById("infoTool").click();
                        }
                    });

                    btnKeyboard.addEventListener("click", function () {
                        
                        //check to see if the location button is already active. If it is, turn it off
                        if (btnKeyboard.classList.contains("active")){
                        
                            btnKeyboard.classList.remove("active");
                            mapCenterGraphic.removeAll();
                            document.body.style.cursor = 'initial';
                            view.ui.remove(userNoteInfo);

                            document.removeEventListener('keyup', handleMapSelect);



                        } else {
                        
                            btnKeyboard.classList.add("active");
                            document.body.style.cursor = 'crosshair';
                            view.ui.add(userNoteInfo, "top-right");
                            //accessibility set focus on the map application to enable keyboard navigation
                            view.focus();
                            addMapCenterGraphic();

                            document.addEventListener('keyup', handleMapSelect);
                            
                        };
                    });

                    // function to run on keyup
                    function handleMapSelect (event) {

                        let key = event.which || event.keyCode;
                        let alt = event.altKey;
                        //if the user hits the i key on the keyboard, simulate a mouse click on the center of the map
                        if ( key === 73 || ( alt === true && key === 73 ) || ( alt === true && key === 83 )) {
                            event.stopPropagation();
                            
                            executeIdentifyPOI(150, [1,3, 5]);

                        } else {
                            //if the key is an arrow
                            if( key=== 37||key=== 38 || key=== 39 ||key=== 40) {
                                //move graphic to the new center point
                                mapCenterGraphic.removeAll();
                                addMapCenterGraphic();
                            };
                            //if the key is an arrow
                            if (key === 37){
                                mapDescription.innerHTML="<p>you are panning West</p>";						
                            } else if (key === 38){					
                                mapDescription.innerHTML="<p>you are panning North</p>";
                            } else if (key === 39){							
                                mapDescription.innerHTML="<p>you are panning East</p>";							
                            } else if (key === 40){							
                                mapDescription.innerHTML="<p>you are panning South</p>";
                            };						
                        }

                    };

                    /********* End functions for keyboard click to open popup  *********************/


                    function addMapCenterGraphic() {
                        let center_latLng = view.center;
                        let y = center_latLng.latitude;
                        let x = center_latLng.longitude;
                        let point = {
                            type: "point", 
                            x: x,
                            y: y
                        };

                        mapCenterGraphic.add(new Graphic({
                            geometry: point,
                            symbol: boxSymLg
                        }));

                    };

                    function executeIdentifyPOI(tolerance, layerIds) {
                        
                        let polyLL = [];
                        
                        // Set the parameters for the identify
                        let params = new IdentifyParameters();
                        params.tolerance = tolerance;
                        params.layerIds = layerIds;
                        params.layerOption = "visible";
                        params.width = view.width;
                        params.height = view.height;
                        params.geometry = view.center;
                        params.mapExtent = view.extent;
                        params.returnGeometry = true;

                        // This function returns a promise that resolves to an array of features
                        // A custom popupTemplate is set for each feature based on the layer it
                        // originates from
                        identify
                            .identify("https://pca-gis02.pca.state.mn.us/arcgis/rest/services/WIMN/wimn_tempo/MapServer", params)
                            .then(function (response) {
                                var results = response.results;

                                var resultCount = results.length;
                                
                                mapDescription.innerHTML="<p>This " + JSON.stringify(map.basemap.title) + " map contains the following " + resultCount + " sites:";

                                return results.map(function (result) {
        
                                    let feature = result.feature;					
                                    let layerName = result.layerName;
                                    let layerId = result.layerId;

                                    if (layerName === "MPCA Sites" && layerId < 4) {
                            
                                        let name = feature.attributes.name;
                                        mapDescription.innerHTML = mapDescription.innerHTML + name + "; ";
                                    
                                    } else{
                                        mapDescription.innerHTML = "Zoom in to query sites.";
                                    };
                            
                                });
                            })				
                    };


                 
                    /*****************************************************************
                     * UI
                     *****************************************************************/

                    view.ui.add(basemapToggle, "bottom-right");
                    view.ui.add(scaleBar, {position: "bottom-left"});
                    //view.ui.add(btnKeyboard, "top-left");
                    
                    }); 
                    } catch (error) {

                };
            };
        };