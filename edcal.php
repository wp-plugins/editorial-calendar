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
Description: An editorial calendar for setting the dates of your WordPress posts
Author: EdCal Project
Author URI: TBD
*/

function edcal_list_add_management_page(  ) {
  if ( function_exists('add_management_page') ) {
    $page = add_posts_page( 'Calendar', 'Calendar', 'manage_categories', 'posts_list', 'edcal_list_admin' );
  }
}

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
 function edcal_list_admin(  ) {
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
    <!-- This is just a little script so we can pass the AJAX URL -->
    <script type="text/javascript">
        jQuery(document).ready(function(){
            edcal.ajax_url = '<?php echo admin_url("admin-ajax.php"); ?>';
        });
    </script>

    <style type="text/css">
        .loadingclass {
            background-image: url('<?php echo(path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/images/loading_post.gif")); ?>');
        }

        #loading {
            background-image: url('<?php echo(path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/images/loading.gif")); ?>');
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
    <h2>Posts Calendar</h2>

    <div id="topbar">
        <div id="topleft">
            <div id="loading"> </div>
        </div>
        <div id="topright">
            <a href="#" class="prev page-numbers" id="prevmonth" style="border: none";>&laquo;</a><span id="currentRange"></span><a href="#" class="next page-numbers" id="nextmonth" style="border: none";>&raquo;</a> <a href="#" id="moveToToday">Jump to Today</a>
        </div>
    </div>
    
    <div id="rowhead"></div>
    <div id="edcal_scrollable" class="edcal_scrollable vertical">
        <div id="cal"></div>
    </div>
</div>
  <?php
}
 
add_action('admin_menu', 'edcal_list_add_management_page');

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

add_action("admin_print_scripts", 'edcal_scripts');

/*
 * This function adds all of the JavaScript files we need.
 *
 * TODO: This list is way too long.  We need to minimize and
 * combine most of these files.  I'm still on the fence if we
 * should include these files inline.
 */
function edcal_scripts(  ) {
    wp_enqueue_script( "ui-core", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/ui.core.js"), array( 'jquery' ) );
    wp_enqueue_script( "ui-draggable", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/ui.draggable.js"), array( 'jquery' ) );
    wp_enqueue_script( "ui-droppable", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/ui.droppable.js"), array( 'jquery' ) );
    
    
    wp_enqueue_script( "bgiframe", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/jquery.bgiframe.js"), array( 'jquery' ) );
    wp_enqueue_script( "tooltip", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/jquery.tooltip.js"), array( 'jquery' ) );
    wp_enqueue_script( "humanMsg", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/humanmsg.js"), array( 'jquery' ) );
    

    wp_enqueue_script( "date", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/date.js"), array( 'jquery' ) );
    wp_enqueue_script( "scrollable", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/tools.scrollable-1.1.2.js"), array( 'jquery' ) );
    wp_enqueue_script( "mouse-wheel", path_join(WP_PLUGIN_URL, basename( dirname( __FILE__ ) )."/lib/tools.scrollable.mousewheel-1.0.1.js"), array( 'jquery' ) );
}

/*
 * This is an AJAX call that gets the posts between the from date 
 * and the to date.  
 */
function edcal_posts(  ) {
  header("Content-Type: application/json");
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
      edcal_postJSON($post);
  }

  ?> ]
  <?php
  die;
}

add_action('wp_ajax_edcal_posts', 'edcal_posts' );

function edcal_postJSON($post) {
    setup_postdata($post);
    ?>
        {
            "date" : "<?php the_time('d') ?><?php the_time('M') ?><?php the_time('Y') ?>", 
            "url" : "<?php the_permalink(); ?>", 
            "status" : "<?php echo(get_post_status()); ?>",
            "title" : "<?php the_title(); ?>",
            "author" : "<?php the_author(); ?>",
            "editlink" : "<?php echo(get_edit_post_link($id)); ?>",
            "permalink" : "<?php echo(get_permalink($id)); ?>",
            "id" : "<?php the_ID(); ?>"
        },
  <?php
}

/*
 * This function changes the date on a post.  It does optimistic 
 * concurrency checking by comparing the original post date from
 * the browser with the one from the database.  If they don't match
 * then it returns an error code and the updated post data.
 *
 * If the call is successful then it returns the updated post data.
 */
function edcal_changedate(  ) {
  if (!current_user_can('edit_others_posts')) {
      /*
       * This is just a sanity check to make sure that the current
       * user has permission to edit posts.  Most of the time this
       * will never be run because you can't see the calendar unless
       * you are at least an editor
       */
      ?>
      {
        "error": 5,
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
  }

  header("Content-Type: application/json");
  global $edcal_startDate, $edcal_endDate;
  $edcal_postid = isset($_GET['postid'])?$_GET['postid']:null;
  $edcal_newDate = isset($_GET['newdate'])?$_GET['newdate']:null;
  $edcal_oldDate = isset($_GET['olddate'])?$_GET['olddate']:null;
  $edcal_postStatus = isset($_GET['postStatus'])?$_GET['postStatus']:null;

  $post = get_post($edcal_postid, ARRAY_A);
  setup_postdata($post);

  $matches = strpos($post['post_date'], $edcal_oldDate) === 0;

  if ($matches != 1) {
      ?>
      {
        "error": 4,
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
      //return  new WP_Error('broke', __("no match error"));
      die();
  }

  /*
   * Posts have more than one date and we have to update them all
   */
  $updated_post = array();
  $updated_post['ID'] = $edcal_postid;
  $updated_post['post_date'] = $edcal_newDate . substr($post['post_date'], strlen($edcal_newDate));
  $updated_post['post_date_gmt'] = $edcal_newDate . substr($post['post_date_gmt'], strlen($edcal_newDate));
  $updated_post['post_modified'] = $edcal_newDate . substr($post['post_modified'], strlen($edcal_newDate));
  $updated_post['post_modified_gmt'] = $edcal_newDate . substr($post['post_modified_gmt'], strlen($edcal_newDate));

  // Update the post into the database
  if ( $edcal_postStatus != $post['post_status'] ) {
      /*
       * If the post status changed that takes a few more steps
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

  //check_and_publish_future_post($edcal_postid);

  wp_update_post( $updated_post );
  
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
  

  die;
}

add_action('wp_ajax_edcal_changedate', 'edcal_changedate' );
