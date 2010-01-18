=== Editorial Calendar ===
Contributors: MaryVogt, zgrossbart
Tags: posts, post, calendar, AJAX, admin, administration
Requires at least: 2.8.5
Tested up to: 2.9.1
Stable tag: 0.5.4

Editorial calendar makes it possible to see all your posts and drag and drop them to manage your blog.

== Description ==

The editorial calendar lets WordPress administrators and editors manage the dates for multiple posts at once.  You see all of your posts in a calendar view and can arrange them via an easy drag and drop interface.  The editorial calendar greatly improves any blog that plans posts in advance or takes contributions from multiple users.

This is the beta version and the first one ready for public use.  Please help us make this plugin better by giving us <a href="mailto:zack@grossbart.com">feedback</a>.  

<a href="http://chrisg.org/drag-and-drop-post-scheduling-with-the-editorial-calendar-wordpress-plugin/">Chris Garret</a> liked the calendar so much he made a <a href="http://www.youtube.com/watch?v=F4BnQZsgtZc&feature=player_embedded" style="font-size: 1.25em">video</a> showing you how to use it.  Thanks Chris!

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

Check out our demo installation at <a href="http://www.zackgrossbart.com/extras/sandbox/wp-admin/edit.php?page=posts_list">Zack's WordPress Sandbox</a>.

= What languages is the calendar available in? =

The calendar is available in English, French, and Croatian. 

= Can I add another language? =

Yes please!  We are looking for translators.  It only takes 20 minutes.  If you're interested please <a href="mailto:zack@grossbart.com">contact us</a>.

= Can I use the editorial calendar with pages? =

Right now the calendar only supports posts.  We are considering adding pages.  If you would like to see support for pages let us know.

= Will my readers be able to tell I'm using the editorial calendar? =

No.  The calendar is only an administration tool.  None of your readers will know you are running the calendar unless you tell them.

= Why can't I move published posts? =

Moving published posts can cause problems with some RSS feeds and is generally not very popular.  Right now the calendar only allows you to move scheduled and draft posts.

= Why doesn't the calendar work with Live Countdown Timer =

If you use the plugin <a href="http://wordpress.org/extend/plugins/live-countdown-timer/">Live Countdown Timer</a> the editorial calendar will not work.  There is a conflict in some JavaScript libraries.  They're working on it.  For now you must disable Live Countdown Timer if you want to use the WordPress Editorial Calendar.

== Screenshots ==

1. See all of your posts and when they'll be published.
2. Get more information and edit post titles right in the calendar.
3. Drag and drop posts to easily change dates and arrange your calendar.

== Changelog ==

= 0.6 =
* The new look and feel of the calendar makes it easier to scan over your posts while showing you more information.
* You can customize the number of weeks you work with in the calendar using the screen options pull down in the upper right.
* The calendar now starts with the current day as the first week.
* When dragging posts the calendar will now automatically scroll when you move a post past the top or bottom of the calendar.
* You can now access the edit, view, and delete post links directly in the calendar without bringing up a second dialog.
* The calendar now prevents you from changing posts that have already been published.
* The calendar now supports using HTTPS for admin with the define('FORCE_SSL_ADMIN', true); option in wp-config.php.
* The calendar is now properly handling posts with apostrophe's in the title in Internet Explorer.
* The calendar now supports French.  Thanks to the guys at <a href="http://stresslimitdesign.com/">StressLimitDesign</a>.

= 0.5.4 =
* I think this should finally fix the date format bugs we've been having.  Thanks for sticking with it guys.

= 0.5.3 =
* Fixed a date formatting bug when we update posts into the WordPress database

= 0.5.2 =
* Fixed a bug that way causing an invalid concurrency error when changing post dates in non-American countries

= 0.5.1 =
* Fixed a bug with the post creation date that was making posts created from the calendar sometimes show up on the wrong day
* We are now properly encoding the post title when changing the title or creating a new draft so we can handle non-English characters properly.

= 0.5 =
* Added localization support for strings and dates in the calendar
* The calendar is no longer showing posts that you have put in your trash
* Fixed a problem that caused posts to never show up when working with WordPress in Croatian and other Eastern European languages.
* The calendar now starts the week on the right day based on the configured locale in WordPress. 
* Added language support files for Croatian.  Special thanks to <a href="http://www.ivanbrezakbrkan.com">Ivan Brezak Brkan</a>.

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
