jQuery.browser = {};
(function () {
    jQuery.browser.msie = false;
    jQuery.browser.version = 0;
    if (navigator.userAgent.match(/MSIE ([0-9]+)./)) {
        jQuery.browser.msie = true;
        jQuery.browser.version = RegExp.$1;
    }
})();

/* --- Cookie --- */
jQuery.cookie = function (key, value, options) {

    // key and at least value given, set cookie...
    if (arguments.length > 1 && String(value) !== "[object Object]") {
        options = jQuery.extend({}, options);

        if (value === null || value === undefined) {
            options.expires = -1;
        }

        if (typeof options.expires === 'number') {
            var days = options.expires, t = options.expires = new Date();
            t.setDate(t.getDate() + days);
        }

        value = String(value);

        return (document.cookie = [
            encodeURIComponent(key), '=',
            options.raw ? value : encodeURIComponent(value),
            options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
            options.path ? '; path=' + options.path : '',
            options.domain ? '; domain=' + options.domain : '',
            options.secure ? '; secure' : ''
        ].join(''));
    }

    // key and possibly options given, get cookie...
    options = value || {};
    var result, decode = options.raw ? function (s) { return s; } : decodeURIComponent;
    return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
};


/*!
 * imagesLoaded PACKAGED v5.0.0
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

/**
 * EvEmitter v2.1.1
 * Lil' event emitter
 * MIT License
 */

( function( global, factory ) {
  // universal module definition
  if ( typeof module == 'object' && module.exports ) {
    // CommonJS - Browserify, Webpack
    module.exports = factory();
  } else {
    // Browser globals
    global.EvEmitter = factory();
  }

}( typeof window != 'undefined' ? window : this, function() {

function EvEmitter() {}

let proto = EvEmitter.prototype;

proto.on = function( eventName, listener ) {
  if ( !eventName || !listener ) return this;

  // set events hash
  let events = this._events = this._events || {};
  // set listeners array
  let listeners = events[ eventName ] = events[ eventName ] || [];
  // only add once
  if ( !listeners.includes( listener ) ) {
    listeners.push( listener );
  }

  return this;
};

proto.once = function( eventName, listener ) {
  if ( !eventName || !listener ) return this;

  // add event
  this.on( eventName, listener );
  // set once flag
  // set onceEvents hash
  let onceEvents = this._onceEvents = this._onceEvents || {};
  // set onceListeners object
  let onceListeners = onceEvents[ eventName ] = onceEvents[ eventName ] || {};
  // set flag
  onceListeners[ listener ] = true;

  return this;
};

proto.off = function( eventName, listener ) {
  let listeners = this._events && this._events[ eventName ];
  if ( !listeners || !listeners.length ) return this;

  let index = listeners.indexOf( listener );
  if ( index != -1 ) {
    listeners.splice( index, 1 );
  }

  return this;
};

proto.emitEvent = function( eventName, args ) {
  let listeners = this._events && this._events[ eventName ];
  if ( !listeners || !listeners.length ) return this;

  // copy over to avoid interference if .off() in listener
  listeners = listeners.slice( 0 );
  args = args || [];
  // once stuff
  let onceListeners = this._onceEvents && this._onceEvents[ eventName ];

  for ( let listener of listeners ) {
    let isOnce = onceListeners && onceListeners[ listener ];
    if ( isOnce ) {
      // remove listener
      // remove before trigger to prevent recursion
      this.off( eventName, listener );
      // unset once flag
      delete onceListeners[ listener ];
    }
    // trigger listener
    listener.apply( this, args );
  }

  return this;
};

proto.allOff = function() {
  delete this._events;
  delete this._onceEvents;
  return this;
};

return EvEmitter;

} ) );
/*!
 * imagesLoaded v5.0.0
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

( function( window, factory ) {
  // universal module definition
  if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory( window, require('ev-emitter') );
  } else {
    // browser global
    window.imagesLoaded = factory( window, window.EvEmitter );
  }

} )( typeof window !== 'undefined' ? window : this,
    function factory( window, EvEmitter ) {

let $ = window.jQuery;
let console = window.console;

// -------------------------- helpers -------------------------- //

// turn element or nodeList into an array
function makeArray( obj ) {
  // use object if already an array
  if ( Array.isArray( obj ) ) return obj;

  let isArrayLike = typeof obj == 'object' && typeof obj.length == 'number';
  // convert nodeList to array
  if ( isArrayLike ) return [ ...obj ];

  // array of single index
  return [ obj ];
}

// -------------------------- imagesLoaded -------------------------- //

/**
 * @param {[Array, Element, NodeList, String]} elem
 * @param {[Object, Function]} options - if function, use as callback
 * @param {Function} onAlways - callback function
 * @returns {ImagesLoaded}
 */
function ImagesLoaded( elem, options, onAlways ) {
  // coerce ImagesLoaded() without new, to be new ImagesLoaded()
  if ( !( this instanceof ImagesLoaded ) ) {
    return new ImagesLoaded( elem, options, onAlways );
  }
  // use elem as selector string
  let queryElem = elem;
  if ( typeof elem == 'string' ) {
    queryElem = document.querySelectorAll( elem );
  }
  // bail if bad element
  if ( !queryElem ) {
    console.error(`Bad element for imagesLoaded ${queryElem || elem}`);
    return;
  }

  this.elements = makeArray( queryElem );
  this.options = {};
  // shift arguments if no options set
  if ( typeof options == 'function' ) {
    onAlways = options;
  } else {
    Object.assign( this.options, options );
  }

  if ( onAlways ) this.on( 'always', onAlways );

  this.getImages();
  // add jQuery Deferred object
  if ( $ ) this.jqDeferred = new $.Deferred();

  // HACK check async to allow time to bind listeners
  setTimeout( this.check.bind( this ) );
}

ImagesLoaded.prototype = Object.create( EvEmitter.prototype );

ImagesLoaded.prototype.getImages = function() {
  this.images = [];

  // filter & find items if we have an item selector
  this.elements.forEach( this.addElementImages, this );
};

const elementNodeTypes = [ 1, 9, 11 ];

/**
 * @param {Node} elem
 */
ImagesLoaded.prototype.addElementImages = function( elem ) {
  // filter siblings
  if ( elem.nodeName === 'IMG' ) {
    this.addImage( elem );
  }
  // get background image on element
  if ( this.options.background === true ) {
    this.addElementBackgroundImages( elem );
  }

  // find children
  // no non-element nodes, #143
  let { nodeType } = elem;
  if ( !nodeType || !elementNodeTypes.includes( nodeType ) ) return;

  let childImgs = elem.querySelectorAll('img');
  // concat childElems to filterFound array
  for ( let img of childImgs ) {
    this.addImage( img );
  }

  // get child background images
  if ( typeof this.options.background == 'string' ) {
    let children = elem.querySelectorAll( this.options.background );
    for ( let child of children ) {
      this.addElementBackgroundImages( child );
    }
  }
};

const reURL = /url\((['"])?(.*?)\1\)/gi;

ImagesLoaded.prototype.addElementBackgroundImages = function( elem ) {
  let style = getComputedStyle( elem );
  // Firefox returns null if in a hidden iframe https://bugzil.la/548397
  if ( !style ) return;

  // get url inside url("...")
  let matches = reURL.exec( style.backgroundImage );
  while ( matches !== null ) {
    let url = matches && matches[2];
    if ( url ) {
      this.addBackground( url, elem );
    }
    matches = reURL.exec( style.backgroundImage );
  }
};

/**
 * @param {Image} img
 */
ImagesLoaded.prototype.addImage = function( img ) {
  let loadingImage = new LoadingImage( img );
  this.images.push( loadingImage );
};

ImagesLoaded.prototype.addBackground = function( url, elem ) {
  let background = new Background( url, elem );
  this.images.push( background );
};

ImagesLoaded.prototype.check = function() {
  this.progressedCount = 0;
  this.hasAnyBroken = false;
  // complete if no images
  if ( !this.images.length ) {
    this.complete();
    return;
  }

  /* eslint-disable-next-line func-style */
  let onProgress = ( image, elem, message ) => {
    // HACK - Chrome triggers event before object properties have changed. #83
    setTimeout( () => {
      this.progress( image, elem, message );
    } );
  };

  this.images.forEach( function( loadingImage ) {
    loadingImage.once( 'progress', onProgress );
    loadingImage.check();
  } );
};

ImagesLoaded.prototype.progress = function( image, elem, message ) {
  this.progressedCount++;
  this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
  // progress event
  this.emitEvent( 'progress', [ this, image, elem ] );
  if ( this.jqDeferred && this.jqDeferred.notify ) {
    this.jqDeferred.notify( this, image );
  }
  // check if completed
  if ( this.progressedCount === this.images.length ) {
    this.complete();
  }

  if ( this.options.debug && console ) {
    console.log( `progress: ${message}`, image, elem );
  }
};

ImagesLoaded.prototype.complete = function() {
  let eventName = this.hasAnyBroken ? 'fail' : 'done';
  this.isComplete = true;
  this.emitEvent( eventName, [ this ] );
  this.emitEvent( 'always', [ this ] );
  if ( this.jqDeferred ) {
    let jqMethod = this.hasAnyBroken ? 'reject' : 'resolve';
    this.jqDeferred[ jqMethod ]( this );
  }
};

// --------------------------  -------------------------- //

function LoadingImage( img ) {
  this.img = img;
}

LoadingImage.prototype = Object.create( EvEmitter.prototype );

LoadingImage.prototype.check = function() {
  // If complete is true and browser supports natural sizes,
  // try to check for image status manually.
  let isComplete = this.getIsImageComplete();
  if ( isComplete ) {
    // report based on naturalWidth
    this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
    return;
  }

  // If none of the checks above matched, simulate loading on detached element.
  this.proxyImage = new Image();
  // add crossOrigin attribute. #204
  if ( this.img.crossOrigin ) {
    this.proxyImage.crossOrigin = this.img.crossOrigin;
  }
  this.proxyImage.addEventListener( 'load', this );
  this.proxyImage.addEventListener( 'error', this );
  // bind to image as well for Firefox. #191
  this.img.addEventListener( 'load', this );
  this.img.addEventListener( 'error', this );
  this.proxyImage.src = this.img.currentSrc || this.img.src;
};

LoadingImage.prototype.getIsImageComplete = function() {
  // check for non-zero, non-undefined naturalWidth
  // fixes Safari+InfiniteScroll+Masonry bug infinite-scroll#671
  return this.img.complete && this.img.naturalWidth;
};

LoadingImage.prototype.confirm = function( isLoaded, message ) {
  this.isLoaded = isLoaded;
  let { parentNode } = this.img;
  // emit progress with parent <picture> or self <img>
  let elem = parentNode.nodeName === 'PICTURE' ? parentNode : this.img;
  this.emitEvent( 'progress', [ this, elem, message ] );
};

// ----- events ----- //

// trigger specified handler for event type
LoadingImage.prototype.handleEvent = function( event ) {
  let method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

LoadingImage.prototype.onload = function() {
  this.confirm( true, 'onload' );
  this.unbindEvents();
};

LoadingImage.prototype.onerror = function() {
  this.confirm( false, 'onerror' );
  this.unbindEvents();
};

LoadingImage.prototype.unbindEvents = function() {
  this.proxyImage.removeEventListener( 'load', this );
  this.proxyImage.removeEventListener( 'error', this );
  this.img.removeEventListener( 'load', this );
  this.img.removeEventListener( 'error', this );
};

// -------------------------- Background -------------------------- //

function Background( url, element ) {
  this.url = url;
  this.element = element;
  this.img = new Image();
}

// inherit LoadingImage prototype
Background.prototype = Object.create( LoadingImage.prototype );

Background.prototype.check = function() {
  this.img.addEventListener( 'load', this );
  this.img.addEventListener( 'error', this );
  this.img.src = this.url;
  // check if image is already complete
  let isComplete = this.getIsImageComplete();
  if ( isComplete ) {
    this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
    this.unbindEvents();
  }
};

Background.prototype.unbindEvents = function() {
  this.img.removeEventListener( 'load', this );
  this.img.removeEventListener( 'error', this );
};

Background.prototype.confirm = function( isLoaded, message ) {
  this.isLoaded = isLoaded;
  this.emitEvent( 'progress', [ this, this.element, message ] );
};

// -------------------------- jQuery -------------------------- //

ImagesLoaded.makeJQueryPlugin = function( jQuery ) {
  jQuery = jQuery || window.jQuery;
  if ( !jQuery ) return;

  // set local variable
  $ = jQuery;
  // $().imagesLoaded()
  $.fn.imagesLoaded = function( options, onAlways ) {
    let instance = new ImagesLoaded( this, options, onAlways );
    return instance.jqDeferred.promise( $( this ) );
  };
};
// try making plugin
ImagesLoaded.makeJQueryPlugin();

// --------------------------  -------------------------- //

return ImagesLoaded;

} );


/*
 * Superfish v1.4.8 - jQuery menu widget
 * Copyright (c) 2008 Joel Birch
 *
 * Dual licensed under the MIT and GPL licenses:
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 *
 * CHANGELOG: http://users.tpg.com.au/j_birch/plugins/superfish/changelog.txt
 */
(function($){$.fn.superfish=function(op){var sf=$.fn.superfish,c=sf.c,$arrow=$(['<span class="',c.arrowClass,'"> &#187;</span>'].join("")),over=function(){var $$=$(this),menu=getMenu($$);clearTimeout(menu.sfTimer);$$.showSuperfishUl().siblings().hideSuperfishUl()},out=function(){var $$=$(this),menu=getMenu($$),o=sf.op;clearTimeout(menu.sfTimer);menu.sfTimer=setTimeout(function(){o.retainPath=$.inArray($$[0],o.$path)>-1;$$.hideSuperfishUl();if(o.$path.length&&$$.parents(["li.",o.hoverClass].join("")).length<
1)over.call(o.$path)},o.delay)},getMenu=function($menu){var menu=$menu.parents(["ul.",c.menuClass,":first"].join(""))[0];sf.op=sf.o[menu.serial];return menu},addArrow=function($a){$a.addClass(c.anchorClass).append($arrow.clone())};return this.each(function(){var s=this.serial=sf.o.length;var o=$.extend({},sf.defaults,op);o.$path=$("li."+o.pathClass,this).slice(0,o.pathLevels).each(function(){$(this).addClass([o.hoverClass,c.bcClass].join(" ")).filter("li:has(ul)").removeClass(o.pathClass)});sf.o[s]=
sf.op=o;$("li:has(ul)",this)[$.fn.hoverIntent&&!o.disableHI?"hoverIntent":"hover"](over,out).each(function(){if(o.autoArrows)addArrow($(">a:first-child",this))}).not("."+c.bcClass).hideSuperfishUl();var $a=$("a",this);$a.each(function(i){var $li=$a.eq(i).parents("li");$a.eq(i).focus(function(){over.call($li)}).blur(function(){out.call($li)})});o.onInit.call(this)}).each(function(){var menuClasses=[c.menuClass];if(sf.op.dropShadows&&!($.browser.msie&&$.browser.version<7))menuClasses.push(c.shadowClass);
$(this).addClass(menuClasses.join(" "))})};var sf=$.fn.superfish;sf.o=[];sf.op={};sf.IE7fix=function(){var o=sf.op;if($.browser.msie&&$.browser.version>6&&o.dropShadows&&o.animation.opacity!=undefined)this.toggleClass(sf.c.shadowClass+"-off")};sf.c={bcClass:"sf-breadcrumb",menuClass:"sf-js-enabled",anchorClass:"sf-with-ul",arrowClass:"sf-sub-indicator",shadowClass:"sf-shadow"};sf.defaults={hoverClass:"sfHover",pathClass:"overideThisToUse",pathLevels:1,delay:800,animation:{opacity:"show"},speed:"normal",
autoArrows:true,dropShadows:true,disableHI:false,onInit:function(){},onBeforeShow:function(){},onShow:function(){},onHide:function(){}};$.fn.extend({hideSuperfishUl:function(){var o=sf.op,not=o.retainPath===true?o.$path:"";o.retainPath=false;var $ul=$(["li.",o.hoverClass].join(""),this).add(this).not(not).removeClass(o.hoverClass).find(">ul").hide().css("visibility","hidden");o.onHide.call($ul);return this},showSuperfishUl:function(){var o=sf.op,sh=sf.c.shadowClass+"-off",$ul=this.addClass(o.hoverClass).find(">ul:hidden").css("visibility",
"visible");sf.IE7fix.call($ul);o.onBeforeShow.call($ul);$ul.animate(o.animation,o.speed,function(){sf.IE7fix.call($ul);o.onShow.call($ul)});return this}})})(jQuery);


/*!
* FitVids 1.0
*
* Copyright 2011, Chris Coyier - http://css-tricks.com + Dave Rupert - http://daverupert.com
* Credit to Thierry Koblentz - http://www.alistapart.com/articles/creating-intrinsic-ratios-for-video/
* Released under the WTFPL license - http://sam.zoy.org/wtfpl/
*
* Date: Thu Sept 01 18:00:00 2011 -0500
*/
(function($){$.fn.fitVids=function(options){var settings={customSelector:null};var div=document.createElement("div"),ref=document.getElementsByTagName("base")[0]||document.getElementsByTagName("script")[0];div.className="fit-vids-style";div.innerHTML="&shy;<style>               .fluid-width-video-wrapper {                 width: 100%;                              position: relative;                       padding: 0;                            }                                                                                   .fluid-width-video-wrapper iframe,        .fluid-width-video-wrapper object,        .fluid-width-video-wrapper embed {           position: absolute;                       top: 0;                                   left: 0;                                  width: 100%;                              height: 100%;                          }                                       </style>";
ref.parentNode.insertBefore(div,ref);if(options)$.extend(settings,options);return this.each(function(){var selectors=["iframe[src*='player.vimeo.com']","iframe[src*='www.youtube.com']","iframe[src*='www.kickstarter.com']","object","embed"];if(settings.customSelector)selectors.push(settings.customSelector);var $allVideos=$(this).find(selectors.join(","));$allVideos.each(function(){var $this=$(this);if(this.tagName.toLowerCase()==="embed"&&$this.parent("object").length||$this.parent(".fluid-width-video-wrapper").length)return;
var height=this.tagName.toLowerCase()==="object"||$this.attr("height")?parseInt($this.attr("height"),10):$this.height(),width=$this.attr("width")?parseInt($this.attr("width"),10):$this.width(),aspectRatio=height/width;if(!$this.attr("id")){var videoID="fitvid"+Math.floor(Math.random()*999999);$this.attr("id",videoID)}$this.wrap('<div class="fluid-width-video-wrapper"></div>').parent(".fluid-width-video-wrapper").css("padding-top",aspectRatio*100+"%");$this.removeAttr("height").removeAttr("width")})})}})(jQuery);


/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 * 
 * Open source under the BSD License. 
 * 
 * Copyright å© 2008 George McGinley Smith
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
*/

jQuery.easing.jswing=jQuery.easing.swing;jQuery.extend(jQuery.easing,{def:"easeOutQuad",swing:function(e,f,a,h,g){return jQuery.easing[jQuery.easing.def](e,f,a,h,g)},easeInQuad:function(e,f,a,h,g){return h*(f/=g)*f+a},easeOutQuad:function(e,f,a,h,g){return -h*(f/=g)*(f-2)+a},easeInOutQuad:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f+a}return -h/2*((--f)*(f-2)-1)+a},easeInCubic:function(e,f,a,h,g){return h*(f/=g)*f*f+a},easeOutCubic:function(e,f,a,h,g){return h*((f=f/g-1)*f*f+1)+a},easeInOutCubic:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f*f+a}return h/2*((f-=2)*f*f+2)+a},easeInQuart:function(e,f,a,h,g){return h*(f/=g)*f*f*f+a},easeOutQuart:function(e,f,a,h,g){return -h*((f=f/g-1)*f*f*f-1)+a},easeInOutQuart:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f*f*f+a}return -h/2*((f-=2)*f*f*f-2)+a},easeInQuint:function(e,f,a,h,g){return h*(f/=g)*f*f*f*f+a},easeOutQuint:function(e,f,a,h,g){return h*((f=f/g-1)*f*f*f*f+1)+a},easeInOutQuint:function(e,f,a,h,g){if((f/=g/2)<1){return h/2*f*f*f*f*f+a}return h/2*((f-=2)*f*f*f*f+2)+a},easeInSine:function(e,f,a,h,g){return -h*Math.cos(f/g*(Math.PI/2))+h+a},easeOutSine:function(e,f,a,h,g){return h*Math.sin(f/g*(Math.PI/2))+a},easeInOutSine:function(e,f,a,h,g){return -h/2*(Math.cos(Math.PI*f/g)-1)+a},easeInExpo:function(e,f,a,h,g){return(f==0)?a:h*Math.pow(2,10*(f/g-1))+a},easeOutExpo:function(e,f,a,h,g){return(f==g)?a+h:h*(-Math.pow(2,-10*f/g)+1)+a},easeInOutExpo:function(e,f,a,h,g){if(f==0){return a}if(f==g){return a+h}if((f/=g/2)<1){return h/2*Math.pow(2,10*(f-1))+a}return h/2*(-Math.pow(2,-10*--f)+2)+a},easeInCirc:function(e,f,a,h,g){return -h*(Math.sqrt(1-(f/=g)*f)-1)+a},easeOutCirc:function(e,f,a,h,g){return h*Math.sqrt(1-(f=f/g-1)*f)+a},easeInOutCirc:function(e,f,a,h,g){if((f/=g/2)<1){return -h/2*(Math.sqrt(1-f*f)-1)+a}return h/2*(Math.sqrt(1-(f-=2)*f)+1)+a},easeInElastic:function(f,h,e,l,k){var i=1.70158;var j=0;var g=l;if(h==0){return e}if((h/=k)==1){return e+l}if(!j){j=k*0.3}if(g<Math.abs(l)){g=l;var i=j/4}else{var i=j/(2*Math.PI)*Math.asin(l/g)}return -(g*Math.pow(2,10*(h-=1))*Math.sin((h*k-i)*(2*Math.PI)/j))+e},easeOutElastic:function(f,h,e,l,k){var i=1.70158;var j=0;var g=l;if(h==0){return e}if((h/=k)==1){return e+l}if(!j){j=k*0.3}if(g<Math.abs(l)){g=l;var i=j/4}else{var i=j/(2*Math.PI)*Math.asin(l/g)}return g*Math.pow(2,-10*h)*Math.sin((h*k-i)*(2*Math.PI)/j)+l+e},easeInOutElastic:function(f,h,e,l,k){var i=1.70158;var j=0;var g=l;if(h==0){return e}if((h/=k/2)==2){return e+l}if(!j){j=k*(0.3*1.5)}if(g<Math.abs(l)){g=l;var i=j/4}else{var i=j/(2*Math.PI)*Math.asin(l/g)}if(h<1){return -0.5*(g*Math.pow(2,10*(h-=1))*Math.sin((h*k-i)*(2*Math.PI)/j))+e}return g*Math.pow(2,-10*(h-=1))*Math.sin((h*k-i)*(2*Math.PI)/j)*0.5+l+e},easeInBack:function(e,f,a,i,h,g){if(g==undefined){g=1.70158}return i*(f/=h)*f*((g+1)*f-g)+a},easeOutBack:function(e,f,a,i,h,g){if(g==undefined){g=1.70158}return i*((f=f/h-1)*f*((g+1)*f+g)+1)+a},easeInOutBack:function(e,f,a,i,h,g){if(g==undefined){g=1.70158}if((f/=h/2)<1){return i/2*(f*f*(((g*=(1.525))+1)*f-g))+a}return i/2*((f-=2)*f*(((g*=(1.525))+1)*f+g)+2)+a},easeInBounce:function(e,f,a,h,g){return h-jQuery.easing.easeOutBounce(e,g-f,0,h,g)+a},easeOutBounce:function(e,f,a,h,g){if((f/=g)<(1/2.75)){return h*(7.5625*f*f)+a}else{if(f<(2/2.75)){return h*(7.5625*(f-=(1.5/2.75))*f+0.75)+a}else{if(f<(2.5/2.75)){return h*(7.5625*(f-=(2.25/2.75))*f+0.9375)+a}else{return h*(7.5625*(f-=(2.625/2.75))*f+0.984375)+a}}}},easeInOutBounce:function(e,f,a,h,g){if(f<g/2){return jQuery.easing.easeInBounce(e,f*2,0,h,g)*0.5+a}return jQuery.easing.easeOutBounce(e,f*2-g,0,h,g)*0.5+h*0.5+a}});

