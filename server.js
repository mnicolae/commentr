http = require("http");
fs = require("fs");
path = require("path");
qs = require("querystring");
url = require("url");

green  = '\033[32m'; // for console coloring

requestHandlers = require("./requestHandlers.js");

function start(route, handle) {
    function onRequest(request, response) {
        requestURL = url.parse(request.url);
        console.log("Request for " + green + requestURL.path + '\033[0m' + " received" );

        if (request.url === "/") {
                requestHandlers.serveFile("./index.html", response);
        } else if (request.url.indexOf('js/') !== -1) { // serve js files
                requestHandlers.serveFile(request.url.substring(1), response);
        } else if (request.url.indexOf('css/') !== -1) { // serve css files
                requestHandlers.serveFile(request.url.substring(1), response);
        } else {
            route(handle, requestURL, response);
        }
    }

    // initialize the server
    http.createServer(onRequest).listen(PORT);
    console.log("Server running at " + green + LOCALHOST + PORT + "/");
}

exports.start = start;