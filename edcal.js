/* 
   <div id="cal">
       <div id="row08Nov2009">
           <div id="row08Nov2009row">
               <div class="day sunday nov" id="08Nov2009">
                   <div class="dayobj">
                       <div class="daylabel">8</div>
                       <ul class="postlist">
                       </ul>
                    </div>
                </div>
           </div>
       </div>
   </div>
 */
var edcal = {
    /*
     * True if the calendar is in the process of moving
     */
    isMoving: false,
        
    /*
       This is the base URL to make our call to the server.
       TODO:  The code to generate this should come from edcal.php
     */
    ajax_url: '',
        
    /*
     * The cache of dates we have already loaded posts for.
     */
    cacheDates : new Array(),
        
    /*
     * The ID of the timer we use to batch new post requests
     */
    tID: null,
        
    /*
     * The number of steps moving for this timer.
     */
    steps: 0,

    /*
     * The constant for the concurrency error.
     */
    CONCURRENCY_ERROR: 4,

    /*
     * The constant for the user permission error
     */
    PERMISSION_ERROR: 5,
    
    /*
       The direction the calendar last moved.
       true = down = to the future
       false = up = to the past

     */
    currentDirection: true,
        
    /*
       This date is our index.  When the calendar moves we
       update this date to indicate the next rows we need
       to add.
     */
    _wDate: Date.today(),
        
    /*
     * The date since the previous move
     */
    moveDate: null,
    
    /*
       A cache of all the posts we have loaded so far.  The
       data structure is:
 
       posts [date - ddMMMyyyy][posts array - post object from JSON data]
     */
    posts: new Array(50),
    
    /*
       This function aligns the grid in two directions.  There
       is a vertical grid with a row of each week and a horizontal
       grid for each week with a list of days.
     */
    alignGrid: function(/*string*/ gridid, /*int*/ cols, /*int*/ cellWidth, /*int*/ cellHeight, /*int*/ padding) {
        var x = 0;
        var y = 0;
        var count = 1;

        jQuery(gridid).each(function(){
                       jQuery(this).css("position", "relative");
                      
                      jQuery(this).children("div").each(function(){
                                                   jQuery(this).css({
                                                               width: cellWidth + "%",
                                                               height: cellHeight + "%",
                                                               position: "absolute",
                                                               left: x + "%",
                                                               top: y + "%"
                                                               });
                                                  
                                                  if ((count % cols) === 0){
                                                  x = 0;
                                                  y += cellHeight + padding;
                                                  }else{
                                                  x += cellWidth + padding;
                                                  }
                                                  
                                                  count++;
                                                  });
                      });
    },
    
    /*
       This is a helper function to align the calendar so we don't
       have to change the cell sizes in multiple places.
     */
    alignCal: function() {
        edcal.alignGrid("#cal", 1, 100, 20, 0.25);         
    },

    
    /*
       This function creates the days header at the top of the
       calendar.
 
       TODO:  We should localize these values 
     */
    createDaysHeader: function() {
        var html = '<div class="dayhead">Sunday</div>';
        html += '<div class="dayhead">Monday</div>';
        html += '<div class="dayhead">Tuesday</div>';
        html += '<div class="dayhead">Wednesday</div>';
        html += '<div class="dayhead">Thursday</div>';
        html += '<div class="dayhead">Friday</div>';
        html += '<div class="dayhead">Saturday</div>';
        
        jQuery("#rowhead").append(html);
        
        edcal.alignGrid("#rowhead", 7, 14.2, 100, 0.25);
    },
    
    /*
       Creates a row of the calendar and adds all of the CSS classes
       and listeners for each calendar day.
     */
    createRow: function(/*jQuery*/ parent, /*bool*/ append) {
        var _date = edcal._wDate.clone();
        
        var newrow = '<div class="rowcont" id="' + 'row' + edcal._wDate.toString("ddMMMyyyy") + '">' + 
                     '<div id="' + 'row' + edcal._wDate.toString("ddMMMyyyy") + 'row" class="row">';
        for (var i = 0; i < 7; i++) {
            newrow +='<div id="' + _date.toString("ddMMMyyyy") + '" class="day ' + _date.toString("dddd").toLowerCase() + ' '   + 
                     _date.toString("MMM").toLowerCase() + '">';
            
            newrow += '<div class="dayobj">';
            
            newrow += '<div class="daylabel">';
            if (_date.toString("dd") == "01") {
                newrow += _date.toString("MMM d");
            } else {
                newrow += _date.toString("d");
            }
            newrow += '</div>';

            newrow += '<ul class="postlist">';

            newrow += edcal.getPostItems(_date.toString("ddMMMyyyy"));
            
            newrow += '</ul>';
            
            newrow += '</div>';
            newrow += '</div>';
            _date.add(1).days();
        }
        
        newrow += '</div></div';
        
        if (append) {
            parent.append(newrow);
            
        } else {
            parent.prepend(newrow);
        }
        
        edcal.alignGrid("#row" + edcal._wDate.toString("ddMMMyyyy") + "row", 7, 14.2, 100, 0.25);
        jQuery('#row' + edcal._wDate.toString("ddMMMyyyy") + ' .post').draggable({ 
            revert: 'invalid',
            start: function(event, ui) {
                //jQuery.tooltip.block();
            }
        });
        jQuery('#row' + edcal._wDate.toString("ddMMMyyyy") + ' .day').each( function() {
            edcal.addTooltip(jQuery(this).attr("id"));
        });
        
        
        jQuery('#row' + edcal._wDate.toString("ddMMMyyyy") + ' .day').droppable({
            hoverClass: 'day-active',
            accept: '.post',
            greedy: true,
            drop: function(event, ui) {
                        //output('dropped ui.draggable.attr("id"): ' + ui.draggable.attr("id"));
                        //output('dropped on jQuery(this).attr("id"): ' + jQuery(this).attr("id"));
                        //output('ui.draggable.html(): ' + ui.draggable.html());

                        var dayId = ui.draggable.parent().parent().parent().attr("id");

                        // Step 0. Get the post object from the map
                        var post = edcal.findPostForId(ui.draggable.parent().parent().parent().attr("id"), ui.draggable.attr("id"));
                        output("post: " + post);
                        
                        // Step 1. Remove the post from the posts map
                        edcal.removePostFromMap(ui.draggable.parent().parent().attr("id"), 
                                                ui.draggable.attr("id"));

                        // Step 2. Remove the old element from the old parent.
                        jQuery('#' + ui.draggable.attr("id")).remove();
                        
                        // Step 3. Add the item to the new DOM parent
                        jQuery('#' + jQuery(this).attr("id") + ' .postlist').append(edcal.createPostItem(post, 
                                                                                               jQuery(this).attr("id")));
                        
                        // Step 4. Don't forget to make the new item draggable
                        //jQuery('#' + jQuery(this).attr("id") + ' .post').draggable({ revert: 'invalid'});

                        // Step 5. And add the tooltip
                        edcal.addTooltip(jQuery(this).attr("id"));

                        if (dayId == jQuery(this).attr("id")) {
                            /*
                             * If they dropped back on to the day they started with we
                             * don't want to go back to the server.
                             */
                            jQuery('#' + jQuery(this).attr("id") + ' .post').draggable({ 
                                revert: 'invalid',
                                start: function(event, ui) {
                                    //jQuery.tooltip.block();
                                }
                            });
                        } else {
                            // Step6. Update the date on the server
                            edcal.changeDate(jQuery(this).attr("id"), post);
                        }
            }
        });
        
        return jQuery('row' + edcal._wDate.toString("ddMMMyyyy"));
    },
    
    /*
       This is a utility method to find a post and remove it
       from the cache map.
     */
    removePostFromMap: function(/*string*/ dayobjId, /*string*/ postId) {
        if (edcal.posts[dayobjId]) {
            for (var i = 0; i < edcal.posts[dayobjId].length; i++) {
                if (edcal.posts[dayobjId][i] &&
                    "post-" + edcal.posts[dayobjId][i].POST_ID === postId) {
                    edcal.posts[dayobjId][i] = null;
                    return true;
                }
            }
        }

        return false;
    },
    
    /*
     * Adds a post to al already existing calendar day.
     */
    addPostItem: function(/*post*/ post, /*string*/ dayobjId) {
         jQuery('#' + dayobjId + ' .postlist').append(edcal.createPostItem(post, dayobjId));
         jQuery('#' + dayobjId + ' .post').draggable({ 
             revert: 'invalid',
             start: function(event, ui) {
                 //jQuery.tooltip.block();
             }
         });
         edcal.addTooltip(dayobjId);
    },
    
    /*
     * Adds a tooltip to every post in the specified day.
     */
    addTooltip: function(/*string*/ dayobjId) {
         jQuery('#' + dayobjId + ' .post').tooltip({ 
             delay: 1000, 
             bodyHandler: function() {
                 var post = edcal.findPostForId(dayobjId, jQuery(this).attr("id"));
                 edcal.findPostForId(jQuery(this).parent().parent().attr("id"),
                                     jQuery(this).attr("id"));
                 var tooltip = '<div class="tooltip">' + 
                                   '<h3>' + post.title + '</h3>' + 
                                   '<p>' + 
                                       '<i>by</i> ' + post.author + ' <i>on</i> ' + 
                                       edcal.getDayFromDayId(post.date).toString("MMMM d, yyyy") +
                                   '</p>' + 
                                   '<p>' + 
                                       'Status<b>: ' + post.status + '</b>' +
                                       '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + 
                                       '<a href="' + post.editlink + '" title="Edit ' + post.title + '">Edit</a>&nbsp; | &nbsp;' + 
                                       '<a href="' + post.permalink + '" title="Edit ' + post.title + '">View</a>' + 
                                   '</p>' + 
                               '</div>';

                 return tooltip;
             } 
         });
    },
    
    /*
       Creates the HTML for a post item and adds the data for
       the post to the posts cache.
     */
    createPostItem: function(/*post*/ post, /*string*/ dayobjId) {
        var postHtml = edcal.getPostItemString(post);
        if (!edcal.posts[dayobjId]) {
            edcal.posts[dayobjId] = new Array(0);
        }

        edcal.posts[dayobjId][edcal.posts[dayobjId].length] = post;
        
        return postHtml;
    },
    
    /*
       Finds the post object for the specified post ID  in the
       specified day.
     */
    findPostForId: function(/*string*/ dayobjId, /*string*/ postId) {
         if (edcal.posts[dayobjId]) {
            for (var i = 0; i < edcal.posts[dayobjId].length; i++) {
                if (edcal.posts[dayobjId][i] &&
                    "post-" + edcal.posts[dayobjId][i].id === postId) {
                    return edcal.posts[dayobjId][i];
                }
            }
        }
    },
    
    /*
     * Removes a post from the HTML and the posts cache.
     */
    removePostItem: function(/*string*/ dayobjId, /*string*/ postId) {
         if (edcal.findPostForId(dayobjId, postId)) {
             for (var i = 0; i < edcal.posts[dayobjId].length; i++) {
                if (edcal.posts[dayobjId][i] &&
                    "post-" + edcal.posts[dayobjId][i].id === postId) {
                    edcal.posts[dayobjId][i] = null;
                    jQuery("#" + postId).remove();
                }
            }

         }
    },
    
    /*
       Gets all the post items for the specified day from
       the post cache.
     */
    getPostItems: function(/*string*/ dayobjId) {
        var postsString = "";
        
        if (edcal.posts[dayobjId]) {
            for (var i = 0; i < edcal.posts[dayobjId].length; i++) {
                if (edcal.posts[dayobjId][i]) {
                    postsString += edcal.getPostItemString(edcal.posts[dayobjId][i]);
                }
            }
        }

        return postsString;
    },
    
    /*
     * Gets the HTML string for a post.
     */
    getPostItemString: function(/*post*/ post) {
         return '<li id="post-' + post.id + '" class="post ' + post.status + '">' + post.title + '</li>';
    },
    
    /*
       Finds the calendar cell for the current day and adds the
       class "today" to that cell.
     */
    setClassforToday: function() {
        /*
           We want to set a class for the cell that represents the current day so we ca
           give it a background color.
         */
        jQuery('#' + Date.today().toString("ddMMMyyyy")).addClass("today");
    },
    
    /*
       Most browsers need us to set a calendar height in pixels instead
       of percent.  This function get the correct pixel height for the
       calendar based on the window height.
     */
    getCalHeight: function() {
        var myHeight = 0;
        if ( typeof( window.innerWidth ) == 'number' ) {
            //Non-IE
            myHeight = window.innerHeight;
        } else if ( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
            //IE 6+ in 'standards compliant mode'
            myHeight = document.documentElement.clientHeight;
        } else if ( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
            //IE 4 compatible
            myHeight = document.body.clientHeight;
        }
        return myHeight - 150;
    },
    
    /*
       Moves the calendar a certain number of steps in the specified direction.
       True moves the calendar down into the future and false moves the calendar
       up into the past.
     */
    move: function(steps, direction) {
        /*
           The working date is a marker for the last calendar row we created.
           If we are moving forward that will be the last row, if we are moving
           backward it will be the first row.  If we switch direction we need
           to bump up our date by 11 rows times 7 days a week or 77 days.
         */
        if (edcal.currentDirection != direction) {
            if (direction) {        // into the future
                edcal._wDate = edcal._wDate.add(77).days();
            } else {                // into the past
                edcal._wDate = edcal._wDate.add(-77).days();
            }

            edcal.steps = 0;
            edcal.moveDate = edcal._wDate;
        }

        edcal.currentDirection = direction;
        
        
        if (direction) {
            for (var i = 0; i < steps; i++) {
                jQuery("#cal > div:first").remove();
                edcal.createRow(jQuery("#cal"), true);
                edcal._wDate.add(7).days();
            }
            edcal.alignCal();
        } else {
            for (var i = 0; i < steps; i++) {
                jQuery("#cal > div:last").remove();
                edcal.createRow(jQuery("#cal"), false);
                edcal._wDate.add(-7).days();
            }
            edcal.alignCal();
        }
        
        edcal.setClassforToday();
        edcal.setDateLabel();

        /*
         * If the user clicks quickly or uses the mouse wheel they can 
         * get a lot of move events very quickly and we need to batch 
         * them up together.  We set a timeout and clear it if there is
         * another move before the timeout happens.
         */
        edcal.steps += steps;
        if (edcal.tID) {
            clearTimeout(edcal.tID);
        } else {
            edcal.moveDate = edcal._wDate;
        }

        edcal.tID = setTimeout(function() {
            /*
             * Now that we are done moving the calendar we need to get the posts for the 
             * new dates.
             */
            if (direction) {
                edcal.getPosts(edcal._wDate.clone(), 
                               edcal._wDate.clone().add(7 * edcal.steps).days());
            } else {
                edcal.getPosts(edcal._wDate.clone().add(-7 * edcal.steps).days(), 
                               edcal._wDate.clone());
            }

            edcal.steps = 0;
            edcal.tID = null;
            edcal.moveDate = edcal._wDate;
        }, 200);
    },

    /*
       We use the date as the ID for day elements, but the Date
       library can't parse the date without spaces and using
       spaces in IDs can cause problems.  We work around the
       issue by adding the spaces back before we parse.
     */
    getDayFromDayId: function(/*dayId*/ day) {
        return Date.parse(day.substring(0, 2) + ' ' + day.substring(2, 5) + ' ' + day.substring(5));
    },
    
    /*
       This is a helper method to set the date label on the top of
       the calendar.  It looks like November 2009-December2009
     */
    setDateLabel: function(year) {
        var api = jQuery(".edcal_scrollable").scrollable();
        var items = api.getVisibleItems();
        
        /*
           We need to get the first day in the first week and the
           last day in the last week.  We call children twice to
           work around a small JQuery issue.
         */
        var firstDate = edcal.getDayFromDayId(items.eq(0).children(".row").children(".day:first").attr("id"));
        var lastDate = edcal.getDayFromDayId(items.eq(items.length - 1).children(".row").children(".day:last").attr("id"));
        
        jQuery("#currentRange").text(firstDate.toString("MMMM yyyy") + " - " + lastDate.toString("MMMM yyyy"));
    },
    
    /*
     * Moves the calendar to the specified date.
     */
    moveTo : function(/*Date*/ date) {
         edcal.isMoving = true;
         jQuery("#cal").empty();
         
         /*
           When we first start up our working date is 4 weeks before
           the next Sunday. 
        */
        edcal._wDate = date.next().sunday().add(-28).days();
        
        /*
           After we remove and readd all the rows we are back to
           moving in a going down direction.
         */
        edcal.currentDirection = true;
        
        for (var i = 0; i < 10; i++) {
            edcal.createRow(jQuery("#cal"), true);
            edcal._wDate.add(7).days();
        }
        
        edcal.alignCal();
        
        var api = jQuery(".edcal_scrollable").scrollable();
        api.move(2);
        
        edcal.setDateLabel();
        edcal.setClassforToday();
        edcal.isMoving = false;
         
    },
    
    /*
     * Initializes the calendar
     */
    init : function() {
         if (jQuery("#edcal_scrollable").length === 0) {
             /*
              * This means we are on a page without the editorial 
              * calendar
              */
             return;
         }

        jQuery("#loading").hide();
        
        jQuery("#edcal_scrollable").css("height", edcal.getCalHeight() + "px");
        
        /*
         *  Add the days of the week
         */ 
        edcal.createDaysHeader();
        
        // initialize scrollable  
        jQuery(".edcal_scrollable").scrollable({ 
                                    vertical:true,  
                                    size: 6,
                                    keyboardSteps: 1,
                                    speed: 100
                                    // use mousewheel plugin 
                                    }).mousewheel();
        
        var api = jQuery(".edcal_scrollable").scrollable();
        
        edcal.moveTo(Date.today());
        
        var steps = 1;
        
        /*
         * The scrollable handles some basic binding.  This gets us 
         * up arrow, down arrow and the mouse wheel. 
         */
        api.onBeforeSeek(function(evt, direction) { 
                         // inside callbacks the "this" variable is a reference to the API 
            if (!edcal.isMoving) {
                edcal.move(1, direction);
            }
            
            return false;
        });
        
        /*
         * We also want to listen for a few other key events
         */
        jQuery(document).bind("keydown", function(evt) {
            //if (evt.altKey || evt.ctrlKey) { return; }
            //output("evt.altKey: " + evt.altKey);
            //output("evt.keyCode: " + evt.keyCode);
            //output("evt.ctrlKey: " + evt.ctrlKey);
            
            if ((evt.keyCode === 34 && !(evt.altKey || evt.ctrlKey)) || //page down
                evt.keyCode === 40 && evt.ctrlKey){                     // Ctrl+down down arrow
                edcal.move(4, true);
                return false;
            } else if ((evt.keyCode === 33 && !(evt.altKey || evt.ctrlKey)) || //page up
                evt.keyCode === 38 && evt.ctrlKey){                            // Ctrl+up up arrow
                edcal.move(4, false);
                return false;
            }
        });

        edcal.getPosts(Date.today().next().sunday().add(-61).days(), 
                       Date.today().next().sunday().add(61).days());
    },
    
    /*
       This function makes an AJAX call and changes the date of
       the specified post on the server.
     */
    changeDate: function(/*string*/ newdate, /*Post*/ post) {

         newdate = edcal.getDayFromDayId(newdate).toString("yyyy-MM-dd");

         var postStatus = "";

         if (post.status === "draft") {
             /*
              * If your status was draft then we don't want to change it.
              */
             postStatus = "draft";
         } else {
             var compare = edcal.getDayFromDayId(newdate).compareTo(Date.today());
             if (compare === -1) {
                 postStatus = "publish";
             } else {
                 postStatus = "future";
             }
         }

         var url = edcal.ajax_url + "?action=edcal_changedate&postid=" + post.id + 
             "&postStatus=" + postStatus + 
             "&newdate=" + newdate + "&olddate=" + edcal.getDayFromDayId(post.date).toString("yyyy-MM-dd");

         jQuery("#post-" + post.id).addClass("loadingclass");

         jQuery.ajax( { 
            url: url,
            type: "POST",
            processData: false,
            timeout: 10000,
            dataType: "json",
            success: function(res) {
                if (res.error) {
                    if (res.error === edcal.CONCURRENCY_ERROR) {
                        edcal.removePostItem(res.post.date, "post-" + res.post.id);
                    
                        edcal.addPostItem(res.post, res.post.date);
                        edcal.showError("Someone else already moved " + res.post.title);
                    } else if (res.error === edcal.PERMISSION_ERROR) {
                        edcal.removePostItem(res.post.date, "post-" + res.post.id);
                    
                        edcal.addPostItem(res.post, res.post.date);
                        edcal.showError("You don't have permission to edit posts");
                    }
                } else {
                    edcal.removePostItem(res.post.date, "post-" + res.post.id);
                    edcal.addPostItem(res.post, res.post.date);
                }
            },
            error:  function(xhr) {
                 output("call error...");
                 if (xhr.responseText) {
                     output("xhr.responseText: " + xhr.responseText);
                 }
            }
        });

    },
    
    /*
     * Shows an error message
     */
    showError: function(/*string*/ msg) {
         humanMsg.displayMsg(msg);
    },
    
    /*
       Makes an AJAX call to get the posts from the server within the
       specified dates.
     */
    getPosts: function(/*Date*/ from, /*Date*/ to) {
         output("getPosts(" + from.toString("yyyy-MM-dd") + ", " + to.toString("yyyy-MM-dd") + ")");

         var shouldGet = edcal.cacheDates[from];

         if (shouldGet) {
             /*
              * TODO: We don't want to make extra AJAX calls for dates
              * that we have already coverred.  This is cutting down on
              * it somewhat, but we could get much better about this.
              */
             output("We already have the results.");
             return;
         }

         edcal.cacheDates[from] = true;


         var url = edcal.ajax_url + "?action=edcal_posts&from=" + from.toString("yyyy-MM-dd") + "&to=" + to.toString("yyyy-MM-dd");
         output("url: " + url);

         jQuery("#loading").show();

        jQuery.ajax( { 
            url: url,
            type: "GET",
            processData: false,
            timeout: 10000,
            dataType: "json",
            success: function(res) {
                jQuery("#loading").hide();
                jQuery.each(res, function(i, post) {

                    edcal.removePostItem(post.date, "post-" + post.id);
                    
                    edcal.addPostItem(post, post.date);
                 });
            },
            error:  function(xhr) {
                 output("call error...");
                 if (xhr.responseText) {
                     output("xhr.responseText: " + xhr.responseText);
                 }
            }
        });

    }
};