/*
 *
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * 
 * Copyright å© 2001 Robert Penner
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
 */


 /*

  Supersized - Fullscreen Slideshow jQuery Plugin
  Version : 3.2.7
  Site  : www.buildinternet.com/project/supersized
  
  Author  : Sam Dunn
  Company : One Mighty Roar (www.onemightyroar.com)
  License : MIT License / GPL License
  
 */

 (function($){

  /* Place Supersized Elements
  ----------------------------*/
  $(document).ready(function() {
    $('body').append('<ul id="supersized"></ul>');
  });
     
     
     $.supersized = function(options){
      
      /* Variables
    ----------------------------*/
      var el = '#supersized',
          base = this;
         // Access to jQuery and DOM versions of element
         base.$el = $(el);
         base.el = el;
         vars = $.supersized.vars;
         // Add a reverse reference to the DOM object
         base.$el.data("supersized", base);
         api = base.$el.data('supersized');
    
    base.init = function(){
          // Combine options and vars
          $.supersized.vars = $.extend($.supersized.vars, $.supersized.themeVars);
          $.supersized.vars.options = $.extend({},$.supersized.defaultOptions, $.supersized.themeOptions, options);
             base.options = $.supersized.vars.options;
             
             base._build();
         };
         
         
         /* Build Elements
    ----------------------------*/
         base._build = function(){
          // Add in slide markers
          var thisSlide = 0,
            slideSet = '',
        markers = '',
        markerContent,
        thumbMarkers = '',
        thumbImage;

        // Check if Slides is exists
        if( typeof base.options.slides !== 'undefined' ) {
          // Append loader
          $('<div id="supersized-loader"></div>').insertBefore( base.$el );
        }
        
      while(thisSlide <= base.options.slides.length-1){
        //Determine slide link content
        switch(base.options.slide_links){
          case 'num':
            markerContent = thisSlide;
            break;
          case 'name':
            markerContent = base.options.slides[thisSlide].title;
            break;
          case 'blank':
            markerContent = '';
            break;
        }
        
        slideSet = slideSet+'<li class="slide-'+thisSlide+'"></li>';
        
        if(thisSlide == base.options.start_slide-1){
          // Slide links
          if (base.options.slide_links)markers = markers+'<li class="slide-link-'+thisSlide+' current-slide"><a>'+markerContent+'</a></li>';
          // Slide Thumbnail Links
          if (base.options.thumb_links){
            base.options.slides[thisSlide].thumb ? thumbImage = base.options.slides[thisSlide].thumb : thumbImage = base.options.slides[thisSlide].image;
            thumbMarkers = thumbMarkers+'<li class="thumb'+thisSlide+' current-thumb"><img src="'+thumbImage+'"/></li>';
          };
        }else{
          // Slide links
          if (base.options.slide_links) markers = markers+'<li class="slide-link-'+thisSlide+'" ><a>'+markerContent+'</a></li>';
          // Slide Thumbnail Links
          if (base.options.thumb_links){
            base.options.slides[thisSlide].thumb ? thumbImage = base.options.slides[thisSlide].thumb : thumbImage = base.options.slides[thisSlide].image;
            thumbMarkers = thumbMarkers+'<li class="thumb'+thisSlide+'"><img src="'+thumbImage+'"/></li>';
          };
        }
        thisSlide++;
      }
      
      if (base.options.slide_links) $(vars.slide_list).html(markers);
      if (base.options.thumb_links && vars.thumb_tray.length){
        $(vars.thumb_tray).append('<ul id="'+vars.thumb_list.replace('#','')+'">'+thumbMarkers+'</ul>');
      }
      
      $(base.el).append(slideSet);
      
      // Add in thumbnails
      if (base.options.thumbnail_navigation){
        // Load previous thumbnail
        vars.current_slide - 1 < 0  ? prevThumb = base.options.slides.length - 1 : prevThumb = vars.current_slide - 1;
        $(vars.prev_thumb).show().html($("<img/>").attr("src", base.options.slides[prevThumb].image));
        
        // Load next thumbnail
        vars.current_slide == base.options.slides.length - 1 ? nextThumb = 0 : nextThumb = vars.current_slide + 1;
        $(vars.next_thumb).show().html($("<img/>").attr("src", base.options.slides[nextThumb].image));
      }
      
             base._start(); // Get things started
         };
         
         
         /* Initialize
    ----------------------------*/
      base._start = function(){
      
      // Determine if starting slide random
      if (base.options.start_slide){
        vars.current_slide = base.options.start_slide - 1;
      }else{
        vars.current_slide = Math.floor(Math.random()*base.options.slides.length);  // Generate random slide number
      }
      
      // If links should open in new window
      var linkTarget = base.options.new_window ? ' target="_blank"' : '';
      
      // Set slideshow quality (Supported only in FF and IE, no Webkit)
      if (base.options.performance == 3){
        base.$el.addClass('speed');     // Faster transitions
      } else if ((base.options.performance == 1) || (base.options.performance == 2)){
        base.$el.addClass('quality'); // Higher image quality
      }
            
      // Shuffle slide order if needed    
      if (base.options.random){
        arr = base.options.slides;
        for(var j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x); // Fisher-Yates shuffle algorithm (jsfromhell.com/array/shuffle)
          base.options.slides = arr;
      }
      
      /*-----Load initial set of images-----*/
  
      if (base.options.slides.length > 1){
        if(base.options.slides.length > 2){
          // Set previous image
          // vars.current_slide - 1 < 0  ? loadPrev = base.options.slides.length - 1 : loadPrev = vars.current_slide - 1;  // If slide is 1, load last slide as previous
          loadPrev = ( vars.current_slide - 1 < 0 ) ? base.options.slides.length - 1 : vars.current_slide - 1;
          var imageLink = (base.options.slides[loadPrev].url) ? "href='" + base.options.slides[loadPrev].url + "'" : "";
        
          var imgPrev = $('<img src="'+base.options.slides[loadPrev].image+'"/>');
          var slidePrev = base.el+' li:eq('+loadPrev+')';
          imgPrev.appendTo(slidePrev).wrap('<a ' + imageLink + linkTarget + '></a>').parent().parent().addClass('image-loading prevslide');
        
          imgPrev.load(function(){
            $(this).data('origWidth', $(this).width()).data('origHeight', $(this).height());
            base.resizeNow(); // Resize background image
          }); // End Load
        }
      } else {
        // Slideshow turned off if there is only one slide
        base.options.slideshow = 0;
      }
      
      // Set current image
      imageLink = (api.getField('url')) ? "href='" + api.getField('url') + "'" : "";
      var img = $('<img src="'+api.getField('image')+'"/>');
      
      var slideCurrent= base.el+' li:eq('+vars.current_slide+')';
      img.appendTo(slideCurrent).wrap('<a ' + imageLink + linkTarget + '></a>').parent().parent().addClass('image-loading activeslide');
      
      img.load(function(){
        base._origDim($(this));
        base.resizeNow(); // Resize background image
        base.launch();
        if( typeof theme != 'undefined' && typeof theme._init == "function" ) theme._init();  // Load Theme
      });
      
      if (base.options.slides.length > 1){
        // Set next image
        vars.current_slide == base.options.slides.length - 1 ? loadNext = 0 : loadNext = vars.current_slide + 1;  // If slide is last, load first slide as next
        imageLink = (base.options.slides[loadNext].url) ? "href='" + base.options.slides[loadNext].url + "'" : "";
        
        var imgNext = $('<img src="'+base.options.slides[loadNext].image+'"/>');
        var slideNext = base.el+' li:eq('+loadNext+')';
        imgNext.appendTo(slideNext).wrap('<a ' + imageLink + linkTarget + '></a>').parent().parent().addClass('image-loading');
        
        imgNext.load(function(){
          $(this).data('origWidth', $(this).width()).data('origHeight', $(this).height());
          base.resizeNow(); // Resize background image
        }); // End Load
      }
      /*-----End load initial images-----*/
      
      //  Hide elements to be faded in
      base.$el.css('visibility','hidden');
      $('.load-item').hide();
      
      };
    
    
    /* Launch Supersized
    ----------------------------*/
    base.launch = function(){
    
      base.$el.css('visibility','visible');
      $('#supersized-loader').remove();   //Hide loading animation
      
      // Call theme function for before slide transition
      if( typeof theme != 'undefined' && typeof theme.beforeAnimation == "function" ) theme.beforeAnimation('next');
      $('.load-item').show();
      
      // Keyboard Navigation
      if (base.options.keyboard_nav){
        $(document.documentElement).keyup(function (event) {
        
          if(vars.in_animation) return false;   // Abort if currently animating
          
          // Left Arrow or Down Arrow
          if ((event.keyCode == 37) || (event.keyCode == 40)) {
            clearInterval(vars.slideshow_interval); // Stop slideshow, prevent buildup
            base.prevSlide();
          
          // Right Arrow or Up Arrow
          } else if ((event.keyCode == 39) || (event.keyCode == 38)) {
            clearInterval(vars.slideshow_interval); // Stop slideshow, prevent buildup
            base.nextSlide();
          
          // Spacebar 
          } else if (event.keyCode == 32 && !vars.hover_pause) {
            clearInterval(vars.slideshow_interval); // Stop slideshow, prevent buildup
            base.playToggle();
          }
        
        });
      }
      
      // Pause when hover on image
      if (base.options.slideshow && base.options.pause_hover){
        $(base.el).hover(function() {
          if(vars.in_animation) return false;   // Abort if currently animating
              vars.hover_pause = true;  // Mark slideshow paused from hover
              if(!vars.is_paused){
                vars.hover_pause = 'resume';  // It needs to resume afterwards
                base.playToggle();
              }
          }, function() {
          if(vars.hover_pause == 'resume'){
            base.playToggle();
            vars.hover_pause = false;
          }
          });
      }
      
      if (base.options.slide_links){
        // Slide marker clicked
        $(vars.slide_list+'> li').click(function(){
        
          index = $(vars.slide_list+'> li').index(this);
          targetSlide = index + 1;
          
          base.goTo(targetSlide);
          return false;
          
        });
      }
      
      // Thumb marker clicked
      if (base.options.thumb_links){
        $(vars.thumb_list+'> li').click(function(){
        
          index = $(vars.thumb_list+'> li').index(this);
          targetSlide = index + 1;
          
          api.goTo(targetSlide);
          return false;
          
        });
      }
      
      // Start slideshow if enabled
      if (base.options.slideshow && base.options.slides.length > 1){
          
          // Start slideshow if autoplay enabled
          if (base.options.autoplay && base.options.slides.length > 1){
            vars.slideshow_interval = setInterval(base.nextSlide, base.options.slide_interval); // Initiate slide interval
        }else{
          vars.is_paused = true;  // Mark as paused
        }
        
        //Prevent navigation items from being dragged         
        $('.load-item img').on("contextmenu mousedown",function(){
          return false;
        });
                
      }
      
      // Adjust image when browser is resized
      $(window).resize(function(){
          base.resizeNow();
      });
        
      };
         
         
         /* Resize Images
    ----------------------------*/
    base.resizeNow = function(){
      
      return base.$el.each(function() {
          //  Resize each image seperately
          $('img', base.el).each(function(){
            
          thisSlide = $(this);
          var ratio = (thisSlide.data('origHeight')/thisSlide.data('origWidth')).toFixed(2);  // Define image ratio
          
          // Gather browser size
          var browserwidth = base.$el.width(),
            browserheight = base.$el.height(),
            offset;
          
          /*-----Resize Image-----*/
          if (base.options.fit_always){ // Fit always is enabled
            if ((browserheight/browserwidth) > ratio){
              resizeWidth();
            } else {
              resizeHeight();
            }
          }else{  // Normal Resize
            if ((browserheight <= base.options.min_height) && (browserwidth <= base.options.min_width)){  // If window smaller than minimum width and height
            
              if ((browserheight/browserwidth) > ratio){
                base.options.fit_landscape && ratio < 1 ? resizeWidth(true) : resizeHeight(true); // If landscapes are set to fit
              } else {
                base.options.fit_portrait && ratio >= 1 ? resizeHeight(true) : resizeWidth(true);   // If portraits are set to fit
              }
            
            } else if (browserwidth <= base.options.min_width){   // If window only smaller than minimum width
            
              if ((browserheight/browserwidth) > ratio){
                base.options.fit_landscape && ratio < 1 ? resizeWidth(true) : resizeHeight(); // If landscapes are set to fit
              } else {
                base.options.fit_portrait && ratio >= 1 ? resizeHeight() : resizeWidth(true);   // If portraits are set to fit
              }
              
            } else if (browserheight <= base.options.min_height){ // If window only smaller than minimum height
            
              if ((browserheight/browserwidth) > ratio){
                base.options.fit_landscape && ratio < 1 ? resizeWidth() : resizeHeight(true); // If landscapes are set to fit
              } else {
                base.options.fit_portrait && ratio >= 1 ? resizeHeight(true) : resizeWidth();   // If portraits are set to fit
              }
            
            } else {  // If larger than minimums
              
              if ((browserheight/browserwidth) > ratio){
                base.options.fit_landscape && ratio < 1 ? resizeWidth() : resizeHeight(); // If landscapes are set to fit
              } else {
                base.options.fit_portrait && ratio >= 1 ? resizeHeight() : resizeWidth();   // If portraits are set to fit
              }
              
            }
          }
          /*-----End Image Resize-----*/
          
          
          /*-----Resize Functions-----*/
          
          function resizeWidth(minimum){
            if (minimum){ // If minimum height needs to be considered
              if(thisSlide.width() < browserwidth || thisSlide.width() < base.options.min_width ){
                if (thisSlide.width() * ratio >= base.options.min_height){
                  thisSlide.width(base.options.min_width);
                    thisSlide.height(thisSlide.width() * ratio);
                  }else{
                    resizeHeight();
                  }
                }
            }else{
              if (base.options.min_height >= browserheight && !base.options.fit_landscape){ // If minimum height needs to be considered
                if (browserwidth * ratio >= base.options.min_height || (browserwidth * ratio >= base.options.min_height && ratio <= 1)){  // If resizing would push below minimum height or image is a landscape
                  thisSlide.width(browserwidth);
                  thisSlide.height(browserwidth * ratio);
                } else if (ratio > 1){    // Else the image is portrait
                  thisSlide.height(base.options.min_height);
                  thisSlide.width(thisSlide.height() / ratio);
                } else if (thisSlide.width() < browserwidth) {
                  thisSlide.width(browserwidth);
                    thisSlide.height(thisSlide.width() * ratio);
                }
              }else{  // Otherwise, resize as normal
                thisSlide.width(browserwidth);
                thisSlide.height(browserwidth * ratio);
              }
            }
          };
          
          function resizeHeight(minimum){
            if (minimum){ // If minimum height needs to be considered
              if(thisSlide.height() < browserheight){
                if (thisSlide.height() / ratio >= base.options.min_width){
                  thisSlide.height(base.options.min_height);
                  thisSlide.width(thisSlide.height() / ratio);
                }else{
                  resizeWidth(true);
                }
              }
            }else{  // Otherwise, resized as normal
              if (base.options.min_width >= browserwidth){  // If minimum width needs to be considered
                if (browserheight / ratio >= base.options.min_width || ratio > 1){  // If resizing would push below minimum width or image is a portrait
                  thisSlide.height(browserheight);
                  thisSlide.width(browserheight / ratio);
                } else if (ratio <= 1){   // Else the image is landscape
                  thisSlide.width(base.options.min_width);
                    thisSlide.height(thisSlide.width() * ratio);
                }
              }else{  // Otherwise, resize as normal
                thisSlide.height(browserheight);
                thisSlide.width(browserheight / ratio);
              }
            }
          };
          
          /*-----End Resize Functions-----*/
          
          if (thisSlide.parents('li').hasClass('image-loading')){
            $('.image-loading').removeClass('image-loading');
          }
          
          // Horizontally Center
          if (base.options.horizontal_center){
            $(this).css('left', (browserwidth - $(this).width())/2);
          }
          
          // Vertically Center
          if (base.options.vertical_center){
            $(this).css('top', (browserheight - $(this).height())/2);
          }
          
        });
        
        // Basic image drag and right click protection
        if (base.options.image_protect){
          
          $('img', base.el).on("contextmenu mousedown",function(){
            return false;
          });
        
        }
        
        return false;
        
      });
      
    };
         
         
         /* Next Slide
    ----------------------------*/
    base.nextSlide = function(){
      
      if(vars.in_animation || !api.options.slideshow) return false;   // Abort if currently animating
        else vars.in_animation = true;    // Otherwise set animation marker
        
        clearInterval(vars.slideshow_interval); // Stop slideshow
        
        var slides = base.options.slides,         // Pull in slides array
        liveslide = base.$el.find('.activeslide');    // Find active slide
        $('.prevslide').removeClass('prevslide');
        liveslide.removeClass('activeslide').addClass('prevslide'); // Remove active class & update previous slide
          
      // Get the slide number of new slide
      vars.current_slide + 1 == base.options.slides.length ? vars.current_slide = 0 : vars.current_slide++;
      
        var nextslide = $(base.el+' li:eq('+vars.current_slide+')'),
          prevslide = base.$el.find('.prevslide');
      
      // If hybrid mode is on drop quality for transition
      if (base.options.performance == 1) base.$el.removeClass('quality').addClass('speed'); 
      
      
      /*-----Load Image-----*/
      
      loadSlide = false;

      vars.current_slide == base.options.slides.length - 1 ? loadSlide = 0 : loadSlide = vars.current_slide + 1;  // Determine next slide

      var targetList = base.el+' li:eq('+loadSlide+')';
      if (!$(targetList).html()){
        
        // If links should open in new window
        var linkTarget = base.options.new_window ? ' target="_blank"' : '';
        
        imageLink = (base.options.slides[loadSlide].url) ? "href='" + base.options.slides[loadSlide].url + "'" : "";  // If link exists, build it
        var img = $('<img src="'+base.options.slides[loadSlide].image+'"/>'); 
        
        img.appendTo(targetList).wrap('<a ' + imageLink + linkTarget + '></a>').parent().parent().addClass('image-loading').css('visibility','hidden');
        
        img.load(function(){
          base._origDim($(this));
          base.resizeNow();
        }); // End Load
      };
            
      // Update thumbnails (if enabled)
      if (base.options.thumbnail_navigation == 1){
      
        // Load previous thumbnail
        vars.current_slide - 1 < 0  ? prevThumb = base.options.slides.length - 1 : prevThumb = vars.current_slide - 1;
        $(vars.prev_thumb).html($("<img/>").attr("src", base.options.slides[prevThumb].image));
      
        // Load next thumbnail
        nextThumb = loadSlide;
        $(vars.next_thumb).html($("<img/>").attr("src", base.options.slides[nextThumb].image));
        
      }
      
      
      
      /*-----End Load Image-----*/
      
      
      // Call theme function for before slide transition
      if( typeof theme != 'undefined' && typeof theme.beforeAnimation == "function" ) theme.beforeAnimation('next');
      
      //Update slide markers
      if (base.options.slide_links){
        $('.current-slide').removeClass('current-slide');
        $(vars.slide_list +'> li' ).eq(vars.current_slide).addClass('current-slide');
      }
        
        nextslide.css('visibility','hidden').addClass('activeslide'); // Update active slide
        
        switch(base.options.transition){
          case 0: case 'none':  // No transition
              nextslide.css('visibility','visible'); vars.in_animation = false; base.afterAnimation();
              break;
          case 1: case 'fade':  // Fade
              nextslide.css({opacity : 0, 'visibility': 'visible'}).animate({opacity : 1, avoidTransforms : false}, base.options.transition_speed, function(){ base.afterAnimation(); });
              break;
          case 2: case 'slideTop':  // Slide Top
              nextslide.css({top : -base.$el.height(), 'visibility': 'visible'}).animate({ top:0, avoidTransforms : false }, base.options.transition_speed, function(){ base.afterAnimation(); });
              break;
          case 3: case 'slideRight':  // Slide Right
            nextslide.css({left : base.$el.width(), 'visibility': 'visible'}).animate({ left:0, avoidTransforms : false }, base.options.transition_speed, function(){ base.afterAnimation(); });
            break;
          case 4: case 'slideBottom': // Slide Bottom
            nextslide.css({top : base.$el.height(), 'visibility': 'visible'}).animate({ top:0, avoidTransforms : false }, base.options.transition_speed, function(){ base.afterAnimation(); });
            break;
          case 5: case 'slideLeft':  // Slide Left
            nextslide.css({left : -base.$el.width(), 'visibility': 'visible'}).animate({ left:0, avoidTransforms : false }, base.options.transition_speed, function(){ base.afterAnimation(); });
            break;
          case 6: case 'carouselRight': // Carousel Right
            nextslide.css({left : base.$el.width(), 'visibility': 'visible'}).animate({ left:0, avoidTransforms : false }, base.options.transition_speed, function(){ base.afterAnimation(); });
          liveslide.animate({ left: -base.$el.width(), avoidTransforms : false }, base.options.transition_speed );
            break;
          case 7: case 'carouselLeft':   // Carousel Left
            nextslide.css({left : -base.$el.width(), 'visibility': 'visible'}).animate({ left:0, avoidTransforms : false }, base.options.transition_speed, function(){ base.afterAnimation(); });
          liveslide.animate({ left: base.$el.width(), avoidTransforms : false }, base.options.transition_speed );
            break;
        }
        return false; 
    };
    
    
    /* Previous Slide
    ----------------------------*/
    base.prevSlide = function(){
    
      if(vars.in_animation || !api.options.slideshow) return false;   // Abort if currently animating
        else vars.in_animation = true;    // Otherwise set animation marker
      
      clearInterval(vars.slideshow_interval); // Stop slideshow
      
      var slides = base.options.slides,         // Pull in slides array
        liveslide = base.$el.find('.activeslide');    // Find active slide
        $('.prevslide').removeClass('prevslide');
        liveslide.removeClass('activeslide').addClass('prevslide');   // Remove active class & update previous slide
      
      // Get current slide number
      vars.current_slide == 0 ?  vars.current_slide = base.options.slides.length - 1 : vars.current_slide-- ;
        
        var nextslide =  $(base.el+' li:eq('+vars.current_slide+')'),
          prevslide =  base.$el.find('.prevslide');
      
      // If hybrid mode is on drop quality for transition
      if (base.options.performance == 1) base.$el.removeClass('quality').addClass('speed'); 
      
      
      /*-----Load Image-----*/
      
      loadSlide = vars.current_slide;
      
      var targetList = base.el+' li:eq('+loadSlide+')';
      if (!$(targetList).html()){
        // If links should open in new window
        var linkTarget = base.options.new_window ? ' target="_blank"' : '';
        imageLink = (base.options.slides[loadSlide].url) ? "href='" + base.options.slides[loadSlide].url + "'" : "";  // If link exists, build it
        var img = $('<img src="'+base.options.slides[loadSlide].image+'"/>'); 
        
        img.appendTo(targetList).wrap('<a ' + imageLink + linkTarget + '></a>').parent().parent().addClass('image-loading').css('visibility','hidden');
        
        img.load(function(){
          base._origDim($(this));
          base.resizeNow();
        }); // End Load
      };
      
      // Update thumbnails (if enabled)
      if (base.options.thumbnail_navigation == 1){
      
        // Load previous thumbnail
        //prevThumb = loadSlide;
        loadSlide == 0 ? prevThumb = base.options.slides.length - 1 : prevThumb = loadSlide - 1;
        $(vars.prev_thumb).html($("<img/>").attr("src", base.options.slides[prevThumb].image));
        
        // Load next thumbnail
        vars.current_slide == base.options.slides.length - 1 ? nextThumb = 0 : nextThumb = vars.current_slide + 1;
        $(vars.next_thumb).html($("<img/>").attr("src", base.options.slides[nextThumb].image));
      }
      
      /*-----End Load Image-----*/
      
      
      // Call theme function for before slide transition
      if( typeof theme != 'undefined' && typeof theme.beforeAnimation == "function" ) theme.beforeAnimation('prev');
      
      //Update slide markers
      if (base.options.slide_links){
        $('.current-slide').removeClass('current-slide');
        $(vars.slide_list +'> li' ).eq(vars.current_slide).addClass('current-slide');
      }
      
        nextslide.css('visibility','hidden').addClass('activeslide'); // Update active slide
        
        switch(base.options.transition){
          case 0: case 'none':  // No transition
              nextslide.css('visibility','visible'); vars.in_animation = false; base.afterAnimation();
              break;
          case 1: case 'fade':  // Fade
              nextslide.css({opacity : 0, 'visibility': 'visible'}).animate({opacity : 1, avoidTransforms : false}, base.options.transition_speed, function(){ base.afterAnimation(); });
              break;
          case 2: case 'slideTop':  // Slide Top (reverse)
              nextslide.css({top : base.$el.height(), 'visibility': 'visible'}).animate({ top:0, avoidTransforms : false }, base.options.transition_speed, function(){ base.afterAnimation(); });
              break;
          case 3: case 'slideRight':  // Slide Right (reverse)
            nextslide.css({left : -base.$el.width(), 'visibility': 'visible'}).animate({ left:0, avoidTransforms : false }, base.options.transition_speed, function(){ base.afterAnimation(); });
            break;
          case 4: case 'slideBottom': // Slide Bottom (reverse)
            nextslide.css({top : -base.$el.height(), 'visibility': 'visible'}).animate({ top:0, avoidTransforms : false }, base.options.transition_speed, function(){ base.afterAnimation(); });
            break;
          case 5: case 'slideLeft':  // Slide Left (reverse)
            nextslide.css({left : base.$el.width(), 'visibility': 'visible'}).animate({ left:0, avoidTransforms : false }, base.options.transition_speed, function(){ base.afterAnimation(); });
            break;
          case 6: case 'carouselRight': // Carousel Right (reverse)
            nextslide.css({left : -base.$el.width(), 'visibility': 'visible'}).animate({ left:0, avoidTransforms : false }, base.options.transition_speed, function(){ base.afterAnimation(); });
          liveslide.css({left : 0}).animate({ left: base.$el.width(), avoidTransforms : false}, base.options.transition_speed );
            break;
          case 7: case 'carouselLeft':   // Carousel Left (reverse)
            nextslide.css({left : base.$el.width(), 'visibility': 'visible'}).animate({ left:0, avoidTransforms : false }, base.options.transition_speed, function(){ base.afterAnimation(); });
          liveslide.css({left : 0}).animate({ left: -base.$el.width(), avoidTransforms : false }, base.options.transition_speed );
            break;
        }
        return false; 
    };
    
    
    /* Play/Pause Toggle
    ----------------------------*/
    base.playToggle = function(){
    
      if (vars.in_animation || !api.options.slideshow) return false;    // Abort if currently animating
      
      if (vars.is_paused){
        
        vars.is_paused = false;
        
        // Call theme function for play
        if( typeof theme != 'undefined' && typeof theme.playToggle == "function" ) theme.playToggle('play');
        
        // Resume slideshow
            vars.slideshow_interval = setInterval(base.nextSlide, base.options.slide_interval);
              
          }else{
            
            vars.is_paused = true;
            
            // Call theme function for pause
            if( typeof theme != 'undefined' && typeof theme.playToggle == "function" ) theme.playToggle('pause');
            
            // Stop slideshow
            clearInterval(vars.slideshow_interval); 
            
            }
        
        return false;
        
      };
      
      
      /* Go to specific slide
    ----------------------------*/
      base.goTo = function(targetSlide){
      if (vars.in_animation || !api.options.slideshow) return false;    // Abort if currently animating
      
      var totalSlides = base.options.slides.length;
      
      // If target outside range
      if(targetSlide < 0){
        targetSlide = totalSlides;
      }else if(targetSlide > totalSlides){
        targetSlide = 1;
      }
      targetSlide = totalSlides - targetSlide + 1;
      
      clearInterval(vars.slideshow_interval); // Stop slideshow, prevent buildup
      
      // Call theme function for goTo trigger
      if (typeof theme != 'undefined' && typeof theme.goTo == "function" ) theme.goTo();
      
      if (vars.current_slide == totalSlides - targetSlide){
        if(!(vars.is_paused)){
          vars.slideshow_interval = setInterval(base.nextSlide, base.options.slide_interval);
        } 
        return false;
      }
      
      // If ahead of current position
      if(totalSlides - targetSlide > vars.current_slide ){
        
        // Adjust for new next slide
        vars.current_slide = totalSlides-targetSlide-1;
        vars.update_images = 'next';
        base._placeSlide(vars.update_images);
        
      //Otherwise it's before current position
      }else if(totalSlides - targetSlide < vars.current_slide){
        
        // Adjust for new prev slide
        vars.current_slide = totalSlides-targetSlide+1;
        vars.update_images = 'prev';
          base._placeSlide(vars.update_images);
          
      }
      
      // set active markers
      if (base.options.slide_links){
        $(vars.slide_list +'> .current-slide').removeClass('current-slide');
        $(vars.slide_list +'> li').eq((totalSlides-targetSlide)).addClass('current-slide');
      }
      
      if (base.options.thumb_links){
        $(vars.thumb_list +'> .current-thumb').removeClass('current-thumb');
        $(vars.thumb_list +'> li').eq((totalSlides-targetSlide)).addClass('current-thumb');
      }
      
    };
         
         
         /* Place Slide
    ----------------------------*/
         base._placeSlide = function(place){
          
      // If links should open in new window
      var linkTarget = base.options.new_window ? ' target="_blank"' : '';
      
      loadSlide = false;
      
      if (place == 'next'){
        
        vars.current_slide == base.options.slides.length - 1 ? loadSlide = 0 : loadSlide = vars.current_slide + 1;  // Determine next slide
        
        var targetList = base.el+' li:eq('+loadSlide+')';
        
        if (!$(targetList).html()){
          // If links should open in new window
          var linkTarget = base.options.new_window ? ' target="_blank"' : '';
          
          imageLink = (base.options.slides[loadSlide].url) ? "href='" + base.options.slides[loadSlide].url + "'" : "";  // If link exists, build it
          var img = $('<img src="'+base.options.slides[loadSlide].image+'"/>'); 
          
          img.appendTo(targetList).wrap('<a ' + imageLink + linkTarget + '></a>').parent().parent().addClass('image-loading').css('visibility','hidden');
          
          img.load(function(){
            base._origDim($(this));
            base.resizeNow();
          }); // End Load
        };
        
        base.nextSlide();
        
      }else if (place == 'prev'){
      
        vars.current_slide - 1 < 0  ? loadSlide = base.options.slides.length - 1 : loadSlide = vars.current_slide - 1;  // Determine next slide
        
        var targetList = base.el+' li:eq('+loadSlide+')';
        
        if (!$(targetList).html()){
          // If links should open in new window
          var linkTarget = base.options.new_window ? ' target="_blank"' : '';
          
          imageLink = (base.options.slides[loadSlide].url) ? "href='" + base.options.slides[loadSlide].url + "'" : "";  // If link exists, build it
          var img = $('<img src="'+base.options.slides[loadSlide].image+'"/>'); 
          
          img.appendTo(targetList).wrap('<a ' + imageLink + linkTarget + '></a>').parent().parent().addClass('image-loading').css('visibility','hidden');
          
          img.load(function(){
            base._origDim($(this));
            base.resizeNow();
          }); // End Load
        };
        base.prevSlide();
      }
      
    };
    
    
    /* Get Original Dimensions
    ----------------------------*/
    base._origDim = function(targetSlide){
      targetSlide.data('origWidth', targetSlide.width()).data('origHeight', targetSlide.height());
    };
    
    
    /* After Slide Animation
    ----------------------------*/
    base.afterAnimation = function(){
      
      // If hybrid mode is on swap back to higher image quality
      if (base.options.performance == 1){
          base.$el.removeClass('speed').addClass('quality');
      }
      
      // Update previous slide
      if (vars.update_images){
        vars.current_slide - 1 < 0  ? setPrev = base.options.slides.length - 1 : setPrev = vars.current_slide-1;
        vars.update_images = false;
        $('.prevslide').removeClass('prevslide');
        $(base.el+' li:eq('+setPrev+')').addClass('prevslide');
      }
      
      vars.in_animation = false;
      
      // Resume slideshow
      if (!vars.is_paused && base.options.slideshow){
        vars.slideshow_interval = setInterval(base.nextSlide, base.options.slide_interval);
        if (base.options.stop_loop && vars.current_slide == base.options.slides.length - 1 ) base.playToggle();
      }
      
      // Call theme function for after slide transition
      if (typeof theme != 'undefined' && typeof theme.afterAnimation == "function" ) theme.afterAnimation();
      
      return false;
    
    };
    
    base.getField = function(field){
      return base.options.slides[vars.current_slide][field];
    };
    
         // Make it go!
         base.init();
  };
  
  
  /* Global Variables
  ----------------------------*/
  $.supersized.vars = {
  
    // Elements             
    thumb_tray      : '#thumb-tray',  // Thumbnail tray
    thumb_list      : '#thumb-list',  // Thumbnail list
    slide_list          :   '#slide-list',  // Slide link list
    
    // Internal variables
    current_slide     : 0,      // Current slide number
    in_animation      : false,    // Prevents animations from stacking
    is_paused         :   false,    // Tracks paused on/off
    hover_pause       : false,    // If slideshow is paused from hover
    slideshow_interval    : false,    // Stores slideshow timer         
    update_images       :   false,    // Trigger to update images after slide jump
    options         : {}      // Stores assembled options list
    
  };
  
  
  /* Default Options
  ----------------------------*/
  $.supersized.defaultOptions = {
     
      // Functionality
    slideshow               :   1,      // Slideshow on/off
    autoplay        : 1,      // Slideshow starts playing automatically
    start_slide             :   1,      // Start slide (0 is random)
    stop_loop       : 0,      // Stops slideshow on last slide
    random          :   0,      // Randomize slide order (Ignores start slide)
    slide_interval          :   5000,   // Length between transitions
    transition              :   1,      // 0-None, 1-Fade, 2-Slide Top, 3-Slide Right, 4-Slide Bottom, 5-Slide Left, 6-Carousel Right, 7-Carousel Left
    transition_speed    : 750,    // Speed of transition
    new_window        : 1,      // Image links open in new window/tab
    pause_hover             :   0,      // Pause slideshow on hover
    keyboard_nav            :   1,      // Keyboard navigation on/off
    performance       : 1,      // 0-Normal, 1-Hybrid speed/quality, 2-Optimizes image quality, 3-Optimizes transition speed //  (Only works for Firefox/IE, not Webkit)
    image_protect     : 1,      // Disables image dragging and right click with Javascript
                           
    // Size & Position
    fit_always        : 0,      // Image will never exceed browser width or height (Ignores min. dimensions)
    fit_landscape     :   0,      // Landscape images will not exceed browser width
    fit_portrait          :   1,      // Portrait images will not exceed browser height          
    min_width           :   0,      // Min width allowed (in pixels)
    min_height            :   0,      // Min height allowed (in pixels)
    horizontal_center       :   1,      // Horizontally center background
    vertical_center         :   1,      // Vertically center background
    
                           
    // Components             
    slide_links       : 1,      // Individual links for each slide (Options: false, 'num', 'name', 'blank')
    thumb_links       : 1,      // Individual thumb links for each slide
    thumbnail_navigation    :   0     // Thumbnail navigation
      
     };
     
     $.fn.supersized = function(options){
         return this.each(function(){
             (new $.supersized(options));
         });
     };
    
 })(jQuery);

