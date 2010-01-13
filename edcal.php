<?php
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
Plugin Name: WordPress Editorial Calendar
Description: An editorial calendar for managing the dates of your WordPress posts
Version: 0.6
Author: Mary Vogt and Zack Grossbart
Author URI: http://www.zackgrossbart.com
*/

add_action('wp_ajax_edcal_saveoptions', 'edcal_saveoptions' );
add_action('wp_ajax_edcal_changedate', 'edcal_changedate' );
add_action('wp_ajax_edcal_newdraft', 'edcal_newdraft' );
add_action('wp_ajax_edcal_changetitle', 'edcal_changetitle' );
add_action('admin_menu', 'edcal_list_add_management_page');
add_action('wp_ajax_edcal_posts', 'edcal_posts' );
add_action("admin_print_scripts", 'edcal_scripts');
add_action("init", 'edcal_load_language');

/*
 * This error code matches CONCURRENCY_ERROR from edcal.js
 */
$EDCAL_CONCURRENCY_ERROR = "4";

/*
 * This error code matches NONCE_ERROR from edcal.js
 */
$EDCAL_PERMISSION_ERROR = "5";

/*
 * This error code matches NONCE_ERROR from edcal.js
 */
$EDCAL_NONCE_ERROR = "6";

function edcal_load_language() {
    $plugin_dir = basename(dirname(__FILE__));
    load_plugin_textdomain( 'editorial-calendar', 'wp-content/plugins/' . $plugin_dir . '/languages/', $plugin_dir . '/languages/' );
}

/*
 * This function adds our calendar page to the admin UI
 */
function edcal_list_add_management_page(  ) {
    if ( function_exists('add_management_page') ) {
        $page = add_posts_page( 'Calendar', __('Calendar', 'editorial-calendar'), 'manage_categories', 'posts_list', 'edcal_list_admin' );
    }
}

/*
 * This is a utility function to open a file add it to our
 * output stream.  We use this to embed JavaScript and CSS
 * files and cut down on the number of HTTP requests.
 */
function echoEdCalFile($myFile) {
    $fh = fopen($myFile, 'r');
    $theData = fread($fh, filesize($myFile));
    fclose($fh);
    echo $theData;
}
 
/*
 * This is the function that generates our admin page.  It adds the CSS files and 
 * generates the divs that we need for the JavaScript to work.
 */
