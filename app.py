import os
import argparse
import webbrowser
import pandas as pd
from time import time

from flask import Flask, render_template, request, Response

app = Flask(__name__, static_folder="", template_folder="")

servdown = True
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

    check_data_path()

    with open(os.path.join("data", "{}_{}_{}.wf1".format(filename, ip, timestamp)), "w") as f:
        f.write(click_result)
    with open(os.path.join("data", "{}_{}_{}.wf2".format(filename, ip, timestamp)), "w") as f:
        f.write(task_result)
    with open(os.path.join("data", "{}_{}_{}.wf3".format(filename, ip, timestamp)), "w") as f:
        f.write(mean_result)
    
    return "OK"

@app.route("/utils/mergewf3")
def gen_merged_mean():
    check_data_path()
    data_files = [os.path.join("data", f) for f in os.listdir("data") if f.endswith(".wf3")]
    if len(data_files) <= 1:
        return "No data to merge"
    df_list = []
    for filedir in data_files:
        temp = pd.read_csv(filedir)
        temp.insert(0, "Filename", os.path.basename(filedir))
        df_list.append(temp)
    merged_df = pd.concat(df_list, ignore_index=True)
    merged_mean = merged_df.to_csv(index=False)
    return Response(merged_mean, mimetype="text/csv", headers={"Content-disposition": "attachment; filename=merged_wf3.csv"})

@app.route("/utils/cleardata")
def clear_collected_data():
    check_data_path()
    for filename in os.listdir("data"):
        if filename.endswith(".wf1") or filename.endswith(".wf2") or filename.endswith(".wf3"):
            filedir = os.path.join("data", filename)
            os.rename(filedir, os.path.join("data/trash", filename))
    return "Cleared"

def check_data_path():
    if not os.path.exists("data"):
        os.makedirs("data")
    if not os.path.exists("data/trash"):
        os.makedirs("data/trash")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ip", default="127.0.0.1", help="The ip to listen on. Default is 127.0.0.1")
    parser.add_argument("--port", type=int, default=5000, help="The port to listen on. Default is 5000")
    parser.add_argument("--servdown", type=int, default=1, help="Set to 0 to disable downloads to server. Default is 1")
    parser.add_argument("--resultsview", type=int, default=1, help="Set to 1 to show result screen after task completion, 0 to return to main menu. Default is 1")

    args = parser.parse_args()
    if args.servdown == 0:
        servdown = False
    if args.resultsview == 0:
        resultsview = False

    app.run(host=args.ip, port=args.port, debug=True)