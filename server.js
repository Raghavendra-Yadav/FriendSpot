const express = require("express");
const app = express();

const formidable = require("express-formidable");
app.use(formidable());

const http = require("http").createServer(app);
const bcrypt = require("bcryptjs");
const fileSystem = require("fs");

const jwt = require("jsonwebtoken");
const Cryptr = require("cryptr");
const socketIO = require("socket.io")(http, { cors: { origin: "*" } });
const mongodb = require("mongodb");
const { MongoClient, ObjectId } = mongodb;

const accessTokenSecret = "myAccessTokenSecret1234567890";
global.cryptr = new Cryptr("mySecretKey");

app.use("/public", express.static(__dirname + "/public"));
app.set("view engine", "ejs");

const socketID = {};
var users = [];

const port = process.env.PORT || 4000;
global.mainURL = `http://localhost:${port}`;

socketIO.on("connection", function (socket) {
  // Corrected here
  console.log("User connected", socket.id);
  socketID = socket.id;
});
http.listen(port, function () {
  console.log("Server started at " + mainURL);

  MongoClient.connect(
    "mongodb://localhost:27017",
    {
      useUnifiedTopology: true,
    },
    function (error, client) {
      global.database = client.db("friendSpot");
      console.log("Database connected.");
    }
  );

  app.get("/", (req, res) => {
    res.render("index");
  });
});
