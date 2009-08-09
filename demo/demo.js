window.demo = window.demo || {};
(function(ns){
    
    ns.makeGreenHandler = {
        nodeName : 'div',
        className : 'make-green',
        init : function() {
            this.style.backgroundColor = 'green';
        }
    };
    
    ns.makeFormSpecialHandler = {
        mode : nodewalker.modes.OR, // just to demonstrate we have AND and OR to work with
        nodeName : 'form',
        className : 'form',
        init : function() {
            var elements = this.elements;
            if (!elements) return false; // returning false will stop the walker at this level
            
            var len = elements.length;
            for (var i = 0; i < len; i++) {
                var el = elements[i];
                el.value = new Date();
                el.style.border = '1px solid red';
            }
        }
    };
    
    ns.specialFontSizeHandler = {
        nodeName : 'div',
        init : function() {
            this.style.fontSize = '18px';
            this.style.lineHeight = '22px';
        }
    };
    
    ns.startWalkerForBody = function() {
        nodewalker.walk(document.body, 
            {handlers : [demo.specialFontSizeHandler]}); // extend the defaults with custom config
    };
    
    ns.startWalkerForTable = function() {
        var el = document.getElementById('that-table');
        nodewalker.walk(el);
    };
    
    ns.setDefaults = function() {
        
        // lets set some default handlers
        var defaults = nodewalker.defaults;
        defaults.ignoreClasses += ' widget-with-large-dom';
        defaults.handlers.push(demo.makeGreenHandler);
        defaults.handlers.push(demo.makeFormSpecialHandler);
    };
    
})(window.demo);