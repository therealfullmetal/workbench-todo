#!/usr/bin/env python3
"""
Simple HTTP Server for WORKBENCH // TASK_REGISTRY
Runs locally on port 8080 with proper MIME types and CORS support.
"""

import http.server
import socketserver
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class WorkbenchHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and caching headers for local workbench development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), WorkbenchHandler) as httpd:
        print(f"==================================================")
        print(f"  WORKBENCH // TASK_REGISTRY is running")
        print(f"  URL: http://127.0.0.1:{PORT}")
        print(f"  Root: {DIRECTORY}")
        print(f"  Press Ctrl+C to stop the server")
        print(f"==================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server gracefully...")
            httpd.server_close()
            sys.exit(0)

if __name__ == "__main__":
    main()
