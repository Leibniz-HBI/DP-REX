# DP|rEX VrAn
This repository contains an editor for collaborative maintenance of metadata for social media accounts.
It is developed as the infrastructure of the data trustee for research on right wing extremism (VrAN).

VrAN is a sub project of DP|rEX and funded by the German Federal Ministry of Education and Reasearch.

## Features
Currently the following features are supported:
* View social media account metadata
* Change the displayed metadata fields
* Create new metadata fields
* Edit Data

### Planned Features
The following features will be implemented
* Bulk data upload
* Assisted review for merging data from bulk uploads into the database


# Running
Currently there is no recommended way of running VrAN.
Please see the _Development_ section.

# Development
There are two projects in this repository.
A backend written in python and a frontend in TypeScript.

## Requirements
Currently the only operating system supported is Linux.
For the backend the project requires Python and poetry as a package manager.
Please install Python with your distros package manager.
Afterwards install poetry using `pip install poetry`.

Node is required for the frontend.
You can find instructions on installing node at [https://github.com/nodesource/distributions]

## Installing dependencies
* For the backend run `poetry install` from the root of the directory.
* For the frontend run `npm install` from  the `ui` directory.


## Preparing the backend
The following steps are required for the initial setup.
You only need to run them once.
* Create an instance of the environment file by running `cp .template.env .env`
* Generate a secret key using `< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c${1:-64};echo`;.
* Copy the secret key and paste it as the value of the variable `DJANGO_KEY` in the `.env` file.
* Set the variable `VRAN_DEBUG` to true in the `.env` file.
* Generate a local database by runing `poetry run ./manage.py migrate`.
## Running
* Start the backend by running `poetry run ./manage.py  runserver`.
* In a seperate shell switch to the `ui` directory and run `npm start`.