/*!
 * Masonry PACKAGED v4.2.2
 * Cascading grid layout library
 * https://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */

/**
 * Bridget makes jQuery widgets
 * v2.0.1
 * MIT license
 */

/* jshint browser: true, strict: true, undef: true, unused: true */

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /* globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'jquery-bridget/jquery-bridget',[ 'jquery' ], function( jQuery ) {
      return factory( window, jQuery );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('jquery')
    );
  } else {
    // browser global
    window.jQueryBridget = factory(
      window,
      window.jQuery
    );
  }

}( window, function factory( window, jQuery ) {
'use strict';

// ----- utils ----- //

var arraySlice = Array.prototype.slice;

// helper function for logging errors
// $.error breaks jQuery chaining
var console = window.console;
var logError = typeof console == 'undefined' ? function() {} :
  function( message ) {
    console.error( message );
  };

// ----- jQueryBridget ----- //

function jQueryBridget( namespace, PluginClass, $ ) {
  $ = $ || jQuery || window.jQuery;
  if ( !$ ) {
    return;
  }

  // add option method -> $().plugin('option', {...})
  if ( !PluginClass.prototype.option ) {
    // option setter
    PluginClass.prototype.option = function( opts ) {
      // bail out if not an object
      if ( !$.isPlainObject( opts ) ){
        return;
      }
      this.options = $.extend( true, this.options, opts );
    };
  }

  // make jQuery plugin
  $.fn[ namespace ] = function( arg0 /*, arg1 */ ) {
    if ( typeof arg0 == 'string' ) {
      // method call $().plugin( 'methodName', { options } )
      // shift arguments by 1
      var args = arraySlice.call( arguments, 1 );
      return methodCall( this, arg0, args );
    }
    // just $().plugin({ options })
    plainCall( this, arg0 );
    return this;
  };

  // $().plugin('methodName')
  function methodCall( $elems, methodName, args ) {
    var returnValue;
    var pluginMethodStr = '$().' + namespace + '("' + methodName + '")';

    $elems.each( function( i, elem ) {
      // get instance
      var instance = $.data( elem, namespace );
      if ( !instance ) {
        logError( namespace + ' not initialized. Cannot call methods, i.e. ' +
          pluginMethodStr );
        return;
      }

      var method = instance[ methodName ];
      if ( !method || methodName.charAt(0) == '_' ) {
        logError( pluginMethodStr + ' is not a valid method' );
        return;
      }

      // apply method, get return value
      var value = method.apply( instance, args );
      // set return value if value is returned, use only first value
      returnValue = returnValue === undefined ? value : returnValue;
    });

    return returnValue !== undefined ? returnValue : $elems;
  }

  function plainCall( $elems, options ) {
    $elems.each( function( i, elem ) {
      var instance = $.data( elem, namespace );
      if ( instance ) {
        // set options & init
        instance.option( options );
        instance._init();
      } else {
        // initialize new instance
        instance = new PluginClass( elem, options );
        $.data( elem, namespace, instance );
      }
    });
  }

  updateJQuery( $ );

}

