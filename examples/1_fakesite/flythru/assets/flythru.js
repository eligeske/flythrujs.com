var flythru = (function(){	
	
    var testpanel = $('#test_panel');
    var iframe = $('#speciman');
    var cw;    
    var tests = [];   
    var loaded = false;
    var cargo = { win: null };
    var targetJQuery;
    
    
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
        start();        
    });
    startBtn.attr('disabled',true);
    setTimeout(function(){
        startBtn.removeAttr('disabled',true);        
    },1);
    var start = function(){
        var i = 0;
        var nextTest = function(){
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
            }                
        };
        nextTest();        
    }
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
            
            var completedCallbacks = [];
                       
            
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
                if (steps[on]) {
                    on++;
                    var f = steps[on - 1];
                    setTimeout(f, (ms = waits[(on - 1).toString()])?ms:config.pace);                   
                } else {
                    if (!group.hasClass('failed')) {
                        group.addClass('passed');
                        $.each(completedCallbacks, function(i,func){
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
                completedCallbacks.push(callback);
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