import os
import argparse
import webbrowser
import pandas
from time import time

from flask import Flask, render_template, request, Response

app = Flask(__name__, static_folder="web", template_folder="web")

servdown = False
resultsview = True

@app.route("/")
def index():
    return render_template("index.html", servdown=servdown, resultsview=resultsview)

@app.route("/saveResult", methods=["POST"])
def save_result():
    click_result = request.form["click_result"]
    task_result = request.form["task_result"]
    mean_result = request.form["mean_result"]
    filename = request.form["filename"]
    ip = request.remote_addr

    timestamp = str(int(round(time() * 1000)))

    if not os.path.exists("data"):
        os.makedirs("data")

    with open(os.path.join("data", "{}_{}_{}.wf1".format(filename, ip, timestamp)), "w") as f:
        f.write(click_result)
    with open(os.path.join("data", "{}_{}_{}.wf2".format(filename, ip, timestamp)), "w") as f:
        f.write(task_result)
    with open(os.path.join("data", "{}_{}_{}.wf3".format(filename, ip, timestamp)), "w") as f:
        f.write(mean_result)
    
    return "OK"

@app.route("/utils/mergedmean")
def gen_merged_mean():
    df = pandas.DataFrame()
    for filename in os.listdir("data"):
        if filename.endswith(".wf3"):
            filedir = os.path.join("data", filename)
            temp = pandas.read_csv(filedir)
            df = df.append(temp)
    merged_mean = df.to_csv(index=False)
    # return app.send_static_file("mergedmean.csv")
    return Response(merged_mean, mimetype="text/csv", headers={"Content-disposition": "attachment; filename=merged_mean.csv"})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ip", default="127.0.0.1", help="The ip to listen on. Default is 127.0.0.1")
    parser.add_argument("--port", type=int, default=5000, help="The port to listen on. Default is 5000")
    parser.add_argument("--servdown", type=int, default=0, help="Set to 1 to enable downloads to server. Default is 0")
    parser.add_argument("--resultsview", type=int, default=1, help="Set to 1 to show result screen after task completion, 0 to return to main menu. Default is 1")

    args = parser.parse_args()
    if args.servdown == 1:
        servdown = True
    if args.resultsview == 0:
        resultsview = False

    # url = "http://{}:{}".format(args.ip, args.port)
    # webbrowser.open(url)

    app.run(host=args.ip, port=args.port, debug=True)