// ----- updateJQuery ----- //

// set $.bridget for v1 backwards compatibility
function updateJQuery( $ ) {
  if ( !$ || ( $ && $.bridget ) ) {
    return;
  }
  $.bridget = jQueryBridget;
}

updateJQuery( jQuery || window.jQuery );

// -----  ----- //

return jQueryBridget;

}));

/*!
 * getSize v2.0.3
 * measure size of elements
 * MIT license
 */

/* jshint browser: true, strict: true, undef: true, unused: true */
/* globals console: false */

( function( window, factory ) {
  /* jshint strict: false */ /* globals define, module */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'get-size/get-size',factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.getSize = factory();
  }

})( window, function factory() {
'use strict';

// -------------------------- helpers -------------------------- //

// get a number from a string, not a percentage
function getStyleSize( value ) {
  var num = parseFloat( value );
  // not a percent like '100%', and a number
  var isValid = value.indexOf('%') == -1 && !isNaN( num );
  return isValid && num;
}

function noop() {}

var logError = typeof console == 'undefined' ? noop :
  function( message ) {
    console.error( message );
  };

// -------------------------- measurements -------------------------- //

var measurements = [
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopWidth',
  'borderBottomWidth'
];

var measurementsLength = measurements.length;

function getZeroSize() {
  var size = {
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    outerWidth: 0,
    outerHeight: 0
  };
  for ( var i=0; i < measurementsLength; i++ ) {
    var measurement = measurements[i];
    size[ measurement ] = 0;
  }
  return size;
}

// -------------------------- getStyle -------------------------- //

/**
 * getStyle, get style of element, check for Firefox bug
 * https://bugzilla.mozilla.org/show_bug.cgi?id=548397
 */
function getStyle( elem ) {
  var style = getComputedStyle( elem );
  if ( !style ) {
    logError( 'Style returned ' + style +
      '. Are you running this code in a hidden iframe on Firefox? ' +
      'See https://bit.ly/getsizebug1' );
  }
  return style;
}

// -------------------------- setup -------------------------- //

var isSetup = false;

var isBoxSizeOuter;

/**
 * setup
 * check isBoxSizerOuter
 * do on first getSize() rather than on page load for Firefox bug
 */
function setup() {
  // setup once
  if ( isSetup ) {
    return;
  }
  isSetup = true;

  // -------------------------- box sizing -------------------------- //

  /**
   * Chrome & Safari measure the outer-width on style.width on border-box elems
   * IE11 & Firefox<29 measures the inner-width
   */
  var div = document.createElement('div');
  div.style.width = '200px';
  div.style.padding = '1px 2px 3px 4px';
  div.style.borderStyle = 'solid';
  div.style.borderWidth = '1px 2px 3px 4px';
  div.style.boxSizing = 'border-box';

  var body = document.body || document.documentElement;
  body.appendChild( div );
  var style = getStyle( div );
  // round value for browser zoom. desandro/masonry#928
  isBoxSizeOuter = Math.round( getStyleSize( style.width ) ) == 200;
  getSize.isBoxSizeOuter = isBoxSizeOuter;

  body.removeChild( div );
}

// -------------------------- getSize -------------------------- //

function getSize( elem ) {
  setup();

  // use querySeletor if elem is string
  if ( typeof elem == 'string' ) {
    elem = document.querySelector( elem );
  }

  // do not proceed on non-objects
  if ( !elem || typeof elem != 'object' || !elem.nodeType ) {
    return;
  }

  var style = getStyle( elem );

  // if hidden, everything is 0
  if ( style.display == 'none' ) {
    return getZeroSize();
  }

  var size = {};
  size.width = elem.offsetWidth;
  size.height = elem.offsetHeight;

  var isBorderBox = size.isBorderBox = style.boxSizing == 'border-box';

  // get all measurements
  for ( var i=0; i < measurementsLength; i++ ) {
    var measurement = measurements[i];
    var value = style[ measurement ];
    var num = parseFloat( value );
    // any 'auto', 'medium' value will be 0
    size[ measurement ] = !isNaN( num ) ? num : 0;
  }

  var paddingWidth = size.paddingLeft + size.paddingRight;
  var paddingHeight = size.paddingTop + size.paddingBottom;
  var marginWidth = size.marginLeft + size.marginRight;
  var marginHeight = size.marginTop + size.marginBottom;
  var borderWidth = size.borderLeftWidth + size.borderRightWidth;
  var borderHeight = size.borderTopWidth + size.borderBottomWidth;

  var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

  // overwrite width and height if we can get it from style
  var styleWidth = getStyleSize( style.width );
  if ( styleWidth !== false ) {
    size.width = styleWidth +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth );
  }

  var styleHeight = getStyleSize( style.height );
  if ( styleHeight !== false ) {
    size.height = styleHeight +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight );
  }

  size.innerWidth = size.width - ( paddingWidth + borderWidth );
  size.innerHeight = size.height - ( paddingHeight + borderHeight );

  size.outerWidth = size.width + marginWidth;
  size.outerHeight = size.height + marginHeight;

  return size;
}

return getSize;

});

/**
 * matchesSelector v2.0.2
 * matchesSelector( element, '.selector' )
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */

( function( window, factory ) {
  /*global define: false, module: false */
  'use strict';
  // universal module definition
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'desandro-matches-selector/matches-selector',factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.matchesSelector = factory();
  }

}( window, function factory() {
  'use strict';

  var matchesMethod = ( function() {
    var ElemProto = window.Element.prototype;
    // check for the standard method name first
    if ( ElemProto.matches ) {
      return 'matches';
    }
    // check un-prefixed
    if ( ElemProto.matchesSelector ) {
      return 'matchesSelector';
    }
    // check vendor prefixes
    var prefixes = [ 'webkit', 'moz', 'ms', 'o' ];

    for ( var i=0; i < prefixes.length; i++ ) {
      var prefix = prefixes[i];
      var method = prefix + 'MatchesSelector';
      if ( ElemProto[ method ] ) {
        return method;
      }
    }
  })();

  return function matchesSelector( elem, selector ) {
    return elem[ matchesMethod ]( selector );
  };

}));

/**
 * Fizzy UI utils v2.0.7
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /*globals define, module, require */

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'fizzy-ui-utils/utils',[
      'desandro-matches-selector/matches-selector'
    ], function( matchesSelector ) {
      return factory( window, matchesSelector );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('desandro-matches-selector')
    );
  } else {
    // browser global
    window.fizzyUIUtils = factory(
      window,
      window.matchesSelector
    );
  }

}( window, function factory( window, matchesSelector ) {



var utils = {};

// ----- extend ----- //

// extends objects
utils.extend = function( a, b ) {
  for ( var prop in b ) {
    try {
      a[ prop ] = b[ prop ];
    }
    catch(err) {
      console.log("Error trying to set property %s of a", prop, a);
    }
  }
  return a;
};

// ----- modulo ----- //

utils.modulo = function( num, div ) {
  return ( ( num % div ) + div ) % div;
};

// ----- makeArray ----- //

var arraySlice = Array.prototype.slice;

// turn element or nodeList into an array
utils.makeArray = function( obj ) {
  if ( Array.isArray( obj ) ) {
    // use object if already an array
    return obj;
  }
  // return empty array if undefined or null. #6
  if ( obj === null || obj === undefined ) {
    return [];
  }

  var isArrayLike = typeof obj == 'object' && typeof obj.length == 'number';
  if ( isArrayLike ) {
    // convert nodeList to array
    return arraySlice.call( obj );
  }

  // array of single index
  return [ obj ];
};

// ----- removeFrom ----- //

utils.removeFrom = function( ary, obj ) {
  var index = ary.indexOf( obj );
  if ( index != -1 ) {
    ary.splice( index, 1 );
  }
};

// ----- getParent ----- //

utils.getParent = function( elem, selector ) {
  while ( elem.parentNode && elem != document.body ) {
    elem = elem.parentNode;
    if ( matchesSelector( elem, selector ) ) {
      return elem;
    }
  }
};

// ----- getQueryElement ----- //

// use element as selector string
utils.getQueryElement = function( elem ) {
  if ( typeof elem == 'string' ) {
    return document.querySelector( elem );
  }
  return elem;
};

// ----- handleEvent ----- //

// enable .ontype to trigger from .addEventListener( elem, 'type' )
utils.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

// ----- filterFindElements ----- //

utils.filterFindElements = function( elems, selector ) {
  // make array of elems
  elems = utils.makeArray( elems );
  var ffElems = [];

  elems.forEach( function( elem ) {
    // check that elem is an actual element
    if ( !( elem instanceof HTMLElement ) ) {
      return;
    }
    // add elem if no selector
    if ( !selector ) {
      ffElems.push( elem );
      return;
    }
    // filter & find items if we have a selector
    // filter
    if ( matchesSelector( elem, selector ) ) {
      ffElems.push( elem );
    }
    // find children
    var childElems = elem.querySelectorAll( selector );
    // concat childElems to filterFound array
    for ( var i=0; i < childElems.length; i++ ) {
      ffElems.push( childElems[i] );
    }
  });

  return ffElems;
};

// ----- debounceMethod ----- //

utils.debounceMethod = function( _class, methodName, threshold ) {
  threshold = threshold || 100;
  // original method
  var method = _class.prototype[ methodName ];
  var timeoutName = methodName + 'Timeout';

  _class.prototype[ methodName ] = function() {
    var timeout = this[ timeoutName ];
    clearTimeout( timeout );

    var args = arguments;
    var _this = this;
    this[ timeoutName ] = setTimeout( function() {
      method.apply( _this, args );
      delete _this[ timeoutName ];
    }, threshold );
  };
};

// ----- docReady ----- //

utils.docReady = function( callback ) {
  var readyState = document.readyState;
  if ( readyState == 'complete' || readyState == 'interactive' ) {
    // do async to allow for other scripts to run. metafizzy/flickity#441
    setTimeout( callback );
  } else {
    document.addEventListener( 'DOMContentLoaded', callback );
  }
};

// ----- htmlInit ----- //

// http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
utils.toDashed = function( str ) {
  return str.replace( /(.)([A-Z])/g, function( match, $1, $2 ) {
    return $1 + '-' + $2;
  }).toLowerCase();
};

var console = window.console;
/**
 * allow user to initialize classes via [data-namespace] or .js-namespace class
 * htmlInit( Widget, 'widgetName' )
 * options are parsed from data-namespace-options
 */
utils.htmlInit = function( WidgetClass, namespace ) {
  utils.docReady( function() {
    var dashedNamespace = utils.toDashed( namespace );
    var dataAttr = 'data-' + dashedNamespace;
    var dataAttrElems = document.querySelectorAll( '[' + dataAttr + ']' );
    var jsDashElems = document.querySelectorAll( '.js-' + dashedNamespace );
    var elems = utils.makeArray( dataAttrElems )
      .concat( utils.makeArray( jsDashElems ) );
    var dataOptionsAttr = dataAttr + '-options';
    var jQuery = window.jQuery;

    elems.forEach( function( elem ) {
      var attr = elem.getAttribute( dataAttr ) ||
        elem.getAttribute( dataOptionsAttr );
      var options;
      try {
        options = attr && JSON.parse( attr );
      } catch ( error ) {
        // log error, do not initialize
        if ( console ) {
          console.error( 'Error parsing ' + dataAttr + ' on ' + elem.className +
          ': ' + error );
        }
        return;
      }
      // initialize
      var instance = new WidgetClass( elem, options );
      // make available via $().data('namespace')
      if ( jQuery ) {
        jQuery.data( elem, namespace, instance );
      }
    });

  });
};

// -----  ----- //

return utils;

}));

/**
 * Outlayer Item
 */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /* globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD - RequireJS
    define( 'outlayer/item',[
        'ev-emitter/ev-emitter',
        'get-size/get-size'
      ],
      factory
    );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS - Browserify, Webpack
    module.exports = factory(
      require('ev-emitter'),
      require('get-size')
    );
  } else {
    // browser global
    window.Outlayer = {};
    window.Outlayer.Item = factory(
      window.EvEmitter,
      window.getSize
    );
  }

}( window, function factory( EvEmitter, getSize ) {
'use strict';

// ----- helpers ----- //

function isEmptyObj( obj ) {
  for ( var prop in obj ) {
    return false;
  }
  prop = null;
  return true;
}

// -------------------------- CSS3 support -------------------------- //


var docElemStyle = document.documentElement.style;

var transitionProperty = typeof docElemStyle.transition == 'string' ?
  'transition' : 'WebkitTransition';
var transformProperty = typeof docElemStyle.transform == 'string' ?
  'transform' : 'WebkitTransform';

var transitionEndEvent = {
  WebkitTransition: 'webkitTransitionEnd',
  transition: 'transitionend'
}[ transitionProperty ];

// cache all vendor properties that could have vendor prefix
var vendorProperties = {
  transform: transformProperty,
  transition: transitionProperty,
  transitionDuration: transitionProperty + 'Duration',
  transitionProperty: transitionProperty + 'Property',
  transitionDelay: transitionProperty + 'Delay'
};

// -------------------------- Item -------------------------- //

function Item( element, layout ) {
  if ( !element ) {
    return;
  }

  this.element = element;
  // parent layout class, i.e. Masonry, Isotope, or Packery
  this.layout = layout;
  this.position = {
    x: 0,
    y: 0
  };

  this._create();
}

// inherit EvEmitter
var proto = Item.prototype = Object.create( EvEmitter.prototype );
proto.constructor = Item;

proto._create = function() {
  // transition objects
  this._transn = {
    ingProperties: {},
    clean: {},
    onEnd: {}
  };

  this.css({
    position: 'absolute'
  });
};

// trigger specified handler for event type
proto.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

proto.getSize = function() {
  this.size = getSize( this.element );
};

/**
 * apply CSS styles to element
 * @param {Object} style
 */
proto.css = function( style ) {
  var elemStyle = this.element.style;

  for ( var prop in style ) {
    // use vendor property if available
    var supportedProp = vendorProperties[ prop ] || prop;
    elemStyle[ supportedProp ] = style[ prop ];
  }
};

 // measure position, and sets it
proto.getPosition = function() {
  var style = getComputedStyle( this.element );
  var isOriginLeft = this.layout._getOption('originLeft');
  var isOriginTop = this.layout._getOption('originTop');
  var xValue = style[ isOriginLeft ? 'left' : 'right' ];
  var yValue = style[ isOriginTop ? 'top' : 'bottom' ];
  var x = parseFloat( xValue );
  var y = parseFloat( yValue );
  // convert percent to pixels
  var layoutSize = this.layout.size;
  if ( xValue.indexOf('%') != -1 ) {
    x = ( x / 100 ) * layoutSize.width;
  }
  if ( yValue.indexOf('%') != -1 ) {
    y = ( y / 100 ) * layoutSize.height;
  }
  // clean up 'auto' or other non-integer values
  x = isNaN( x ) ? 0 : x;
  y = isNaN( y ) ? 0 : y;
  // remove padding from measurement
  x -= isOriginLeft ? layoutSize.paddingLeft : layoutSize.paddingRight;
  y -= isOriginTop ? layoutSize.paddingTop : layoutSize.paddingBottom;

  this.position.x = x;
  this.position.y = y;
};

// set settled position, apply padding
proto.layoutPosition = function() {
  var layoutSize = this.layout.size;
  var style = {};
  var isOriginLeft = this.layout._getOption('originLeft');
  var isOriginTop = this.layout._getOption('originTop');

  // x
  var xPadding = isOriginLeft ? 'paddingLeft' : 'paddingRight';
  var xProperty = isOriginLeft ? 'left' : 'right';
  var xResetProperty = isOriginLeft ? 'right' : 'left';

  var x = this.position.x + layoutSize[ xPadding ];
  // set in percentage or pixels
  style[ xProperty ] = this.getXValue( x );
  // reset other property
  style[ xResetProperty ] = '';

  // y
  var yPadding = isOriginTop ? 'paddingTop' : 'paddingBottom';
  var yProperty = isOriginTop ? 'top' : 'bottom';
  var yResetProperty = isOriginTop ? 'bottom' : 'top';

  var y = this.position.y + layoutSize[ yPadding ];
  // set in percentage or pixels
  style[ yProperty ] = this.getYValue( y );
  // reset other property
  style[ yResetProperty ] = '';

  this.css( style );
  this.emitEvent( 'layout', [ this ] );
};

proto.getXValue = function( x ) {
  var isHorizontal = this.layout._getOption('horizontal');
  return this.layout.options.percentPosition && !isHorizontal ?
    ( ( x / this.layout.size.width ) * 100 ) + '%' : x + 'px';
};

proto.getYValue = function( y ) {
  var isHorizontal = this.layout._getOption('horizontal');
  return this.layout.options.percentPosition && isHorizontal ?
    ( ( y / this.layout.size.height ) * 100 ) + '%' : y + 'px';
};

proto._transitionTo = function( x, y ) {
  this.getPosition();
  // get current x & y from top/left
  var curX = this.position.x;
  var curY = this.position.y;

  var didNotMove = x == this.position.x && y == this.position.y;

  // save end position
  this.setPosition( x, y );

  // if did not move and not transitioning, just go to layout
  if ( didNotMove && !this.isTransitioning ) {
    this.layoutPosition();
    return;
  }

  var transX = x - curX;
  var transY = y - curY;
  var transitionStyle = {};
  transitionStyle.transform = this.getTranslate( transX, transY );

  this.transition({
    to: transitionStyle,
    onTransitionEnd: {
      transform: this.layoutPosition
    },
    isCleaning: true
  });
};

proto.getTranslate = function( x, y ) {
  // flip cooridinates if origin on right or bottom
  var isOriginLeft = this.layout._getOption('originLeft');
  var isOriginTop = this.layout._getOption('originTop');
  x = isOriginLeft ? x : -x;
  y = isOriginTop ? y : -y;
  return 'translate3d(' + x + 'px, ' + y + 'px, 0)';
};

// non transition + transform support
proto.goTo = function( x, y ) {
  this.setPosition( x, y );
  this.layoutPosition();
};

proto.moveTo = proto._transitionTo;

proto.setPosition = function( x, y ) {
  this.position.x = parseFloat( x );
  this.position.y = parseFloat( y );
};

// ----- transition ----- //

/**
 * @param {Object} style - CSS
 * @param {Function} onTransitionEnd
 */

// non transition, just trigger callback
proto._nonTransition = function( args ) {
  this.css( args.to );
  if ( args.isCleaning ) {
    this._removeStyles( args.to );
  }
  for ( var prop in args.onTransitionEnd ) {
    args.onTransitionEnd[ prop ].call( this );
  }
};

/**
 * proper transition
 * @param {Object} args - arguments
 *   @param {Object} to - style to transition to
 *   @param {Object} from - style to start transition from
 *   @param {Boolean} isCleaning - removes transition styles after transition
 *   @param {Function} onTransitionEnd - callback
 */
