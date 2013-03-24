LOCALHOST = 'http://127.0.0.1:';
PORT = '31110';
NEW_TOPIC_HTML = '<form id="new-topic-form" >' +
		         '<label for="topic-title">Topic Title:</label>' +
				 '<input type="text" id="topic-title" placeholder="What do you want your topic to be called?" size="140" maxlength="140" required>' +
				 '<label for="url-field">URL: </label>' +
				 '<input type="url" id="url-field" placeholder="What do you want to share?" size="140" maxlength="140" required>' +
				 '<label for="submit-topic"></label>' +
				 '<input id="submit-topic" type="button" value = "Post Topic"/>' +
				 '</form>'
NEW_REPLY_HTML = '<form id="new-reply-form" >' +
				 '<TEXTAREA autofocus="autofocus" ROWS=3 COLS=50 id="reply-text" ></TEXTAREA>' +
				 '<br><input class="submit-reply" type="button" value="Post Reply"/>' +
				 '</form>';
/*
 * Populate the DOM with data
 */
function populateDOM(url) {
	$.getJSON(url, function(json) {
		injectTopics(json);
	});
 }

/*
 * Inject topic elements into the DOM.
 */
 function injectTopics(json) {
	// process each topic
	var sorted = [];
	$.each(json, function (tid, topic) {
		sorted.push([tid, topic]);
	});

	// sort topics by upvotes
	sorted.sort(function(a, b) {
		return b[1]["upvotes"] - a[1]["upvotes"];
	});
	
	// iterate through array and inject topics
	for (var i = 0; i < sorted.length; i++) {
		var j = i + 1;
		var topic_title = sorted[i][1]["topicTitle"],
		url_field = sorted[i][1]["urlField"],
		upvotes = sorted[i][1]["upvotes"],
		div_id = "tid" + sorted[i][0],
		htmlString = '<div>'+ j +'</div><div id=' + div_id + ' class="topic repliable"><h4 class="topicName">' +
		"(Upvotes: <span class='upcounter'>" + upvotes + "</span>) | " + topic_title +
		'</h4><div class="link">(<a href="' + url_field +
			'">' + url_field + '</a>)</div><p class="tvid">Upvote Topic</p><div class="replySpace">View Replies</div></div>';
	$("#topics").append(htmlString);
	}
}

/*
 * Perform topic swap if necessary.
 */
function topicSwap(tid, tid_upvotes) {
	var prev_upvotes = $("#"+tid).prev().prev().find(".upcounter:first").text();
	// while the new upvotes are greater than the topic above it, swap them.
	while (tid_upvotes > prev_upvotes && prev_upvotes !== "") {
		$("#"+tid).after($("#"+tid).prev().prev());
		var order = $("#"+tid).prev();
		$(order).before($("#"+tid));
		prev_upvotes = $("#"+tid).prev().prev().find(".upcounter:first").text();
	}
}

/*
* Increment replies upvote
*/
function replyPut(){
	var rid = $(this).parent().attr("id");
	var stripped_rid = +rid.substring(3);
	$.post("/replies?method=put&rid=" +
		stripped_rid ,function() {
			$.get('/replies?method=get&rid=' + stripped_rid, function(data) {
				// update upvoted reply
				$("#"+rid).find(".upcounter").first().html(data["upvotes"]);
				// update upvoted replies'
				var updated_upvote =
				+$("#"+rid).parents(".topic").find(".upcounter:first").text() + 1;
				$("#"+rid).parents(".topic").find(".upcounter:first").html(updated_upvote);
				topicSwap($("#"+rid).parents(".topic").attr('id'), updated_upvote);
				$.get('/replies?method=get', function (data) {
					$.each(data, function (r, reply) {
						var div_id = "rid" + r;
						replySwap(div_id);
					});
				});
			});
	});
}
/*
* Increment topics upvote
*/
function topicPut(){
		var tid = $(this).parent(".topic").attr('id');
		var stripped_tid = +tid.substring(3);
		$.post("/topics?method=put&tid=" +
			stripped_tid ,function(){
				$.get('/topics?method=get&tid=' + stripped_tid, function(data) {
					var updated_vote = data["upvotes"];
					$("#"+tid).find(".upcounter:first").html(updated_vote);
					topicSwap(tid, updated_vote);
				});
		});
}

