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
 * This file contains unit tests for the editorial calendar.  It is only loaded
 * if you add the qunit=true parameter to the URL for the calendar.
 */

var edcal_test = {
    runTests: function() {
        jQuery("head").append("<link>");
        css = jQuery("head").children(":last");
        css.attr({
            rel:  "stylesheet",
            type: "text/css",
            href: "../wp-content/plugins/edcal/lib/qunit.css"
        });

        jQuery("#wpbody-content .wrap").append('<div id="edcal-qunit"></div>');

        jQuery("#edcal-qunit").append('<h1 id="qunit-header">WordPress Editorial Calendar Unit Tests</h1>' + 
                                      '<h2 id="qunit-banner"></h2>' + 
                                      '<h2 id="qunit-userAgent"></h2>' + 
                                      '<ol id="qunit-tests"></ol>');


        edcal_test.doTests();
    },

    getFirstDate: function() {
         var api = jQuery("#edcal_scrollable").scrollable();
         var items = api.getVisibleItems();

         return edcal.getDayFromDayId(items.eq(0).children(".row").children(".day:first").attr("id"));
    },

    getLastDate: function() {
         var api = jQuery("#edcal_scrollable").scrollable();
         var items = api.getVisibleItems();

         return edcal.getDayFromDayId(items.eq(edcal.weeksPref - 1).children(".row").children(".day:last").attr("id"));
    },

    doTests: function() {
         var curSunday = edcal.nextStartOfWeek(Date.today()).add(-1).weeks();

         edcal.output("edcal.startOfWeek: " + edcal.startOfWeek);

         edcal.moveTo(Date.today());
         
         test("Check visible dates moving to today", function() {
             expect(2);
             ok(edcal_test.getFirstDate().equals(curSunday.clone()), "firstDate should match " + curSunday );

             ok(edcal_test.getLastDate().equals(curSunday.clone().add(parseInt(edcal.weeksPref)).weeks().add(-1).days()), 
                "lastDate should match curSunday" );
         });

         test("Check visible dates after 1 week move in the future", function() {
             expect(2);
             edcal.move(1, true);
             
             ok(edcal_test.getFirstDate().equals(curSunday.clone().add(1).weeks()), "firstDate should match " + curSunday );

             ok(edcal_test.getLastDate().equals(curSunday.clone().add(parseInt(edcal.weeksPref)).weeks().add(-1).days().add(1).weeks()), 
                "lastDate should match curSunday" );

             edcal.move(1, false);
         });

         test("Check visible dates after 4 week move in the future", function() {
             expect(2);
             edcal.move(4, true);
             
             ok(edcal_test.getFirstDate().equals(curSunday.clone().add(4).weeks()), "firstDate should match " + curSunday );

             ok(edcal_test.getLastDate().equals(curSunday.clone().add(parseInt(edcal.weeksPref)).weeks().add(-1).days().add(4).weeks()), 
                "lastDate should match curSunday" );

             edcal.move(4, false);
         });

         test("Check visible dates after 8 week move in the past", function() {
             expect(2);
             edcal.move(8, false);
             
             ok(edcal_test.getFirstDate().equals(curSunday.clone().add(-8).weeks()), "firstDate should match " + curSunday );

             ok(edcal_test.getLastDate().equals(curSunday.clone().add(parseInt(edcal.weeksPref)).weeks().add(-1).days().add(-8).weeks()), 
                "lastDate should match curSunday" );

             edcal.move(8, true);
         });

         var post = {};

         test("Create new post", function() {
             expect(3);

             post.title = 'Unit Test Post';
             post.content = 'This is the content of the unit test post.';
             post.status = 'draft';
             post.time = '10:00 AM';
             post.date = Date.today().add(7).days().toString(edcal.internalDateFormat);
             post.id = '0';
    
             stop();
             edcal.savePost(post, false, true, function(res)
                {
                    start();

                    if (!res.post) {
                        ok(false, "There was an error creating the new post.");
                        return;
                    }

                    ok(res.post.date === post.date, "The resulting post should have the same date as the request");
                    ok(res.post.title === post.title, "The resulting post should have the same title as the request");

                    ok(jQuery('#post-' + res.post.id).length === 1, "The post should be added in only one place in the calendar.");

                    post = res.post;

                });
         });

         /*
         The move test isn't working yet
         test("Change post date", function() {
             expect(2);

             // We added the post one week in the future, now we will move it 
             // one day after that.
             var newDate = Date.today().add(8).days().toString(edcal.internalDateFormat);

             stop();
             edcal.doDrop(post.date, 'post-' + post.id, newDate, function(res)
                {
                    start();
                    
                    

                    if (!res.post) {
                        ok(false, "There was an error creating the new post.");
                        return;
                    }

                    ok(res.post.date === newDate, "The resulting post should have the same date as the request");

                    ok(jQuery('#post-' + res.post.id).length === 1, "The post should be added in only one place in the calendar.");

                    post = res.post;

                });
         });
         */

         test("Edit existing post", function() {
             expect(2);

             post.title = 'Unit Test Post &#8211 Changed';
             post.content = 'This is the content of the unit test post. &#8211 Changed';
             
             stop();
             edcal.savePost(post, false, true, function(res)
                {
                    start();

                    if (!res.post) {
                        ok(false, "There was an error creating the new post.");
                        return;
                    }

                    ok(res.post.title === post.title, "The resulting post should have the same title as the request");

                    ok(jQuery('#post-' + res.post.id).length === 1, "The post should be added in only one place in the calendar.");

                    post = res.post;

                });
         });

         test("Change post date conflict", function() {
             expect(2);

             post.date = Date.today().add(-1).days().toString(edcal.internalDateFormat);
             
             stop();

             /*
              * We added the post one week in the future, now we will move it 
              * one day after that.
              */
             var newDate = Date.today().add(8).days().toString(edcal.internalDateFormat);

             stop();
             edcal.changeDate(newDate, post, function(res)
                {
                    start();

                    if (!res.post) {
                        ok(false, "There was an error creating the new post.");
                        return;
                    }

                    ok(res.error === 4, "This move should show an exception because it is in conflict.");

                    ok(jQuery('#post-' + res.post.id).length === 1, "The post should be added in only one place in the calendar.");

                    post = res.post;

                });
         });

         test("Delete existing post", function() {
             expect(1);

             stop();
             edcal.deletePost(post.id, function(res)
                {
                    start();

                    if (!res.post) {
                        ok(false, "There was an error creating the new post.");
                        return;
                    }

                    ok(jQuery('#post-' + res.post.id).length === 0, "The post should now be deleted from the calendar.");

                });
         });
    }
}
