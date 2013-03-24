querystring = require("querystring");

// global tid and rid contain number of topics and replies on server

var tid = 0,
rid = 0;

/*
  Sample Topic:
  tid : {
    "topicTitle" : "Title",
    "urlField" : "www. url here.com"
  }

  Sample Reply;
  rid : {
    "comment": "your comment here",
    "upvotes" : number of upvotes (str),
    "parentId": {
      "tid": tid here (str),
      "rid": rid here (str) // specify 0 for rid here if the reply belongs to topic
    }
  }
  */
  var db = {
    "topics": {},
    "replies": {}
  };

magenta  = '\033[35m';
reset = '\033[0m';

/******************
 * Topics handler
 ******************/
function topics(query, response) {
    console.log("Request handler" + magenta + " topics " + reset + "was called.");
    queryParsed = querystring.parse(query);
    method = queryParsed["method"];

    if (method === 'post') {
        topicPost(queryParsed, response);
    } else if (method === 'get') {
        fetchTopics(queryParsed, response);
    } else if (method === 'put') {
        topicPut(queryParsed, response);
    } else {
        response.writeHead(405, {"Content-Type": "text/plain"});
        response.write("405 Method not allowed");
        response.end();
    }
}

/*
 * Handles a POST request for creating a new topic.
 */
function topicPost(queryParsed, response) {
    console.log("Request handler " + magenta +  "topicPost"  + reset + " was called.");
    var topic_title, url_field;
   
    topic_title = queryParsed["topic-title"];
    url_field = queryParsed["url-field"];
   
    tid++; // increment topic id
   
    db["topics"][tid] = {
        "topicTitle": topic_title,
        "urlField": url_field,
        "upvotes": "1"
    };
   
    console.log("New Topic added to db: tid = " + magenta + tid + reset + " Name = "+
     magenta + db["topics"][tid]["topicTitle"] + reset);
   
    response.writeHead(301, {Location: '/'});
    response.end();
}

/*
 * Handles a GET request for fetching all topics.
 * Returned data is in JSON format.
 */
 function fetchTopics(queryParsed, response) {
    var body, tid;
   
    if (queryParsed["tid"]) { // get the specific topic if tid is supplied
      tid = queryParsed["tid"];
      body = JSON.stringify(db["topics"][tid]);
    } else {
      body = JSON.stringify(db["topics"]);
    }
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(body);
}

/*
 * Handles a PUT request for updating an existing topic.
 * Updating an existing topic means upvoting it in this
 * case.
 */
function topicPut(queryParsed, response) {
  console.log("Request handler " + magenta + 'topicPut' + reset + " was called.");

  var tid = queryParsed["tid"];
  // increment upvote count for this topic
  db["topics"][tid]["upvotes"]++;

  console.log("Topic tid = " + magenta + tid + reset + " has been upvoted.");

  response.writeHead(301, {Location : '/'});
  response.end();

}

/******************
 * Replies handler
 ******************/
function replies(query, response) {
    console.log("Request handler " + magenta + "replies" + reset + " was called.");
   
    queryParsed = querystring.parse(query);
    method = queryParsed["method"];

    if (method === 'post') {
   		replyPost(queryParsed, response);
    } else if (method === 'get') {
    	fetchReplies(queryParsed, response);
    } else if (method === 'put') {
    	replyPut(queryParsed, response);
    } else {
    	response.writeHead(405, {"Content-Type": "text/plain"});
    	response.write("405 Method not allowed");
    	response.end();
    }
}

/*
 * Handles a POST request for creating a new reply.
 */ 
function replyPost(queryParsed, response) {
	console.log("Request handler " + magenta + "replyPost" + reset + " was called.");

	var parentId, comment;
	comment = queryParsed["comment"];
	parentId = {
		"tid" : queryParsed["tid"],
		"rid" : queryParsed["rid"]
	};

	rid++; //increment reply id

	db["replies"][rid] = {
		"comment" : comment,
		"upvotes" : "1",
		"parentId" : parentId
	}; 
	
	// increment upvote count for the topic this reply belongs to
	db["topics"][parentId["tid"]]["upvotes"]++;

	console.log("New reply added to db: rid = " + magenta + rid + reset + " parentId = { tid : "
				+ magenta + parentId["tid"] + reset + " rid : "
				+ magenta + parentId["rid"] + reset + "}");

	response.writeHead(301, {Location : '/'});
	response.end(); 

}

/*
 * Handles a GET request for fetching all replies.
 * Returned data is in JSON format.
 */
function fetchReplies(queryParsed, response) {
    var body, rid;
    
    if (queryParsed["rid"]) {
      rid = queryParsed["rid"];
      body = JSON.stringify(db["replies"][rid]);
    } else {
      body = JSON.stringify(db["replies"]);
    }
    response.writeHead(200, {'Content-Type': 'application/json'});
    console.log(queryParsed);
    response.end(body);
}

/*
 * Handles a PUT request for updating an existing reply.
 * Updating an existing reply means upvoting it in this
 * case.
 */
function replyPut(queryParsed, response) {
	console.log("Request handler " + magenta + 'replyPut' + reset + " was called.");

	var comment, parentId, rid;
	rid = queryParsed["rid"];

	// look up the parents this reply belongs to
	parentId = db["replies"][rid]["parentId"];
	
	// increment upvote count for this reply
	db["replies"][rid]["upvotes"]++;

	// increment upvote count for the topic this reply belongs to
	db["topics"][parentId["tid"]]["upvotes"]++;
	
	console.log("Reply rid = " + magenta + rid + reset + " parentId = { tid : "
				+ magenta + parentId["tid"] + reset + ", rid : "
				+ magenta + parentId["rid"] + reset + "} has been upvoted.");

	response.writeHead(301, {Location : '/'});
	response.end(); 

}

/*
 * serveFile will read a file from filePath and serve it with response.
 */ 
function serveFile(query, response) {
	console.log("Request handler" + magenta + " serveFile " + reset + "was called.");

	path.exists(query, function(exists) {
		if (!exists) { // check if path exists
			response.writeHead(404, {"Content-Type" : "text/plain"});
			response.write("404 Not Found");
			response.end();
			return;
		}
		fs.readFile(query, function(error, content) {
			if (error) {
				response.writeHead(500, {"Content-Type" : "text/plain"});
				response.write("500 Internal Server Error");
				response.end();
				return;
			}
			var extension = path.extname(query);
			var mimeType = MIME_TYPES[extension];
			// determine mimeType
			response.writeHead(200, {'Content-Type' : mimeType});
			response.end(content, 'utf-8');
		});
	}); 

}

exports.fetchTopics = fetchTopics;
exports.topics = topics;
exports.replies = replies;
exports.serveFile = serveFile;