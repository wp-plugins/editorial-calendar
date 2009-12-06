/*
 * jQuery Tooltip plugin 1.3
 *
 * http://bassistance.de/jquery-plugins/jquery-plugin-tooltip/
 * http://docs.jquery.com/Plugins/Tooltip
 *
 * Copyright (c) 2006 - 2008 Jörn Zaefferer
 *
 * jQueryId: jquery.tooltip.js 5741 2008-06-21 15:22:16Z joern.zaefferer jQuery
 * 
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
 
;(function(jQuery) {
	
		// the tooltip element
	var helper = {},
		// the current tooltipped element
		current,
        _top,
        _left,
        _right = "auto",
		// IE 5.5 or 6
		IE = jQuery.browser.msie && /MSIE\s(5\.5|6\.)/.test(navigator.userAgent),
		// flag for mouse tracking
		track = false;
	
	jQuery.tooltip = {
		blocked: false,
		defaults: {
			delay: 200,
			fade: false,
			showURL: true,
			extraClass: "",
			top: 15,
			left: 15,
			id: "tooltip"
		},
		block: function() {
			jQuery.tooltip.blocked = !jQuery.tooltip.blocked;
		}
	};
	
	jQuery.fn.extend({
		tooltip: function(settings) {
			settings = jQuery.extend({}, jQuery.tooltip.defaults, settings);
			createHelper(settings);
			return this.each(function() {
					jQuery.data(this, "tooltip", settings);
					this.tOpacity = helper.parent.css("opacity");
				})
				.mouseover(save)
                .mouseup(function() {
                    show();
                });
		},
        hideWhenEmpty: function() {
			return this.each(function() {
				jQuery(this)[ jQuery(this).html() ? "show" : "hide" ]();
			});
		},
		url: function() {
			return this.attr('href') || this.attr('src');
		}
	});
	
	function createHelper(settings) {
		// there can be only one tooltip helper
		if( helper.parent )
			return;
		// create the helper, h3 for title, div for url
		helper.parent = jQuery('<div id="' + settings.id + '"><h3></h3><div class="body"></div><div class="url"></div></div>')
			// add to document
			.appendTo(document.body)
			// hide it at first
			.hide();
			
		// apply bgiframe if available
		if ( jQuery.fn.bgiframe )
			helper.parent.bgiframe();
		
		// save references to title and url elements
        helper.body = jQuery('div.body', helper.parent);
	}
	
	function tooltipsettings(element) {
        if (element) {
            return jQuery.data(element, "tooltip");
        } else {
            jQuery("#tooltip").hide();
        }
	}
	
	// main event handler to start showing tooltips
	function handle(event) {
        // if selected, update the helper position when the mouse moves
		track = !!tooltipsettings(this).track;
		jQuery(document.body).bind('mousemove', update);
			
		// update at least once
        update(event);
	}
	
	// save elements title before the tooltip is displayed
	function save() {
        // if this is the current source, or it has no title (occurs with click event), stop
		if ( jQuery.tooltip.blocked || this == current || (!this.tooltipText && !tooltipsettings(this).bodyHandler))
			return;

		// save current
		current = this;
        handle.apply(current, arguments);
	}
	
	/*
     * This function is a little strange.  The issue is that our tooltips work
     * more like modeless dialogs than like tooltips.  We make this work by 
     * storing the information of where the tooltip should go when the mouse
     * moves over an item and then showing it when the mouse is clicked on that 
     * item.
     */
	function show() {
        if (!tooltipsettings(current)) {
            return;
        }
        helper.parent.css({
            left: _left,
            right: _right,
            top: _top
        });

        var v = viewport(),
			h = helper.parent[0];

        /*
         * We don't want the tooltip to cause scroll bars to appear.
         * First we check the left.
         */
        if (_left + 200 > v.x + v.cx) {
            _left -= h.offsetWidth + tooltipsettings(current).left + ((_left + 225) - (v.x + v.cx));
            helper.parent.css({left: _left + 'px'}).addClass("viewport-right");
        }

        /*
         * Now we check the top
         */
        if (_top + 100 > v.y + v.cy) {
            _top -= h.offsetHeight + 100 + tooltipsettings(current).top;
			helper.parent.css({top: _top + 'px'}).addClass("viewport-bottom");
        }

		// check horizontal position
		if (v.x + v.cx < h.offsetLeft + h.offsetWidth) {
			_left -= h.offsetWidth + 20 + tooltipsettings(current).left + 150;
            helper.parent.css({left: _left + 'px'}).addClass("viewport-right");
		}
		// check vertical position
		if (v.y + v.cy < h.offsetTop + h.offsetHeight) {
			_top -= h.offsetHeight + 20 + tooltipsettings(current).top;
			helper.parent.css({top: _top + 'px'}).addClass("viewport-bottom");
		}
        
        if ( tooltipsettings(current).bodyHandler ) {
            var bodyContent = tooltipsettings(current).bodyHandler.call(current);
			if (bodyContent.nodeType || bodyContent.jquery) {
				helper.body.empty().append(bodyContent)
			} else {
				helper.body.html( bodyContent );
			}
			helper.body.show();
		} else if ( tooltipsettings(current).showBody ) {
			var parts = tooltipsettings(current).showBody;
            helper.body.empty();
			for(var i = 0, part; (part = parts[i]); i++) {
				if(i > 0)
					helper.body.append("<br/>");
				helper.body.append(part);
			}
			helper.body.hideWhenEmpty();
		} else {
            helper.body.hide();
		}

		// add an optional class for this tip
		helper.parent.addClass(tooltipsettings(current).extraClass);

		// fix PNG background for IE
		if (tooltipsettings(current).fixPNG )
			helper.parent.fixPNG();
			
        if (!tooltipsettings(current)) {
            return;
        }
        if ((!IE || !jQuery.fn.bgiframe) && tooltipsettings(current).fade) {
			if (helper.parent.is(":animated"))
				helper.parent.stop().show().fadeTo(tooltipsettings(current).fade, current.tOpacity);
			else
				helper.parent.is(':visible') ? helper.parent.fadeTo(tooltipsettings(current).fade, current.tOpacity) : helper.parent.fadeIn(tooltipsettings(current).fade);
		} else {
			helper.parent.show();
		}

        if (tooltipsettings(current).showHandler) {
            tooltipsettings(current).showHandler.call(current);
        }
	}

    /**
	 * callback for mousemove
	 * updates the helper position
	 * removes itself when no current element
	 */
	function update(event)	{
		if(jQuery.tooltip.blocked)
			return;
        if (!tooltipsettings(current)) {
            return;
        }
		
		if (event && event.target.tagName == "OPTION") {
			return;
		}

        // stop updating when tracking is disabled and the tooltip is visible
		if ( !track && helper.parent.is(":visible")) {
			jQuery(document.body).unbind('mousemove', update)
		}
		
		// if no current element is available, remove this listener
		if( current == null ) {
			jQuery(document.body).unbind('mousemove', update);
			return;	
		}
		
		// remove position helper classes
		helper.parent.removeClass("viewport-right").removeClass("viewport-bottom");
		
		_left = helper.parent[0].offsetLeft;
		_top = helper.parent[0].offsetTop;

        if (event) {
			// position the helper 15 pixel to bottom right, starting from mouse position
			_left = event.pageX + tooltipsettings(current).left;
			_top = event.pageY + tooltipsettings(current).top;
			_right = 'auto';
			if (tooltipsettings(current).positionLeft) {
				_right = jQuery(window).width() - left;
				_left = 'auto';
			}
		}
	}
	
	function viewport() {
		return {
			x: jQuery(window).scrollLeft(),
			y: jQuery(window).scrollTop(),
			cx: jQuery(window).width(),
			cy: jQuery(window).height()
		};
	}

    // hide helper and restore added classes and the title
	function hide(event) {
        if(jQuery.tooltip.blocked)
			return;

        if (!event) {
            jQuery("#tooltip").hide();
            return;
        }

        var offset = jQuery("#tooltip").offset();
        /*
         * We want to give the user a chance to get their mouse over the tooltip
         * before we hide it.
         */
        if (event.pageX >= offset.left - 15 &&
            event.pageY >= offset.top - 15 &&
            event.pageX <= jQuery("#tooltip").width() + offset.left + 15 &&
            event.pageY <= jQuery("#tooltip").height() + offset.top + 15) {
            return;
        }

        // no more current element
		current = null;
		
		var tsettings = tooltipsettings(this);
		function complete() {
			helper.parent.removeClass( tsettings.extraClass ).hide().css("opacity", "");
		}
		if ((!IE || !jQuery.fn.bgiframe) && tsettings.fade) {
			if (helper.parent.is(':animated'))
				helper.parent.stop().fadeTo(tsettings.fade, 0, complete);
			else
				helper.parent.stop().fadeOut(tsettings.fade, complete);
		} else
			complete();
	}
	
})(jQuery);
