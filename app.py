import os
import argparse
import webbrowser
from time import time

from flask import Flask, render_template, request

app = Flask(__name__, static_folder="web", template_folder="web")

servdown = False

@app.route("/")
def index():
    return render_template("index.html", servdown=servdown)

@app.route("/saveResult", methods=["POST"])
def save_result():
    result = request.form["result"]
    filename = request.form["filename"]
    ip = request.remote_addr

    timestamp = str(int(round(time() * 1000)))

    if not os.path.exists("data"):
        os.makedirs("data")

    with open(os.path.join("data", "{}_{}_{}.csv".format(filename, ip, timestamp)), "w") as f:
        f.write(result)
    
    return "OK"

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ip", default="127.0.0.1", help="The ip to listen on. Default is 127.0.0.1")
    parser.add_argument("--port", type=int, default=5000, help="The port to listen on. Default is 5000")
    parser.add_argument("--servdown", type=int, default=0, help="Set to 1 to enable downloads to server. Default is 0")

    args = parser.parse_args()
    if args.servdown == 1:
        servdown = True

    url = "http://{}:{}".format(args.ip, args.port)
    webbrowser.open(url)

    app.run(host=args.ip, port=args.port)