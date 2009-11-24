/*******************************************************************************
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 ******************************************************************************/
 
/**
 * This is a helper function to output messages on the HTML page.  It
 * write them out to a text area.
 * 
 * @param msg    the message to write
 */
function output(msg) {
    //console.info(msg);
}

 /*
  This is the WordPress editorial calendar.  It is a continuous
  calendar in both directions.  That means instead of showing only
  one month at a time it shows the months running together.  Users
  can scroll from one month to the next using the up and down
  arrow keys, the page up and page down keys, the next and previous
  month buttons, and their mouse wheel.
 
  The calendar shows five weeks visible at a time and maintains 11
  weeks of rendered HTML.  Only the middle weeks are visible.
 
                    Week 1
                    Week 2
                    Week 3
                -   Week 4   -
                |   Week 5   |
                |   Week 6   |
                |   Week 7   |
                -   Week 8   -
                    Week 9
                    Week 10
                    Week 11
 
  When the user scrolls down one week the new week is added at the
  end of the calendar and the first week is removed.  In this way
  the calendar will only ever have 11 weeks total and won't use up
  excessive memory.
 
  This calendar uses AJAX to call into the functions defined in
  edcal.php.  These functions get posts and change post dates.
 
  The HTML structure of the calendar is:
 
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
       This is the base URL we use to make AJAX calls back
       to the server.  This value is set in code generated
       from edcal.php that run in a script tag in the main
       page.
     */
    ajax_url: '',
        
    /*
     * The cache of dates we have already loaded posts for.
     */
    cacheDates : [],
        
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
       IE will sometimes fire the resize event twice for the same resize
       action.  We save it so we only resize the calendar once and avoid
       any flickering.
     */
    windowHeight: 0,
    
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
                
                if ((count % cols) === 0) {
                    x = 0;
                    y += cellHeight + padding;
                } else {
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
            newrow += '<div id="' + _date.toString("ddMMMyyyy") + '" class="day ' + 
                      _date.toString("dddd").toLowerCase() + ' '   + 
                      _date.toString("MMM").toLowerCase() + '">';
            
            newrow += '<div class="dayobj">';

            newrow += '<div class="daylabel">';
            newrow += '<a href="#" class="daynewlink" title="Add new post on ' + _date.toString("MMMM d") + '" ' + 
                         'onclick="return false;">+</a>';
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
        
        jQuery('#row' + edcal._wDate.toString("ddMMMyyyy") + ' .day').each( function() {
            edcal.addTooltip(jQuery(this).attr("id"));
        });

        edcal.draggablePost('#row' + edcal._wDate.toString("ddMMMyyyy") + ' .post');

        jQuery('#row' + edcal._wDate.toString("ddMMMyyyy") + ' .day').droppable({
            hoverClass: 'day-active',
            accept: '.post',
            greedy: true,
            tolerance: 'pointer',
            drop: function(event, ui) {
                           //output('dropped ui.draggable.attr("id"): ' + ui.draggable.attr("id"));
                           //output('dropped on jQuery(this).attr("id"): ' + jQuery(this).attr("id"));
                           //output('ui.draggable.html(): ' + ui.draggable.html());
                           
                           var dayId = ui.draggable.parent().parent().parent().attr("id");
                           
                           // Step 0. Get the post object from the map
                           var post = edcal.findPostForId(ui.draggable.parent().parent().parent().attr("id"), 
                                                          ui.draggable.attr("id"));
                           
                           // Step 1. Remove the post from the posts map
                           edcal.removePostFromMap(ui.draggable.parent().parent().parent().attr("id"), 
                                                   ui.draggable.attr("id"));
                           
                           // Step 2. Remove the old element from the old parent.
                           jQuery('#' + ui.draggable.attr("id")).remove();
                           
                           // Step 3. Add the item to the new DOM parent
                           jQuery('#' + jQuery(this).attr("id") + ' .postlist').append(edcal.createPostItem(post, 
                                                                                                            jQuery(this).attr("id")));
                           
                           // Step 4. And add the tooltip
                           edcal.addTooltip(jQuery(this).attr("id"));
                           
                           if (dayId == jQuery(this).attr("id")) {
                               /*
                                  If they dropped back on to the day they started with we
                                  don't want to go back to the server.
                                */
                               edcal.draggablePost('#' + jQuery(this).attr("id") + ' .post');
                            } else {
                                // Step6. Update the date on the server
                                edcal.changeDate(jQuery(this).attr("id"), post);
                            }
                        }
            });

        return jQuery('row' + edcal._wDate.toString("ddMMMyyyy"));
    },

    /*
     * This is a helper method to make an individual post item draggable.
     */
    draggablePost: function(/*post selector*/ post) {
         /*
          * Click is a different operation than drag in our UI.  The problem is if
          * the user is moving their mouse just a little bit we can think it is a 
          * drag instead of a click.  We stop this by delaying the drag event until
          * the user has dragged at least 10 pixels.  This works fine on IE and
          * Firefox, but on Chrome it causes text selection so we don't delay on
          * Chrome.
          */
         var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
         var is_safari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;

         if (is_chrome || is_safari) {
             jQuery(post).draggable({ 
                revert: 'invalid',
                appendTo: 'body',
                helper: "clone",
                addClasses: false
            });
         } else {
             jQuery(post).draggable({ 
                revert: 'invalid',
                appendTo: 'body',
                distance: 10,
                helper: "clone",
                addClasses: false
             });
         }
    },
    
    /*
       This is a utility method to find a post and remove it
       from the cache map.
     */
    removePostFromMap: function(/*string*/ dayobjId, /*string*/ postId) {
         if (edcal.posts[dayobjId]) {
             for (var i = 0; i < edcal.posts[dayobjId].length; i++) {
                 if (edcal.posts[dayobjId][i] &&
                     "post-" + edcal.posts[dayobjId][i].id === postId) {
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
    },

    /*
       Makes all the posts in the specified day draggable
       and adds the tooltip.
     */
    addPostItemDragAndToolltip: function(/*string*/ dayobjId) {
         edcal.draggablePost('#' + dayobjId + ' .post');
         edcal.addTooltip(dayobjId);
    },

    /*
     * Confirms if you want to delete the specified post
     */
    confirmDelete: function(/*string*/ posttitle) {
         if (confirm('You are about to delete this post ' + posttitle + '.\n\n Press cancel to stop, OK to delete.')) {
             return true;
         } else {
             return false;
         }
    },

    /*
       This is an AJAX function to save the past title when
       the user presses the save button on the tooltip.
     */
    saveTitle: function(/*string*/ postId) {
         
         var url = edcal.ajax_url + "?action=edcal_changetitle&postid=" + postId + 
             "&title=" + jQuery.URLEncode(jQuery("#edcal-title-edit-field").val());

         jQuery("#post-" + postId).addClass("loadingclass");
         
         jQuery("#tooltip").hide();

         jQuery.ajax( { 
            url: url,
            type: "POST",
            processData: false,
            timeout: 100000,
            dataType: "json",
            success: function(res) {
                edcal.removePostItem(res.post.date, "post-" + res.post.id);
                edcal.addPostItem(res.post, res.post.date);
                edcal.addPostItemDragAndToolltip(res.post.date);
            },
            error:  function(xhr) {
                 edcal.showError("There was an error contacting your blog.");
                 if (xhr.responseText) {
                     output("xhr.responseText: " + xhr.responseText);
                 }
            }
        });
    },

    /*
     * Cancels the edit title action in the tooltip.
     */
    cancelEditTitle: function(/*string*/ postTitle) {
         jQuery("#edcal-title-edit-field").val(postTitle);

         jQuery("#edcal-title-box").hide();
         jQuery("#edcal-title").show();
         
    },

    /*
     * Shows the edit title UI in the tooltip.
     */
    editTitle: function() {
         jQuery("#edcal-title").hide();
         jQuery("#edcal-title-box").show();

         jQuery("#edcal-title-edit-field").focus();
         jQuery("#edcal-title-edit-field").select();
    },

    /*
       Switches back to the normal tooltip title view
       and closes the tooltip.
     */
    closeTooltip: function() {
         edcal.cancelEditTitle();
         jQuery("#tooltip").hide();
    },
    
    /*
     * Adds a tooltip to every post in the specified day.
     */
    addTooltip: function(/*string*/ dayobjId) {
         jQuery('#' + dayobjId + ' .post').tooltip({ 
             delay: 1500, 
             bodyHandler: function() {
                 var post = edcal.findPostForId(dayobjId, jQuery(this).attr("id"));

                 var posttitle = post.title;

                 if (posttitle === "") {
                     posttitle = "[No Title]";
                 }

                 var tooltip = '<div class="tooltip">' + 
                               '<a href="#" id="tipclose" onclick="edcal.closeTooltip(); return false;" title="close"> </a>' + 
                                   '<h3 id="edcal-title">' + posttitle + 
                                       ' <a href="#" onclick="edcal.editTitle(); return false;" class="edit-post-status" id="edcal-title-edit">Edit</a>' + 
                                   '</h3>' + 
                                   '<div id="edcal-title-box">' + 
                                       '<input type="text" value="' + post.title + '" id="edcal-title-edit-field"/> &nbsp;&nbsp;' + 
                                       '<span id="edit-slug-buttons">' + 
                                           '<a class="save button" href="#" onclick="edcal.saveTitle(\'' + post.id + '\'); return false;">Save</a> ' + 
                                           '<a href="#" onclick="edcal.cancelEditTitle(\'' + post.title + '\'); return false;" class="cancel">Cancel</a></span>' + 
                                       '</div>' + 
                                   '<p>' + 
                                       '<i>by</i> ' + post.author + ' <i>on</i> ' + 
                                       edcal.getDayFromDayId(post.date).toString("MMMM d, yyyy") + ' at ' +
                                       post.time + 
                                   '</p>' + 
                                   '<p>' + 
                                       'Status<b>: ' + post.status + '</b>' +
                                       '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
                                    if (post.editlink) {
                                        /*
                                         * If the user doesn't have permission to edit a post then 
                                         * then server won't send the edit link URL and we shouldn't
                                         * show the edit link
                                         */
                                       tooltip += '<a href="' + post.editlink + '" title="Edit ' + post.title + 
                                           '">Edit</a>&nbsp; | &nbsp;';
                                    }

                                    if (post.dellink) {
                                        tooltip += '<a class="submitdelete" href="' + post.dellink + '" ' + 
                                        'onclick="return edcal.confirmDelete(\'' + post.title + '\');"' +
                                        'title="Delete ' + post.title + '">Delete</a> &nbsp; | &nbsp;';
                                    }

                                    tooltip += '<a href="' + post.permalink + '" title="View ' + post.title + '">View</a>' + 
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
         var posttitle = post.title;

         if (posttitle === "") {
             posttitle = "[No Title]";
         }
         return '<li id="post-' + post.id + '" class="post ' + post.status + '">' + posttitle + '</li>';
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
        
        var i;
        
        
        if (direction) {
            for (i = 0; i < steps; i++) {
                jQuery("#cal > div:first").remove();
                edcal.createRow(jQuery("#cal"), true);
                edcal._wDate.add(7).days();
            }
            edcal.alignCal();
        } else {
            for (i = 0; i < steps; i++) {
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
             * new dates.  We want to load the posts between the place the calendar was
             * at when the user started moving it and the place the calendar is at now.
             */
            if (!direction) {
                edcal.getPosts(edcal._wDate.clone(), 
                               edcal._wDate.clone().add(7 * (edcal.steps + 1)).days());
            } else {
                edcal.getPosts(edcal._wDate.clone().add(-7 * (edcal.steps + 1)).days(), 
                               edcal._wDate.clone());
            }

            edcal.steps = 0;
            edcal.tID = null;
            edcal.moveDate = edcal._wDate;
        }, 1000);
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
        edcal.windowHeight = jQuery(window).height();
        
        /*
         *  Add the days of the week
         */ 
        edcal.createDaysHeader();
        
        // initialize scrollable  
        jQuery(".edcal_scrollable").scrollable({ 
                                    vertical:true,  
                                    size: 5,
                                    keyboardSteps: 1,
                                    speed: 100
                                    // use mousewheel plugin 
                                    }).mousewheel();
        
        var api = jQuery(".edcal_scrollable").scrollable();
        
        edcal.moveTo(Date.today());
        
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
            } else if (evt.keyCode === 27) { //escape key
                edcal.closeTooltip();
                return false;
            }
        });

        edcal.getPosts(Date.today().next().sunday().add(-28).days(), 
                       Date.today().next().sunday().add(35).days());
        
        /*
           Now we bind the listeners for all of our links and the window
           resize.
         */
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
        
        function resizeWindow(e) {
            if (edcal.windowHeight != jQuery(window).height()) {
                jQuery("#edcal_scrollable").css("height", edcal.getCalHeight() + "px");
                edcal.windowHeight = jQuery(window).height();
            }
        }
        jQuery(window).bind("resize", resizeWindow);

        jQuery(".day").live("mouseover", function(evt) {
            jQuery("#" + jQuery(this).attr("id") + " .daynewlink").show();
        });

        jQuery(".day").live("mouseout", function(evt) {
            jQuery("#" + jQuery(this).attr("id") + " .daynewlink").hide();
        });

        jQuery(".daynewlink").live("click", function(evt) {
            output("clicked on : " + jQuery(this).parent().parent().parent().attr("id"));
            edcal.createEmptyDraft(jQuery(this).parent().parent().parent().attr("id"));
        });
    },

    /*
     * This function responds to the new post link on each calendar day.
     * The function is kind of funny.  What I would really like to do is
     * redirect the user to the edit page with a parameter on the URL to
     * set a default post date, but WordPress doesn't support that.  Instead
     * I create a new empty draft post on that day and take them to edit
     * that post.
     */
    createEmptyDraft: function(/*string*/ date) {
         /*
          * We don't really let them set a time in the calendar, so we 
          * put a default post time of 10:00 AM.
          */
         var formattedDate = jQuery.URLEncode(edcal.getDayFromDayId(date).toString("yyyy-MM-dd") + " 10:00:00");
         var url = edcal.ajax_url + "?action=edcal_newdraft&date=" + formattedDate;

         jQuery.ajax( { 
            url: url,
            type: "POST",
            processData: false,
            timeout: 100000,
            dataType: "json",
            success: function(res) {
                window.location = res.editlink.replace("&amp;", "&");
            },
            error:  function(xhr) {
                 edcal.showError("There was an error contacting your blog.");
                 if (xhr.responseText) {
                     output("xhr.responseText: " + xhr.responseText);
                 }
            }
        });
    },
    
    /*
       This function makes an AJAX call and changes the date of
       the specified post on the server.
     */
    changeDate: function(/*string*/ newdate, /*Post*/ post) {
         var newdateFormatted = edcal.getDayFromDayId(newdate).toString("yyyy-MM-dd");

         var postStatus = "";

         if (post.status === "draft") {
             /*
              * If the status of the post was a draft we leave it as a draft
              */
             postStatus = "draft";
         } else if (post.status === "pending") {
             /*
              * If the status of the post was a pending we leave it as a draft
              */
             postStatus = "pending";
         } else {
             /*
                If the post status was published or future we need to adjust
                it.  If you take a post that is published a move it after
                the current day we change the status to future.  If the post
                was scheduled to get published in the future and they drag
                it into the past we change the status to publish.
              */
             var compare = Date.parse(newdateFormatted).compareTo(Date.today());
             if (compare === -1) {
                 if (post.status === "publish") {
                     postStatus = "publish";
                 } else {
                     postStatus = "draft";
                 }
                 
             } else {
                 postStatus = "future";
             }
         }

         var url = edcal.ajax_url + "?action=edcal_changedate&postid=" + post.id + 
             "&postStatus=" + postStatus + 
             "&newdate=" + newdateFormatted + "&olddate=" + edcal.getDayFromDayId(post.date).toString("yyyy-MM-dd");

         jQuery("#post-" + post.id).addClass("loadingclass");

         jQuery.ajax( { 
            url: url,
            type: "POST",
            processData: false,
            timeout: 100000,
            dataType: "json",
            success: function(res) {
                edcal.removePostItem(res.post.date, "post-" + res.post.id);
                edcal.addPostItem(res.post, res.post.date);
                edcal.addPostItemDragAndToolltip(res.post.date);

                if (res.error) {
                    /*
                     * If there was an error we need to remove the dropped
                     * post item.
                     */
                    edcal.removePostItem(newdate, "post-" + res.post.id);
                    if (res.error === edcal.CONCURRENCY_ERROR) {
                        edcal.showError("Someone else already moved " + res.post.title);
                    } else if (res.error === edcal.PERMISSION_ERROR) {
                        edcal.showError("You don't have permission to edit posts");
                    }
                }
            },
            error:  function(xhr) {
                 edcal.showError("There was an error contacting your blog.");
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
         //output("getPosts(" + from.toString("dd-MMM-yyyy") + ", " + to.toString("dd-MMM-yyyy") + ")");
         
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
             timeout: 100000,
             dataType: "text",
             success: function(res) {
                jQuery("#loading").hide();

                /*
                 * These result here can get pretty large on a busy blog and
                 * the JSON parser from JSON.org works faster than the native
                 * one used by JQuery.
                 */
                var parsedRes = JSON.parseIt(res);
                var postDates = [];
                jQuery.each(parsedRes, function(i, post) {
                    if (post) {
                        edcal.removePostItem(post.date, "post-" + post.id);
                        edcal.addPostItem(post, post.date);
                        postDates[postDates.length] = post.date;
                    }
                });

                /*
                 * If the blog has a very larger number of posts then adding
                 * them all can make the UI a little slow.  Particularly IE 
                 * pops up a warning giving the user a chance to abort the 
                 * script.  Adding tooltips and making the items draggable is
                 * a lot of what makes things slow.  Delaying those two operations
                 * makes the UI show up much faster and the user has to wait
                 * three seconds before they can drag.  It also makes IE
                 * stop complaining.
                 */
                setTimeout(function() {
                    output("adding tooltips and draggables to " + postDates.length + " items.");
                    jQuery.each(postDates, function(i, postDate) {
                        edcal.addPostItemDragAndToolltip(postDate);
                    });
                }, 300);
             },
             error:  function(xhr) {
                edcal.showError("There was an error contacting your blog.");
                if (xhr.responseText) {
                    output("xhr.responseText: " + xhr.responseText);
                }
            }
        });
    }
};

jQuery(document).ready(function(){
    edcal.init();
});

/*
 * This code is from the JQuery URL Encode plugin (http://plugins.jquery.com/project/URLEncode);
 */
jQuery.extend({URLEncode:function(c){var o='';var x=0;c=c.toString();var r=/(^[a-zA-Z0-9_.]*)/;
  while(x<c.length){var m=r.exec(c.substr(x));
    if(m!==null && m.length>1 && m[1]!=''){o+=m[1];x+=m[1].length;
    }else{if(c[x]===' '){o+='+';}else{var d=c.charCodeAt(x);var h=d.toString(16);
    o+='%'+(h.length<2?'0':'')+h.toUpperCase();}x++;}}return o;},
URLDecode:function(s){var o=s;var binVal,t;var r=/(%[^%]{2})/;
  while((m=r.exec(o))!==null && m.length>1 && m[1]!==''){b=parseInt(m[1].substr(1),16);
  t=String.fromCharCode(b);o=o.replace(m[1],t);}return o;}
});

