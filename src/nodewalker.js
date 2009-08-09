/* -------------------------------------------------------
//////////////////////////////////////////////////////////
nodewalker.js - walking the DOM fast
version 1.0

The MIT License

Copyright (c) 2008 Marcel Beumer (marcel@marcelbeumer.nl)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
//////////////////////////////////////////////////////////
------------------------------------------------------- */
(function(ns){
    
    var _defaults = {
        ignoreClasses : 'nodewalker-stop',
        useCaches : true,
        handlers : []
    };
    
    var _modes = {
        'AND' : 2,
        'OR' : 1
    };
    
    // very fast has class (without proper node or name checks though)
    var hasClass = function(str, className) {
        var r = new RegExp("(^|\\s)" + className + "(\\s|$)");
        return r.test(str);
    };
    
    // get count of classes contained (based on hasClass)
    var hasClasses = function(str, classNames) {
        var names = classNames.split(' ');
        var len = names.length;
        var count = 0;
        for (var x = 0; x < len; x++) {
            if (hasClass(str, names[x])) count++;
        }
        return count;
    };
    
    // check if the node should be ignored
    var shouldIgnore = function(node, config) {
        var className = node.className;
        var ignoreByClass = hasClasses(className, config.ignoreClasses);
        var ignoreByRouter = config.router ? !config.router(node, className) : false;
        return ignoreByClass || ignoreByRouter;
    };
    
    // run handlers on a node
    var runHandlers = function(node, config) {
        var useCaches = config.useCaches;
        
        var handlers = config.handlers;
        if (!handlers) return true;
        
        var nodeName = node.nodeName.toLowerCase();
        var className = node.className;
        
        if (useCaches) {
            var caches = config.caches;
            
            if (className && className != '') {
                var searches = caches.classNameSearches;
                if (searches[className] !== undefined) {
                    var hasClassMatch = searches[className];
                } else {
                    var hasClassMatch = (className && hasClasses(caches.classNames, className) > 0) ? true : false;
                    searches[className] = hasClassMatch;
                }
            } else {
                var hasClassMatch = false;
            }
            
            if (nodeName) {
                var searches = caches.nodeNameSearches;
                if (searches[nodeName] !== undefined) {
                    var hasNodeMatch = searches[nodeName];
                } else {
                    var hasNodeMatch = (nodeName && hasClasses(caches.nodeNames, nodeName)) ? true : false;
                    searches[nodeName] = hasNodeMatch;
                }
            } else {
                var hasNodeMatch = false;
            }
            
            if ((!hasClassMatch && !hasNodeMatch)) return true;
        }
        
        var len = handlers.length;
        
        for (var x = 0; x < len; x++) {
            var handler = handlers[x];
            
            var handlerClassName = handler.className;
            var handlerNodeName = handler.nodeName;
            
            if (handlerNodeName) {
                var nodeNameEquals = nodeName == handlerNodeName;
            }
            
            if (handlerClassName) {
                var classMatches = hasClass(node.className, handlerClassName);
            }
            if (handler.mode == 1) {
                var run = (handlerClassName ? classMatches : false) || (handlerNodeName ? nodeNameEquals : false);
            } else {
                var run = (handlerClassName ? classMatches : true) && (handlerNodeName ? nodeNameEquals : true);
            }
            
            if (run && typeof(handler.init) == 'function') {
                if (handler.init.apply(node) === false) return false;
            }
        }
        
        return true;
    };
    
    
    var walk = function(node, config) {
        if (shouldIgnore(node, config)) return;
        
        var result = runHandlers(node, config);
        if (result === false) return;
        
        // do the same for all children
        
        /* 
        we build up a children array because (at least firefox) might not 
        walk the dom correctly when we do the walker _while_ going
        through the siblings and _while_ modules are modifying the dom
        */
        var len = 0;
        var children = [];
        var child = node.firstChild;
        for ( ; child; child = child.nextSibling) {
            if (child.nodeType == 1) {
                children.push(child);
                len++; // while we walk anyway, lets keep track of the size
            }
        }
        
        for (var x= 0; x < len; x++) {
            walk(children[x], config);
        }
    };
    
    var buildConfig = function(config) {
        var build = {};
        for (var name in _defaults) {
            build[name] = _defaults[name];
        }
        
        for (var name in config) {
            if (name == 'handlers') {
                
                if (build.handlers) {
                    var copy = [];
                    var len = build.handlers.length;
                    for (var i = 0; i < len; i++) {
                        copy.push(build.handlers[i]);
                    }
                    build.handlers = copy;
                } else {
                    build.handlers = [];
                }
                
                var bhandlers = build.handlers;
                var chandlers = config.handlers;
                
                var len = chandlers.length;
                for (var i = 0; i < len; i++) {
                    bhandlers.push(chandlers[i]);
                }
            } else {
                build[name] = config[name];
            }
        }
        return build;
    };
    
    var buildCaches = function(config) {
        // build up caches
        var nodeNames = '';
        var classNames = '';
        var handlers = config.handlers;
        var len = handlers.length;
        
        for (var x = 0; x < len; x++) {
            var handler = handlers[x];
            var nodeName = handler.nodeName;
            if (nodeName) nodeNames += nodeName + ' ';
            var className = handler.className;
            if (className) classNames += className + ' ';
        }
        
        return {
            nodeNames : nodeNames,
            classNames : classNames,
            classNameSearches : {},
            nodeNameSearches : {}
        };
    };
    
    ns.nodewalker = {
        defaults : _defaults,
        modes : _modes,
        walk : function(node, config) {
            var config = buildConfig(config || {});
            if (config.useCaches) config.caches = buildCaches(config);
            walk(node, config);
        }
    };

})(window);