proto.transition = function( args ) {
  // redirect to nonTransition if no transition duration
  if ( !parseFloat( this.layout.options.transitionDuration ) ) {
    this._nonTransition( args );
    return;
  }

  var _transition = this._transn;
  // keep track of onTransitionEnd callback by css property
  for ( var prop in args.onTransitionEnd ) {
    _transition.onEnd[ prop ] = args.onTransitionEnd[ prop ];
  }
  // keep track of properties that are transitioning
  for ( prop in args.to ) {
    _transition.ingProperties[ prop ] = true;
    // keep track of properties to clean up when transition is done
    if ( args.isCleaning ) {
      _transition.clean[ prop ] = true;
    }
  }

  // set from styles
  if ( args.from ) {
    this.css( args.from );
    // force redraw. http://blog.alexmaccaw.com/css-transitions
    var h = this.element.offsetHeight;
    // hack for JSHint to hush about unused var
    h = null;
  }
  // enable transition
  this.enableTransition( args.to );
  // set styles that are transitioning
  this.css( args.to );

  this.isTransitioning = true;

};

// dash before all cap letters, including first for
// WebkitTransform => -webkit-transform
function toDashedAll( str ) {
  return str.replace( /([A-Z])/g, function( $1 ) {
    return '-' + $1.toLowerCase();
  });
}

var transitionProps = 'opacity,' + toDashedAll( transformProperty );

proto.enableTransition = function(/* style */) {
  // HACK changing transitionProperty during a transition
  // will cause transition to jump
  if ( this.isTransitioning ) {
    return;
  }

  // make `transition: foo, bar, baz` from style object
  // HACK un-comment this when enableTransition can work
  // while a transition is happening
  // var transitionValues = [];
  // for ( var prop in style ) {
  //   // dash-ify camelCased properties like WebkitTransition
  //   prop = vendorProperties[ prop ] || prop;
  //   transitionValues.push( toDashedAll( prop ) );
  // }
  // munge number to millisecond, to match stagger
  var duration = this.layout.options.transitionDuration;
  duration = typeof duration == 'number' ? duration + 'ms' : duration;
  // enable transition styles
  this.css({
    transitionProperty: transitionProps,
    transitionDuration: duration,
    transitionDelay: this.staggerDelay || 0
  });
  // listen for transition end event
  this.element.addEventListener( transitionEndEvent, this, false );
};

// ----- events ----- //

proto.onwebkitTransitionEnd = function( event ) {
  this.ontransitionend( event );
};

proto.onotransitionend = function( event ) {
  this.ontransitionend( event );
};

// properties that I munge to make my life easier
var dashedVendorProperties = {
  '-webkit-transform': 'transform'
};

proto.ontransitionend = function( event ) {
  // disregard bubbled events from children
  if ( event.target !== this.element ) {
    return;
  }
  var _transition = this._transn;
  // get property name of transitioned property, convert to prefix-free
  var propertyName = dashedVendorProperties[ event.propertyName ] || event.propertyName;

  // remove property that has completed transitioning
  delete _transition.ingProperties[ propertyName ];
  // check if any properties are still transitioning
  if ( isEmptyObj( _transition.ingProperties ) ) {
    // all properties have completed transitioning
    this.disableTransition();
  }
  // clean style
  if ( propertyName in _transition.clean ) {
    // clean up style
    this.element.style[ event.propertyName ] = '';
    delete _transition.clean[ propertyName ];
  }
  // trigger onTransitionEnd callback
  if ( propertyName in _transition.onEnd ) {
    var onTransitionEnd = _transition.onEnd[ propertyName ];
    onTransitionEnd.call( this );
    delete _transition.onEnd[ propertyName ];
  }

  this.emitEvent( 'transitionEnd', [ this ] );
};

proto.disableTransition = function() {
  this.removeTransitionStyles();
  this.element.removeEventListener( transitionEndEvent, this, false );
  this.isTransitioning = false;
};

/**
 * removes style property from element
 * @param {Object} style
**/
proto._removeStyles = function( style ) {
  // clean up transition styles
  var cleanStyle = {};
  for ( var prop in style ) {
    cleanStyle[ prop ] = '';
  }
  this.css( cleanStyle );
};

var cleanTransitionStyle = {
  transitionProperty: '',
  transitionDuration: '',
  transitionDelay: ''
};

proto.removeTransitionStyles = function() {
  // remove transition
  this.css( cleanTransitionStyle );
};

// ----- stagger ----- //

proto.stagger = function( delay ) {
  delay = isNaN( delay ) ? 0 : delay;
  this.staggerDelay = delay + 'ms';
};

// ----- show/hide/remove ----- //

// remove element from DOM
proto.removeElem = function() {
  this.element.parentNode.removeChild( this.element );
  // remove display: none
  this.css({ display: '' });
  this.emitEvent( 'remove', [ this ] );
};

proto.remove = function() {
  // just remove element if no transition support or no transition
  if ( !transitionProperty || !parseFloat( this.layout.options.transitionDuration ) ) {
    this.removeElem();
    return;
  }

  // start transition
  this.once( 'transitionEnd', function() {
    this.removeElem();
  });
  this.hide();
};

proto.reveal = function() {
  delete this.isHidden;
  // remove display: none
  this.css({ display: '' });

  var options = this.layout.options;

  var onTransitionEnd = {};
  var transitionEndProperty = this.getHideRevealTransitionEndProperty('visibleStyle');
  onTransitionEnd[ transitionEndProperty ] = this.onRevealTransitionEnd;

  this.transition({
    from: options.hiddenStyle,
    to: options.visibleStyle,
    isCleaning: true,
    onTransitionEnd: onTransitionEnd
  });
};

proto.onRevealTransitionEnd = function() {
  // check if still visible
  // during transition, item may have been hidden
  if ( !this.isHidden ) {
    this.emitEvent('reveal');
  }
};

/**
 * get style property use for hide/reveal transition end
 * @param {String} styleProperty - hiddenStyle/visibleStyle
 * @returns {String}
 */
proto.getHideRevealTransitionEndProperty = function( styleProperty ) {
  var optionStyle = this.layout.options[ styleProperty ];
  // use opacity
  if ( optionStyle.opacity ) {
    return 'opacity';
  }
  // get first property
  for ( var prop in optionStyle ) {
    return prop;
  }
};

proto.hide = function() {
  // set flag
  this.isHidden = true;
  // remove display: none
  this.css({ display: '' });

  var options = this.layout.options;

  var onTransitionEnd = {};
  var transitionEndProperty = this.getHideRevealTransitionEndProperty('hiddenStyle');
  onTransitionEnd[ transitionEndProperty ] = this.onHideTransitionEnd;

  this.transition({
    from: options.visibleStyle,
    to: options.hiddenStyle,
    // keep hidden stuff hidden
    isCleaning: true,
    onTransitionEnd: onTransitionEnd
  });
};

proto.onHideTransitionEnd = function() {
  // check if still hidden
  // during transition, item may have been un-hidden
  if ( this.isHidden ) {
    this.css({ display: 'none' });
    this.emitEvent('hide');
  }
};

proto.destroy = function() {
  this.css({
    position: '',
    left: '',
    right: '',
    top: '',
    bottom: '',
    transition: '',
    transform: ''
  });
};

return Item;

}));

/*!
 * Outlayer v2.1.1
 * the brains and guts of a layout library
 * MIT license
 */

( function( window, factory ) {
  'use strict';
  // universal module definition
  /* jshint strict: false */ /* globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD - RequireJS
    define( 'outlayer/outlayer',[
        'ev-emitter/ev-emitter',
        'get-size/get-size',
        'fizzy-ui-utils/utils',
        './item'
      ],
      function( EvEmitter, getSize, utils, Item ) {
        return factory( window, EvEmitter, getSize, utils, Item);
      }
    );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS - Browserify, Webpack
    module.exports = factory(
      window,
      require('ev-emitter'),
      require('get-size'),
      require('fizzy-ui-utils'),
      require('./item')
    );
  } else {
    // browser global
    window.Outlayer = factory(
      window,
      window.EvEmitter,
      window.getSize,
      window.fizzyUIUtils,
      window.Outlayer.Item
    );
  }

}( window, function factory( window, EvEmitter, getSize, utils, Item ) {
'use strict';

// ----- vars ----- //

var console = window.console;
var jQuery = window.jQuery;
var noop = function() {};

// -------------------------- Outlayer -------------------------- //

// globally unique identifiers
var GUID = 0;
// internal store of all Outlayer intances
var instances = {};


/**
 * @param {Element, String} element
 * @param {Object} options
 * @constructor
 */
function Outlayer( element, options ) {
  var queryElement = utils.getQueryElement( element );
  if ( !queryElement ) {
    if ( console ) {
      console.error( 'Bad element for ' + this.constructor.namespace +
        ': ' + ( queryElement || element ) );
    }
    return;
  }
  this.element = queryElement;
  // add jQuery
  if ( jQuery ) {
    this.$element = jQuery( this.element );
  }

  // options
  this.options = utils.extend( {}, this.constructor.defaults );
  this.option( options );

  // add id for Outlayer.getFromElement
  var id = ++GUID;
  this.element.outlayerGUID = id; // expando
  instances[ id ] = this; // associate via id

  // kick it off
  this._create();

  var isInitLayout = this._getOption('initLayout');
  if ( isInitLayout ) {
    this.layout();
  }
}

// settings are for internal use only
Outlayer.namespace = 'outlayer';
Outlayer.Item = Item;

// default options
Outlayer.defaults = {
  containerStyle: {
    position: 'relative'
  },
  initLayout: true,
  originLeft: true,
  originTop: true,
  resize: true,
  resizeContainer: true,
  // item options
  transitionDuration: '0.4s',
  hiddenStyle: {
    opacity: 0,
    transform: 'scale(0.001)'
  },
  visibleStyle: {
    opacity: 1,
    transform: 'scale(1)'
  }
};

var proto = Outlayer.prototype;
// inherit EvEmitter
utils.extend( proto, EvEmitter.prototype );

/**
 * set options
 * @param {Object} opts
 */
proto.option = function( opts ) {
  utils.extend( this.options, opts );
};

/**
 * get backwards compatible option value, check old name
 */
proto._getOption = function( option ) {
  var oldOption = this.constructor.compatOptions[ option ];
  return oldOption && this.options[ oldOption ] !== undefined ?
    this.options[ oldOption ] : this.options[ option ];
};

Outlayer.compatOptions = {
  // currentName: oldName
  initLayout: 'isInitLayout',
  horizontal: 'isHorizontal',
  layoutInstant: 'isLayoutInstant',
  originLeft: 'isOriginLeft',
  originTop: 'isOriginTop',
  resize: 'isResizeBound',
  resizeContainer: 'isResizingContainer'
};

proto._create = function() {
  // get items from children
  this.reloadItems();
  // elements that affect layout, but are not laid out
  this.stamps = [];
  this.stamp( this.options.stamp );
  // set container style (only if the element has a style)
  if (this.element.style) { 
    utils.extend( this.element.style, this.options.containerStyle );
  }
  

  // bind resize method
  var canBindResize = this._getOption('resize');
  if ( canBindResize ) {
    this.bindResize();
  }
};

// goes through all children again and gets bricks in proper order
proto.reloadItems = function() {
  // collection of item elements
  this.items = this._itemize( this.element.children );
};


/**
 * turn elements into Outlayer.Items to be used in layout
 * @param {Array or NodeList or HTMLElement} elems
 * @returns {Array} items - collection of new Outlayer Items
 */
proto._itemize = function( elems ) {

  var itemElems = this._filterFindItemElements( elems );
  var Item = this.constructor.Item;

  // create new Outlayer Items for collection
  var items = [];
  for ( var i=0; i < itemElems.length; i++ ) {
    var elem = itemElems[i];
    var item = new Item( elem, this );
    items.push( item );
  }

  return items;
};

/**
 * get item elements to be used in layout
 * @param {Array or NodeList or HTMLElement} elems
 * @returns {Array} items - item elements
 */
proto._filterFindItemElements = function( elems ) {
  return utils.filterFindElements( elems, this.options.itemSelector );
};

/**
 * getter method for getting item elements
 * @returns {Array} elems - collection of item elements
 */
proto.getItemElements = function() {
  return this.items.map( function( item ) {
    return item.element;
  });
};

// ----- init & layout ----- //

/**
 * lays out all items
 */
proto.layout = function() {
  this._resetLayout();
  this._manageStamps();

  // don't animate first layout
  var layoutInstant = this._getOption('layoutInstant');
  var isInstant = layoutInstant !== undefined ?
    layoutInstant : !this._isLayoutInited;
  this.layoutItems( this.items, isInstant );

  // flag for initalized
  this._isLayoutInited = true;
};

// _init is alias for layout
proto._init = proto.layout;

/**
 * logic before any new layout
 */
proto._resetLayout = function() {
  this.getSize();
};


proto.getSize = function() {
  this.size = getSize( this.element );
};

/**
 * get measurement from option, for columnWidth, rowHeight, gutter
 * if option is String -> get element from selector string, & get size of element
 * if option is Element -> get size of element
 * else use option as a number
 *
 * @param {String} measurement
 * @param {String} size - width or height
 * @private
 */
proto._getMeasurement = function( measurement, size ) {
  var option = this.options[ measurement ];
  var elem;
  if ( !option ) {
    // default to 0
    this[ measurement ] = 0;
  } else {
    // use option as an element
    if ( typeof option == 'string' ) {
      elem = this.element.querySelector( option );
    } else if ( option instanceof HTMLElement ) {
      elem = option;
    }
    // use size of element, if element
    this[ measurement ] = elem ? getSize( elem )[ size ] : option;
  }
};

/**
 * layout a collection of item elements
 * @api public
 */
proto.layoutItems = function( items, isInstant ) {
  items = this._getItemsForLayout( items );

  this._layoutItems( items, isInstant );

  this._postLayout();
};

/**
 * get the items to be laid out
 * you may want to skip over some items
 * @param {Array} items
 * @returns {Array} items
 */
proto._getItemsForLayout = function( items ) {
  return items.filter( function( item ) {
    return !item.isIgnored;
  });
};

/**
 * layout items
 * @param {Array} items
 * @param {Boolean} isInstant
 */
proto._layoutItems = function( items, isInstant ) {
  this._emitCompleteOnItems( 'layout', items );

  if ( !items || !items.length ) {
    // no items, emit event with empty array
    return;
  }

  var queue = [];

  items.forEach( function( item ) {
    // get x/y object from method
    var position = this._getItemLayoutPosition( item );
    // enqueue
    position.item = item;
    position.isInstant = isInstant || item.isLayoutInstant;
    queue.push( position );
  }, this );

  this._processLayoutQueue( queue );
};

/**
 * get item layout position
 * @param {Outlayer.Item} item
 * @returns {Object} x and y position
 */
proto._getItemLayoutPosition = function( /* item */ ) {
  return {
    x: 0,
    y: 0
  };
};

/**
 * iterate over array and position each item
 * Reason being - separating this logic prevents 'layout invalidation'
 * thx @paul_irish
 * @param {Array} queue
 */
proto._processLayoutQueue = function( queue ) {
  this.updateStagger();
  queue.forEach( function( obj, i ) {
    this._positionItem( obj.item, obj.x, obj.y, obj.isInstant, i );
  }, this );
};

// set stagger from option in milliseconds number
proto.updateStagger = function() {
  var stagger = this.options.stagger;
  if ( stagger === null || stagger === undefined ) {
    this.stagger = 0;
    return;
  }
  this.stagger = getMilliseconds( stagger );
  return this.stagger;
};

/**
 * Sets position of item in DOM
 * @param {Outlayer.Item} item
 * @param {Number} x - horizontal position
 * @param {Number} y - vertical position
 * @param {Boolean} isInstant - disables transitions
 */
proto._positionItem = function( item, x, y, isInstant, i ) {
  if ( isInstant ) {
    // if not transition, just set CSS
    item.goTo( x, y );
  } else {
    item.stagger( i * this.stagger );
    item.moveTo( x, y );
  }
};

/**
 * Any logic you want to do after each layout,
 * i.e. size the container
 */
proto._postLayout = function() {
  this.resizeContainer();
};

proto.resizeContainer = function() {
  var isResizingContainer = this._getOption('resizeContainer');
  if ( !isResizingContainer ) {
    return;
  }
  var size = this._getContainerSize();
  if ( size ) {
    this._setContainerMeasure( size.width, true );
    this._setContainerMeasure( size.height, false );
  }
};

/**
 * Sets width or height of container if returned
 * @returns {Object} size
 *   @param {Number} width
 *   @param {Number} height
 */
proto._getContainerSize = noop;

/**
 * @param {Number} measure - size of width or height
 * @param {Boolean} isWidth
 */
proto._setContainerMeasure = function( measure, isWidth ) {
  if ( measure === undefined ) {
    return;
  }

  var elemSize = this.size;
  // add padding and border width if border box
  if ( elemSize && elemSize.isBorderBox ) {
    measure += isWidth ? elemSize.paddingLeft + elemSize.paddingRight +
      elemSize.borderLeftWidth + elemSize.borderRightWidth :
      elemSize.paddingBottom + elemSize.paddingTop +
      elemSize.borderTopWidth + elemSize.borderBottomWidth;
  }

  measure = Math.max( measure, 0 );
  if (this.element.style) {
    this.element.style[ isWidth ? 'width' : 'height' ] = measure + 'px';
  }
  
};

/**
 * emit eventComplete on a collection of items events
 * @param {String} eventName
 * @param {Array} items - Outlayer.Items
 */
proto._emitCompleteOnItems = function( eventName, items ) {
  var _this = this;
  function onComplete() {
    _this.dispatchEvent( eventName + 'Complete', null, [ items ] );
  }

  var count = items.length;
  if ( !items || !count ) {
    onComplete();
    return;
  }

  var doneCount = 0;
  function tick() {
    doneCount++;
    if ( doneCount == count ) {
      onComplete();
    }
  }

  // bind callback
  items.forEach( function( item ) {
    item.once( eventName, tick );
  });
};

/**
 * emits events via EvEmitter and jQuery events
 * @param {String} type - name of event
 * @param {Event} event - original event
 * @param {Array} args - extra arguments
 */
proto.dispatchEvent = function( type, event, args ) {
  // add original event to arguments
  var emitArgs = event ? [ event ].concat( args ) : args;
  this.emitEvent( type, emitArgs );

  if ( jQuery ) {
    // set this.$element
    this.$element = this.$element || jQuery( this.element );
    if ( event ) {
      // create jQuery event
      var $event = jQuery.Event( event );
      $event.type = type;
      this.$element.trigger( $event, args );
    } else {
      // just trigger with type if no event available
      this.$element.trigger( type, args );
    }
  }
};

// -------------------------- ignore & stamps -------------------------- //


/**
 * keep item in collection, but do not lay it out
 * ignored items do not get skipped in layout
 * @param {Element} elem
 */
proto.ignore = function( elem ) {
  var item = this.getItem( elem );
  if ( item ) {
    item.isIgnored = true;
  }
};

/**
 * return item to layout collection
 * @param {Element} elem
 */
proto.unignore = function( elem ) {
  var item = this.getItem( elem );
  if ( item ) {
    delete item.isIgnored;
  }
};

/**
 * adds elements to stamps
 * @param {NodeList, Array, Element, or String} elems
 */
proto.stamp = function( elems ) {
  elems = this._find( elems );
  if ( !elems ) {
    return;
  }

  this.stamps = this.stamps.concat( elems );
  // ignore
  elems.forEach( this.ignore, this );
};

/**
 * removes elements to stamps
 * @param {NodeList, Array, or Element} elems
 */
proto.unstamp = function( elems ) {
  elems = this._find( elems );
  if ( !elems ){
    return;
  }

  elems.forEach( function( elem ) {
    // filter out removed stamp elements
    utils.removeFrom( this.stamps, elem );
    this.unignore( elem );
  }, this );
};

/**
 * finds child elements
 * @param {NodeList, Array, Element, or String} elems
 * @returns {Array} elems
 */
proto._find = function( elems ) {
  if ( !elems ) {
    return;
  }
  // if string, use argument as selector string
  if ( typeof elems == 'string' ) {
    elems = this.element.querySelectorAll( elems );
  }
  elems = utils.makeArray( elems );
  return elems;
};

proto._manageStamps = function() {
  if ( !this.stamps || !this.stamps.length ) {
    return;
  }

  this._getBoundingRect();

  this.stamps.forEach( this._manageStamp, this );
};

// update boundingLeft / Top
proto._getBoundingRect = function() {
  // get bounding rect for container element
  var boundingRect = this.element.getBoundingClientRect();
  var size = this.size;
  this._boundingRect = {
    left: boundingRect.left + size.paddingLeft + size.borderLeftWidth,
    top: boundingRect.top + size.paddingTop + size.borderTopWidth,
    right: boundingRect.right - ( size.paddingRight + size.borderRightWidth ),
    bottom: boundingRect.bottom - ( size.paddingBottom + size.borderBottomWidth )
  };
};

/**
 * @param {Element} stamp
**/
proto._manageStamp = noop;

/**
 * get x/y position of element relative to container element
 * @param {Element} elem
 * @returns {Object} offset - has left, top, right, bottom
 */
proto._getElementOffset = function( elem ) {
  var boundingRect = elem.getBoundingClientRect();
  var thisRect = this._boundingRect;
  var size = getSize( elem );
  var offset = {
    left: boundingRect.left - thisRect.left - size.marginLeft,
    top: boundingRect.top - thisRect.top - size.marginTop,
    right: thisRect.right - boundingRect.right - size.marginRight,
    bottom: thisRect.bottom - boundingRect.bottom - size.marginBottom
  };
  return offset;
};

// -------------------------- resize -------------------------- //

// enable event handlers for listeners
// i.e. resize -> onresize
proto.handleEvent = utils.handleEvent;

/**
 * Bind layout to window resizing
 */
proto.bindResize = function() {
  window.addEventListener( 'resize', this );
  this.isResizeBound = true;
};

/**
 * Unbind layout to window resizing
 */
proto.unbindResize = function() {
  window.removeEventListener( 'resize', this );
  this.isResizeBound = false;
};

proto.onresize = function() {
  this.resize();
};

utils.debounceMethod( Outlayer, 'onresize', 100 );

proto.resize = function() {
  // don't trigger if size did not change
  // or if resize was unbound. See #9
  if ( !this.isResizeBound || !this.needsResizeLayout() ) {
    return;
  }

  this.layout();
};

/**
 * check if layout is needed post layout
 * @returns Boolean
 */
proto.needsResizeLayout = function() {
  var size = getSize( this.element );
  // check that this.size and size are there
  // IE8 triggers resize on body size change, so they might not be
  var hasSizes = this.size && size;
  return hasSizes && size.innerWidth !== this.size.innerWidth;
};

// -------------------------- methods -------------------------- //

/**
 * add items to Outlayer instance
 * @param {Array or NodeList or Element} elems
 * @returns {Array} items - Outlayer.Items
**/
proto.addItems = function( elems ) {
  var items = this._itemize( elems );
  // add items to collection
  if ( items.length ) {
    this.items = this.items.concat( items );
  }
  return items;
};

/**
 * Layout newly-appended item elements
 * @param {Array or NodeList or Element} elems
 */
proto.appended = function( elems ) {
  var items = this.addItems( elems );
  if ( !items.length ) {
    return;
  }
  // layout and reveal just the new items
  this.layoutItems( items, true );
  this.reveal( items );
};

/**
 * Layout prepended elements
 * @param {Array or NodeList or Element} elems
 */
proto.prepended = function( elems ) {
  var items = this._itemize( elems );
  if ( !items.length ) {
    return;
  }
  // add items to beginning of collection
  var previousItems = this.items.slice(0);
  this.items = items.concat( previousItems );
  // start new layout
  this._resetLayout();
  this._manageStamps();
  // layout new stuff without transition
  this.layoutItems( items, true );
  this.reveal( items );
  // layout previous items
  this.layoutItems( previousItems );
};

/**
 * reveal a collection of items
 * @param {Array of Outlayer.Items} items
 */
proto.reveal = function( items ) {
  this._emitCompleteOnItems( 'reveal', items );
  if ( !items || !items.length ) {
    return;
  }
  var stagger = this.updateStagger();
  items.forEach( function( item, i ) {
    item.stagger( i * stagger );
    item.reveal();
  });
};

/**
 * hide a collection of items
 * @param {Array of Outlayer.Items} items
 */
proto.hide = function( items ) {
  this._emitCompleteOnItems( 'hide', items );
  if ( !items || !items.length ) {
    return;
  }
  var stagger = this.updateStagger();
  items.forEach( function( item, i ) {
    item.stagger( i * stagger );
    item.hide();
  });
};

/**
 * reveal item elements
 * @param {Array}, {Element}, {NodeList} items
 */
proto.revealItemElements = function( elems ) {
  var items = this.getItems( elems );
  this.reveal( items );
};

/**
 * hide item elements
 * @param {Array}, {Element}, {NodeList} items
 */
proto.hideItemElements = function( elems ) {
  var items = this.getItems( elems );
  this.hide( items );
};

/**
 * get Outlayer.Item, given an Element
 * @param {Element} elem
 * @param {Function} callback
 * @returns {Outlayer.Item} item
 */
proto.getItem = function( elem ) {
  // loop through items to get the one that matches
  for ( var i=0; i < this.items.length; i++ ) {
    var item = this.items[i];
    if ( item.element == elem ) {
      // return item
      return item;
    }
  }
};

/**
 * get collection of Outlayer.Items, given Elements
 * @param {Array} elems
 * @returns {Array} items - Outlayer.Items
 */
proto.getItems = function( elems ) {
  elems = utils.makeArray( elems );
  var items = [];
  elems.forEach( function( elem ) {
    var item = this.getItem( elem );
    if ( item ) {
      items.push( item );
    }
  }, this );

  return items;
};

/**
 * remove element(s) from instance and DOM
 * @param {Array or NodeList or Element} elems
 */
proto.remove = function( elems ) {
  var removeItems = this.getItems( elems );

  this._emitCompleteOnItems( 'remove', removeItems );

  // bail if no items to remove
  if ( !removeItems || !removeItems.length ) {
    return;
  }

  removeItems.forEach( function( item ) {
    item.remove();
    // remove item from collection
    utils.removeFrom( this.items, item );
  }, this );
};

// ----- destroy ----- //

// remove and disable Outlayer instance
proto.destroy = function() {
  // clean up dynamic styles
  var style = this.element.style;
  style.height = '';
  style.position = '';
  style.width = '';
  // destroy items
  this.items.forEach( function( item ) {
    item.destroy();
  });

  this.unbindResize();

  var id = this.element.outlayerGUID;
  delete instances[ id ]; // remove reference to instance by id
  delete this.element.outlayerGUID;
  // remove data for jQuery
  if ( jQuery ) {
    jQuery.removeData( this.element, this.constructor.namespace );
  }

};

// -------------------------- data -------------------------- //

/**
 * get Outlayer instance from element
 * @param {Element} elem
 * @returns {Outlayer}
 */
Outlayer.data = function( elem ) {
  elem = utils.getQueryElement( elem );
  var id = elem && elem.outlayerGUID;
  return id && instances[ id ];
};


// -------------------------- create Outlayer class -------------------------- //

/**
 * create a layout class
 * @param {String} namespace
 */
Outlayer.create = function( namespace, options ) {
  // sub-class Outlayer
  var Layout = subclass( Outlayer );
  // apply new options and compatOptions
  Layout.defaults = utils.extend( {}, Outlayer.defaults );
  utils.extend( Layout.defaults, options );
  Layout.compatOptions = utils.extend( {}, Outlayer.compatOptions  );

  Layout.namespace = namespace;

  Layout.data = Outlayer.data;

  // sub-class Item
  Layout.Item = subclass( Item );

  // -------------------------- declarative -------------------------- //

  utils.htmlInit( Layout, namespace );

  // -------------------------- jQuery bridge -------------------------- //

  // make into jQuery plugin
  if ( jQuery && jQuery.bridget ) {
    jQuery.bridget( namespace, Layout );
  }

  return Layout;
};

function subclass( Parent ) {
  function SubClass() {
    Parent.apply( this, arguments );
  }

  SubClass.prototype = Object.create( Parent.prototype );
  SubClass.prototype.constructor = SubClass;

  return SubClass;
}

// ----- helpers ----- //

// how many milliseconds are in each unit
var msUnits = {
  ms: 1,
  s: 1000
};

// munge time-like parameter into millisecond number
// '0.4s' -> 40
function getMilliseconds( time ) {
  if ( typeof time == 'number' ) {
    return time;
  }
  var matches = time.match( /(^\d*\.?\d*)(\w*)/ );
  var num = matches && matches[1];
  var unit = matches && matches[2];
  if ( !num.length ) {
    return 0;
  }
  num = parseFloat( num );
  var mult = msUnits[ unit ] || 1;
  return num * mult;
}

// ----- fin ----- //

// back in global
Outlayer.Item = Item;

return Outlayer;

}));

