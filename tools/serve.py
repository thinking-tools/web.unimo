#!/usr/bin/env python3
"""
Serves the site to look at while working on it:  python3 tools/serve.py [port]

It does what `python3 -m http.server` does, with three differences that keep errors which are not the page's own
out of the browser's console:

- It tells the browser to keep no copies. The files carry no version in their names, so a browser that keeps
  copies will sooner or later run an old copy of one script beside a new copy of another.
- It keeps connections open and takes many at once. The page sends for some thirty files in one go; the plain
  server answers each on a connection of its own and lets only five wait, so under that rush it turns some away
  ("connection reset").
- It knows a few kinds of file an older Python does not.
"""
import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_PORT = 5173


class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"  # a connection stays open for the next request
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".avif": "image/avif",
        ".webmanifest": "application/manifest+json",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class Server(ThreadingHTTPServer):
    request_queue_size = 128  # how many new connections may wait their turn


def main():
    port = int(sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PORT", DEFAULT_PORT))
    with Server(("", port), partial(Handler, directory=SITE)) as server:
        print(f"http://localhost:{port}")
        server.serve_forever()


if __name__ == "__main__":
    main()