// Populate a topic with its replies
function populateTopic(url, parent) {
	$.getJSON(url, function(json) {
		injectReplies(json, parent);
	});
}

// inject reply elements
function injectReplies(replies, parent) {
	$.each(replies, function (rid, reply) {
		var parentElement;
		var reply_tid = "tid" + reply["parentId"]["tid"];
		if ((reply_tid) !== parent.attr('id')){ // check only for replies same as the topic clicked
			return true; // continue in loop
		}
		if (reply["parentId"]["rid"] !== "0" ) {
			parentElement = "#rid" + reply["parentId"]["rid"];
		} else {
			parentElement = "#tid" + reply["parentId"]["tid"];
		}
		var comment = reply["comment"];
		var upvotes = reply["upvotes"];
		var div_id = "rid" + rid;
		var htmlString = '<div id=' + div_id + ' class="reply repliable"><p>Upvotes: <span class="upcounter">' + upvotes + '</span>' + " | " + comment +
		'  </p><p class="vid">Upvote Reply</p><div class="replySpace">Reply</div></div>';
		$(parentElement).append(htmlString);
		replySwap(div_id);
	});
}

function replySwap(div_id) {
	// alert(div_id)
	var rid = "#" + div_id;
	var reply_list = $(rid).siblings('.reply').andSelf();

	$.each(reply_list, function (i, reply) {
		if (i !== 0) {
			var j = i;
			var curvote = $(reply).find(".upcounter:first").text();
			var prevvote = $(reply_list[j-1]).find(".upcounter:first").text();
			while (curvote > prevvote && j > 0){
				$(reply).after($(reply_list[j-1]));
				j -= 1;
				prevvote = $(reply_list[j-1]).find(".upcounter:first").text();
			}
		}
	})
}

// post new topic
function postTopic() {
	if (validateForm()) {
		var topic_title, url_field;

		// retrieve the title and url from the form
		topic_title = $('#topic-title').val();
		url_field = $('#url-field').val();

		// send post request to server
		$.post("/topics?method=post&topic-title=" +
			topic_title + '&url-field=' + url_field, function(){
				$.get("/topics?method=get", function(data) {
					var tid = Object.keys(data).length, // latest tid
						topic_title = data[tid]["topicTitle"],
						url_field = data[tid]["urlField"],
						upvotes = data[tid]["upvotes"],
						div_id = "tid" + tid,
						htmlString = '<div>'+ tid +'</div><div id=' + div_id + ' class="topic repliable"><h4 class="topicName">' +
							"(Upvotes: <span class='upcounter'>" + upvotes + "</span>) | " + topic_title +
							'</h4><div class="link">(<a href="' + url_field +'">' + url_field +
							'</a>)</div><p class="tvid">Upvote Topic</p><div class="replySpace">View Replies</div></div>';
					// get rid of form after posting
					$("#create-topic").html("");
					$("#new-topic").show();
					$("#topics").append(htmlString);
				});
			});
	}
}

