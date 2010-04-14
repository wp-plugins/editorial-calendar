=== Editorial Calendar ===
Contributors: cvernon, justinstresslimit, MaryVogt, zgrossbart
Tags: posts, post, calendar, AJAX, admin, administration
Requires at least: 2.8.5
Tested up to: 2.9.2
Stable tag: 0.7

The Editorial Calendar makes it possible to see all your posts and drag and drop them to manage your blog.

== Description ==

Did you remember to write a post for next Tuesday?  What about the Tuesday after that?  WordPress doesn't make it easy to see what posts happen on what days.  The editorial calendar gives you an overview of your blog and when each post will be available.  You can drag and drop to move posts, quickly edit posts right in the calendar, and manage your entire blog.  

<a href="http://chrisg.org/drag-and-drop-post-scheduling-with-the-editorial-calendar-wordpress-plugin/">Chris Garret</a> liked the calendar so much he made a <a href="http://www.youtube.com/watch?v=F4BnQZsgtZc&feature=player_embedded" style="font-size: 1.25em">video</a> showing you how to use it.  Thanks Chris!

<h4>Try it out</h4>
You don't have to install the calendar to give it a try.  Just check out the demo installation at <a href="http://www.zackgrossbart.com/extras/sandbox/wp-admin/edit.php?page=cal">Zack's WordPress Sandbox</a>.

<h4>Features</h4>

1. See all of your posts and when they'll be posted.
1. Drag and drop to change your post dates.
1. Quickedit post titles, contents, and times.
1. Easily see the status of your posts.

<h4>Make it better</h4>

The editorial calendar is getting closer and closer to version 1.0.  We have a few more features to go.  Thank you to everyone who has helped us improve this plugin with their feedback.  If you have questions, problems, or idea for new features please let us know at <a href="mailto:wp-edcal@googlegroups.com">wp-edcal@googlegroups.com</a>.  

== Installation ==

1. <b>Backup your WordPress database</b>.
1. Upload the plugin directory <code>editorial-calendar</code> to the <code>wp-content/plugins</code> directory.
1. Activate the plugin through the 'Plugins' menu in WordPress.
1. Click the new 'Calendar' option under the 'Posts' menu.

== Frequently Asked Questions ==

= Can I see a demo of the calendar? =

Check out our demo installation at <a href="http://www.zackgrossbart.com/extras/sandbox/wp-admin/edit.php?page=cal">Zack's WordPress Sandbox</a>.

= How do I navigate in the calendar? =

You can move around in the calendar using the arrows next to the months at the top or your mouse wheel, You can also move using your keyboard:

<ul>
<li>Move 1 week into the past - Up Arrow</li>
<li>Move 1 week into the future - Down Arrow</li>
<li>Jump multiple weeks into the past - Page Up or Ctrl+Up Arrow</li>
<li>Jump multiple weeks into the future - Page Down or Ctrl+Down Arrow</li>
</ul>

= What languages does the calendar support? =

The calendar is available in English, French, Czechoslovakian, and Croatian. 

= Can I add new languages? =

Yes please!  We are looking for translators.  It only takes about 20 minutes.  If you're interested please <a href="mailto:wp-edcal@googlegroups.com">contact us</a>.

= What users can use the calendar? =

The editorial calendar appears differently based on your permissions.  Administrators and Editors can use every feature available in the calendar.  Authors can use the calendar to edit and move their own posts, but other people's posts are read-only.  Contributors and Subscribers can't see the calendar.


= Can I use the editorial calendar with pages? =

Right now the calendar only supports posts.  We're considering adding pages.  If you would like to see support for pages let us know.

= Does the calendar support group blogs? =

If your blog has multiple authors the calendar will work just fine.  We are currently working on new features to add for multi-author blogs.  If you have any ideas please <a href="mailto:wp-edcal@googlegroups.com">contact us</a>.


= Can my readers tell I'm using the editorial calendar? =

No.  The calendar is only an administration tool.  None of your readers will know you're running it unless you tell them.

= Why can't I move published posts? =

Moving published posts can cause problems with some RSS feeds and is generally not a very popular thing to do.  The calendar only allows you to move scheduled and draft posts.

= Why doesn't the calendar work with Live Countdown Timer? =

If you use the plugin <a href="http://wordpress.org/extend/plugins/live-countdown-timer/">Live Countdown Timer</a> the editorial calendar will not work.  There is a conflict in some JavaScript libraries.  They're working on it.  For now you must disable Live Countdown Timer if you want to use the WordPress Editorial Calendar.

== Screenshots ==

1. The calendar integrates seamlessly into the WordPress administration console
2. See the big picture with a view of all your posts and when they'll be published.
3. Drag and drop posts to easily change dates and take control of your blog.
4. Create, edit, and schedule posts in one simple quickedit dialog.
5. Show as much or as little of your blog as you like.

== Changelog ==

= 0.8 =
* The calendar now supports Greek.  Thanks to <a href="http://stigmi.aenaon.info/blog/">Mihalis Papanousis</a>.

= 0.7 =
* You can now edit post contents, title, and time directly in the calendar.  You can also schedule a post for publication.
* The layout of posts in the calendar has been optimized to you can see the maximum number of posts in a single day without scrolling.
* The calendar is now available for Authors and grays out the posts the current user doesn't have permission to edit.
* The calendar has been translated into Czech.  Thanks to Luk&#225;&#353; Adamec, who uses the Calendar on his blog <a href="http://hornihrad.cz/">Horni Hrad</a>. 
* Added a link to view published posts directly from the calendar.
* The calendar will now use the WordPress preference for the first day of the week and fall back on the server locale if it isn't set.
* The calendar is also using the WordPress preferences for time format.
* The calendar is now loading JavaScript libraries for just the calendar page.  That makes other pages load faster and avoids potential JavaScript conflicts with other plugins.
* The visible weeks preference in the screen options is now a dropdown instead of a text box.


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