function edcal_list_admin() {
    include_once('edcal.php');
    
    
    /*
     * This section of code embeds certain CSS and
     * JavaScript files into the HTML.  This has the 
     * advantage of fewer HTTP requests, but the 
     * disadvantage that the browser can't cache the
     * results.  We only do this for files that will
     * be used on this page and nowhere else.
     */
     
    echo '<!-- This is the styles from jquery.tooltip.css -->';
    echo '<style type="text/css">';
    echoEdCalFile(dirname( __FILE__ ) . "/lib/jquery.tooltip.css");
    echo '</style>';
    
    echo '<!-- This is the styles from humanmsg.css -->';
    echo '<style type="text/css">';
    echoEdCalFile(dirname( __FILE__ ) . "/lib/humanmsg.css");
    echo '</style>';
    
    echo '<!-- This is the styles from edcal.css -->';
    echo '<style type="text/css">';
    echoEdCalFile(dirname( __FILE__ ) . "/edcal.css");
    echo '</style>';
    
    ?>
    <!-- This is just a little script so we can pass the AJAX URL and some localized strings -->
    <script type="text/javascript">
        jQuery(document).ready(function(){
            edcal.wp_nonce = '<?php echo wp_create_nonce("edit-calendar"); ?>';
            <?php 
                if (get_option("edcal_weeks_pref") != "") {
            ?>
                edcal.weeksPref = '<?php echo(get_option("edcal_weeks_pref")); ?>';
            <?php
                }
            ?>

            /*
             * We want to show the day of the first day of the week to match the user's 
             * country code.  The problem is that we can't just use the WordPress locale.
             * If the locale was fr-FR so we started the week on Monday it would still 
             * say Sunday was the first day if we didn't have a proper language bundle
             * for French.  Therefore we must depend on the language bundle writers to
             * specify the locale for the language they are adding.
             * 
             */
            edcal.locale = '<?php echo(__('en-US', 'editorial-calendar')) ?>';
            
            /*
             * These strings are all localized values.  The WordPress localization mechanism 
             * doesn't really extend to JavaScript so we localize the strings in PHP and then
             * pass the values to JavaScript.
             */
            
            edcal.str_on = '<?php echo(__('on', 'editorial-calendar')) ?>';
            edcal.str_by = '<?php echo(__('by', 'editorial-calendar')) ?>';
            edcal.str_at = '<?php echo(__('at', 'editorial-calendar')) ?>';

            edcal.str_addPostLink = '<?php echo(__('Add a post', 'editorial-calendar')) ?>';
            
            edcal.str_day1 = '<?php echo(__('Sunday', 'editorial-calendar')) ?>';
            edcal.str_day2 = '<?php echo(__('Monday', 'editorial-calendar')) ?>';
            edcal.str_day3 = '<?php echo(__('Tuesday', 'editorial-calendar')) ?>';
            edcal.str_day4 = '<?php echo(__('Wednesday', 'editorial-calendar')) ?>';
            edcal.str_day5 = '<?php echo(__('Thursday', 'editorial-calendar')) ?>';
            edcal.str_day6 = '<?php echo(__('Friday', 'editorial-calendar')) ?>';
            edcal.str_day7 = '<?php echo(__('Saturday', 'editorial-calendar')) ?>';

            edcal.str_draft = '<?php echo(__(' [DRAFT]', 'editorial-calendar')) ?>';
            edcal.str_edit = '<?php echo(__('Edit', 'editorial-calendar')) ?>';
            edcal.str_del = '<?php echo(__('Delete', 'editorial-calendar')) ?>';
            edcal.str_view = '<?php echo(__('View', 'editorial-calendar')) ?>';
            edcal.str_republish = '<?php echo(__('Republish', 'editorial-calendar')) ?>';
            edcal.str_status = '<?php echo(__('Status:', 'editorial-calendar')) ?>';
            edcal.str_cancel = '<?php echo(__('Cancel', 'editorial-calendar')) ?>';
            edcal.str_posttitle = '<?php echo(__('Post Title:', 'editorial-calendar')) ?>';
            edcal.str_savedraft = '<?php echo(__('Save Draft', 'editorial-calendar')) ?>';
            edcal.str_saveandedit = '<?php echo(__('Save and Edit Draft', 'editorial-calendar')) ?>';
            edcal.str_newpost = '<?php echo(__('Add a new post on ', 'editorial-calendar')) ?>';
            
            edcal.str_del_msg1 = '<?php echo(__('You are about to delete this post ', 'editorial-calendar')) ?>';
            edcal.str_del_msg2 = '<?php echo(__('Press cancel to stop, OK to delete.', 'editorial-calendar')) ?>';
            
            edcal.concurrency_error = '<?php echo(__('Looks like someone else already moved this post.', 'editorial-calendar')) ?>';
            edcal.permission_error = '<?php echo(__('You do not have permission to edit posts.', 'editorial-calendar')) ?>';
            edcal.checksum_error = '<?php echo(__('Invalid checksum for post. This is commonly a cross-site scripting error.', 'editorial-calendar')) ?>';
            edcal.general_error = '<?php echo(__('There was an error contacting your blog.', 'editorial-calendar')) ?>';
            
            edcal.str_screenoptions = '<?php echo(__('Screen Options', 'editorial-calendar')) ?>';
            edcal.str_optionsheader = '<?php echo(__('Calendar Options', 'editorial-calendar')) ?>';
            edcal.str_apply = '<?php echo(__('Apply', 'editorial-calendar')) ?>';
            edcal.str_show = '<?php echo(__('Show ', 'editorial-calendar')) ?>';
            edcal.str_show2 = '<?php echo(__('weeks at a time', 'editorial-calendar')) ?>';
            edcal.str_weekserror = '<?php echo(__('The calendar can only show between 1 and 5 weeks at a time.', 'editorial-calendar')) ?>';
            edcal.str_weekstt = '<?php echo(__('Enter the number of weeks, between 1 and 5, for the calendar to show.', 'editorial-calendar')) ?>';
        });
    </script>

    <style type="text/css">
        .loadingclass, .tiploading {
            background-image: url('<?php echo(path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/images/loading_post.gif")); ?>');
        }

        #loading {
            background-image: url('<?php echo(path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/images/loading.gif")); ?>');
        }

        #tipclose {
            background-image: url('<?php echo(path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/images/tip_close.gif")); ?>');
        }

        .today .daylabel {
            background: url('<?php echo(path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/images/today_bk.gif")); ?>') repeat-x left top;
        }

        .dayheadcont {
            background: #6D6D6D url('<?php echo(path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/../../../wp-admin/images/menu-bits.gif")); ?>') repeat-x scroll left top;
        }
    </style>
    
    <?php
    echo '<!-- This is the code from edcal.js -->';
    echo '<script type="text/javascript">';
    echoEdCalFile(dirname( __FILE__ ) . "/edcal.js");
    echo '</script>';
    
    ?>
    
    <div class="wrap">
        <div class="icon32" id="icon-edit"><br/></div>
        <h2><?php echo(__('Posts Calendar', 'editorial-calendar')) ?></h2>
        
        <div id="loadingcont">
            <div id="loading"> </div>
        </div>
        
        <div id="topbar">
            <div id="topleft">
                <h3>
                    <a href="#" title="<?php echo(__('Jump back', 'editorial-calendar')) ?>" class="save button prev page-numbers" id="prevmonth" style="border: thin solid gray;">&laquo;</a>
                    <span id="currentRange"></span>
                    <a href="#" title="<?php echo(__('Skip ahead', 'editorial-calendar')) ?>" class="save button next page-numbers" id="nextmonth" style="border: thin solid gray;">&raquo;</a>
                </h3>
            </div>
            
            <div id="topright">
                <a href="#" title="<?php echo(__('Jump to today', 'editorial-calendar')) ?>" id="moveToToday"><?php echo(__('Today', 'editorial-calendar')) ?></a>
            </div>
        </div>
        
        <div id="cal_cont">
            <div id="edcal_scrollable" class="edcal_scrollable vertical">
                <div id="cal"></div>
            </div>
        </div>
    </div>
    
    <?php
}

