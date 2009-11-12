<?php
    // turn off WordPress themes and include the WordPress core:
    define('WP_USE_THEMES', false);
    require($_SERVER['DOCUMENT_ROOT'] . '/wp-blog-header.php');
?>

jQuery(document).ready(function(){
    edcal.ajax_url = '<?php echo admin_url("admin-ajax.php"); ?>';
});
