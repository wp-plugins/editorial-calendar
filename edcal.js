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
       This value is the number of weeks the user wants to see at one time
       in the calendar.
     */
    weeksPref: 3,
    /*
     * True if the calendar is in the process of moving
     */
    isMoving: false,

    /*
     * True if we are in the middle of dragging a post
     */
    inDrag: false,
    
    /*
       True if the calendar is in the process of queueing scrolling
       during a drag.
     */
    isDragScrolling: false,
        
    /*
       This is the position of the calendar.  It is an array with
       two fields:  top and bottom.
     */
    position: null,

    /*
     * This is the first date of the current month
     */
    firstDayOfMonth: null,

    /*
     * This is the first day of the next month
     */
    firstDayOfNextMonth: null,

    wp_dateFormat: "yyyy-MM-dd",
        
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
     * The constant for the nonce error
     */
    NONCE_ERROR: 6,
    
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
        edcal.alignGrid("#cal", 1, 100, (100 / edcal.weeksPref) - 1, 1);         
    },

    
    /*
       This function creates the days header at the top of the
       calendar.
     */
    createDaysHeader: function() {
        var html = '<div class="dayheadcont"><div class="dayhead firstday">' + edcal.str_day1 + '</div>';
        html += '<div class="dayhead">' + edcal.str_day2 + '</div>';
        html += '<div class="dayhead">' + edcal.str_day3 + '</div>';
        html += '<div class="dayhead">' + edcal.str_day4 + '</div>';
        html += '<div class="dayhead">' + edcal.str_day5 + '</div>';
        html += '<div class="dayhead">' + edcal.str_day6 + '</div>';
        html += '<div class="dayhead lastday">' + edcal.str_day7 + '</div></div>';
        
        jQuery("#cal_cont").prepend(html);
        
        edcal.alignGrid(".dayheadcont", 7, 13.9, 100, 0.5);
    },

    /*
       We have different styles for days in previous months,
       the current month, and future months.  This function
       figures out the right class based on the date.
     */
    getDateClass: function(/*Date*/ date) {
         if (!edcal.firstDayOfMonth) {
             /*
              * We only need to figure out the first and last day 
              * of the month once
              */
             edcal.firstDayOfMonth = Date.today().moveToFirstDayOfMonth().clearTime();
             edcal.firstDayOfNextMonth = Date.today().moveToLastDayOfMonth().clearTime();
         }

         if (date.between(edcal.firstDayOfMonth, edcal.firstDayOfNextMonth)) {
             /*
              * If the date isn't before the first of the 
              * month and it isn't after the last of the 
              * month then it is in the current month.
              */
             return "month-present";
         } else if (date.compareTo(edcal.firstDayOfMonth) == 1) {
             /*
              * Then the date is after the current month
              */
             return "month-future";
         } else if (date.compareTo(edcal.firstDayOfNextMonth) == -1) {
             /*
              * Then the date is before the current month
              */
             return "month-past";
         }
    },

    /*
       Show the add post link.  This gets called when the mouse
       is over a specific day.
     */
    showAddPostLink: function(/*string*/ dayid) {
         if (edcal.inDrag) {
             return;
         }

         var createLink = jQuery("#" + dayid + " .daynewlink");
         createLink.css("display", "block");
         edcal.addCreateTooltip(createLink);
    },

    /*
       Hides the add new post link it is called when the mouse moves
       outside of the calendar day.
     */
    hideAddPostLink: function(/*string*/ dayid) {
         jQuery("#" + dayid + " .daynewlink").hide();
    },
    
    /*
       Creates a row of the calendar and adds all of the CSS classes
       and listeners for each calendar day.
     */
    createRow: function(/*jQuery*/ parent, /*bool*/ append) {
        var _date = edcal._wDate.clone();
        
        var newrow = '<div class="rowcont" id="' + 'row' + edcal._wDate.toString("ddMMyyyy") + '">' + 
                     '<div id="' + 'row' + edcal._wDate.toString("ddMMyyyy") + 'row" class="row">';
        for (var i = 0; i < 7; i++) {
            /*
             * Adding all of these calls in the string is kind of messy.  We
             * could do this with the JQuery live function, but there are a lot
             * of days in the calendar and the live function gets a little slow.
             */
            newrow += '<div onmouseover="edcal.showAddPostLink(\'' + _date.toString("ddMMyyyy") + '\');" ' + 
                      'onmouseout="edcal.hideAddPostLink(\'' + _date.toString("ddMMyyyy") + '\');" ' + 
                      'id="' + _date.toString("ddMMyyyy") + '" class="day ' + 
                      edcal.getDateClass(_date) + ' ' + 
                      _date.toString("dddd").toLowerCase() + ' month-'   + 
                      _date.toString("MM").toLowerCase() + '">';
            
            newrow += '<div class="dayobj">';

            newrow += '<a href="#" adddate="' + _date.toString("MMMM d") + '" class="daynewlink" title="' + edcal.str_newpost + _date.toString("MMMM d") + '" ' + 
                         'onclick="return false;">' + edcal.str_addPostLink + '</a>';
            
            newrow += '<div class="daylabel">';
            if (_date.toString("dd") == "01") {
                newrow += _date.toString("MMM d");
            } else {
                newrow += _date.toString("d");
            }
            newrow += '</div>';

            newrow += '<ul class="postlist">';

            newrow += edcal.getPostItems(_date.toString("ddMMyyyy"));
            
            newrow += '</ul>';
            
            newrow += '</div>';
            newrow += '</div>';
            _date.add(1).days();
        }
        
        newrow += '</div></div>';
        
        if (append) {
            parent.append(newrow);
            
        } else {
            parent.prepend(newrow);
        }
        
        /*
         * This is the horizontal alignment of an individual week
         */
        edcal.alignGrid("#row" + edcal._wDate.toString("ddMMyyyy") + "row", 7, 13.9, 100, 0.5);
        
        edcal.draggablePost('#row' + edcal._wDate.toString("ddMMyyyy") + ' .post');

        jQuery('#row' + edcal._wDate.toString("ddMMyyyy") + ' .day').droppable({
            hoverClass: 'day-active',
            accept: function(ui) {
                /*
                 * We only let them drag draft posts into the past.  If
                 * they try to drag and scheduled post into the past we
                 * reject the drag
                 */
                if (jQuery(this).hasClass("month-past")) {
                    if (ui.hasClass("draft")) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return true;
                }
            },
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

        return jQuery('row' + edcal._wDate.toString("ddMMyyyy"));
    },

    /*
     * This is a helper method to make an individual post item draggable.
     */
    draggablePost: function(/*post selector*/ post) {
         jQuery(post).each(function() {
             var postObj = edcal.findPostForId(jQuery(this).parent().parent().parent().attr("id"), 
                                               jQuery(this).attr("id"));
             if (edcal.isPostEditable(postObj)) {
                 jQuery(this).draggable({ 
                     revert: 'invalid',
                     appendTo: 'body',
                     helper: "clone",
                     distance: 0,
                     addClasses: false,
                     start: function() {
                       edcal.inDrag = true;
                     },
                     stop: function() {
                       edcal.inDrag = false;
                     },
                     drag: function(event, ui) {
                        edcal.handleDrag(event, ui);
                     },
                     scroll: false,
                     refreshPositions: true
                 });
                 jQuery(this).addClass("draggable");
             }
         });
    },

    /*
       When the user is dragging we scroll the calendar when they get
       close to the top or bottom of the calendar.  This function handles
       scrolling the calendar when that happens.
     */
    handleDrag: function(event, ui) {
         if (edcal.isMoving || edcal.isDragScrolling) {
             return;
         }

         edcal.isDragScrolling = true;
         
         if (event.pageY < (edcal.position.top + 10)) {
             /*
                This means we're close enough to the top of the calendar to
                start scrolling up.
              */
             edcal.move(1, false);
         } else if (event.pageY > (edcal.position.bottom - 10)) {
             /*
                This means we're close enough to the bottom of the calendar
                to start scrolling down.
              */
             edcal.move(1, true);
         }

         /*
            We want to start scrolling as soon as the user gets their mouse
            close to the top, but if we just scrolle with every event then
            the screen flies by way too fast.  We wait here so we scroll one
            row and wait three quarters of a second.  That way it gives a
            smooth scroll that doesn't go too fast to track.
          */
         setTimeout(function() {
             edcal.isDragScrolling = false;
         }, 500);
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
     * Adds a post to an already existing calendar day.
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
    },

    /*
     * Confirms if you want to delete the specified post
     */
    confirmDelete: function(/*string*/ posttitle) {
         if (confirm(edcal.str_del_msg1 + posttitle + edcal.str_del_msg2)) {
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
         edcal.output("Saving the new title " + jQuery("#edcal-title-edit-field").val() + " for post " + postId);
         var url = edcal.ajax_url + "&action=edcal_changetitle&postid=" + postId + 
             "&title=" + encodeURIComponent(jQuery("#edcal-title-edit-field").val());

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
                if (res.error) {
                    /*
                     * If there was an error we need to remove the dropped
                     * post item.
                     */
                    if (res.error === edcal.NONCE_ERROR) {
                        edcal.showError(edcal.checksum_error);
                    }
                }
                edcal.addPostItem(res.post, res.post.date);
                edcal.addPostItemDragAndToolltip(res.post.date);
            },
            error: function(xhr) {
                 edcal.showError(edcal.general_error);
                 if (xhr.responseText) {
                     edcal.output("xhr.responseText: " + xhr.responseText);
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
     * Adds a tooltip to every add post link
     */
    addCreateTooltip: function(/*JQuery*/ createLink) {
         if (createLink.hasClass('hasTooltip')) {
             return;
         }
         
         var date = createLink.parent().parent().attr("id");
         
         
         createLink.tooltip({ 
             delay: 1500, 
             bodyHandler: function() {
                 var tooltip = '<div class="tooltip newposttip">' + 
                                   '<a href="#" id="tipclose" onclick="jQuery(\'#tooltip\').hide(); return false;" title="close"> </a>' + 
                                   '<h3>' + edcal.str_newpost + createLink.attr("adddate") + '</h3>' + 
                                   '<div id="edcal-title-new-section">' + 
                                       edcal.str_posttitle + '<br />' + 
                                       '<input type="text" class="text_input" id="edcal-title-new-field"/>' + 
                                   '</div>' + 
                                   '<div id="edit-slug-buttons">' + 
                                       '<a class="save button disabled" id="newPostButton" href="#" adddate="' + date + '">' + edcal.str_savedraft + '</a> ' + 
                                       '<a class="save button disabled" id="newPostEditButton" href="#" adddate="' + date + '">' + edcal.str_saveandedit + '</a> ' + 
                                       '<a href="#" onclick="jQuery(\'#tooltip\').hide(); return false;" class="cancel">' + edcal.str_cancel + '</a>' + 
                                   '</div>' + 
                               '</div>';
                 return tooltip;
             },
             showHandler: function() {
                  /*
                   * Put the focus in the post title field when the tooltip opens.
                   */
                  jQuery("#edcal-title-new-field").focus();
                  jQuery("#edcal-title-new-field").select();
             }
         });
         
         createLink.addClass('hasTooltip');
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
       When you hover your mouse over a post we show the edit, delete,
       and view links below it.  If there was another post below we don't
       want it to jump around.  To make that work we set a padding on the
       bottom of the post equal to the height of the div containing
       the links.  When the div is shown we remove the padding on the
       bottom.
     
       This function determines the right size for that padding.  We
       call it once when we first get posts and again if we resize the
       window.  The boolean indicates which case this is.
     */
    updatePostPadding: function(/*boolean*/ resized) {
         if (resized || !edcal.actionButtonHeight) {
             edcal.actionButtonHeight = jQuery(".postactions").height();
             jQuery(".post").css("padding-bottom", edcal.actionButtonHeight + "px");
         }
    },

    /*
       This function shows the action links for the post with the
       specified ID.
     */
    showActionLinks: function(/*string*/ postid) {
         if (edcal.inDrag) {
             return;
         }
         jQuery('#' + postid).css({
             'padding-bottom': '0px'
         });
         jQuery('#' + postid + ' .postactions').show();
    }, 

    /*
       Hides the action links for the post with the specified
       post ID.
     */
    hideActionLinks: function(/*string*/ postid) {
         jQuery('#' + postid).css({
             'padding-bottom': edcal.actionButtonHeight + "px"
         });
         jQuery('#' + postid + ' .postactions').hide();
    },

    /*
     * Returns true if the post is editable and false otherwise
     */
    isPostEditable: function(/*post*/ post) {
         return post.status !== 'publish';
    },
    
    /*
     * Gets the HTML string for a post.
     */
    getPostItemString: function(/*post*/ post) {
         var posttitle = post.title;

         if (posttitle === "") {
             posttitle = "[No Title]";
         }

         if (post.status === "draft" ||
             post.status === "pending") {
             posttitle += edcal.str_draft;
         }

         posttitle = '<span class="posttime">' + post.formattedtime + '</span> ' + posttitle;

         if (edcal.isPostEditable(post)) {
             return '<li onmouseover="edcal.showActionLinks(\'post-' + post.id + '\');" ' + 
                 'onmouseout="edcal.hideActionLinks(\'post-' + post.id + '\');" ' + 
                 'id="post-' + post.id + '" class="post ' + post.status + '"><div class="postlink">' + posttitle + '</div>' + 
                 '<div class="postactions"><a href="' + post.editlink + '">' + edcal.str_edit + '</a> | ' +
                 '<a href="' + post.dellink + '" onclick="return edcal.confirmDelete(\'' + post.title + '\');">' + edcal.str_del + '</a> | ' +
                 '<a href="' + post.permalink + '">' + edcal.str_view + '</a>'  + 
                 '</div></li>';
         } else {
             return '<li onmouseover="edcal.showActionLinks(\'post-' + post.id + '\');" ' + 
                 'onmouseout="edcal.hideActionLinks(\'post-' + post.id + '\');" ' + 
                 'id="post-' + post.id + '" class="post ' + post.status + '"><div class="postlink">' + posttitle + '</div>' + 
                 '<div class="postactions"><a href="' + post.editlink + '">' + edcal.str_republish + '</a>' +
                 '</div></li>';
         }
    },
    
    /*
       Finds the calendar cell for the current day and adds the
       class "today" to that cell.
     */
    setClassforToday: function() {
        /*
           We want to set a class for the cell that represents the current day so we can
           give it a background color.
         */
        jQuery('#' + Date.today().toString("ddMMyyyy")).addClass("today");
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
                edcal._wDate = edcal._wDate.add((edcal.weeksPref + 7) * 7).days();
            } else {                // into the past
                edcal._wDate = edcal._wDate.add(-((edcal.weeksPref + 7) * 7)).days();
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
         return Date.parseExact(day.substring(2, 4) + '/' + day.substring(0, 2) + '/' + day.substring(4), "MM/dd/yyyy");
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
        var lastDate = edcal.getDayFromDayId(items.eq(edcal.weeksPref - 1).children(".row").children(".day:last").attr("id"));
        
        jQuery("#currentRange").text(firstDate.toString("MMMM yyyy") + " - " + lastDate.toString("MMMM yyyy"));
    },

    /*
     * We want the calendar to start on the day of the week that matches the country
     * code in the locale.  If their full locale is en-US, that means the country
     * code is US.  
     *
     * This is the full list of start of the week days from unicode.org
     * http://unicode.org/repos/cldr/trunk/common/supplemental/supplementalData.xml
     */
    nextStartOfWeek: function(/*date*/ date) {
         if (edcal.locale) {
             var local = edcal.locale.toUpperCase();

             if (edcal.endsWith(local, "AS") ||
                 edcal.endsWith(local, "AZ") ||
                 edcal.endsWith(local, "BW") ||
                 edcal.endsWith(local, "CA") ||
                 edcal.endsWith(local, "CN") ||
                 edcal.endsWith(local, "FO") ||
                 edcal.endsWith(local, "GB") ||
                 edcal.endsWith(local, "GE") ||
                 edcal.endsWith(local, "GL") ||
                 edcal.endsWith(local, "GU") ||
                 edcal.endsWith(local, "HK") ||
                 edcal.endsWith(local, "IE") ||
                 edcal.endsWith(local, "IL") ||
                 edcal.endsWith(local, "IN") ||
                 edcal.endsWith(local, "IS") ||
                 edcal.endsWith(local, "JM") ||
                 edcal.endsWith(local, "JP") ||
                 edcal.endsWith(local, "KG") ||
                 edcal.endsWith(local, "KR") ||
                 edcal.endsWith(local, "LA") ||
                 edcal.endsWith(local, "MH") ||
                 edcal.endsWith(local, "MN") ||
                 edcal.endsWith(local, "MO") ||
                 edcal.endsWith(local, "MP") ||
                 edcal.endsWith(local, "MT") ||
                 edcal.endsWith(local, "NZ") ||
                 edcal.endsWith(local, "PH") ||
                 edcal.endsWith(local, "PK") ||
                 edcal.endsWith(local, "SG") ||
                 edcal.endsWith(local, "SY") ||
                 edcal.endsWith(local, "TH") ||
                 edcal.endsWith(local, "TT") ||
                 edcal.endsWith(local, "TW") ||
                 edcal.endsWith(local, "UM") ||
                 edcal.endsWith(local, "US") ||
                 edcal.endsWith(local, "UZ") ||
                 edcal.endsWith(local, "VI") ||
                 edcal.endsWith(local, "ZW")) {
                 return date.next().sunday();
             } else if (edcal.endsWith(local, "MV")) {
                 return date.next().friday();
             } else if (edcal.endsWith(local, "AF") ||
                        edcal.endsWith(local, "BH") ||
                        edcal.endsWith(local, "DJ") ||
                        edcal.endsWith(local, "DZ") ||
                        edcal.endsWith(local, "EG") ||
                        edcal.endsWith(local, "ER") ||
                        edcal.endsWith(local, "ET") ||
                        edcal.endsWith(local, "IQ") ||
                        edcal.endsWith(local, "IR") ||
                        edcal.endsWith(local, "JO") ||
                        edcal.endsWith(local, "KE") ||
                        edcal.endsWith(local, "KW") ||
                        edcal.endsWith(local, "LY") ||
                        edcal.endsWith(local, "MA") ||
                        edcal.endsWith(local, "OM") ||
                        edcal.endsWith(local, "QA") ||
                        edcal.endsWith(local, "SA") ||
                        edcal.endsWith(local, "SD") ||
                        edcal.endsWith(local, "SO") ||
                        edcal.endsWith(local, "TN") ||
                        edcal.endsWith(local, "YE")) {
                 return date.next().saturday();
             } else {
                 return date.next().monday();
             }
         } else {
             /*
              * If we have no locale set we'll assume American style
              */
             return date.next().sunday();
         }
    },

    /*
     * Just a little helper function to tell if a given string (str)
     * ends with the given expression (expr).  I could adding this 
     * function to the JavaScript string object, but I don't want to
     * risk conflicts with other plugins.
     */
    endsWith: function(/*string*/ str, /*string*/ expr) {
         return (str.match(expr+"$")==expr);
    },
    
    /*
     * Moves the calendar to the specified date.
     */
    moveTo: function(/*Date*/ date) {
         edcal.isMoving = true;
         jQuery("#cal").empty();
         
         /*
           When we first start up our working date is 4 weeks before
           the next Sunday. 
         */
        edcal._wDate = edcal.nextStartOfWeek(date).add(-21).days();
        
        /*
           After we remove and redo all the rows we are back to
           moving in a going down direction.
         */
        edcal.currentDirection = true;
        
        for (var i = 0; i < edcal.weeksPref + 6; i++) {
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
       When we handle dragging posts we need to know the size
       of the calendar so we figure it out ahead of time and
       save it.
     */
    savePosition: function() {
         var cal = jQuery("#edcal_scrollable");
         edcal.position = {
             top: cal.offset().top,
             bottom: cal.offset().top + cal.height()
         }

         edcal.updatePostPadding(true);
    },
    
    /*
     * Initializes the calendar
     */
    init: function() {
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
                                    size: edcal.weeksPref,
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
            /*
             * Some times for reasons I haven't been able to figure out
             * the direction is an int instead of a boolean.  I don't
             * know why, but this works around it.
             */
            if (direction === 1) {
                direction = false;
            } else if (direction === 3) {
                direction = true;
            }
            
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
                edcal.move(edcal.weeksPref, true);
                return false;
            } else if ((evt.keyCode === 33 && !(evt.altKey || evt.ctrlKey)) || //page up
                evt.keyCode === 38 && evt.ctrlKey){                            // Ctrl+up up arrow
                edcal.move(edcal.weeksPref, false);
                return false;
            } else if (evt.keyCode === 27) { //escape key
                edcal.closeTooltip();
                return false;
            }
        });

        edcal.getPosts(edcal.nextStartOfWeek(Date.today()).add(-21).days(), 
                       edcal.nextStartOfWeek(Date.today()).add((edcal.weeksPref * 7) + 21).days());
        
        /*
           Now we bind the listeners for all of our links and the window
           resize.
         */
        jQuery("#moveToToday").click(function() {
            edcal.moveTo(Date.today());
            return false;
        });
    
        jQuery("#prevmonth").click(function() {
            edcal.move(edcal.weeksPref, false);
            return false;
        });
    
        jQuery("#nextmonth").click(function() {
            edcal.move(edcal.weeksPref, true);
            return false;
        });
        
        function resizeWindow(e) {
            if (edcal.windowHeight != jQuery(window).height()) {
                jQuery("#edcal_scrollable").css("height", edcal.getCalHeight() + "px");
                edcal.windowHeight = jQuery(window).height();
                edcal.savePosition();
            }
        }
        jQuery(window).bind("resize", resizeWindow);

        jQuery("#newPostButton").live("click", function(evt) {
            edcal.createNewDraft(jQuery(this).attr("adddate"), jQuery("#edcal-title-new-field").val(), false);
        });
        
        jQuery("#newPostEditButton").live("click", function(evt) {
            edcal.createNewDraft(jQuery(this).attr("adddate"), jQuery("#edcal-title-new-field").val(), true);
        });

        jQuery("#edcal-title-new-field").live("keyup", function(evt) {
            if (jQuery("#edcal-title-new-field").val().length > 0) {
                jQuery("#newPostButton").removeClass("disabled");
                jQuery("#newPostEditButton").removeClass("disabled");
            } else {
                jQuery("#newPostButton").addClass("disabled");
                jQuery("#newPostEditButton").addClass("disabled");
            }

            if (evt.keyCode == 13) {    // enter key
                /*
                 * If the user presses enter we want to save the draft.
                 */
                edcal.createNewDraft(jQuery("#newPostButton").attr("adddate"), jQuery("#edcal-title-new-field").val(), false);
            }
        });

        jQuery("#edcal-title-edit-field").live("keyup", function(evt) {
            if (evt.keyCode == 13) {    // enter key
                /*
                 * If the user presses enter we want to save the post title.
                 */
                edcal.saveTitle(jQuery(this).attr("postid"));
            }

        });
        
        jQuery("#edcal_weeks_pref").live("keyup", function(evt) {
            if (jQuery("#edcal_weeks_pref").val().length > 0) {
                jQuery("#edcal_applyoptions").removeClass("disabled");
            } else {
                jQuery("#edcal_applyoptions").addClass("disabled");
            }
            
            if (evt.keyCode == 13) {    // enter key
                edcal.saveOptions();
            }

        });

        edcal.savePosition();
        
        edcal.addOptionsSection();
    },

    /*
     * When the user presses the new post link on each calendar cell they get
     * a tooltip which prompts them to edit the title of the new post.  Once
     * they provide a title we call this function.
     * 
     * date - the date for the new post
     * title - the title for the new post
     * doEdit - should we edit the post immediately?  if true we send the user
     *          to the edit screen for their new post.
     */
    createNewDraft: function(/*string*/ date, /*string*/ title, /*boolean*/ doEdit) {
         if (!title || title === "") {
             return;
         }
         edcal.output("createNewDraft(" + date + ", " + title + ")");

         jQuery("#edit-slug-buttons").addClass("tiploading");
         /*
          * We don't really let them set a time in the calendar, so we 
          * put a default post time of 10:00 AM.
          */
         var formattedDate = encodeURIComponent(edcal.getDayFromDayId(date).toString(edcal.wp_dateFormat) + " 10:00:00");
         var url = edcal.ajax_url + "&action=edcal_newdraft&date=" + formattedDate + "&title=" + 
             encodeURIComponent(title);

         jQuery.ajax( { 
            url: url,
            type: "POST",
            processData: false,
            timeout: 100000,
            dataType: "json",
            success: function(res) {
                jQuery("#edit-slug-buttons").removeClass("tiploading");
                jQuery('#tooltip').hide();
                if (res.error) {
                    /*
                     * If there was an error we need to remove the dropped
                     * post item.
                     */
                    if (res.error === edcal.NONCE_ERROR) {
                        edcal.showError(edcal.checksum_error);
                    }
                    return;
                }
                
                if (!res.post) {
                    edcal.showError("There was an error creating a new post for your blog.");
                } else {
                    if (doEdit) {
                        /*
                         * If the user wanted to edit the post then we redirect
                         * them to the edit page.
                         */
                        window.location = res.post.editlink.replace("&amp;", "&");
                    } else {
                        edcal.addPostItem(res.post, res.post.date);
                        edcal.addPostItemDragAndToolltip(res.post.date);
                    }
                }
            },
            error: function(xhr) {
                 jQuery("#edit-slug-buttons").removeClass("tiploading");
                 jQuery('#tooltip').hide();
                 edcal.showError(edcal.general_error);
                 if (xhr.responseText) {
                     edcal.output("xhr.responseText: " + xhr.responseText);
                 }
            }
        });
    },
    
    /*
       This function makes an AJAX call and changes the date of
       the specified post on the server.
     */
    changeDate: function(/*string*/ newdate, /*Post*/ post) {
         edcal.output('Changing the date of "' + post.title + '" to ' + newdate);
         var newdateFormatted = edcal.getDayFromDayId(newdate).toString(edcal.wp_dateFormat);

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
             var compare = Date.parseExact(newdateFormatted, edcal.wp_dateFormat).compareTo(Date.today());
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

         var url = edcal.ajax_url + "&action=edcal_changedate&postid=" + post.id + 
             "&postStatus=" + postStatus + 
             "&newdate=" + newdateFormatted + "&olddate=" + edcal.getDayFromDayId(post.date).toString(edcal.wp_dateFormat);

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
                        edcal.showError(edcal.concurrency_error + '<br />' + res.post.title);
                    } else if (res.error === edcal.PERMISSION_ERROR) {
                        edcal.showError(edcal.edcal.permission_error);
                    } else if (res.error === edcal.NONCE_ERROR) {
                        edcal.showError(edcal.checksum_error);
                    }
                }
            },
            error: function(xhr) {
                 edcal.showError(edcal.general_error);
                 if (xhr.responseText) {
                     edcal.output("xhr.responseText: " + xhr.responseText);
                 }
            }
        });

    },
    
    /*
       Makes an AJAX call to get the posts from the server within the
       specified dates.
     */
    getPosts: function(/*Date*/ from, /*Date*/ to) {
         edcal.output("Getting posts from " + from.toString("dd-MMM-yyyy") + " to " + to.toString("dd-MMM-yyyy"));
         
         var shouldGet = edcal.cacheDates[from];

         if (shouldGet) {
             /*
              * TODO: We don't want to make extra AJAX calls for dates
              * that we have already covered.  This is cutting down on
              * it somewhat, but we could get much better about this.
              */
             edcal.output("Using cached results for posts from " + from.toString("dd-MMM-yyyy") + " to " + to.toString("dd-MMM-yyyy"));
             return;
         }

         edcal.cacheDates[from] = true;


         var url = edcal.ajax_url + "&action=edcal_posts&from=" + from.toString("yyyy-MM-dd") + "&to=" + to.toString("yyyy-MM-dd");
         
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
                
                if (parsedRes.error) {
                    /*
                     * If there was an error we need to remove the dropped
                     * post item.
                     */
                    if (parsedRes.error === edcal.NONCE_ERROR) {
                        edcal.showError(edcal.checksum_error);
                    }
                    return;
                }
                var postDates = [];
                
                /*
                   We get the posts back with the most recent post first.  That
                   is what most blogs want.  However, we want them in the other
                   order so we can show the earliest post in a given day first.
                 */
                for (var i = parsedRes.length; i >= 0; i--) {
                    var post = parsedRes[i];
                    if (post) {
                        if (post.status === 'trash') {
                            continue;
                        }

                        /*
                         * In some non-English locales the date comes back as all lower case.
                         * This is a problem since we use the date as the ID so we replace
                         * the first letter of the month name with the same letter in upper
                         * case to make sure we don't get into trouble.
                         */
                        post.date = post.date.replace(post.date.substring(2, 3), post.date.substring(2, 3).toUpperCase());
                        
                        edcal.removePostItem(post.date, "post-" + post.id);
                        edcal.addPostItem(post, post.date);
                        postDates[postDates.length] = post.date;
                    }
                }

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
                    edcal.output("Finished adding draggable support to " + postDates.length + " posts.");
                    jQuery.each(postDates, function(i, postDate) {
                        edcal.addPostItemDragAndToolltip(postDate);
                    });
                    edcal.updatePostPadding(false);
                }, 300);
             },
             error: function(xhr) {
                edcal.showError(edcal.general_error);
                if (xhr.responseText) {
                    edcal.output("xhr.responseText: " + xhr.responseText);
                }
            }
        });
    },
    
    /*
       This function adds the scren options tab to the top of the screen.  I wish
       WordPress had a hook so I could provide this in PHP, but as of version 2.9.1
       they just have an internal loop for their own screen options tabs so we're
       doing this in JavaScript.
     */
    addOptionsSection: function() {
         var html = 
             '<div class="hide-if-no-js screen-meta-toggle" id="screen-options-link-wrap">' + 
                '<a class="show-settings" ' + 
                   'id="show-edcal-settings-link" ' + 
                   'onclick="edcal.toggleOptions(); return false;" ' + 
                   'href="#screen-options" ' + 
                   'style="background-image: url(images/screen-options-right.gif);">' + edcal.str_screenoptions + '</a>' + 
             '</div>';
         
         jQuery("#screen-meta-links").append(html);
    },
    
    /*
       Respond to clicks on the Screen Options tab by sliding it down when it
       is up and sliding it up when it is down.
     */
    toggleOptions: function() {
         if (!edcal.helpMeta) {
             /*
                Show the screen options section.  We start by saving off the old HTML
              */
             edcal.helpMeta = jQuery("#contextual-help-wrap").html();
             
             jQuery("#contextual-help-wrap").html(
                 '<h5>' + edcal.str_optionsheader + '</h5>' + 
                 '<div class="metabox-prefs">' + 
                    edcal.str_show + '<input type="text" value="' + edcal.weeksPref + '" ' + 
                                            'maxlength="1" width="2" id="edcal_weeks_pref" ' + 
                                            'class="screen-per-page" title="' + edcal.str_weekstt + '" /> ' +
                    edcal.str_show2 + '<br /><br />' + 
                    '<button id="edcal_applyoptions" onclick="edcal.saveOptions(); return false;" class="save button">' + edcal.str_apply + '</button>' +
                 '</div>');
             
             jQuery("#contextual-help-link-wrap").hide();
             
             jQuery('#contextual-help-wrap').slideDown('normal');
             
             jQuery("#show-edcal-settings-link").css("background-image", "url(images/screen-options-right-up.gif)");
         } else {
             jQuery('#contextual-help-wrap').slideUp('fast');
             
             /*
              * restore the old HTML
              */
             jQuery("#contextual-help-wrap").html(edcal.helpMeta);
             
             edcal.helpMeta = null;
             
             jQuery("#show-edcal-settings-link").css("background-image", "url(images/screen-options-right.gif)");
             jQuery("#contextual-help-link-wrap").show();
         }
    },
    
    /*
       Save the number of weeks options with an AJAX call.  This happens
       when you press the apply button.
     */
    saveOptions: function() {
         /*
            We start by validating the number of weeks.  We only allow
            1, 2, 3, 4, or 5 weeks at a time.
          */
         if (jQuery("#edcal_weeks_pref").val() !== '1' &&
             jQuery("#edcal_weeks_pref").val() !== '2' &&
             jQuery("#edcal_weeks_pref").val() !== '3' &&
             jQuery("#edcal_weeks_pref").val() !== '4' &&
             jQuery("#edcal_weeks_pref").val() !== '5') {
             humanMsg.displayMsg(edcal.str_weekserror);
             return;
         }
         
         var url = edcal.ajax_url + "&action=edcal_saveoptions&weeks=" + 
             encodeURIComponent(jQuery("#edcal_weeks_pref").val());
         
         jQuery.ajax( { 
             url: url,
             type: "POST",
             processData: false,
             timeout: 100000,
             dataType: "text",
             success: function(res) {
                /*
                   Now we refresh the page because I'm too lazy to
                   make changing the weeks work inline.
                 */
                window.location.href = window.location.href;
             },
             error: function(xhr) {
                edcal.showError(edcal.general_error);
                if (xhr.responseText) {
                    edcal.output("xhr.responseText: " + xhr.responseText);
                }
            }
        });
    },
    
    /**
     * Outputs info messages to the Firebug console if it is available.
     * 
     * @param msg    the message to write
     */
    output: function(msg) {
        if (window.console) {
            console.info(msg);
        }
    },
    
    /*
     * Shows an error message and sends the message as an error to the 
     * Firebug console if it is available.
     */
    showError: function(/*string*/ msg) {
        if (window.console) {
            console.error(msg);
        }
        humanMsg.displayMsg(msg);
    }
};

jQuery(document).ready(function(){
    edcal.init();
});
