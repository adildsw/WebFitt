import os
import argparse
import webbrowser
from time import time

from flask import Flask, render_template, request

app = Flask(__name__, static_folder="web", template_folder="web")

@app.route("/")
def index():
    return render_template("index.html", servdown=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ip", default="127.0.0.1", help="The ip to listen on. Default is 127.0.0.1")
    parser.add_argument("--port", type=int, default=5000, help="The port to listen on. Default is 5000")
    args = parser.parse_args()

    # url = "http://{}:{}".format(args.ip, args.port)
    # webbrowser.open(url)

    app.run(host=args.ip, port=args.port, debug=True)