jQuery(document).ready(function(){
    /*
       Just a few test posts
     */
    /*edcal.createPostItem("Test Post 1", "05Nov2009");
    edcal.createPostItem("Test Post 2", "12Nov2009");
    edcal.createPostItem("Test Post 3", "16Nov2009");
    edcal.createPostItem("Test Post 4", "17Nov2009");
    edcal.createPostItem("Test Post 5", "27Nov2009");
    edcal.createPostItem("Test Post 6", "23Nov2009");
    edcal.createPostItem("Test Post 7", "01Dec2009");
    edcal.createPostItem("Test Post 8", "21Nov2009");
    edcal.createPostItem("Test Post 9", "09Nov2009");
    edcal.createPostItem("Test Post 10", "04Dec2009");*/
    
    edcal.init();
    
    jQuery("#moveToToday").click(function() {
        edcal.moveTo(Date.today());
        return false;
    });

    jQuery("#prevmonth").click(function() {
        edcal.move(4, false);
        return false;
    });

    jQuery("#nextmonth").click(function() {
        edcal.move(4, true);
        return false;
    });
});

/**
 * This is a helper function to output messages on the HTML page.  It
 * write them out to a text area.
 * 
 * @param msg    the message to write
 */
function output(msg) {
    //console.info(msg);
}
