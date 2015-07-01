var flythru = (function(){
    
    var flightPanel = $('#test_panel');
    var iframe = $('#speciman');
    var resetBtn = $('#reset');
    var frameCont = $('#browser_window');
    var rightCol = $('#right_cont');
    
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
    
    /* PUBLIC */
    
    var out = {
        getConfig: function(){
            return config;
        },
        plane: function(name){
            var p = hangar.getPlaneByName(name);
            return (p)?p:hangar.addPlane(name).lastPlane()
        },
        addFlight: function(name){
            return hangar.lastPlane().addFlight(name).lastFlight();
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
        
        // flight
        this.addFlight = function(name){
            var flt = new Flight(name, self);
            itinerary.push(flt);
            return flt;
        }
        
    }
    // Destination
    var Destination = function(location){
        var self = this;
        var location = location;
        
        var flight = new Flight("Fly to "+location);
        
        return flight;
    }
    // Flight
    var Flight = function(name, plane){
        var self = this;
        var name = name;
        var plane = plane;        
        var stops = [];
        var flightLog = {
            currentStop: 0
        }
        var flightCompleteCallbacks = [];
        
        // ui
        var group = $("<div>", { "class":"group" });
        var title = $("<span>", { "class": "title", html: name });
        var rowcont = $("<div>", { "class": "check-holder" });
        group.append(title,rowcont);
        flightPanel.append(group);
        
        
        
        /* flight controls */
        // starts flight in beginning and each next stop/layover
        var takeOff = function(){
            
        }
        
        /* flight patterns */
        // stop
        this.addStop = function(name,pilotsLogicFunction){
            
        }
        // layover 1
        // layover 2
        // destination
        
        /* stop/layover callbacks */
        var pass = function(){
            
        }
        
        
        /* notifiers */
        this.onflightComplete = function(callback){
            flightCompleteCallbacks.push(callback);
        }
    }
	
    var FlightStop = function(name,pilotsLogicFunction,rowCont){
        var self = this;
        var name = name;
        var pilotsLogicFunction = pilotsLogicFunction;
        var rowCont = rowCont;
        var css = { passed: "passed", faild: "failed" };
        
        var passed = false;
        var stopComplete = false;
        var stopCompleteCallbacks = [];
        
        // ui
        var row = $("<div>", { html: "<span>" + name + "</span>", "class": "check" });
        rowCont.append(row);
                
        // public
        this.inspection = function(){
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
                });
             if(stopComplete){
                 runCallbackList(stopCompleteCallbacks,passed);
             }else{
                 throw "No callback was called for: "+name;
             }
        };
        
        // when completed fire callbacks and tell them if it passed
        this.stopCompleteCallback = function(callback){
            stopCompleteCallbacks.push(callback);
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
    
    __construct();
    /* END */
    
    
    var testpanel = $('#test_panel');
    var iframe = $('#speciman');
    var resetBtn = $('#reset');
    var cw;    
    var tests = [];   
    var loaded = false;
    var cargo = { win: null };
    var targetJQuery;
    
    var stopped = false;
    
    var config = {
        viewport: {
            h: 800, w: 900
        },
        zoom: 1,
        pace: 1000
    }
    
    var runSettings = function(){
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
        var width = (($('#right_cont').width() - (iframe.width()*config.zoom)) / 2);
        var height = (($('#right_cont').height() - (iframe.height()*config.zoom)) / 2);
        $('#browser_window').css({
            'padding-left': (width > 0)?width:0,
            'padding-top': (height > 0)?height:0,  
        });
    }
    $(window).resize(function(){
       runSettings(); 
    });
    var startBtn = $('#run_test').click(function(){
        timeline.start();        
    });
    startBtn.attr('disabled',true);
    setTimeout(function(){
        startBtn.removeAttr('disabled',true);        
    },1);
    resetBtn.click(function(){
        timeline.reset();
    });
    var timeline = (function(){
        var i = 0;
        var out = {
            start: function(){
                stopped = false;
                resetBtn.attr('disabled',true);                
                var nextTest = function(){
                    if(stopped) return;
                    if(tests[i]){
                        if(tests[i-1]){
                            tests[i-1].expand(false);
                        }
                        tests[i].expand(true);
                        tests[i].arrival(function(){
                            i++;
                            nextTest(i);
                        });
                        tests[i].takeoff();    
                    }else{
                        out.stop();
                        startBtn.text("Landed!").attr('disabled',true);
                    }               
                };
                nextTest(); 
            },
            stop: function(){
                stopped = true;
                resetBtn.removeAttr('disabled');
                startBtn.text("Take Off").removeAttr('disabled');
            },
            reset: function(){
                out.stop();
                i = 0;
                for(var ii=0; ii < tests.length; ii++){
                    tests[ii].reset();
                }                
                cargo.html.remove();
                iframe.addClass('faded');                
                
            }
        }
        return out;
    })();
    
    var setWindow = function(){
        
        cargo.win = (iframe[0].contentWindow)?iframe[0].contentWindow:false;
        if(cargo.win && cargo.win.$){
            targetJQuery = iframe[0].contentWindow.$;
            cargo.html = iframe[0].contentWindow.$('html');
        }else if(cargo.win && cargo.win.document){
            targetJQuery = $;
            cargo.html = $(cargo.win.document).find('html');
        }else{
            cargo.html = false;
        }      
        // bind type in  
        if(targetJQuery){
            //flythru.cargo.win.angular.element(flythru.cargo.html.find('button:contains("Login")')[0]).scope().$apply
            // jquery extensions 
            var applyAngular = function(ele){
                var attr = ele.attr('ng-model');
                if(attr && cargo.win.angular && cargo.win.angular.element(ele).scope){
                    cargo.win.angular.element(ele).scope()[attr] = ele.val();
                    cargo.win.angular.element(ele).scope().$apply();
                }
            }
            targetJQuery.fn.typeIn = function(val){
                targetJQuery(this).val(val).trigger('keydown').trigger('keyup').trigger('keypress').trigger('change');
                applyAngular(targetJQuery(this));
                return this;
            }
        }
    }
	var Test = function (name) {
            
            var self = this;
            var dom = dom;            
            var steps = [];
            var on = 0;
            var waits = {};
            
            self.completedCallbacks = [];
                   
            this.reset = function(){
                on = 0;
                group.removeClass("passed").removeClass("failed");
                rowcont.find('div').removeClass("passed").removeClass("failed");
                self.expand(false);
            }    
            
            var group = $("<div>", { "class":"group" });
            var title = $("<span>", { "class": "title", html: name });
            var rowcont = $("<div>", { "class": "check-holder" });
            this.expand = function(bool){
                (!bool)?group.removeClass('open'):group.addClass('open');
            }
            group.append(title, rowcont);
            title.click(function(){               
               self.expand(!$(this).parent().find('.check-holder').is(":visible"));
            });
            $("#test_panel").append(group);

            var Row = function () {
                var h = $("<div>", { html: "" })
            }
            var next = function () {
                if(stopped) return;
                if (steps[on]) {
                    on++;
                    var f = steps[on - 1];
                    setTimeout(f, (ms = waits[(on - 1).toString()])?ms:config.pace);                   
                } else {
                    if (!group.hasClass('failed')) {
                        group.addClass('passed');
                        $.each(self.completedCallbacks, function(i,func){
                            func();                            
                        });
                    }                    
                }
            }
            this.flyby = function () {
                return self;
            }
            this.addStop = function (testName, func) {
                var name = testName;
                var row = $("<div>", { html: "<span>" + testName + "</span>", "class": "check" });
                rowcont.append(row);
                steps.push(function () {                    
                    func(function () {
                        row.addClass('passed');
                        next();
                    }, function (reason) {
                        row.addClass('failed');
                        group.addClass('failed');
                        if(reason){
                            alert(reason);
                        }
                    }, cargo);
                });
                return self;
            }
            var layoverUntil = function (testName, func, howLongMS) {

                var name = testName;
                var row = $("<div>", { html: "<span>" + testName + "</span>", "class": "check" });
                rowcont.append(row);
                var howLongMS = howLongMS;
                var func = func;

                

                steps.push(function () {
                    var pass = null;
                    var timeElapsed = 0;
                    var interval = 1000;
                    
                    var failed = function(reason){
                        pass = false; row.addClass('failed'); group.addClass('failed');
                        if(reason){
                            alert(reason);
                        }
                    }
                    
                    var waitForIt = function () {
                        if(pass !== null){
                            if(pass){
                                next();
                            }else{
                                failed('Layover times up');
                            }
                            return;
                        }
                        setTimeout(function () {
                            timeElapsed = timeElapsed + interval;
                            func(function(){
                                pass = true; row.addClass('passed');
                            },failed,cargo);
                                
                            if (timeElapsed > howLongMS) {
                                pass = false;
                                
                            }
                            waitForIt();
                        }, 1000);
                    }
                    waitForIt();
                });          
            };
            // overloaded ()
            this.layover = function (ms,func,howLongMS) {
                if(arguments.length > 1){
                    layoverUntil(ms,func,howLongMS);
                }else{
                   waits[(steps.length).toString()] = ms; 
                }
                
                return self;
            };
            this.takeoff = function () {
                // run
                next();
            }
            this.arrival = function(callback){
                // finished
                self.completedCallbacks.push(callback);
            }
            this.stops = steps;
        }
	
    
	var innards =  {
        destination: function(url){
            var t = new Test("Load web page"); 
            tests.push(t);
            t.addStop("Navigate to: "+url,function(pass,fail,cargo){
                startBtn.attr('disabled',true);
                startBtn.text('boarding..');
                iframe.load(function(){
                    
                    iframe.removeClass('faded');  
                    setTimeout(function(){
                        
                        setWindow();                        
                        loaded = true;
                        startBtn.text('In Flight!');
                        //startBtn.removeAttr('disabled');   
                        pass();
                    }, 2000);         
                });
                iframe.attr('src',url);                
            });
            return innards;
        },
		addFlight: function(name){
            var t = new Test(name); 
            tests.push(t);
			return t;
		},
        getConfig: function(){
            return config;
        },
        config: function(options){
          $.extend(config,options);
          runSettings(); 
        },
        cargo: cargo,
        flights: tests
	}	
    runSettings();
    return innards;
})();