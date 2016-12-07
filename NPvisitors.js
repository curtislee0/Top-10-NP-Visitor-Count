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

var parktip = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);

var color = d3.scale.category10();   // set the colour scale

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//  Data Read Start
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

d3.json("parks.json", function(error, park) {
        if (error) throw error;
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
        
        //Add the Legend
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
                information(d);
                showtip(d);
                })
            .on("mouseout", function(){
                hidetip(d);
                hideinfo(d);
                })
            .text(d.values[0].park); 
    });
    
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
        
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//  Map Projection Start
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    var projection = d3.geo.albersUsa()
        .scale(1000)
        .translate([width/4, height * 5 / 10]);
    
    var path = d3.geo.path()
        .projection(projection);
            
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
            .attr("id", function(d) {
                return d.properties.UNIT_CODE;
            })
            .on("mouseover", function(d) {
                parktip.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                parktip.html(d.properties.UNIT_NAME)
                    .style("left", (d3.event.pageX) + "px")		
                    .style("top", (d3.event.pageY - 23) + "px")
                    .style("background", function() {
                        return color(d.properties.UNIT_CODE);
                    })
            })
            .on("mouseout", function() {		
                parktip.transition()		
                    .duration(500)		
                    .style("opacity", 0);
            })
            .style("fill", function(d) {
                return color(d.properties.UNIT_CODE);
            });
        });
         
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//  Helper Functions
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    //Display park name when hover
    function showtip(d){
        var xcord;
        var ycord;
        
        switch(d.key){
            case "ACAD":
                xcord = 853;
                ycord = 249;
                break;
            case "GLAC":
                xcord = 315;
                ycord = 187;
                break;
            case "GRCA":
                xcord = 293;
                ycord = 424;
                break;
            case "GRTE":
                xcord = 333;
                ycord = 293;
                break;
            case "GRSM":
                xcord = 692;
                ycord = 442;
                break;
            case "OLYM":
                xcord = 196;
                ycord = 192;
                break;
            case "ROMO":
                xcord = 386;
                ycord = 364;
                break;
            case "YELL":
                xcord = 345;
                ycord = 260;
                break;
            case "YOSE":
                xcord = 198;
                ycord = 346;
                break;
            case "ZION":
                xcord = 284;
                ycord = 378;
                break;
            default:
                break;
        }
        
        svg.selectAll(".parkbound")
            .call(function() {
                parktip.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                parktip.html(d.values[0].park)
                    .style("left", (xcord) + "px")		
                    .style("top", (ycord - 28) + "px")
                    .style("background", function(){
                        return color(d.key);
                    })
            });
    };
    
    function hidetip(d) {
        parktip.transition()		
            .duration(300)		
            .style("opacity", 0);
    };
    
    function hideinfo(d) {
        parkinfo.transition()
            .duration(300)
            .style("opacity", 0);
    }
    
    //Display park info when hover
    function information(d){
        switch(d.key){
            case "ACAD":
                parkinfo.transition()
                    .duration(300)
                    .style("opacity",1);
                parkinfo.html(
                        "<h2 style='text-align:center'><strong>" + d.values[0].park + "</strong></h2><br/>" + 
                        "<div class='credit'><i>Credit: NPS / Kristi Rugg</i></div>" + 
                        "<div class='desc'>Acadia National Park is a 47,000-acre Atlantic coast recreation area primarily on Maine's Mount Desert Island. Its landscape is marked by woodland, rocky beaches and glacier-scoured granite peaks such as Cadillac Mountain, the highest point on the United States’ East Coast. Among the wildlife are moose, bear, whales and seabirds. The bayside town of Bar Harbor, with restaurants and shops, is a popular gateway.</div>" + 
                        "<img src='https://www.nps.gov/common/uploads/photogallery/ner/park/acad/5ABAAE29-1DD8-B71B-0B65C077C4876E7F/5ABAAE29-1DD8-B71B-0B65C077C4876E7F-large.jpg' alt='Rocky Ocean Drive Coast' style='float:right;max-width:88%;max-height:88%;border:0;'>");
                break;
            case "GLAC":
                parkinfo.transition()
                    .duration(300)
                    .style("opacity",1);
                parkinfo.html(
                    "<h2 style='text-align:center'><strong>" + d.values[0].park + "</strong></h2><br/>" + 
                    "<div class='credit'><i>Credit: NPS</i></div>" + 
                    "<div class='desc'>Glacier National Park is a 1,583-sq.-mi. wilderness area in Montana's Rocky Mountains, with glacier-carved peaks and valleys running to the Canadian border. It's crossed by the mountainous Going-to-the-Sun Road. Among more than 700 miles of hiking trails, it has a route to photogenic Hidden Lake. Other activities include backpacking, cycling and camping. Diverse wildlife ranges from mountain goats to grizzly bears.</div>" + 
                    "<img src='https://www.nps.gov/common/uploads/photogallery/imr/park/glac/F27CED7C-155D-451F-67A8213F347FBE5E/F27CED7C-155D-451F-67A8213F347FBE5E-large.jpg' alt='Glenns Lake' style='float:right;max-width:88%;max-height:88%;border:0;'>");
                break;
            case "GRCA":
                parkinfo.transition()
                    .duration(300)
                    .style("opacity",1);
                parkinfo.html(
                    "<h2 style='text-align:center'><strong>" + d.values[0].park + "</strong></h2><br/>" + 
                    "<div class='credit'><i>Credit: NPS</i></div>" + 
                    "<div class='desc'>Grand Canyon National Park, in Arizona, is home to much of the immense Grand Canyon, with its layered bands of red rock revealing millions of years of geological history. Viewpoints include Mather Point, Yavapai Observation Station and architect Mary Colter’s Lookout Studio and her Desert View Watchtower. Lipan Point, with wide views of the canyon and Colorado River, is a popular, especially at sunrise and sunset.</div>" + 
                    "<img src='https://www.nps.gov/common/uploads/photogallery/imr/park/grca/F7A4FC28-155D-451F-6754A8A6935BE816/F7A4FC28-155D-451F-6754A8A6935BE816-large.jpg' alt='Mather Point Rainbow' style='float:right;max-width:88%;max-height:88%;border:0;'>");
                break;
            case "GRTE":
                parkinfo.transition()
                    .duration(300)
                    .style("opacity",1);
                parkinfo.html(
                    "<h2 style='text-align:center'><strong>" + d.values[0].park + "</strong></h2><br/>" + 
                    "<div class='credit'><i>Credit: NPS</i></div>" + 
                    "<div class='desc'>Grand Teton National Park is in the northwest of the U.S state of Wyoming. It encompasses the Teton mountain range, the 4,000-meter Grand Teton peak, and the valley known as Jackson Hole. It’s a popular destination in summer for mountaineering, hiking, backcountry camping and fishing, linked to nearby Yellowstone National Park by the John D. Rockefeller, Jr. Memorial Parkway.</div>" + 
                    "<img src='https://www.nps.gov/common/uploads/photogallery/imr/park/grte/FC195559-155D-451F-67A79FAE8DF723B0/FC195559-155D-451F-67A79FAE8DF723B0-large.JPG' alt='String Lake' style='float:right;max-width:88%;max-height:88%;border:0;'>");
                break;
            case "GRSM":
                parkinfo.transition()
                    .duration(300)
                    .style("opacity",1);
                parkinfo.html(
                    "<h2 style='text-align:center'><strong>" + d.values[0].park + "</strong></h2><br/>" + 
                    "<div class='credit'><i>Credit: NPS</i></div>" + 
                    "<div class='desc'>Great Smoky Mountains National Park straddles the border between North Carolina and Tennessee. The sprawling landscape encompasses lush forests and an abundance of wildflowers that bloom year-round. Streams, rivers and waterfalls appear along hiking routes that include a segment of the Appalachian Trail. An observation tower tops Clingmans Dome, the highest peak, offering scenic views of the mist-covered mountains.</div>" + 
                    "<img src='https://www.nps.gov/common/uploads/photogallery/akr/park/grsm/2884C85B-1DD8-B71C-07641C4C43F3FDA7/2884C85B-1DD8-B71C-07641C4C43F3FDA7-large.jpg' alt='Cataloochee Creek' style='float:right;max-width:88%;max-height:88%;border:0;'>");
                break;
            case "OLYM":
                parkinfo.transition()
                    .duration(300)
                    .style("opacity",1);
                parkinfo.html(
                    "<h2 style='text-align:center'><strong>" + d.values[0].park + "</strong></h2><br/>" + 
                    "<div class='credit'><i>Credit: NPS Photo</i></div>" + 
                    "<div class='desc'>Olympic National Park is on Washington's Olympic Peninsula in the Pacific Northwest. The park sprawls across several different ecosystems, from the dramatic peaks of the Olympic Mountains to old-growth forests. The summit of glacier-clad Mt. Olympus is popular with climbers, and numerous hiking and backpacking trails cut through the park's rainforests and along its Pacific coastline.</div>" + 
                    "<img src='https://www.nps.gov/common/uploads/photogallery/20151215/park/olym/86070B68-1DD8-B71B-0B10F1FCC85DF7F8/86070B68-1DD8-B71B-0B10F1FCC85DF7F8-large.jpg' alt='Mountain Wildflowers' style='float:right;max-width:88%;max-height:88%;border:0;'>");
                break;
            case "ROMO":
                parkinfo.transition()
                    .duration(300)
                    .style("opacity",1);
                parkinfo.html(
                    "<h2 style='text-align:center'><strong>" + d.values[0].park + "</strong></h2><br/>" + 
                    "<div class='credit'><i>Credit: NPS Photo</i></div>" + 
                    "<div class='desc'>Rocky Mountain National Park in northern Colorado spans the Continental Divide and encompasses protected mountains, forests and alpine tundra. It's known for the Trail Ridge Road and the Old Fall River Road, drives that pass aspen trees and rivers. The Keyhole Route, a climb crossing vertical rock faces, leads up Longs Peak, the park’s tallest mountain. A trail surrounding Bear Lake offers views of the peaks.</div>" + 
                    "<img src='https://www.nps.gov/common/uploads/photogallery/20140131/park/romo/271155A1-155D-451F-67485D6D107B39BF/271155A1-155D-451F-67485D6D107B39BF-large.jpg' alt='Lily Lake' style='float:right;max-width:88%;max-height:88%;border:0;'>");
                break;
            case "YELL":
                parkinfo.transition()
                    .duration(300)
                    .style("opacity",1);
                parkinfo.html(
                    "<h2 style='text-align:center'><strong>" + d.values[0].park + "</strong></h2><br/>" + 
                    "<div class='credit'><i>Credit: NPS Photo/Curtis Akin</i></div>" + 
                    "<div class='desc'>Yellowstone National Park is a nearly 3,500-sq.-mile wilderness recreation area atop a volcanic hot spot. Mostly in Wyoming, the park spreads into parts of Montana and Idaho too. Yellowstone features dramatic canyons, alpine rivers, lush forests, hot springs and gushing geysers, including its most famous, Old Faithful. It's also home to hundreds of animal species, including bears, wolves, bison, elk and antelope.</div>" + 
                    "<img src='https://www.nps.gov/common/uploads/photogallery/20160215/park/yell/01680965-1DD8-B71B-0BAC451A696CFC83/01680965-1DD8-B71B-0BAC451A696CFC83-large.jpg' alt='Grand Prismatic Spring' style='float:right;max-width:88%;max-height:88%;border:0;'>");
                break;
            case "YOSE":
                parkinfo.transition()
                    .duration(300)
                    .style("opacity",1);
                parkinfo.html(
                    "<h2 style='text-align:center'><strong>" + d.values[0].park + "</strong></h2><br/>" + 
                    "<div class='credit'><i>Credit: <a href='http://www.pachd.com/'>www.pachd.com</a></i></div>" + 
                    "<div class='desc'>Yosemite National Park is in California’s Sierra Nevada mountains. It’s famed for its giant, ancient sequoia trees, and for Tunnel View, the iconic vista of towering Bridalveil Fall and the granite cliffs of El Capitan and Half Dome. In Yosemite Village are shops, restaurants, lodging, the Yosemite Museum and the Ansel Adams Gallery, with prints of the photographer’s renowned black-and-white landscapes of the area.</div>" + 
                    "<img src='http://www.pachd.com/free-images/yosemite/yosemite-03.jpg' alt='Half Dome' style='float:right;max-width:88%;max-height:88%;border:0;'>");
                break;
            case "ZION":
                parkinfo.transition()
                    .duration(300)
                    .style("opacity",1);
                parkinfo.html(
                    "<h2 style='text-align:center'><strong>" + d.values[0].park + "</strong></h2><br/>" + 
                    "<div class='credit'><i>Credit: NPS Photo</i></div>" + 
                    "<div class='desc'>Zion National Park is a southwest Utah nature preserve distinguished by Zion Canyon’s steep red cliffs. Zion Canyon Scenic Drive cuts through its main section, leading to forest trails along the Virgin River. The river flows to the Emerald Pools, which have waterfalls and a hanging garden. Also along the river, partly through deep chasms, is Zion Narrows wading hike.</div>" + 
                    "<img src='https://www.nps.gov/common/uploads/photogallery/imr/park/zion/9CAAA9F0-1DD8-B71B-0B40CA1A8612FFB9/9CAAA9F0-1DD8-B71B-0B40CA1A8612FFB9-large.jpg' alt='South Entrance' style='float:right;max-width:88%;max-height:88%;border:0;'>");
                break;
            default:  
        }
    };
});