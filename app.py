from __future__ import annotations

import os

from flask import Flask, render_template


app = Flask(__name__, static_folder="static", template_folder="templates")


@app.get("/")
def home():
    return render_template("home.html")


@app.get("/birthday")
def birthday():
    return render_template("index.html")


def main() -> None:
    port = int(os.environ.get("PORT", "5173"))
    host = os.environ.get("HOST", "127.0.0.1")
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    main()

