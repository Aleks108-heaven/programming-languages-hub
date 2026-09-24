"""Build index.html and serve it locally.

Usage:
    python serve.py                # build, then serve on http://127.0.0.1:8000/
    python serve.py --port 9000    # use another port
    python serve.py --no-build     # serve without rebuilding
    python serve.py --no-open      # do not open a browser tab

The server listens on 127.0.0.1 only, so it is not reachable from other machines.
Press Ctrl+C to stop it.
"""
import argparse
import functools
import http.server
import subprocess
import sys
import webbrowser
from pathlib import Path

ROOT = Path(__file__).parent


class Handler(http.server.SimpleHTTPRequestHandler):
    ALLOWED = {"/", "/index.html"}

    def send_head(self):
        # Serve the app page only: no directory listings, no source files, no .git
        if self.path.split("?", 1)[0].split("#", 1)[0] not in self.ALLOWED:
            self.send_error(404, "Not found")
            return None
        return super().send_head()

    def end_headers(self):
        # Always serve the latest build while editing
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--no-build", action="store_true")
    ap.add_argument("--no-open", action="store_true")
    args = ap.parse_args()

    if not args.no_build:
        subprocess.run([sys.executable, str(ROOT / "build.py")], check=True)

    handler = functools.partial(Handler, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler) as httpd:
        url = f"http://127.0.0.1:{args.port}/"
        print(f"Serving {ROOT.name} at {url}  (Ctrl+C to stop)")
        if not args.no_open:
            webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
