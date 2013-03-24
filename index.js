server = require("./server.js");
router = require("./router.js");
requestHandlers = require("./requestHandlers.js");

LOCALHOST = "http://127.0.0.1:";
PORT = 31110;

MIME_TYPES = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.txt': 'text/plain',
        '.json': 'application/json'
};

var handle = {};
handle["/topics"] = requestHandlers.topics;
handle["/replies"] = requestHandlers.replies;

server.start(router.route, handle);