/*!
 * Masonry v4.2.2
 * Cascading grid layout library
 * https://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /*globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
        'outlayer/outlayer',
        'get-size/get-size'
      ],
      factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      require('outlayer'),
      require('get-size')
    );
  } else {
    // browser global
    window.Masonry = factory(
      window.Outlayer,
      window.getSize
    );
  }

}( window, function factory( Outlayer, getSize ) {



// -------------------------- masonryDefinition -------------------------- //

  // create an Outlayer layout class
  // var Masonry = Outlayer.create('masonry');
  var Masonry = Outlayer.create('masonrylensa');
  // isFitWidth -> fitWidth
  Masonry.compatOptions.fitWidth = 'isFitWidth';

  var proto = Masonry.prototype;

  proto._resetLayout = function() {
    this.getSize();
    this._getMeasurement( 'columnWidth', 'outerWidth' );
    this._getMeasurement( 'gutter', 'outerWidth' );
    this.measureColumns();

    // reset column Y
    this.colYs = [];
    for ( var i=0; i < this.cols; i++ ) {
      this.colYs.push( 0 );
    }

    this.maxY = 0;
    this.horizontalColIndex = 0;
  };

  proto.measureColumns = function() {
    this.getContainerWidth();
    // if columnWidth is 0, default to outerWidth of first item
    if ( !this.columnWidth ) {
      var firstItem = this.items[0];
      var firstItemElem = firstItem && firstItem.element;
      // columnWidth fall back to item of first element
      this.columnWidth = firstItemElem && getSize( firstItemElem ).outerWidth ||
        // if first elem has no width, default to size of container
        this.containerWidth;
    }

    var columnWidth = this.columnWidth += this.gutter;

    // calculate columns
    var containerWidth = this.containerWidth + this.gutter;
    var cols = containerWidth / columnWidth;
    // fix rounding errors, typically with gutters
    var excess = columnWidth - containerWidth % columnWidth;
    // if overshoot is less than a pixel, round up, otherwise floor it
    var mathMethod = excess && excess < 1 ? 'round' : 'floor';
    cols = Math[ mathMethod ]( cols );
    this.cols = Math.max( cols, 1 );
  };

  proto.getContainerWidth = function() {
    // container is parent if fit width
    var isFitWidth = this._getOption('fitWidth');
    var container = isFitWidth ? this.element.parentNode : this.element;
    // check that this.size and size are there
    // IE8 triggers resize on body size change, so they might not be
    var size = getSize( container );
    this.containerWidth = size && size.innerWidth;
  };

  proto._getItemLayoutPosition = function( item ) {
    item.getSize();
    // how many columns does this brick span
    var remainder = item.size.outerWidth % this.columnWidth;
    var mathMethod = remainder && remainder < 1 ? 'round' : 'ceil';
    // round if off by 1 pixel, otherwise use ceil
    var colSpan = Math[ mathMethod ]( item.size.outerWidth / this.columnWidth );
    colSpan = Math.min( colSpan, this.cols );
    // use horizontal or top column position
    var colPosMethod = this.options.horizontalOrder ?
      '_getHorizontalColPosition' : '_getTopColPosition';
    var colPosition = this[ colPosMethod ]( colSpan, item );
    // position the brick
    var position = {
      x: this.columnWidth * colPosition.col,
      y: colPosition.y
    };
    // apply setHeight to necessary columns
    var setHeight = colPosition.y + item.size.outerHeight;
    var setMax = colSpan + colPosition.col;
    for ( var i = colPosition.col; i < setMax; i++ ) {
      this.colYs[i] = setHeight;
    }

    return position;
  };

  proto._getTopColPosition = function( colSpan ) {
    var colGroup = this._getTopColGroup( colSpan );
    // get the minimum Y value from the columns
    var minimumY = Math.min.apply( Math, colGroup );

    return {
      col: colGroup.indexOf( minimumY ),
      y: minimumY,
    };
  };

  /**
   * @param {Number} colSpan - number of columns the element spans
   * @returns {Array} colGroup
   */
  proto._getTopColGroup = function( colSpan ) {
    if ( colSpan < 2 ) {
      // if brick spans only one column, use all the column Ys
      return this.colYs;
    }

    var colGroup = [];
    // how many different places could this brick fit horizontally
    var groupCount = this.cols + 1 - colSpan;
    // for each group potential horizontal position
    for ( var i = 0; i < groupCount; i++ ) {
      colGroup[i] = this._getColGroupY( i, colSpan );
    }
    return colGroup;
  };

  proto._getColGroupY = function( col, colSpan ) {
    if ( colSpan < 2 ) {
      return this.colYs[ col ];
    }
    // make an array of colY values for that one group
    var groupColYs = this.colYs.slice( col, col + colSpan );
    // and get the max value of the array
    return Math.max.apply( Math, groupColYs );
  };

  // get column position based on horizontal index. #873
  proto._getHorizontalColPosition = function( colSpan, item ) {
    var col = this.horizontalColIndex % this.cols;
    var isOver = colSpan > 1 && col + colSpan > this.cols;
    // shift to next row if item can't fit on current row
    col = isOver ? 0 : col;
    // don't let zero-size items take up space
    var hasSize = item.size.outerWidth && item.size.outerHeight;
    this.horizontalColIndex = hasSize ? col + colSpan : this.horizontalColIndex;

    return {
      col: col,
      y: this._getColGroupY( col, colSpan ),
    };
  };

  proto._manageStamp = function( stamp ) {
    var stampSize = getSize( stamp );
    var offset = this._getElementOffset( stamp );
    // get the columns that this stamp affects
    var isOriginLeft = this._getOption('originLeft');
    var firstX = isOriginLeft ? offset.left : offset.right;
    var lastX = firstX + stampSize.outerWidth;
    var firstCol = Math.floor( firstX / this.columnWidth );
    firstCol = Math.max( 0, firstCol );
    var lastCol = Math.floor( lastX / this.columnWidth );
    // lastCol should not go over if multiple of columnWidth #425
    lastCol -= lastX % this.columnWidth ? 0 : 1;
    lastCol = Math.min( this.cols - 1, lastCol );
    // set colYs to bottom of the stamp

    var isOriginTop = this._getOption('originTop');
    var stampMaxY = ( isOriginTop ? offset.top : offset.bottom ) +
      stampSize.outerHeight;
    for ( var i = firstCol; i <= lastCol; i++ ) {
      this.colYs[i] = Math.max( stampMaxY, this.colYs[i] );
    }
  };

  proto._getContainerSize = function() {
    this.maxY = Math.max.apply( Math, this.colYs );
    var size = {
      height: this.maxY
    };

    if ( this._getOption('fitWidth') ) {
      size.width = this._getContainerFitWidth();
    }

    return size;
  };

  proto._getContainerFitWidth = function() {
    var unusedCols = 0;
    // count unused columns
    var i = this.cols;
    while ( --i ) {
      if ( this.colYs[i] !== 0 ) {
        break;
      }
      unusedCols++;
    }
    // fit container to columns that have been used
    return ( this.cols - unusedCols ) * this.columnWidth - this.gutter;
  };

  proto.needsResizeLayout = function() {
    var previousWidth = this.containerWidth;
    this.getContainerWidth();
    return previousWidth != this.containerWidth;
  };

  return Masonry;

}));



