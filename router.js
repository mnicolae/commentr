green  = '\033[32m'; // for console coloring
red   = '\033[31m';
reset = '\033[0m';

function route(handle, requestURL, response) {
	var pathname = requestURL.pathname;
	var query = requestURL.query;
	console.log("About to route a request for " + green + pathname + reset);
	
	if (typeof handle[pathname] === 'function') {
		handle[pathname](query, response);
	} else {
		console.log("No request handler found for " + red + pathname + reset);
		response.writeHead(404, {"Content-Type": "text/plain"});
		response.write("404 Not found");
		response.end();
	}
}

exports.route = route;
