# WebFitts

<p align="center">
  <img src="https://github.com/adildsw/WebFitt/blob/main/assets/banner_alt_zoomed.png" />
</p>

_WebFitts_ is a web-based Fitts' law testing application inspired by Scott MacKenzie's [GoFitts](http://www.yorku.ca/mack/FittsLawSoftware/) application.

## Getting Started
You can get _WebFitts_ up and running on your system by following the instructions below!

### Prerequisites
In order to run _WebFitts_, please make sure your device meets the following requirements:

##### 1. **[Python 3.6+](https://www.python.org/downloads/)** ([Anaconda](https://www.anaconda.com/products/individual) distribution recommended)
##### 2. **[Flask](https://pypi.org/project/Flask/)** (included in the [Anaconda](https://www.anaconda.com/products/individual) distribution)
##### 3. **[Pandas](https://pypi.org/project/pandas/)** (included in the [Anaconda](https://www.anaconda.com/products/individual) distribution)

### Running WebFitts
Once all the prerequisites are met, you can now run _WebFitts_ by following the instructions below:

#### 1. Clone WebFitts repository to your local system.
Open terminal and type the following command:
```
git clone https://github.com/adildsw/WebFitts
```

#### 2. Navigate to the cloned directory.
In the terminal, type the following command:
```
cd WebFitts
```

#### 3. Hosting WebFitts
Once in the _WebFitts_ directory, you can host the _WebFitts_ web application in the localhost by typing the following command in the terminal:
```
python app.py
```
Upon successful server hosting, the terminal/command prompt should return the following message:
```
* Serving Flask app "server" (lazy loading)
* Environment: production
  WARNING: This is a development server. Do not use it in a production deployment.
  Use a production WSGI server instead.
* Debug mode: off
* Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
```
_WebFitts_ can now be launched by opening any browser and entering the address `http://127.0.0.1:5000`

<kbd align="center">
  <img src="https://github.com/adildsw/WebFitt/blob/main/assets/screenshot_main.jpeg" />
</kbd>
<kbd align="center">
  <img src="https://github.com/adildsw/WebFitt/blob/main/assets/screenshot_task.jpeg" />
</kbd>

<kbd align="center">
  <img src="https://github.com/adildsw/WebFitt/blob/main/assets/screenshot_result.jpeg" />
</kbd>

## Configuration
_WebFitts_ offers some configurable parameters:

### Hosting WebFitts over a network
_WebFitts_ has the functionality allowing users to host the application in custom address to allow for multi-device access over a network. This can be done by using the `ip` and `port` argument while launching the application.
```
python app.py --ip <IP> --port <PORT>
```
**NOTE:** The default IP is set to `127.0.0.1`, and the default port is set to `5000`.

### Creating tasks with multiple amplitude and width values
In order to create tasks with a combination of multiple amplitude and width values, simply write all the amplitude and width values in their respective fields separated by a comma, and _WebFitts_ will create all possible tasks using the (amplitude x width) configurations.

### Disabling server downloads
You can configure WebFitts to not save task results on the server setting the `servdown` argument to 0.
```
python app.py --servdown 0
```
## Result Data Format
After the completion of every task, _WebFitts_ saves 3 task result files on the client system (and the same files are also stored on the server if _WebFitts_ is configured that way). The file description are differentiated using individual file types:
* _click_ - files of this type contains detailed information of every click made during the task.
* _task_ - files of this type contains the aggregated information of each task.
* _overall_ - files of this type contains the aggregated information obtained from all the tasks.

All the data are stored in CSV format, and can be accessed using any text editor of choice. The data headers are included with each file. The header definition and calculations are derived from Scott MacKenzie's [GoFitts](http://www.yorku.ca/mack/FittsLawSoftware/) application, the documentation of which can be found [here](http://www.yorku.ca/mack/FittsLawSoftware/doc/index.html?GoFitts.html). 

## Contribution
All contributions are welcome! You can open an issue to discuss the changes, and use pull requests to suggest modifications.
