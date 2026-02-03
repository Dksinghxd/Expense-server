# Express Server Setup

## Step 1: Initialize the Project

```bash
npm init -y
```

* Creates a `package.json` file
* `-y` accepts default values automatically

---

## package.json

* Contains **project metadata**
* Includes:

  * Project name and version
  * Scripts
  * Dependencies
* Gives an overview of the project configuration

---

## Step 2: Install Express

```bash
npm install express
```

This will:

* Install Express as a dependency
* Create a `node_modules` folder
* Generate or update `package-lock.json`

---

## node_modules

* Contains all installed dependencies and their internal packages
* Should **not** be committed to version control
* Recreated using:

```bash
npm install
```

---

## package-lock.json

* Stores exact dependency versions and their locations
* Ensures consistent installs across environments
* Should not be manually edited

---

## Importing Express

```js
const express = require('express');
```

* Uses **CommonJS** module system
* Loads only the required dependency
* Default module system in Node.js (unless ES modules are enabled)

---

## Creating an Express App

```js
const app = express();
```

* Initializes an Express application
* Used to define routes and middleware

---

## Middleware: JSON Parser

```js
app.use(express.json());
```

* Middleware that intercepts incoming requests
* Converts JSON request bodies into JavaScript objects
* Required for handling `POST` and `PUT` requests

---

## Summary

* `npm init -y` → Initialize Node project
* `package.json` → Project metadata
* `npm install express` → Install Express
* `node_modules` → Dependencies
* `package-lock.json` → Dependency lock file
* `express.json()` → Parses incoming JSON requests