// present the reply button and field
function postReply(parentTID, parentRID, comment) {
	var tid, rid;
	tid = +parentTID.substring(3); // get the number from parent TID
						// + sign gets rid of string
	if (parentRID.indexOf("tid") !== -1) {
		rid = 0; // then that means rid should be 0 and comment is a reply to a topic
	} else {
		rid = +parentRID.substring(3);
	}
	
	if (validateReply(comment)) {
		$.post("/replies?method=post&comment=" + comment + "&tid=" +
			tid + "&rid=" + rid, function(){
				$.get("/replies?method=get", function(data) {
					var latest_rid = Object.keys(data).length,
						comment = data[latest_rid]["comment"],
						upvotes = data[latest_rid]["upvotes"],
						div_id = "rid" + latest_rid;
					if (data[latest_rid]["parentId"]["rid"] !== "0" ) {
						parentElement = "#rid" + data[latest_rid]["parentId"]["rid"];
					} else {
						parentElement = "#tid" + data[latest_rid]["parentId"]["tid"];
					}
					var htmlString = '<div id=' + div_id + ' class="reply repliable"><p>Upvotes: <span class="upcounter">' +
						upvotes + '</span>' + " | " + comment +
						'  </p><p class="vid">Upvote Reply</p><div class="replySpace">Reply</div></div>';
				// get rid of form
				$("#new-reply-form").hide();
				// update topic's upvotes
				var updated_upvote = +$("#tid"+tid).find(".upcounter:first").text() + 1;

				$("#tid"+tid).find(".upcounter:first").html(updated_upvote);
				$(parentElement).append(htmlString);
				// swap topic if necessary
				topicSwap("tid"+tid, updated_upvote);
				});
			});
	}
}

/*
 * Validate the form's topic name, length and url.
 */
function validateForm() {
    var returnVal = true;

    // retrieve the input values
    var topic = document.forms["new-topic-form"]["topic-title"].value;
    var url = document.forms["new-topic-form"]["url-field"].value;

    // make sure topic name is present
    if (topic === undefined || topic === "") {
		returnVal = false;
		alert("Please enter a topic name");
    }
    
    // validate URL
    else if (!validateURL(url)) {
		returnVal = false;
		alert("Please enter a correct URL");
    }

    // ensure topic length is 140 characters or less
    else if (topic.length > 140) {
		returnVal = false;
		alert("Topic name is too long");
    }
    return returnVal;
}

/*
 * Validate reply form.
 */
function validateReply(reply) {
    var returnVal = true;

    // make sure reply is present
    if (reply === undefined || reply === "") {
		returnVal = false;
		alert("Please enter a reply");
    }
    
    // ensure reply is 140 characters or less
    else if (reply.length > 140) {
		returnVal = false;
		alert("Reply is too long");
    }
    return returnVal;
}

$(document).ready(function() {
	populateDOM("/topics?method=get");
		
	// Present form to create a new topic and hide the new topic button
	$('#new-topic').click(function () {
		$('#create-topic').html(NEW_TOPIC_HTML);
		$('#new-topic').hide();
	});

	/*
	 * Call the postTopic() function on mouse click
	 */
	$("body").on('click', '#submit-topic', postTopic);

	/*
	 * Bring up the reply form below the topic/reply clicked
	 */
	$('body').on('click', '.replySpace', function(){

		// if there are no replies visibile,
		// retrieve whatever replies are stored on the server
		if ($(this).parent().find('.reply').length === 0) {
			populateTopic("/replies?method=get", $(this).parent());
		}

		// delete all other reply forms if present
		$('body').find('#new-reply-form').remove();
		$(this).text("Reply");
		$(this).after(NEW_REPLY_HTML);
	});

	/*
	 * Retrieve the tID and the rID for the reply from it's
	 * ancestors and proceed to post the reply to server
	 */
	$('body').on('click', '.submit-reply', function() {
		var tid = $(this).parents(".topic").attr('id'),
			rid = $(this).parent().parent().attr('id'),
			comment = $('#reply-text').val();
		postReply(tid, rid, comment);
	});

	// upvote reply
	$('body').on('click', '.vid', replyPut);

	// upvote topic
	$('body').on('click', '.tvid', topicPut);
	
});

/******************
 * Helper functions
 ******************/

/*
 * URL validator.
 * Returns true if url is valid, false otherwise.
 */
function validateURL(url) {
    // regex for url taken from http://www.roseindia.net/answers/viewqa/JavaScriptQuestions/25837-javascript-regex-validate-url.html
    var urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!-\/]))?/;
    
    return urlRegex.test(url);
}
