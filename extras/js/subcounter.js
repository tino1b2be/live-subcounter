var channel_id = "UC2YoJYsMAs4Pb-H90y_Ij6Q"; // tino1b2be
var API_key = "AIzaSyB2QDOpPWm3-7TW8hdgz_z--8tLcIxswPg";
var timer;

// implement a string formatting function
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] !== 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

/**
 *
 * @param must_run
 */
function periodic_update(must_run) {
    if (must_run && !timer){
        update_stats();
        timer = setInterval(function () {
            this.update_stats();
        }, 2000);
    } else {
        timer = false;
    }
}

/**
 * Convert number to string and add commas.
 * @param e number to be converted
 * @returns {string} converted string
 */
function toStringWithCommas(e){
    return e.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

/**
 *
 * @param sub_count
 * @param video_count
 * @param comments_count
 * @param view_count
 * @param hidden
 */
function update_all_stats(sub_count, video_count, comments_count, view_count, hidden) {
    $('#sub_count').html(sub_count);
    $('#video_count').html(toStringWithCommas(video_count));
    $('#view_count').html(toStringWithCommas(view_count));
    $('#comments_count').html(toStringWithCommas(comments_count));

    if (hidden){
        snackBar("This user has hidden their subscriber count.");
    }
}

function snackBar(message) {
    // Get the snackbar DIV
    $("#snackbar").text(message);
    $("#snackbar").addClass("show");

    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ $("#snackbar").removeClass("show");}, 5000);
}

function update_profile_pic(src){
    $('#profile_pic').attr('src', src);
}

function update_channel_name(name) {
    $('.username').text(name);
}

function update_cover_pic(src) {
    $('#cover-pic').attr('src', src);
}

function update_recent_videos(items) {

    // Clear current videos

    $("#recent_thumbs").empty();

    var thumbnail_template = "<div class=\"col-md-6 col-lg-4\">\n" +
        "                <a class=\"portfolio-item d-block mx-auto\" target=\"_blank\" href=\"https://www.youtube.com/watch?v={0}\">\n" +
        "                    <div class=\"portfolio-item-caption d-flex position-absolute h-100 w-100\">\n" +
        "                        <div class=\"portfolio-item-caption-content my-auto w-100 text-center text-white\">\n" +
        "                            <i class=\"fa fa-play fa-3x\"></i>\n" +
        "                        </div>\n" +
        "                    </div>\n" +
        "                    <img class=\"img-fluid\" src=\"{1}\" alt=\"\">\n" +
        "                </a>\n" +
        "            </div>\n";

    var i;
    for (i = 0; i < items.length; i++){
        var thumb_url = items[i].snippet.thumbnails.medium.url ? items[i].snippet.thumbnails.medium.url : items[i].snippet.thumbnails.default.url;
        var video_id = items[i].id.videoId;

        var thumb_html = thumbnail_template.format(video_id,thumb_url);

        // add to recent section and popup divs
        $('#recent_thumbs').append(thumb_html);

    }

}

/**
 * Updates the stats of the YT channel
 */
function update_stats() {


    // retrieve stats from YT API
    var url = "https://www.googleapis.com/youtube/v3/channels?part=statistics&id=" + channel_id + "&key=" + API_key;
    $.getJSON(url, function (x) {
        if (x.pageInfo.totalResults > 0) {
            // Channel found!
            update_all_stats(
                x.items[0].statistics.subscriberCount,
                x.items[0].statistics.videoCount,
                x.items[0].statistics.commentCount,
                x.items[0].statistics.viewCount,
                x.items[0].statistics.hiddenSubscriberCount
            );

        } else {
            // Something odd...not supposed to reach this point but start a new search for the channel
            search_for_channel(channel_id);
        }
    });

}

/**
 *
 * @param query the channel name or ID.
 */
function search_for_channel(query) {

    if (!query) {
        query = $("#search_query").val();
        if (query === ""){
            alert("Please enter something in the search bar.");
            return;
        }
    }

    var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + query + "&type=channel&maxResults=1&key=" + API_key;
    $.getJSON(url, function (e) {
        if (e.pageInfo.totalResults > 0) {

            update_channel_name(e.items[0].snippet.title);
            update_profile_pic(e.items[0].snippet.thumbnails.medium.url ? e.items[0].snippet.thumbnails.medium.url : e.items[0].snippet.thumbnails.default.url);
            channel_id = e.items[0].snippet.channelId;
            $(".channel_url").attr('href', 'https://www.youtube.com/channel/' + channel_id + '?sub_confirmation=1');
            url2 = "https://www.googleapis.com/youtube/v3/channels?part=brandingSettings&id=" + channel_id + "&key=" + API_key;
            $.getJSON(url2, function(e){
                update_cover_pic(e.items[0].brandingSettings.image.bannerImageUrl);
            });

            url2 = "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=" + channel_id + "&maxResults=9&order=date&type=video&key=" + API_key;
            $.getJSON(url2, function (y) {
                if (y.pageInfo.totalResults > 0){
                    update_recent_videos(y.items);
                } else {
                    $('#recent_thumbs').append('<p class="lead">There are no public videos on this channel.</p>');
                }
            })


            if (!timer){
                periodic_update(true);
            }

        } else {
            alert("That channel could not be found.");
        }

    });

}

$(document).ready(function () {
	setTimeout(function () {
        $("#cookieConsent").fadeIn(200);
     }, 4000);
    $("#closeCookieConsent, .cookieConsentOK").click(function() {
        $("#cookieConsent").fadeOut(200);
    }); 
    $('#search_form').submit(function () {
        search_for_channel(false);
        return false;
    });
    search_for_channel(channel_id);
});