/*
 * FancyBox - jQuery Plugin
 * Simple and fancy lightbox alternative
 *
 * Examples and documentation at: http://fancybox.net
 *
 * Copyright (c) 2008 - 2010 Janis Skarnelis
 * That said, it is hardly a one-person project. Many people have submitted bugs, code, and offered their advice freely. Their support is greatly appreciated.
 *
 * Version: 1.3.4 (11/11/2010)
 * Requires: jQuery v1.3+
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

;(function($) {
  var tmp, loading, overlay, wrap, outer, content, close, title, nav_left, nav_right,

    selectedIndex = 0, selectedOpts = {}, selectedArray = [], currentIndex = 0, currentOpts = {}, currentArray = [],

    ajaxLoader = null, imgPreloader = new Image(), imgRegExp = /\.(jpg|gif|png|bmp|jpeg)(.*)?$/i, swfRegExp = /[^\.]\.(swf)\s*$/i,

    loadingTimer, loadingFrame = 1,

    titleHeight = 0, titleStr = '', start_pos, final_pos, busy = false, fx = $.extend($('<div/>')[0], { prop: 0 }),

    isIE6 = $.browser.msie && $.browser.version < 7 && !window.XMLHttpRequest,

    /*
     * Private methods 
     */

    _abort = function() {
      loading.hide();

      imgPreloader.onerror = imgPreloader.onload = null;

      if (ajaxLoader) {
        ajaxLoader.abort();
      }

      tmp.empty();
    },

    _error = function() {
      if (false === selectedOpts.onError(selectedArray, selectedIndex, selectedOpts)) {
        loading.hide();
        busy = false;
        return;
      }

      selectedOpts.titleShow = false;

      selectedOpts.width = 'auto';
      selectedOpts.height = 'auto';

      tmp.html( '<p id="fancybox-error">The requested content cannot be loaded.<br />Please try again later.</p>' );

      _process_inline();
    },

    _start = function() {
      var obj = selectedArray[ selectedIndex ],
        href, 
        type, 
        title,
        str,
        emb,
        ret;

      _abort();

      selectedOpts = $.extend({}, $.fn.fancybox.defaults, (typeof $(obj).data('fancybox') == 'undefined' ? selectedOpts : $(obj).data('fancybox')));

      ret = selectedOpts.onStart(selectedArray, selectedIndex, selectedOpts);

      if (ret === false) {
        busy = false;
        return;
      } else if (typeof ret == 'object') {
        selectedOpts = $.extend(selectedOpts, ret);
      }

      title = selectedOpts.title || (obj.nodeName ? $(obj).attr('title') : obj.title) || '';

      if (obj.nodeName && !selectedOpts.orig) {
        selectedOpts.orig = $(obj).children("img:first").length ? $(obj).children("img:first") : $(obj);
      }

      if (title === '' && selectedOpts.orig && selectedOpts.titleFromAlt) {
        title = selectedOpts.orig.attr('alt');
      }

      href = selectedOpts.href || (obj.nodeName ? $(obj).attr('href') : obj.href) || null;

      if ((/^(?:javascript)/i).test(href) || href == '#') {
        href = null;
      }

      if (selectedOpts.type) {
        type = selectedOpts.type;

        if (!href) {
          href = selectedOpts.content;
        }

      } else if (selectedOpts.content) {
        type = 'html';

      } else if (href) {
        if (href.match(imgRegExp)) {
          type = 'image';

        } else if (href.match(swfRegExp)) {
          type = 'swf';

        } else if ($(obj).hasClass("iframe")) {
          type = 'iframe';

        } else if (href.indexOf("#") === 0) {
          type = 'inline';

        } else {
          type = 'ajax';
        }
      }

      if (!type) {
        _error();
        return;
      }

      if (type == 'inline') {
        obj = href.substr(href.indexOf("#"));
        type = $(obj).length > 0 ? 'inline' : 'ajax';
      }

      selectedOpts.type = type;
      selectedOpts.href = href;
      selectedOpts.title = title;

      if (selectedOpts.autoDimensions) {
        if (selectedOpts.type == 'html' || selectedOpts.type == 'inline' || selectedOpts.type == 'ajax') {
          selectedOpts.width = 'auto';
          selectedOpts.height = 'auto';
        } else {
          selectedOpts.autoDimensions = false;  
        }
      }

      if (selectedOpts.modal) {
        selectedOpts.overlayShow = true;
        selectedOpts.hideOnOverlayClick = false;
        selectedOpts.hideOnContentClick = false;
        selectedOpts.enableEscapeButton = false;
        selectedOpts.showCloseButton = false;
      }

      selectedOpts.padding = parseInt(selectedOpts.padding, 10);
      selectedOpts.margin = parseInt(selectedOpts.margin, 10);

      tmp.css('padding', (selectedOpts.padding + selectedOpts.margin));

      $('.fancybox-inline-tmp').unbind('fancybox-cancel').on('fancybox-change', function() {
        $(this).replaceWith(content.children());        
      });

      switch (type) {
        case 'html' :
          tmp.html( selectedOpts.content );
          _process_inline();
        break;

        case 'inline' :
          if ( $(obj).parent().is('#fancybox-content') === true) {
            busy = false;
            return;
          }

          $('<div class="fancybox-inline-tmp" />')
            .hide()
            .insertBefore( $(obj) )
            .on('fancybox-cleanup', function() {
              $(this).replaceWith(content.children());
            }).on('fancybox-cancel', function() {
              $(this).replaceWith(tmp.children());
            });

          $(obj).appendTo(tmp);

          _process_inline();
        break;

        case 'image':
          busy = false;

          $.fancybox.showActivity();

          imgPreloader = new Image();

          imgPreloader.onerror = function() {
            _error();
          };

          imgPreloader.onload = function() {
            busy = true;

            imgPreloader.onerror = imgPreloader.onload = null;

            _process_image();
          };

          imgPreloader.src = href;
        break;

        case 'swf':
          selectedOpts.scrolling = 'no';

          str = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="' + selectedOpts.width + '" height="' + selectedOpts.height + '"><param name="movie" value="' + href + '"></param>';
          emb = '';

          $.each(selectedOpts.swf, function(name, val) {
            str += '<param name="' + name + '" value="' + val + '"></param>';
            emb += ' ' + name + '="' + val + '"';
          });

          str += '<embed src="' + href + '" type="application/x-shockwave-flash" width="' + selectedOpts.width + '" height="' + selectedOpts.height + '"' + emb + '></embed></object>';

          tmp.html(str);

          _process_inline();
        break;

        case 'ajax':
          busy = false;

          $.fancybox.showActivity();

          selectedOpts.ajax.win = selectedOpts.ajax.success;

          ajaxLoader = $.ajax($.extend({}, selectedOpts.ajax, {
            url : href,
            data : selectedOpts.ajax.data || {},
            error : function(XMLHttpRequest, textStatus, errorThrown) {
              if ( XMLHttpRequest.status > 0 ) {
                _error();
              }
            },
            success : function(data, textStatus, XMLHttpRequest) {
              var o = typeof XMLHttpRequest == 'object' ? XMLHttpRequest : ajaxLoader;
              if (o.status == 200) {
                if ( typeof selectedOpts.ajax.win == 'function' ) {
                  ret = selectedOpts.ajax.win(href, data, textStatus, XMLHttpRequest);

                  if (ret === false) {
                    loading.hide();
                    return;
                  } else if (typeof ret == 'string' || typeof ret == 'object') {
                    data = ret;
                  }
                }

                tmp.html( data );
                _process_inline();
              }
            }
          }));

        break;

        case 'iframe':
          _show();
        break;
      }
    },

    _process_inline = function() {
      var
        w = selectedOpts.width,
        h = selectedOpts.height;

      if (w.toString().indexOf('%') > -1) {
        w = parseInt( ($(window).width() - (selectedOpts.margin * 2)) * parseFloat(w) / 100, 10) + 'px';

      } else {
        w = w == 'auto' ? 'auto' : w + 'px';  
      }

      if (h.toString().indexOf('%') > -1) {
        h = parseInt( ($(window).height() - (selectedOpts.margin * 2)) * parseFloat(h) / 100, 10) + 'px';

      } else {
        h = h == 'auto' ? 'auto' : h + 'px';  
      }

      tmp.wrapInner('<div style="width:' + w + ';height:' + h + ';overflow: ' + (selectedOpts.scrolling == 'auto' ? 'auto' : (selectedOpts.scrolling == 'yes' ? 'scroll' : 'hidden')) + ';position:relative;"></div>');

      selectedOpts.width = tmp.width();
      selectedOpts.height = tmp.height();

      _show();
    },

    _process_image = function() {
      selectedOpts.width = imgPreloader.width;
      selectedOpts.height = imgPreloader.height;

      $("<img />").attr({
        'id' : 'fancybox-img',
        'src' : imgPreloader.src,
        'alt' : selectedOpts.title
      }).appendTo( tmp );

      _show();
    },

    _show = function() {
      var pos, equal;

      loading.hide();

      if (wrap.is(":visible") && false === currentOpts.onCleanup(currentArray, currentIndex, currentOpts)) {
        $.event.trigger('fancybox-cancel');

        busy = false;
        return;
      }

      busy = true;

      $(content.add( overlay )).unbind();

      $(window).unbind("resize.fb scroll.fb");
      $(document).unbind('keydown.fb');

      if (wrap.is(":visible") && currentOpts.titlePosition !== 'outside') {
        wrap.css('height', wrap.height());
      }

      currentArray = selectedArray;
      currentIndex = selectedIndex;
      currentOpts = selectedOpts;

      if (currentOpts.overlayShow) {
        overlay.css({
          'background-color' : currentOpts.overlayColor,
          'opacity' : currentOpts.overlayOpacity,
          'cursor' : currentOpts.hideOnOverlayClick ? 'pointer' : 'auto',
          'height' : $(document).height()
        });

        if (!overlay.is(':visible')) {
          if (isIE6) {
            $('select:not(#fancybox-tmp select)').filter(function() {
              return this.style.visibility !== 'hidden';
            }).css({'visibility' : 'hidden'}).one('fancybox-cleanup', function() {
              this.style.visibility = 'inherit';
            });
          }

          overlay.show();
        }
      } else {
        overlay.hide();
      }

      final_pos = _get_zoom_to();

      _process_title();

      if (wrap.is(":visible")) {
        $( close.add( nav_left ).add( nav_right ) ).hide();

        pos = wrap.position(),

        start_pos = {
          top  : pos.top,
          left : pos.left,
          width : wrap.width(),
          height : wrap.height()
        };

        equal = (start_pos.width == final_pos.width && start_pos.height == final_pos.height);

        content.fadeTo(currentOpts.changeFade, 0.3, function() {
          var finish_resizing = function() {
            content.html( tmp.contents() ).fadeTo(currentOpts.changeFade, 1, _finish);
          };

          $.event.trigger('fancybox-change');

          content
            .empty()
            .removeAttr('filter')
            .css({
              'border-width' : currentOpts.padding,
              'width' : final_pos.width - currentOpts.padding * 2,
              'height' : selectedOpts.autoDimensions ? 'auto' : final_pos.height - titleHeight - currentOpts.padding * 2
            });

          if (equal) {
            finish_resizing();

          } else {
            fx.prop = 0;

            $(fx).animate({prop: 1}, {
               duration : currentOpts.changeSpeed,
               easing : currentOpts.easingChange,
               step : _draw,
               complete : finish_resizing
            });
          }
        });

        return;
      }

      wrap.removeAttr("style");

      content.css('border-width', currentOpts.padding);

      if (currentOpts.transitionIn == 'elastic') {
        start_pos = _get_zoom_from();

        content.html( tmp.contents() );

        wrap.show();

        if (currentOpts.opacity) {
          final_pos.opacity = 0;
        }

        fx.prop = 0;

        $(fx).animate({prop: 1}, {
           duration : currentOpts.speedIn,
           easing : currentOpts.easingIn,
           step : _draw,
           complete : _finish
        });

        return;
      }

      if (currentOpts.titlePosition == 'inside' && titleHeight > 0) { 
        title.show(); 
      }

      content
        .css({
          'width' : final_pos.width - currentOpts.padding * 2,
          'height' : selectedOpts.autoDimensions ? 'auto' : final_pos.height - titleHeight - currentOpts.padding * 2
        })
        .html( tmp.contents() );

      wrap
        .css(final_pos)
        .fadeIn( currentOpts.transitionIn == 'none' ? 0 : currentOpts.speedIn, _finish );
    },

    _format_title = function(title) {
      if (title && title.length) {
        if (currentOpts.titlePosition == 'float') {
          return '<table id="fancybox-title-float-wrap" cellpadding="0" cellspacing="0"><tr><td id="fancybox-title-float-left"></td><td id="fancybox-title-float-main">' + title + '</td><td id="fancybox-title-float-right"></td></tr></table>';
        }

        return '<div id="fancybox-title-' + currentOpts.titlePosition + '">' + title + '</div>';
      }

      return false;
    },

    _process_title = function() {
      titleStr = currentOpts.title || '';
      titleHeight = 0;

      title
        .empty()
        .removeAttr('style')
        .removeClass();

      if (currentOpts.titleShow === false) {
        title.hide();
        return;
      }

      titleStr = $.isFunction(currentOpts.titleFormat) ? currentOpts.titleFormat(titleStr, currentArray, currentIndex, currentOpts) : _format_title(titleStr);

      if (!titleStr || titleStr === '') {
        title.hide();
        return;
      }

      title
        .addClass('fancybox-title-' + currentOpts.titlePosition)
        .html( titleStr )
        .appendTo( 'body' )
        .show();

      switch (currentOpts.titlePosition) {
        case 'inside':
          title
            .css({
              'width' : final_pos.width - (currentOpts.padding * 2),
              'marginLeft' : currentOpts.padding,
              'marginRight' : currentOpts.padding
            });

          titleHeight = title.outerHeight(true);

          title.appendTo( outer );

          final_pos.height += titleHeight;
        break;

        case 'over':
          title
            .css({
              'marginLeft' : currentOpts.padding,
              'width' : final_pos.width - (currentOpts.padding * 2),
              'bottom' : currentOpts.padding
            })
            .appendTo( outer );
        break;

        case 'float':
          title
            .css('left', parseInt((title.width() - final_pos.width - 40)/ 2, 10) * -1)
            .appendTo( wrap );
        break;

        default:
          title
            .css({
              'width' : final_pos.width - (currentOpts.padding * 2),
              'paddingLeft' : currentOpts.padding,
              'paddingRight' : currentOpts.padding
            })
            .appendTo( wrap );
        break;
      }

      title.hide();
    },

    _set_navigation = function() {
      if (currentOpts.enableEscapeButton || currentOpts.enableKeyboardNav) {
        $(document).on('keydown.fb', function(e) {
          if (e.keyCode == 27 && currentOpts.enableEscapeButton) {
            e.preventDefault();
            $.fancybox.close();

          } else if ((e.keyCode == 37 || e.keyCode == 39) && currentOpts.enableKeyboardNav && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
            e.preventDefault();
            $.fancybox[ e.keyCode == 37 ? 'prev' : 'next']();
          }
        });
      }

      if (!currentOpts.showNavArrows) { 
        nav_left.hide();
        nav_right.hide();
        return;
      }

      if ((currentOpts.cyclic && currentArray.length > 1) || currentIndex !== 0) {
        nav_left.show();
      }

      if ((currentOpts.cyclic && currentArray.length > 1) || currentIndex != (currentArray.length -1)) {
        nav_right.show();
      }
    },

    _finish = function () {
      if (!$.support.opacity) {
        content.get(0).style.removeAttribute('filter');
        wrap.get(0).style.removeAttribute('filter');
      }

      if (selectedOpts.autoDimensions) {
        content.css('height', 'auto');
      }

      wrap.css('height', 'auto');

      if (titleStr && titleStr.length) {
        title.show();
      }

      if (currentOpts.showCloseButton) {
        close.show();
      }

      _set_navigation();
  
      if (currentOpts.hideOnContentClick) {
        content.bind('click', $.fancybox.close);
      }

      if (currentOpts.hideOnOverlayClick) {
        overlay.bind('click', $.fancybox.close);
      }

      $(window).on("resize.fb", $.fancybox.resize);

      if (currentOpts.centerOnScroll) {
        $(window).on("scroll.fb", $.fancybox.center);
      }

      if (currentOpts.type == 'iframe') {
        $('<iframe id="fancybox-frame" name="fancybox-frame' + new Date().getTime() + '" frameborder="0" hspace="0" ' + ($.browser.msie ? 'allowtransparency="true""' : '') + ' scrolling="' + selectedOpts.scrolling + '" src="' + currentOpts.href + '"></iframe>').appendTo(content);
      }

      wrap.show();

      busy = false;

      $.fancybox.center();

      currentOpts.onComplete(currentArray, currentIndex, currentOpts);

      _preload_images();
    },

    _preload_images = function() {
      var href, 
        objNext;

      if ((currentArray.length -1) > currentIndex) {
        href = currentArray[ currentIndex + 1 ].href;

        if (typeof href !== 'undefined' && href.match(imgRegExp)) {
          objNext = new Image();
          objNext.src = href;
        }
      }

      if (currentIndex > 0) {
        href = currentArray[ currentIndex - 1 ].href;

        if (typeof href !== 'undefined' && href.match(imgRegExp)) {
          objNext = new Image();
          objNext.src = href;
        }
      }
    },

    _draw = function(pos) {
      var dim = {
        width : parseInt(start_pos.width + (final_pos.width - start_pos.width) * pos, 10),
        height : parseInt(start_pos.height + (final_pos.height - start_pos.height) * pos, 10),

        top : parseInt(start_pos.top + (final_pos.top - start_pos.top) * pos, 10),
        left : parseInt(start_pos.left + (final_pos.left - start_pos.left) * pos, 10)
      };

      if (typeof final_pos.opacity !== 'undefined') {
        dim.opacity = pos < 0.5 ? 0.5 : pos;
      }

      wrap.css(dim);
      wrap.css('width', dim.width);

      content.css({
        'width' : (dim.width - currentOpts.padding * 2),
        'height' : (dim.height - (titleHeight * pos) - currentOpts.padding * 2)
      });
    },

    _get_viewport = function() {
      return [
        $(window).width() - (currentOpts.margin * 2),
        $(window).height() - (currentOpts.margin * 2),
        $(document).scrollLeft() + currentOpts.margin,
        $(document).scrollTop() + currentOpts.margin
      ];
    },

    _get_zoom_to = function () {
      var view = _get_viewport(),
        to = {},
        resize = currentOpts.autoScale,
        double_padding = currentOpts.padding * 2,
        ratio;

      if (currentOpts.width.toString().indexOf('%') > -1) {
        to.width = parseInt((view[0] * parseFloat(currentOpts.width)) / 100, 10);
      } else {
        to.width = currentOpts.width + double_padding;
      }

      if (currentOpts.height.toString().indexOf('%') > -1) {
        to.height = parseInt((view[1] * parseFloat(currentOpts.height)) / 100, 10);
      } else {
        to.height = currentOpts.height + double_padding;
      }

      if (resize && (to.width > view[0] || to.height > view[1])) {
        if (selectedOpts.type == 'image' || selectedOpts.type == 'swf') {
          ratio = (currentOpts.width ) / (currentOpts.height );

          if ((to.width ) > view[0]) {
            to.width = view[0];
            to.height = parseInt(((to.width - double_padding) / ratio) + double_padding, 10);
          }

          if ((to.height) > view[1]) {
            to.height = view[1];
            to.width = parseInt(((to.height - double_padding) * ratio) + double_padding, 10);
          }

        } else {
          to.width = Math.min(to.width, view[0]);
          to.height = Math.min(to.height, view[1]);
        }
      }

      to.top = parseInt(Math.max(view[3] - 20, view[3] + ((view[1] - to.height - 40) * 0.5)), 10);
      to.left = parseInt(Math.max(view[2] - 20, view[2] + ((view[0] - to.width - 40) * 0.5)), 10);

      return to;
    },

    _get_obj_pos = function(obj) {
      var pos = obj.offset();

      pos.top += parseInt( obj.css('paddingTop'), 10 ) || 0;
      pos.left += parseInt( obj.css('paddingLeft'), 10 ) || 0;

      pos.top += parseInt( obj.css('border-top-width'), 10 ) || 0;
      pos.left += parseInt( obj.css('border-left-width'), 10 ) || 0;

      pos.width = obj.width();
      pos.height = obj.height();

      return pos;
    },

    _get_zoom_from = function() {
      var orig = selectedOpts.orig ? $(selectedOpts.orig) : false,
        from = {},
        pos,
        view;

      if (orig && orig.length) {
        pos = _get_obj_pos(orig);

        from = {
          width : pos.width + (currentOpts.padding * 2),
          height : pos.height + (currentOpts.padding * 2),
          top : pos.top - currentOpts.padding - 20,
          left : pos.left - currentOpts.padding - 20
        };

      } else {
        view = _get_viewport();

        from = {
          width : currentOpts.padding * 2,
          height : currentOpts.padding * 2,
          top : parseInt(view[3] + view[1] * 0.5, 10),
          left : parseInt(view[2] + view[0] * 0.5, 10)
        };
      }

      return from;
    },

    _animate_loading = function() {
      if (!loading.is(':visible')){
        clearInterval(loadingTimer);
        return;
      }

      $('div', loading).css('top', (loadingFrame * -40) + 'px');

      loadingFrame = (loadingFrame + 1) % 12;
    };

  /*
   * Public methods 
   */

  $.fn.fancybox = function(options) {
    if (!$(this).length) {
      return this;
    }

    $(this)
      .data('fancybox', $.extend({}, options, ($.metadata ? $(this).metadata() : {})))
      .unbind('click.fb')
      .on('click.fb', function(e) {
        e.preventDefault();

        if (busy) {
          return;
        }

        busy = true;

        $(this).blur();

        selectedArray = [];
        selectedIndex = 0;

        var rel = $(this).attr('rel') || '';

        if (!rel || rel == '' || rel === 'nofollow') {
          selectedArray.push(this);

        } else {
          selectedArray = $("a[rel=" + rel + "], area[rel=" + rel + "]");
          selectedIndex = selectedArray.index( this );
        }

        _start();

        return;
      });

    return this;
  };

  $.fancybox = function(obj) {
    var opts;

    if (busy) {
      return;
    }

    busy = true;
    opts = typeof arguments[1] !== 'undefined' ? arguments[1] : {};

    selectedArray = [];
    selectedIndex = parseInt(opts.index, 10) || 0;

    if ($.isArray(obj)) {
      for (var i = 0, j = obj.length; i < j; i++) {
        if (typeof obj[i] == 'object') {
          $(obj[i]).data('fancybox', $.extend({}, opts, obj[i]));
        } else {
          obj[i] = $({}).data('fancybox', $.extend({content : obj[i]}, opts));
        }
      }

      selectedArray = jQuery.merge(selectedArray, obj);

    } else {
      if (typeof obj == 'object') {
        $(obj).data('fancybox', $.extend({}, opts, obj));
      } else {
        obj = $({}).data('fancybox', $.extend({content : obj}, opts));
      }

      selectedArray.push(obj);
    }

    if (selectedIndex > selectedArray.length || selectedIndex < 0) {
      selectedIndex = 0;
    }

    _start();
  };

  $.fancybox.showActivity = function() {
    clearInterval(loadingTimer);

    loading.show();
    loadingTimer = setInterval(_animate_loading, 66);
  };

  $.fancybox.hideActivity = function() {
    loading.hide();
  };

  $.fancybox.next = function() {
    return $.fancybox.pos( currentIndex + 1);
  };

  $.fancybox.prev = function() {
    return $.fancybox.pos( currentIndex - 1);
  };

  $.fancybox.pos = function(pos) {
    if (busy) {
      return;
    }

    pos = parseInt(pos);

    selectedArray = currentArray;

    if (pos > -1 && pos < currentArray.length) {
      selectedIndex = pos;
      _start();

    } else if (currentOpts.cyclic && currentArray.length > 1) {
      selectedIndex = pos >= currentArray.length ? 0 : currentArray.length - 1;
      _start();
    }

    return;
  };

  $.fancybox.cancel = function() {
    if (busy) {
      return;
    }

    busy = true;

    $.event.trigger('fancybox-cancel');

    _abort();

    selectedOpts.onCancel(selectedArray, selectedIndex, selectedOpts);

    busy = false;
  };

  // Note: within an iframe use - parent.$.fancybox.close();
  $.fancybox.close = function() {
    if (busy || wrap.is(':hidden')) {
      return;
    }

    busy = true;

    if (currentOpts && false === currentOpts.onCleanup(currentArray, currentIndex, currentOpts)) {
      busy = false;
      return;
    }

    _abort();

    $(close.add( nav_left ).add( nav_right )).hide();

    $(content.add( overlay )).unbind();

    $(window).unbind("resize.fb scroll.fb");
    $(document).unbind('keydown.fb');

    content.find('iframe').attr('src', isIE6 && /^https/i.test(window.location.href || '') ? 'javascript:void(false)' : 'about:blank');

    if (currentOpts.titlePosition !== 'inside') {
      title.empty();
    }

    wrap.stop();

    function _cleanup() {
      overlay.fadeOut('fast');

      title.empty().hide();
      wrap.hide();

      $.event.trigger('fancybox-cleanup');

      content.empty();

      currentOpts.onClosed(currentArray, currentIndex, currentOpts);

      currentArray = selectedOpts = [];
      currentIndex = selectedIndex = 0;
      currentOpts = selectedOpts  = {};

      busy = false;
    }

    if (currentOpts.transitionOut == 'elastic') {
      start_pos = _get_zoom_from();

      var pos = wrap.position();

      final_pos = {
        top  : pos.top,
        left : pos.left,
        width : wrap.width(),
        height : wrap.height()
      };

      if (currentOpts.opacity) {
        final_pos.opacity = 1;
      }

      title.empty().hide();

      fx.prop = 1;

      $(fx).animate({ prop: 0 }, {
         duration : currentOpts.speedOut,
         easing : currentOpts.easingOut,
         step : _draw,
         complete : _cleanup
      });

    } else {
      wrap.fadeOut( currentOpts.transitionOut == 'none' ? 0 : currentOpts.speedOut, _cleanup);
    }
  };

  $.fancybox.resize = function() {
    if (overlay.is(':visible')) {
      overlay.css('height', $(document).height());
    }

    $.fancybox.center(true);
  };

  $.fancybox.center = function() {
    var view, align;

    if (busy) {
      return; 
    }

    align = arguments[0] === true ? 1 : 0;
    view = _get_viewport();

    if (!align && (wrap.width() > view[0] || wrap.height() > view[1])) {
      return; 
    }

    wrap
      .stop()
      .animate({
        'top' : parseInt(Math.max(view[3] - 20, view[3] + ((view[1] - content.height() - 40) * 0.5) - currentOpts.padding)),
        'left' : parseInt(Math.max(view[2] - 20, view[2] + ((view[0] - content.width() - 40) * 0.5) - currentOpts.padding))
      }, typeof arguments[0] == 'number' ? arguments[0] : 200);
  };

  $.fancybox.init = function() {
    if ($("#fancybox-wrap").length) {
      return;
    }

    $('body').append(
      tmp = $('<div id="fancybox-tmp"></div>'),
      loading = $('<div id="fancybox-loading"><div></div></div>'),
      overlay = $('<div id="fancybox-overlay"></div>'),
      wrap = $('<div id="fancybox-wrap"></div>')
    );

    outer = $('<div id="fancybox-outer"></div>')
      .append('<div class="fancybox-bg" id="fancybox-bg-n"></div><div class="fancybox-bg" id="fancybox-bg-ne"></div><div class="fancybox-bg" id="fancybox-bg-e"></div><div class="fancybox-bg" id="fancybox-bg-se"></div><div class="fancybox-bg" id="fancybox-bg-s"></div><div class="fancybox-bg" id="fancybox-bg-sw"></div><div class="fancybox-bg" id="fancybox-bg-w"></div><div class="fancybox-bg" id="fancybox-bg-nw"></div>')
      .appendTo( wrap );

    outer.append(
      content = $('<div id="fancybox-content"></div>'),
      close = $('<a id="fancybox-close"></a>'),
      title = $('<div id="fancybox-title"></div>'),

      nav_left = $('<a href="javascript:;" id="fancybox-left"><span class="fancy-ico" id="fancybox-left-ico"><i class="icon-arrow-left"></i></span></a>'),
      nav_right = $('<a href="javascript:;" id="fancybox-right"><span class="fancy-ico" id="fancybox-right-ico"><i class="icon-arrow-right"></i></span></a>')
    );

    close.on("click", $.fancybox.close);
    loading.on("click", $.fancybox.cancel);

    nav_left.click(function(e) {
      e.preventDefault();
      $.fancybox.prev();
    });

    nav_right.click(function(e) {
      e.preventDefault();
      $.fancybox.next();
    });

    if ($.fn.mousewheel) {
      wrap.on('mousewheel.fb', function(e, delta) {
        if (busy) {
          e.preventDefault();

        } else if ($(e.target).get(0).clientHeight == 0 || $(e.target).get(0).scrollHeight === $(e.target).get(0).clientHeight) {
          e.preventDefault();
          $.fancybox[ delta > 0 ? 'prev' : 'next']();
        }
      });
    }

    if (!$.support.opacity) {
      wrap.addClass('fancybox-ie');
    }

    if (isIE6) {
      loading.addClass('fancybox-ie6');
      wrap.addClass('fancybox-ie6');

      $('<iframe id="fancybox-hide-sel-frame" src="' + (/^https/i.test(window.location.href || '') ? 'javascript:void(false)' : 'about:blank' ) + '" scrolling="no" border="0" frameborder="0" tabindex="-1"></iframe>').prependTo(outer);
    }
  };

  $.fn.fancybox.defaults = {
    padding : 10,
    margin : 40,
    opacity : false,
    modal : false,
    cyclic : false,
    scrolling : 'auto', // 'auto', 'yes' or 'no'

    width : 560,
    height : 340,

    autoScale : true,
    autoDimensions : true,
    centerOnScroll : false,

    ajax : {},
    swf : { wmode: 'transparent' },

    hideOnOverlayClick : true,
    hideOnContentClick : false,

    overlayShow : true,
    overlayOpacity : 0.7,
    overlayColor : '#777',

    titleShow : true,
    titlePosition : 'float', // 'float', 'outside', 'inside' or 'over'
    titleFormat : null,
    titleFromAlt : false,

    transitionIn : 'fade', // 'elastic', 'fade' or 'none'
    transitionOut : 'fade', // 'elastic', 'fade' or 'none'

    speedIn : 300,
    speedOut : 300,

    changeSpeed : 300,
    changeFade : 'fast',

    easingIn : 'swing',
    easingOut : 'swing',

    showCloseButton  : true,
    showNavArrows : true,
    enableEscapeButton : true,
    enableKeyboardNav : true,

    onStart : function(){},
    onCancel : function(){},
    onComplete : function(){},
    onCleanup : function(){},
    onClosed : function(){},
    onError : function(){}
  };

  $(function() {
    $.fancybox.init();
  });

})(jQuery);
  