/*
 * We use these variables to hold the post dates for the filter when 
 * we do our post query.
 */
$edcal_startDate;
$edcal_endDate;

/*
 * When we get a set of posts to populate the calendar we don't want
 * to get all of the posts.  This filter allows us to specify the dates
 * we want.
 */
function edcal_filter_where($where = '') {
    global $edcal_startDate, $edcal_endDate;
    //posts in the last 30 days
    //$where .= " AND post_date > '" . date('Y-m-d', strtotime('-30 days')) . "'";
    //posts  30 to 60 days old
    //$where .= " AND post_date >= '" . date('Y-m-d', strtotime('-60 days')) . "'" . " AND post_date <= '" . date('Y-m-d', strtotime('-30 days')) . "'";
    //posts for March 1 to March 15, 2009
    $where .= " AND post_date >= '" . $edcal_startDate . "' AND post_date < '" . $edcal_endDate . "'";
    return $where;
}

/*
 * This function adds all of the JavaScript files we need.
 *
 */
function edcal_scripts() {
    /*
     * To get proper localization for dates we need to include the correct JavaScript file for the current
     * locale.  We can do this based on the locale in the localized bundle to make sure the date locale matches
     * the locale for the other strings.
     */
    wp_enqueue_script( "date", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/languages/date-".__('en-US', 'editorial-calendar').".js"), array( 'jquery' ) );

    wp_enqueue_script( "edcal-lib", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/edcallib.min.js"), array( 'jquery' ) );
    return;
    
    /*
     * If you're using one of the specific libraries you should comment out the two lines
     * above this comment.
     */
    
    wp_enqueue_script( "ui-core", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/ui.core.js"), array( 'jquery' ) );
    wp_enqueue_script( "ui-draggable", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/ui.draggable.js"), array( 'jquery' ) );
    wp_enqueue_script( "ui-droppable", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/ui.droppable.js"), array( 'jquery' ) );
    
    
    wp_enqueue_script( "bgiframe", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/jquery.bgiframe.js"), array( 'jquery' ) );
    wp_enqueue_script( "tooltip", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/jquery.tooltip.js"), array( 'jquery' ) );
    wp_enqueue_script( "humanMsg", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/humanmsg.js"), array( 'jquery' ) );
    
    wp_enqueue_script( "scrollable", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/tools.scrollable-1.1.2.js"), array( 'jquery' ) );
    wp_enqueue_script( "mouse-wheel", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/tools.scrollable.mousewheel-1.0.1.js"), array( 'jquery' ) );

    wp_enqueue_script( "json-parse2", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/json2.js"), array( 'jquery' ) );
}

/*
 * This is an AJAX call that gets the posts between the from date 
 * and the to date.  
 */
function edcal_posts() {
    header("Content-Type: application/json");
    if (!edcal_checknonce()) {
        die();
    }

    global $edcal_startDate, $edcal_endDate;
    $edcal_startDate = isset($_GET['from'])?$_GET['from']:null;
    $edcal_endDate = isset($_GET['to'])?$_GET['to']:null;
    global $post;
    $args = array(
        'posts_per_page' => -1,
        'post_status' => "publish&future&draft",
        'post_parent' => null, // any parent
        'post_type' => 'post',
    );
    
    add_filter('posts_where', 'edcal_filter_where');
    $myposts = query_posts($args);
    remove_filter('posts_where', 'edcal_filter_where');
    
    ?>[
    <?php
    
    foreach($myposts as $post) {
        /*
         * Sticky posts are ones that stick to the front page.
         * They do technically have a date, but it doesn't 
         * really make sense to drag and drop them around since
         * the user has already indicated that they want them
         * to stay on the front page.
         */
        
        if (!is_sticky($post->ID)) {
            edcal_postJSON($post);
        }
    }
    
    ?> ]
    <?php
    
    die();
}

/*
 * This function sets up the post data and prints out the values we
 * care about in a JSON data structure.  This prints out just the
 * value part.
 */
function edcal_postJSON($post) {
    setup_postdata($post);
    ?>
        {
            "date" : "<?php the_time('d') ?><?php the_time('m') ?><?php the_time('Y') ?>", 
            "time" : "<?php the_time() ?>", 
            "formattedtime" : "<?php the_time(__('ga', 'editorial-calendar')) ?>", 
            "url" : "<?php the_permalink(); ?>", 
            "status" : "<?php echo(get_post_status()); ?>",
            "title" : "<?php the_title(); ?>",
            "author" : "<?php the_author(); ?>",
            <?php if ( current_user_can('edit_post', $post->ID) ) {?>
            "editlink" : "<?php echo(get_edit_post_link($id)); ?>",
            <?php } ?>

            <?php if ( current_user_can('delete_post', $post->ID) ) {?>
            "dellink" : "<?php echo(wp_nonce_url("post.php?action=delete&amp;post=$post->ID", 'delete-post_' . $post->ID)); ?>",
            <?php } ?>

            "permalink" : "<?php echo(get_permalink($id)); ?>",
            "id" : "<?php the_ID(); ?>"
        },
    <?php
}

/*
 * This is a helper AJAX function to change the title of a post.  It
 * gets called from the save button in the tooltip when you change a
 * post title in a calendar.
 */
function edcal_changetitle() {
    if (!edcal_checknonce()) {
        die();
    }

    header("Content-Type: application/json");
    $edcal_postid = isset($_GET['postid'])?$_GET['postid']:null;
    $edcal_newTitle = isset($_GET['title'])?$_GET['title']:null;
    
    $post = get_post($edcal_postid, ARRAY_A);
    setup_postdata($post);
    
    $post['post_title'] = $edcal_newTitle;
    
    /*
     * Now we finally update the post into the database
     */
    wp_update_post( $post );
    
    /*
     * We finish by returning the latest data for the post in the JSON
     */
    global $post;
    $args = array(
        'posts_id' => $edcal_postid,
    );
    
    $post = get_post($edcal_postid);
    
    ?>{
        "post" :
    <?php
    
        edcal_postJSON($post);
    
    ?>
    }
    <?php
    
    
    die();
}

/*
 * This is a helper function to create a new blank draft
 * post on a specified date.
 */
function edcal_newdraft() {
    if (!edcal_checknonce()) {
        die();
    }

    header("Content-Type: application/json");
    $edcal_date = isset($_GET['date'])?$_GET['date']:null;
    
    $my_post = array();
    $my_post['post_title'] = isset($_GET['title'])?$_GET['title']:null;;
    $my_post['post_status'] = 'draft';
    
    $my_post['post_date'] = $edcal_date;
    $my_post['post_date_gmt'] = get_gmt_from_date($edcal_date);
    $my_post['post_modified'] = $edcal_date;
    $my_post['post_modified_gmt'] = get_gmt_from_date($edcal_date);
    
    // Insert the post into the database
    $my_post_id = wp_insert_post( $my_post );
    
    
    /*
     * We finish by returning the latest data for the post in the JSON
     */
    global $post;
    $post = get_post($my_post_id);
    ?>{
        "post" :
    <?php
    
        edcal_postJSON($post);
    
    ?>
    }
    <?php
    
    die();
}

/*
 * This function checks the nonce for the URL.  It returns
 * true if the nonce checks out and outputs a JSON error
 * and returns false otherwise.
 */
function edcal_checknonce() {
    header("Content-Type: application/json");
    global $EDCAL_NONCE_ERROR;
    if (!wp_verify_nonce($_REQUEST['_wpnonce'], 'edit-calendar')) {
       /*
         * This is just a sanity check to make sure
         * this isn't a CSRF attack.  Most of the time this
         * will never be run because you can't see the calendar unless
         * you are at least an editor
         */
        ?>
        {
            "error": <?php echo($EDCAL_NONCE_ERROR); ?>
        }
        <?php
        return false;
    }
    return true;
}

/*
 * This function changes the date on a post.  It does optimistic 
 * concurrency checking by comparing the original post date from
 * the browser with the one from the database.  If they don't match
 * then it returns an error code and the updated post data.
 *
 * If the call is successful then it returns the updated post data.
 */
function edcal_changedate() {
    if (!edcal_checknonce()) {
        die();
    }
    header("Content-Type: application/json");
    global $edcal_startDate, $edcal_endDate;
    $edcal_postid = isset($_GET['postid'])?$_GET['postid']:null;
    $edcal_newDate = isset($_GET['newdate'])?$_GET['newdate']:null;
    $edcal_oldDate = isset($_GET['olddate'])?$_GET['olddate']:null;
    $edcal_postStatus = isset($_GET['postStatus'])?$_GET['postStatus']:null;

    if (!current_user_can('edit_others_posts')) {
        global $EDCAL_PERMISSION_ERROR;
        /*
         * This is just a sanity check to make sure that the current
         * user has permission to edit posts.  Most of the time this
         * will never be run because you can't see the calendar unless
         * you are at least an editor
         */
        ?>
        {
            "error": <?php echo($EDCAL_PERMISSION_ERROR); ?>,
        <?php
        
        global $post;
        $args = array(
            'posts_id' => $edcal_postid,
        );
        
        $post = get_post($edcal_postid);
        ?>
            "post" :
        <?php
            edcal_postJSON($post);
        ?> }
        
        <?php
        die();
    }
    
    $post = get_post($edcal_postid, ARRAY_A);
    setup_postdata($post);
    
    /*
     * We are doing optimistic concurrency checking on the dates.  If
     * the user tries to move a post we want to make sure nobody else
     * has moved that post since the page was last updated.  If the 
     * old date in the database doesn't match the old date from the
     * browser then we return an error to the browser along with the
     * updated post data.
     */
     if (date('Y-m-d', strtotime($post['post_date'])) != date('Y-m-d', strtotime($edcal_oldDate))) {
        global $EDCAL_CONCURRENCY_ERROR;
        ?> {
            "error": <?php echo($EDCAL_CONCURRENCY_ERROR); ?>,
        <?php
        
        global $post;
        $args = array(
            'posts_id' => $edcal_postid,
        );
        
        $post = get_post($edcal_postid);
        ?>
            "post" :
        <?php
            edcal_postJSON($post);
        ?> }
        
        <?php
        die();
    }
    
    /*
     * Posts in WordPress have more than one date.  There is the GMT date,
     * the date in the local time zone, the modified date in GMT and the
     * modified date in the local time zone.  We update all of them.
     */
    $post['post_date_gmt'] = $post['post_date'];
    
    /*
     * When a user creates a draft and never sets a date or publishes it 
     * then the GMT date will have a timestamp of 00:00:00 to indicate 
     * that the date hasn't been set.  In that case we need to specify
     * an edit date or the wp_update_post function will strip our new
     * date out and leave the post as publish immediately.
     */
    $needsEditDate = strpos($post['post_date_gmt'], "0000-00-00 00:00:00") === 0;
    
    $updated_post = array();
    $updated_post['ID'] = $edcal_postid;
    $updated_post['post_date'] = $edcal_newDate . substr($post['post_date'], strlen($edcal_newDate));
    if ($needsEditDate != -1) {
        $updated_post['edit_date'] = $edcal_newDate . substr($post['post_date'], strlen($edcal_newDate));
    }
    
    /*
     * We need to make sure to use the GMT formatting for the date.
     */
    $updated_post['post_date_gmt'] = get_gmt_from_date($updated_post['post_date']);
    $updated_post['post_modified'] = $edcal_newDate . substr($post['post_modified'], strlen($edcal_newDate));
    $updated_post['post_modified_gmt'] = get_gmt_from_date($updated_post['post_date']);
    
    if ( $edcal_postStatus != $post['post_status'] ) {
        /*
         * We only want to update the post status if it has changed.
         * If the post status has changed that takes a few more steps
         */
        wp_transition_post_status($edcal_postStatus, $post['post_status'], $post);
        $updated_post['post_status'] = $edcal_postStatus;
        
        // Update counts for the post's terms.
        foreach ( (array) get_object_taxonomies('post') as $taxonomy ) {
            $tt_ids = wp_get_object_terms($post_id, $taxonomy, 'fields=tt_ids');
            wp_update_term_count($tt_ids, $taxonomy);
        }
        
        do_action('edit_post', $edcal_postid, $post);
        do_action('save_post', $edcal_postid, $post);
        do_action('wp_insert_post', $edcal_postid, $post);
    }
    
    /*
     * Now we finally update the post into the database
     */
    wp_update_post( $updated_post );
    
    /*
     * We finish by returning the latest data for the post in the JSON
     */
    global $post;
    $args = array(
        'posts_id' => $edcal_postid,
    );
    
    $post = get_post($edcal_postid);
    ?>{
        "post" :
        
    <?php
        edcal_postJSON($post);
    ?>}
    <?php
    
    die();
}

/*
 * This function saves the preferences
 */
function edcal_saveoptions() {
    if (!edcal_checknonce()) {
        die();
    }

    header("Content-Type: application/json");
    $edcal_weeks = isset($_GET['weeks'])?$_GET['weeks']:null;
    
    add_option("edcal_weeks_pref", $edcal_weeks, "", "yes");
    update_option("edcal_weeks_pref", $edcal_weeks);
    
    
    /*
     * We finish by returning the latest data for the post in the JSON
     */
    ?>{
        "update" : "success"
    }
    <?php
    
    die();
}
