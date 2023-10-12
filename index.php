<?php
/**
Plugin Name: Match 3 Game
Plugin URI: #
Description: Match 3 game
Version: 1.0
Author: Anita Aksentowicz
Author URI: #
License: GPLv2 or later
License URI:  https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: anita-a-game
*/

if ( ! defined( 'ABSPATH' ) ){exit;}  // Exit if accessed directly

/* function anita_game_highscore_nonce() {
    $data = array(
        'gamescore_nonce' => wp_create_nonce("gamescore_nonce"),
    );
    wp_localize_script( 'anitaGameScoreData', $data );
} */

/* wp_localize_script( 'dotank-im-openai-js', 'my_ajax_obj', array(
    'ajax_url' => admin_url( 'admin-ajax.php' ),
) ); */

function enqueue_sweetalert2() {
    // Enqueue SweetAlert2 styles
    wp_enqueue_style('sweetalert2-css', 'https://cdn.jsdelivr.net/npm/sweetalert2@10/dist/sweetalert2.min.css');

    // Enqueue SweetAlert2 script
    wp_enqueue_script('sweetalert2-js', 'https://cdn.jsdelivr.net/npm/sweetalert2@10/dist/sweetalert2.all.min.js', array('jquery'), null, true);
}
// Add plugin settings page
function game_shortcode( $atts ) {
    wp_enqueue_script( 'phaserjs', plugin_dir_url( __FILE__ ) . 'phaser.min.js', array( 'jquery' ));
	enqueue_sweetalert2();
    wp_enqueue_script( 'gamejs', plugin_dir_url( __FILE__ ) . 'game.js', array( 'jquery', 'phaserjs' ));
	


// Hook the enqueue function to the appropriate action hook
add_action('wp_enqueue_scripts', 'enqueue_sweetalert2');
    
    $gamescore_nonce = wp_create_nonce("gamescore_nonce");
    if ( is_user_logged_in() ) {
        // Current user is logged in,
        // so let's get current user info
        $current_user = wp_get_current_user();
        // User ID
        $user_id = $current_user->ID;
        // User Nicename
        $user_nicename = $current_user->user_nicename;
        // User email
        $user_email = $current_user->user_email;
    }
    $link = admin_url( 'admin-ajax.php' );

    ob_start();

    // create nonce for user scores
    echo "<span class='anita-game-data-panel' data-nonce='${gamescore_nonce}' data-user_id='${user_id}' data-link='${link}'></span>";

    ?>
    <style type="text/css">

#restart, #shuffleButton{
    display: none;
	text-align: center;
			margin: auto;
}
		#akcja{
			display: none;
		}

		#contentt{
			text-align: center;
			margin: auto;
		}
		
button{
    background: #CB3A35;
text-align: center;

}

        canvas {
            display: block;
            margin-top: 30px;
            margin-bottom: 30px;
            padding: 10px;
           margin: auto;
        }
    </style>
    <?php

    return ob_get_clean();
}
//shortcode
add_shortcode( 'game_shortcode', 'game_shortcode' );

// AJAX highscore save
add_action('wp_ajax_anita_game_highscore', 'anita_game_highscore');

function anita_game_highscore() {
    // Nonce check
    if ( !wp_verify_nonce( $_REQUEST['nonce'], 'gamescore_nonce')) {
        exit("Woof Woof Woof");
     }
     // User ID
    $user_id = $_REQUEST['user_id'];

    // Total number of plays
    $game_plays_meta = get_user_meta( $user_id, 'anita_game_plays', true );
    if( !$anita_plays_meta) {
        $anita_plays_meta = 0;
    }

    $game_plays_meta++;
    update_user_meta($user_id, 'anita_game_plays', $game_plays_meta);

    $current_score = intval($_REQUEST['anita_gamescore']);
    $anita_gamescore = get_user_meta($user_id, 'anita_gamescore', true);
    if (empty($anita_gamescore) || $current_score > $anita_gamescore) {
        update_user_meta($user_id, 'anita_gamescore', $current_score);
        $new_highscore = true;
    }

    // Preparing the response
    if($new_highscore === true) {
        $response = array(
        'score' => $current_score,
        'text' => 'New Highscore',
     );

    }
    
    // Sending response back to browser 
    //wp_send_json_success($_POST);
    wp_send_json_success($response);

    // Kill db connection
    die();
}

// Score post meta data
function anita_game_leaderboard($atts) {
	
	$params = shortcode_atts( array(
        'limit' => -1,
    ), $atts );

    $args  = array(
        'orderby'   => 'meta_value_num',
        'order'     => 'DESC',
        'meta_key'  => 'anita_gamescore',
		'number'     =>  intval( $params['limit'] ),
		'meta_type' => 'NUMERIC',
		//'role__not_in' => 'Administrator',
        );
        
    $counter = 1;
    
    $users = new WP_User_Query( $args );

    // render ordered list with highscores
    echo '<div class="hall_of_fame_wrapper">';
    echo '<table class="scoreboard-table">';
    echo '<thead><th>No</th><th>User</th><th>Score</th></thead>';
    echo '<tbody>';
    
    foreach ( $users->results as $user ) {
    
        echo '<tr><td>'. $counter++ . '</td><td>' . $user->user_login . '</td><td>' . $user->anita_gamescore . '</td></tr>';
    }
    
    echo '</tbody>';
    echo '</table>';
    echo '</div>';
    
}

add_shortcode('anita-game-leaderboard', 'anita_game_leaderboard');