/*

  Supersized - Fullscreen Slideshow jQuery Plugin
  Version : 3.2.7
  Theme   : Shutter 1.1
  
  Site  : www.buildinternet.com/project/supersized
  Author  : Sam Dunn
  Company : One Mighty Roar (www.onemightyroar.com)
  License : MIT License / GPL License

*/

(function($){
  
  theme = {
    
    
    /* Initial Placement
    ----------------------------*/
    _init : function(){
      
      // Center Slide Links
      if (api.options.slide_links) $(vars.slide_list).css('margin-left', -$(vars.slide_list).width()/2);
      
      // Start progressbar if autoplay enabled
        if (api.options.autoplay){
          if (api.options.progress_bar) theme.progressBar();
      }else{
        if ($(vars.play_button).attr('src')) $(vars.play_button).attr("src", vars.image_path + "play.png"); // If pause play button is image, swap src
        if (api.options.progress_bar) $(vars.progress_bar).stop().animate({left : -$(window).width()}, 0 ); //  Place progress bar
      }
      
      /* Navigation Items
      ----------------------------*/
        $(vars.next_slide).click(function() {
          api.nextSlide();
        });
        
        $(vars.prev_slide).click(function() {
          api.prevSlide();
        });

        $(vars.prev_slide +','+vars.next_slide).css('opacity', 1);
      
      
      /* Window Resize
      ----------------------------*/
      $(window).resize(function(){
        
        // Delay progress bar on resize
        if (api.options.progress_bar && !vars.in_animation){
          if (vars.slideshow_interval) clearInterval(vars.slideshow_interval);
          if (api.options.slides.length - 1 > 0) clearInterval(vars.slideshow_interval);
          
          $(vars.progress_bar).stop().animate({left : -$(window).width()}, 0 );
          
          if (!vars.progressDelay && api.options.slideshow){
            // Delay slideshow from resuming so Chrome can refocus images
            vars.progressDelay = setTimeout(function() {
                if (!vars.is_paused){
                  theme.progressBar();
                  vars.slideshow_interval = setInterval(api.nextSlide, api.options.slide_interval);
                }
                vars.progressDelay = false;
            }, 1000);
          }
        }
      
      });

      // Remove URL link from slider
      $('#supersized a').removeAttr('href');

      // Set Slide Info
      this.setSlideInfo();
      this.setSlideInfoPos();
      $('.slide-info-wrapper').fadeTo(300, 1);

      // Add Pattern overlay
      $('<div class="supersized-pattern"></div>').appendTo('#supersized');

      // Add class that supersized is active in html
      if( !$('.main-container').length ) {
        $('html').addClass('supersized-active');
      }

      // Pause the slideshow when not on homepage
      if( !$('.slide-info-wrapper').length )
        api.playToggle('pause');

      $(window).on('resize', this.setSlideInfoPos);
    },


    /* Set Title and caption
    ----------------------------*/
    setSlideInfo: function() {
      var title = api.getField('title'),
          url = api.getField('url'),
          caption = api.getField('caption'),
          $slideTitle= $('.slide-title a'),
          $slideCaption= $('.slide-caption');

      $slideTitle.html( title ).prop('href', url);

      // Check if caption exists
      if( caption !== '' ) {
        $slideCaption.css('opacity', 1).html( caption );
      } else {
        $slideCaption.css('opacity', 0);
      }
    },
    
    /* Set Slide Info Position
    ----------------------------*/
    setSlideInfoPos: function() {
      var $infoWrapper = $('.slide-info-wrapper'),
          wrapperHeight = $infoWrapper.height(),
          windowHeight = $(window).height(),
          headerHeight = $('.header-section').height(),
          footerHeight = $('.footer-section').height(),
          infoPos = windowHeight - headerHeight - footerHeight - 350;
      $infoWrapper.css('margin-top', infoPos);
    },

    
    /* Go To Slide
    ----------------------------*/
    goTo : function(){
      if (api.options.progress_bar && !vars.is_paused){
        $(vars.progress_bar).stop().animate({left : -$(window).width()}, 0 );
        theme.progressBar();
      }
    },
    
    /* Play & Pause Toggle
    ----------------------------*/
    playToggle : function(state){
      
      if (state =='play'){
        // If image, swap to pause
        if ($(vars.play_button).attr('src')) $(vars.play_button).attr("src", vars.image_path + "pause.png");
        if (api.options.progress_bar && !vars.is_paused) theme.progressBar();
      }else if (state == 'pause'){
        // If image, swap to play
        if ($(vars.play_button).attr('src')) $(vars.play_button).attr("src", vars.image_path + "play.png");
            if (api.options.progress_bar && vars.is_paused)$(vars.progress_bar).stop().animate({left : -$(window).width()}, 0 );
      }
      
    },
    
    
    /* Before Slide Transition
    ----------------------------*/
    beforeAnimation : function(direction){

        if (api.options.progress_bar && !vars.is_paused) $(vars.progress_bar).stop().animate({left : -$(window).width()}, 0 );
        
        /* Update Fields
        ----------------------------*/
        // Update slide caption
        if ($(vars.slide_caption).length){
          (api.getField('title')) ? $(vars.slide_caption).html(api.getField('title')) : $(vars.slide_caption).html('');
        }

        // $('.slide-info-wrapper').fadeTo(300, 0);
        this.setSlideInfo();
        this.setSlideInfoPos();

        // Remove URL link from slider
        $('#supersized a').removeAttr('href');
    },
    
    
    /* After Slide Transition
    ----------------------------*/
    afterAnimation : function(){
      if (api.options.progress_bar && !vars.is_paused) theme.progressBar(); //  Start progress bar
      // $('.slide-info-wrapper').fadeTo(300, 1);
    },
    
    
    /* Progress Bar
    ----------------------------*/
    progressBar : function(){
        $(vars.progress_bar).stop().animate({left : -$(window).width()}, 0 ).animate({ left:0 }, api.options.slide_interval);
      }
    
   
   };
   
   
   /* Theme Specific Variables
   ----------------------------*/
   $.supersized.themeVars = {
    
    // Internal Variables
    progress_delay    : false,        // Delay after resize before resuming slideshow
    thumb_page      :   false,        // Thumbnail page
    thumb_interval    :   false,        // Thumbnail interval
    image_path      : 'img/',       // Default image path
                          
    // General Elements             
    play_button     : '#pauseplay',   // Play/Pause button
    next_slide      : '.slide-next',   // Next slide button
    prev_slide      : '.slide-prev',   // Prev slide button
    next_thumb      : '#nextthumb',   // Next slide thumb button
    prev_thumb      : '#prevthumb',   // Prev slide thumb button
    
    slide_caption   : '#slidecaption',  // Slide caption
    slide_current   : '.slidenumber',   // Current slide number
    slide_total     : '.totalslides',   // Total Slides
    slide_list      : '#slide-list',    // Slide jump list              
    
    thumb_tray      : '#thumb-tray',    // Thumbnail tray
    thumb_list      : '#thumb-list',    // Thumbnail list
    thumb_forward   : '#thumb-forward', // Cycles forward through thumbnail list
    thumb_back      : '#thumb-back',    // Cycles backwards through thumbnail list
    tray_arrow      : '#tray-arrow',    // Thumbnail tray button arrow
    tray_button     : '#tray-button',   // Thumbnail tray button
    
    progress_bar    : '.progress-bar'   // Progress bar
                          
   };                       
  
   /* Theme Specific Options
   ----------------------------*/                       
   $.supersized.themeOptions = {          
                 
    progress_bar    : 1,    // Timer for each slide                     
    mouse_scrub     : 0   // Thumbnails move with mouse
    
   };
   
})(jQuery);

/*! http://mths.be/placeholder v2.0.7 by @mathias */
/*!
 * jQuery Placeholder Plugin v2.3.1
 * https://github.com/mathiasbynens/jquery-placeholder
 *
 * Copyright 2011, 2015 Mathias Bynens
 * Released under the MIT license
 */
(function(factory) {
  if (typeof define === 'function' && define.amd) {
      // AMD
      define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
      factory(require('jquery'));
  } else {
      // Browser globals
      factory(jQuery);
  }
}(function($) {

  /****
   * Allows plugin behavior simulation in modern browsers for easier debugging. 
   * When setting to true, use attribute "placeholder-x" rather than the usual "placeholder" in your inputs/textareas 
   * i.e. <input type="text" placeholder-x="my placeholder text" />
   */
  var debugMode = false; 

  // Opera Mini v7 doesn't support placeholder although its DOM seems to indicate so
  var isOperaMini = Object.prototype.toString.call(window.operamini) === '[object OperaMini]';
  var isInputSupported = 'placeholder' in document.createElement('input') && !isOperaMini && !debugMode;
  var isTextareaSupported = 'placeholder' in document.createElement('textarea') && !isOperaMini && !debugMode;
  var valHooks = $.valHooks;
  var propHooks = $.propHooks;
  var hooks;
  var placeholder;
  var settings = {};

  if (isInputSupported && isTextareaSupported) {

      placeholder = $.fn.placeholder = function() {
          return this;
      };

      placeholder.input = true;
      placeholder.textarea = true;

  } else {

      placeholder = $.fn.placeholder = function(options) {

          var defaults = {customClass: 'placeholder'};
          settings = $.extend({}, defaults, options);

          return this.filter((isInputSupported ? 'textarea' : ':input') + '[' + (debugMode ? 'placeholder-x' : 'placeholder') + ']')
              .not('.'+settings.customClass)
              .not(':radio, :checkbox, [type=hidden]')
              .bind({
                  'focus.placeholder': clearPlaceholder,
                  'blur.placeholder': setPlaceholder
              })
              .data('placeholder-enabled', true)
              .trigger('blur.placeholder');
      };

      placeholder.input = isInputSupported;
      placeholder.textarea = isTextareaSupported;

      hooks = {
          'get': function(element) {

              var $element = $(element);
              var $passwordInput = $element.data('placeholder-password');

              if ($passwordInput) {
                  return $passwordInput[0].value;
              }

              return $element.data('placeholder-enabled') && $element.hasClass(settings.customClass) ? '' : element.value;
          },
          'set': function(element, value) {

              var $element = $(element);
              var $replacement;
              var $passwordInput;

              if (value !== '') {

                  $replacement = $element.data('placeholder-textinput');
                  $passwordInput = $element.data('placeholder-password');

                  if ($replacement) {
                      clearPlaceholder.call($replacement[0], true, value) || (element.value = value);
                      $replacement[0].value = value;

                  } else if ($passwordInput) {
                      clearPlaceholder.call(element, true, value) || ($passwordInput[0].value = value);
                      element.value = value;
                  }
              }

              if (!$element.data('placeholder-enabled')) {
                  element.value = value;
                  return $element;
              }

              if (value === '') {
                  
                  element.value = value;
                  
                  // Setting the placeholder causes problems if the element continues to have focus.
                  if (element != safeActiveElement()) {
                      // We can't use `triggerHandler` here because of dummy text/password inputs :(
                      setPlaceholder.call(element);
                  }

              } else {
                  
                  if ($element.hasClass(settings.customClass)) {
                      clearPlaceholder.call(element);
                  }

                  element.value = value;
              }
              // `set` can not return `undefined`; see http://jsapi.info/jquery/1.7.1/val#L2363
              return $element;
          }
      };

      if (!isInputSupported) {
          valHooks.input = hooks;
          propHooks.value = hooks;
      }

      if (!isTextareaSupported) {
          valHooks.textarea = hooks;
          propHooks.value = hooks;
      }

      $(function() {
          // Look for forms
          $(document).delegate('form', 'submit.placeholder', function() {
              
              // Clear the placeholder values so they don't get submitted
              var $inputs = $('.'+settings.customClass, this).each(function() {
                  clearPlaceholder.call(this, true, '');
              });

              setTimeout(function() {
                  $inputs.each(setPlaceholder);
              }, 10);
          });
      });

      // Clear placeholder values upon page reload
      $(window).bind('beforeunload.placeholder', function() {

          var clearPlaceholders = true;

          try {
              // Prevent IE javascript:void(0) anchors from causing cleared values
              if (document.activeElement.toString() === 'javascript:void(0)') {
                  clearPlaceholders = false;
              }
          } catch (exception) { }

          if (clearPlaceholders) {
              $('.'+settings.customClass).each(function() {
                  this.value = '';
              });
          }
      });
  }

  function args(elem) {
      // Return an object of element attributes
      var newAttrs = {};
      var rinlinejQuery = /^jQuery\d+$/;

      $.each(elem.attributes, function(i, attr) {
          if (attr.specified && !rinlinejQuery.test(attr.name)) {
              newAttrs[attr.name] = attr.value;
          }
      });

      return newAttrs;
  }

  function clearPlaceholder(event, value) {
      
      var input = this;
      var $input = $(this);
      
      if (input.value === $input.attr((debugMode ? 'placeholder-x' : 'placeholder')) && $input.hasClass(settings.customClass)) {
          
          input.value = '';
          $input.removeClass(settings.customClass);

          if ($input.data('placeholder-password')) {

              $input = $input.hide().nextAll('input[type="password"]:first').show().attr('id', $input.removeAttr('id').data('placeholder-id'));
              
              // If `clearPlaceholder` was called from `$.valHooks.input.set`
              if (event === true) {
                  $input[0].value = value;

                  return value;
              }

              $input.focus();

          } else {
              input == safeActiveElement() && input.select();
          }
      }
  }

  function setPlaceholder(event) {
      var $replacement;
      var input = this;
      var $input = $(this);
      var id = input.id;

      // If the placeholder is activated, triggering blur event (`$input.trigger('blur')`) should do nothing.
      if (event && event.type === 'blur' && $input.hasClass(settings.customClass)) {
          return;
      }

      if (input.value === '') {
          if (input.type === 'password') {
              if (!$input.data('placeholder-textinput')) {
                  
                  try {
                      $replacement = $input.clone().prop({ 'type': 'text' });
                  } catch(e) {
                      $replacement = $('<input>').attr($.extend(args(this), { 'type': 'text' }));
                  }

                  $replacement
                      .removeAttr('name')
                      .data({
                          'placeholder-enabled': true,
                          'placeholder-password': $input,
                          'placeholder-id': id
                      })
                      .bind('focus.placeholder', clearPlaceholder);

                  $input
                      .data({
                          'placeholder-textinput': $replacement,
                          'placeholder-id': id
                      })
                      .before($replacement);
              }

              input.value = '';
              $input = $input.removeAttr('id').hide().prevAll('input[type="text"]:first').attr('id', $input.data('placeholder-id')).show();

          } else {
              
              var $passwordInput = $input.data('placeholder-password');

              if ($passwordInput) {
                  $passwordInput[0].value = '';
                  $input.attr('id', $input.data('placeholder-id')).show().nextAll('input[type="password"]:last').hide().removeAttr('id');
              }
          }

          $input.addClass(settings.customClass);
          $input[0].value = $input.attr((debugMode ? 'placeholder-x' : 'placeholder'));

      } else {
          $input.removeClass(settings.customClass);
      }
  }

  function safeActiveElement() {
      // Avoid IE9 `document.activeElement` of death
      try {
          return document.activeElement;
      } catch (exception) {}
  }
}));
