=== Editorial Calendar ===
Contributors: MaryVogt, zgrossbart
Tags: posts, post, calendar, AJAX, admin, administration
Requires at least: 2.8.5
Tested up to: 2.8.6
Stable tag: 0.4

Editorial calendar makes it possible to see all your posts and drag and drop them to manage your blog.

== Description ==

The editorial calendar lets WordPress administrators and editors manage the dates for multiple posts at once.  You see all of your posts in a calendar view and can arrange them via an easy drag and drop interface.  The editorial calendar greatly improves any blog that plans posts in advance or takes contributions from multiple users.

This is the beta version and the first one ready for public use.  Please help us make this plugin better by giving us <a href="mailto:zack@grossbart.com">feedback</a>.  

Features:

1. See all of your posts and when they'll be posted.
1. Drag and drop to change your post dates.
1. Edit and arrange post titles.
1. Easily see the status of your posts.

== Installation ==

1. <b>Backup your WordPress database</b>.
1. Upload the plugin directory <code>editorial-calendar</code> to the <code>wp-content/plugins</code> directory.
1. Activate the plugin through the 'Plugins' menu in WordPress.
1. Click the new 'Calendar' option under the 'Posts' menu.

== Frequently Asked Questions ==

= Can I see a demo of the calendar? =

Check out our demo installation at <a href="http://www.zackgrossbart.com/extras/sandbox/wp-admin/">http://www.zackgrossbart.com/extras/sandbox/wp-admin</a>.

= Can I use the editorial calendar with pages? =

Right now the calendar only supports posts.  We are considering adding support for pages.  If you would like to see support for pages let us know.

= Does the editorial calendar change the way my posts look? =

No.  The calendar is only an administration tool.  None of your readers will know you are running the calendar unless you tell them.

= Why are my posts different colors? =

The different color of each post indicates the status.  Gray is <code>draft</code>, blue is <code>publish</code>, and yellow is <code>future</code>.

= Why does the calendar change my post status? =

The calendar works with three types of post status: <code>draft</code>, <code>publish</code>, and <code>future</code>.  If you move a <code>publish</code> post to a date after the current day it becomes a <code>future</code> post.  If you drag a <code>future</code> post to a day before the current day it becomes a <code>draft</code> post.

= Why doesn't the calendar work with Live Countdown Timer =

If you use the plugin <a href="http://wordpress.org/extend/plugins/live-countdown-timer/">Live Countdown Timer</a> the editorial calendar will not work.  There is a conflict in some JavaScript libraries.  They're working on it.  For now you must disable Live Countdown Timer if you want to use the WordPress Editorial Calendar.

== Screenshots ==

1. See all of your posts and when they'll be published.
2. Get more information and edit post titles right in the calendar.
3. Drag and drop posts to easily change dates and arrange your calendar.

== Changelog ==

= 0.5 =
* Added localization support for strings and dates in the calendar
* The calendar is no longer showing posts that you have put in your trash
* Fixed a problem that caused posts to never show up when working with WordPress in non-English languages.

= 0.4 =
* We are now doing a better job arranging our tooltips and setting GMT dates correctly.
* Fixed a problem with the post times so posts dragged with the calendar don't change their time of day.
* Added a dialog for creating new drafts on specific dates of the calendar.

= 0.3 =
* Additional bug fixes and stabalizations as well as the ability to add new posts to a given date from the calendar.

= 0.2 =
* This version fixes a large number of bugs, makes many usability improvements, and has some significant performance increases.

= 0.1 =
* This version is just for beta testers


`<?php code(); // goes in backticks ?>`
