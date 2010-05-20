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
             ok(edcal_test.getFirstDate().equals(curSunday.clone()), "firstDate should match curSunday" );

             ok(edcal_test.getLastDate().equals(curSunday.clone().add(parseInt(edcal.weeksPref)).weeks().add(-1).days()), 
                "lastDate should match curSunday" );
         });

         test("Check visible dates after 1 week move in the future", function() {
             expect(2);
             edcal.move(1, true);
             
             ok(edcal_test.getFirstDate().equals(curSunday.clone().add(1).weeks()), "firstDate should match curSunday" );

             ok(edcal_test.getLastDate().equals(curSunday.clone().add(parseInt(edcal.weeksPref)).weeks().add(-1).days().add(1).weeks()), 
                "lastDate should match curSunday" );

             edcal.move(1, false);
         });

         test("Check visible dates after 4 week move in the future", function() {
             expect(2);
             edcal.move(4, true);
             
             ok(edcal_test.getFirstDate().equals(curSunday.clone().add(4).weeks()), "firstDate should match curSunday" );

             ok(edcal_test.getLastDate().equals(curSunday.clone().add(parseInt(edcal.weeksPref)).weeks().add(-1).days().add(4).weeks()), 
                "lastDate should match curSunday" );

             edcal.move(4, false);
         });

         test("Check visible dates after 8 week move in the past", function() {
             expect(2);
             edcal.move(8, false);
             
             ok(edcal_test.getFirstDate().equals(curSunday.clone().add(-8).weeks()), "firstDate should match curSunday" );

             ok(edcal_test.getLastDate().equals(curSunday.clone().add(parseInt(edcal.weeksPref)).weeks().add(-1).days().add(-8).weeks()), 
                "lastDate should match curSunday" );

             edcal.move(8, true);
         });
    }
}
