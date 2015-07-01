var flythru = (function(){
    
    var flightPanel = $('#test_panel');
    var iframe = $('#speciman');
    var resetBtn = $('#reset');
    var startBtn = $('#run_test');
    var frameCont = $('#browser_window');
    var rightCol = $('#right_cont');
    
    var targetJQuery;
    var hangar;
    var config;
    
    var __construct = function(){
        config = {
            viewport: {
                h: 800, w: 900
            },
            zoom: 1,
            pace: 1000
        }
        uiSetup();
        hangar = new Hangar();
        hangar.addPlane("First Plane");
    }
    
    /* SETUP */
    var uiSetup = function(){
        iframe.css({
            "height":config.viewport.h+"px",
            "width":config.viewport.w+"px",
            "transform": "scale("+config.zoom+")"
        });
        if(config.zoom < 1){
           iframe.css({
            "transform": "scale("+config.zoom+")"
            }); 
        }
        var width = ((rightCol.width() - (iframe.width()*config.zoom)) / 2);
        var height = ((rightCol.height() - (iframe.height()*config.zoom)) / 2);
        frameCont.css({
            'padding-left': (width > 0)?width:0,
            'padding-top': (height > 0)?height:0,  
        });
    }
    $(window).resize(uiSetup);
    /* interactions */    
    
    startBtn.click(function(){
        hangar.lastPlane().start();
    });
    resetBtn.click(function(){
        var win = getLoadedWindow(iframe);
        $(win.document).find('html').remove();
        iframe.addClass('faded');
        
        flightPanel.find(".passed").removeClass("passed");
        flightPanel.find(".failed").removeClass("failed");
        startBtn.text("Take off!").removeAttr("disabled");
    });
    
    /* PUBLIC */
    
    var out = {
        config: function(_config){
          $.extend(config,_config);
          uiSetup();
          return out;  
        },
        getConfig: function(){
            return config;
        },
        plane: function(name){
            if(!name){ throw "Plane name is required!"; return; }
            var p = hangar.getPlaneByName(name);
            return (p)?p:hangar.addPlane(name).lastPlane();
        },
        addFlight: function(name){
            return hangar.lastPlane().addFlight(name);
		},
        hangar: function(){
            return hangar;
        },
        // old implementation
        destination: function(location){
            return hangar.lastPlane().addDestination(location);
        }
    }
    
    /* CLASSES */
    
    // Hangar
    var Hangar = function(){        
        var self = this;
        var planes = [];
        this.getPlaneByName = function(name){
            return getObjectByName(planes,name);
        }
        this.addPlane = function(name){
            var plane = new Plane(name,self);
            planes.push(plane);
            return self;
        }
        this.lastPlane = function(){
            if(!planes.length){ throw "No planes have been added"; return; }  
            return planes[planes.length - 1];
        }
                
    }
    // Plane
    var planeStates = {
        inFlight: 1,
        halted: 2        
    }
    var Plane = function(name, hangar){
        var self = this;
        var name = name;
        var hangar = hangar;
        var itinerary = [];
        var state = planeStates.halted;
        self.cargo = {};
        self.name = name;
        
        // flight
        this.addFlight = function(name){
            var flt = new Flight(name, self);
            itinerary.push(flt);
            return flt;
        }
        
        // destination
        this.addDestination = function(location){
            var dest = new Destination(location, self);
            itinerary.push(dest);
            return self;
        }
        
        this.start = function(){            
            var runFlights = function(i){
                if(itinerary[i]){
                    itinerary[i].__internal().onflightComplete(function(){
                        runFlights(i+1);
                    }).start();                     
                }else{
                    startBtn.text('Landed!');
                    resetBtn.removeAttr('disabled');
                }
            }
            runFlights(0);
        }
        this.getCargo = function(){
            return self.cargo;
        }
    }
    // Destination
    var Destination = function(location,plane){
        var self = this;
        var plane = plane;
        var location = location;
        
        var loading = false;
        
        var flight = new Flight("Destination",plane);
        flight.__internal().addStop("Fly to "+location,function(pass,fail,cargo){                          
             if(!loading){
                 startBtn.attr('disabled',true);
                 startBtn.text('boarding..');
                 loading = true;
                 //iframe.load(function(){
                    setTimeout(function(){
                        iframe.removeClass('faded');  
                        plane.cargo.win = getLoadedWindow(iframe);
                        startBtn.text('In Flight!');   
                        pass(); loading = false;    
                //    },1000);                    
                });
                iframe.attr('src',location); 
            }
                
        }).config({ asyncTimeout: 25000 });
        return flight;
    }
    // Flight
    var Flight = function(name, plane){
        var self = this;
        var name = name;
        var plane = plane;        
        var stops = [];
        
        var flightCompleteCallbacks = [];
        
        // ui
        var group = $("<div>", { "class":"group" });
        var title = $("<span>", { "class": "title", html: name });
        var rowcont = $("<div>", { "class": "check-holder" });
        rowcont.show();
        group.append(title,rowcont);
        flightPanel.append(group);
        var groupPassFailLogic = function(){
            (group.find('.failed').length)?group.addClass('fail'):group.addClass('passed');
        }
        
        
        /* flight controls */
        // starts flight in beginning and each next stop/layover
        this.start = function(){
            var runStops = function(i){   
                if(stops[i]){
                    setTimeout(function(){
                        stops[i].onStopComplete(function(passed){
                            if(passed){
                                runStops(i+1);
                            }
                        }).inspection();
                    },config.pace); 
                }else{
                    runCallbackList(flightCompleteCallbacks,false);
                }
            };
            runStops(0);
        };
        
        /* flight patterns */
        // stop
        this.addStop = function(name,pilotsLogicFunction){
            var st = new FlightStop(name,pilotsLogicFunction,rowcont,plane.getCargo());
            stops.push(st);
            return st;
        };
        // layover 
        this.layover = function(args){
            if(args.length === 1){
                var ms = args[0];                
                var st = new FlightStop("Layover for "+ms,function(pass,fail,cargo){
                    setTimeout(function(){ pass(); }, ms - 2);
                },rowcont,plane.cargo);
                st.config({
                    asyncTimeout: ms
                });
                stops.push(st);
            }else if(args.length > 1 && typeof(args[0]) == "string"){
                var ms = (args[2])?args[2]:15000;                
                var st = new FlightStop(args[0],args[1],rowcont,plane.getCargo());
                st.config({
                    asyncTimeout: ms
                });
                stops.push(st);
            }else{
                throw "layover is missing required arguments";
            }
            return self;
        }
        
        
        
        /* notifiers */
        this.onflightComplete = function(callback){
            flightCompleteCallbacks.push(callback);
            return self;
        };
        this.onflightComplete(groupPassFailLogic);
        
        var chained = {
            addStop: function(name,pilotsLogicFunction){
                var st = self.addStop(name,pilotsLogicFunction);
                return chained;
            },
            layover: function(){
                var st = self.layover(arguments);
                return chained;
            },
            __internal: function(){
                return self;
            }
        }
        return chained;
    };
    var FlightStop = function(name,pilotsLogicFunction,rowCont,planeCargo){
        var self = this;
        var name = name;
        var planeCargo = planeCargo;
        var pilotsLogicFunction = pilotsLogicFunction;
        var rowCont = rowCont;
        var css = { passed: "passed", failed: "failed" };
        
        var passed = false;
        var stopComplete = false;
        var stopCompleteCallbacks = [];
        
        var settings = {
            asyncTimeout: false, // timeout in ms, if false is sync
            intervalTime: 1000
        }
         
        // ui
        var row = $("<div>", { html: "<span>" + name + "</span>", "class": "check" });
        rowCont.append(row);
                
        // public
        this.inspection = function(){
            var timeElapsed = 0;
            var inspect = function(){
                pilotsLogicFunction(
                    function(){
                       row.addClass(css.passed);
                       passed = true;
                       stopComplete = true; 
                    },
                    function(reason){
                        row.addClass(css.failed);
                        stopComplete = true;
                        if(reason){
                            alert(reason);
                        }
                    },planeCargo
                );
                if(!stopComplete && settings.asyncTimeout && !(timeElapsed > settings.asyncTimeout)){
                    timeElapsed = timeElapsed + settings.intervalTime;
                    setTimeout(inspect,settings.intervalTime);    
                }else if(stopComplete){
                     runCallbackList(stopCompleteCallbacks,passed);
                     passed = false; stopComplete = false;
                }else if(!stopComplete && settings.asyncTimeout){
                     row.addClass(css.failed);
                     alert("Layover timed out");
                }else{
                    throw "No callback was called for: "+name;
                }
            };
            inspect();
            return self;
        };
        this.config = function(_settings){
            // type
            $.extend(settings,_settings);
            return self;
        }
        // when completed fire callbacks and tell them if it passed
        this.onStopComplete = function(callback){
            stopCompleteCallbacks.push(callback);
            return self;
        }
    }
    
    
    
    /* helpers */
    var getObjectByName = function(list,name){
         var m = false;
        $.each(list,function(key,obj){
            if(key == name){ m = obj; return; }
        });
        return m;
    }
    var runCallbackList = function(list,arg){
        $.each(list,function(key,callback){
            callback(arg);
        });
    }
    var getLoadedWindow = function(iframe){
        
        var win = (iframe[0].contentWindow)?iframe[0].contentWindow:false;
        if(win && win.$){
            targetJQuery = iframe[0].contentWindow.$;
        }else if(win && win.document){
            targetJQuery = $;
        }else{
            html = false;
        }      
        // bind type in  
        if(targetJQuery){
            //flythru.cargo.win.angular.element(flythru.cargo.html.find('button:contains("Login")')[0]).scope().$apply
            // jquery extensions 
            var applyAngular = function(ele){
                var attr = ele.attr('ng-model');
                if(attr && win.angular && win.angular.element(ele).scope){
                    win.angular.element(ele).scope()[attr] = ele.val();
                    win.angular.element(ele).scope().$apply();
                }
            }
            targetJQuery.fn.typeIn = function(val){
                targetJQuery(this).val(val).trigger('keydown').trigger('keyup').trigger('keypress').trigger('change');
                applyAngular(targetJQuery(this));
                return this;
            }
        }
        return win;
    }

    __construct();
    
    /* END */
    
    return out;    
})();