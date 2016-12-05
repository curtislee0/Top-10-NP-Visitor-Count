// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 80, bottom: 70, left: 50},
    width = 1920 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

// Parse the date / time
var parseDate = d3.time.format("%Y").parse;

// Set the ranges
var x = d3.time.scale().range([width/2 + 100, width]);
var y = d3.scale.linear().range([height, 0]);

// Define the axes
var xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(5);

var yAxis = d3.svg.axis().scale(y)
    .orient("left").ticks(5)
    .tickFormat(function (d) {
        return milformat(d)/*.replace("M","")*/;//semi still works here, replace removes M
    });

var milformat = d3.format(".2s");

// Define the line
var priceline = d3.svg.line()	
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.visitors); });
    
// Adds the svg canvas
var svg = d3.select("body")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");

var parkinfo = d3.select("body").append("div")   //append div to body
    .attr("class", "info")
    .style("opacity", 0);

// Get the data
d3.csv("visitors.csv", function(error, data) {
    
    data.forEach(function(d) {
		d.date = parseDate(d.date);
		d.visitors = +d.visitors;
        d.park = d.park;
    });
    
    // Scale the range of the data
    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.visitors; })]);

    // Nest the entries by symbol
    var dataNest = d3.nest()
        .key(function(d) {return d.code;})
        //.key(function(d) {return d.park;})
        .entries(data);

    var color = d3.scale.category10();   // set the colour scale

    legendSpace = width/dataNest.length; // spacing for the legend

    // Loop through each symbol / key
    dataNest.forEach(function(d,i) { 
        
        svg.append("path")
            .attr("class", "line")
            .style("stroke", function() { // Add the colours dynamically
                return d.color = color(d.key); })
            .attr("id", 'tag'+d.key.replace(/\s+/g, '')) // assign ID
            .attr("d", priceline(d.values))
            .style("opacity", 0);

        // Add the Legend
        svg.append("text")
            .attr("x", (legendSpace/2)+i*legendSpace)  // space legend
            .attr("y", height + (margin.bottom/2)+ 15)
            .attr("class", "legend")    // style the legend
            .style("fill", function() { // Add the colours dynamically
                return d.color = color(d.key); })
            .on("click", function(){
                // Determine if current line is visible 
                var active   = d.active ? false : true,
                newOpacity = active ? 1 : 0; 
                // Hide or show the elements based on the ID
                d3.select("#tag"+d.key.replace(/\s+/g, ''))
                    .transition().duration(100) 
                    .style("opacity", newOpacity); 
                // Update whether or not the elements are active
                d.active = active;
                })
            .on("mouseover", function(){
<<<<<<< HEAD
                information(d);
                showtip(d);
                })
            .on("mouseout", function(){
                /*parkinfo.transition()
                    .duration(500)
                    .style("opacity",0);*/
                hidetip(d);
=======
                parkinfo.transition()
                    .duration(300)
                    .style("opacity",1);
                parkinfo.html("<strong>" + d.values[0].park + "</strong><br/>" + "lots of infomation");
                
                })
            .on("mouseout", function(){
                
>>>>>>> origin/master
                })
            .text(d.values[0].park); 

    });
    
    // start projection
    var projection = d3.geo.albersUsa()
        .scale(1000)
        .translate([width/4, height * 5 / 10]);
    
    var path = d3.geo.path()
        .projection(projection);
    
    var parktip = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);
    
    d3.json("parks.json", function(error, park) {
        if (error) throw error;
        
        var neededparks = park.objects.npsboundary;
        var ourparks = park.objects.npsboundary.geometries;
        var p = ourparks.filter(function(d) {
            return d.properties.UNIT_CODE == "ACAD"  || 
                d.properties.UNIT_CODE == "GLAC" ||
                d.properties.UNIT_CODE == "GRCA" ||
                d.properties.UNIT_CODE == "GRTE" ||
                d.properties.UNIT_CODE == "GRSM" ||
                d.properties.UNIT_CODE == "OLYM" ||
                d.properties.UNIT_CODE == "ROMO" ||
                d.properties.UNIT_CODE == "YELL" ||
                d.properties.UNIT_CODE == "YOSE" ||
                d.properties.UNIT_CODE == "ZION";
        });
    
        neededparks.geometries = p;
        
        svg.append("path")
            .attr("class", "statebound")
            .datum(topojson.feature(park, park.objects.states))
            .attr("d", path);
        
        svg.append("g")
            .attr("class", "parkbound")
            .selectAll("path")
            .data(topojson.feature(park, neededparks).features)
            .enter()
            .append("path")
            .attr("d", path)
            .on("mouseover", function(d) {
                
                var matrix = this.getScreen
                
                parktip.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                parktip.html(d.properties.UNIT_NAME)
                    .style("left", (d3.event.pageX) + "px")		
                    .style("top", (d3.event.pageY - 23) + "px")
                    .style("background", function() {
                        console.log(d);
                        return color(d.properties.UNIT_CODE);
                    })
            })
            .on("mouseout", function() {		
                parktip.transition()		
                    .duration(500)		
                    .style("opacity", 0);
            })
            .style("fill", function(d) {
                console.log(d);
                return color(d.properties.UNIT_CODE);
            });
        
        });
        
    
    function showtip(d){
        svg.selectAll(".parkbound")
            .call(function() {
                parktip.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                parktip.html(d.values[0].park)
                    .style("left", (d3.event.pageX) + "px")		
                    .style("top", (d3.event.pageY - 28) + "px")
                    .style("background", function(){
                        return color(d.key);
                    })
            });
    };
    
    function hidetip(d){
        parktip.transition()		
                .duration(500)		
                .style("opacity", 0);
    };
    
    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(995,0)")
        .call(yAxis);
    
    function information(d){
        if(d.key=="ACAD"){
            parkinfo.transition()
                    .duration(300)
                    .style("opacity",1);
                parkinfo.html(
                    "<h2 style='text-align:center'><strong>" + 
                    d.values[0].park + 
                    "</strong></h2><br/>" + 
                    "Credit: NPS / Kristi Rugg" + 
                    "<img src='https://www.nps.gov/common/uploads/photogallery/ner/park/acad/5ABAAE29-1DD8-B71B-0B65C077C4876E7F/5ABAAE29-1DD8-B71B-0B65C077C4876E7F-large.jpg' alt='Rocky Ocean Drive Coast' style='float:right;max-width:100%;max-height:100%;border:0;'>");
        }
    };
    
});