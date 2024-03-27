const express = require("express");
const app = express();
const favicon = require("serve-favicon");
const path = require("path");

const formidable = require("express-formidable");
app.use(formidable());

const http = require("http").createServer(app);
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Cryptr = require("cryptr");
const socketIO = require("socket.io")(http, { cors: { origin: "*" } });
const mongodb = require("mongodb");
const { MongoClient } = mongodb;

const accessTokenSecret =
  process.env.ACCESS_TOKEN_SECRET || "myAccessTokenSecret1234567890";
const cryptr = new Cryptr("mySecretKey");

app.use("/public", express.static(__dirname + "/public"));
app.set("view engine", "ejs");

let socketID = {};

const port = process.env.PORT || 4000;
const mainURL = `http://localhost:${port}`;

socketIO.on("connection", function (socket) {
  console.log("User connected", socket.id);
  socketID = socket.id;
});

http.listen(port, function () {
  console.log("Server started at " + mainURL);

  MongoClient.connect(
    "mongodb://localhost:27017/friendSpot",
    {
      useUnifiedTopology: true,
    },
    function (error, client) {
      if (error) {
        console.error("Error connecting to database:", error);
        return;
      }
      global.database = client.db("friendSpot");
      console.log("Database connected.");
    }
  );

  app.get("/", (req, res) => {
    res.render("index");
  });

  app.get("/signup", (req, res) => {
    res.render("signup");
  });

  app.post("/signup", (req, res) => {
    const { name, username, email, password, gender } = req.fields;

    global.database.collection("users").findOne(
      {
        $or: [{ email: email }, { username: username }],
      },
      function (err, user) {
        if (err) {
          console.error("Error finding user:", err);
          return res.status(500).json({
            status: "error",
            message: "Internal Server Error",
          });
        }

        if (user) {
          return res.status(400).json({
            status: "error",
            message: "User already exists",
          });
        }

        bcrypt.hash(password, 10, function (err, hash) {
          if (err) {
            console.error("Error hashing password:", err);
            return res.status(500).json({
              status: "error",
              message: "Internal Server Error",
            });
          }

          global.database.collection("users").insertOne(
            {
              name: name,
              username: username,
              email: email,
              password: hash,
              gender: gender,
              profileImage: "",
              coverPhoto: "",
              dob: "",
              city: "",
              country: "",
              aboutMe: "",
              friends: [],
              pages: [],
              notifications: [],
              groups: [],
              posts: [],
            },
            function (err, data) {
              if (err) {
                console.error("Error inserting user:", err);
                return res.status(500).json({
                  status: "error",
                  message: "Internal Server Error",
                });
              }
              res.send(
                `<script>alert('User created successfully'); window.location.href = '/login';</script>`
              );
            }
          );
        });
      }
    );
  });

  app.get("/login", (req, res) => {
    res.render("login");
  });

  app.post("/login", (req, res) => {
    const { email, password } = req.fields;
    global.database
      .collection("users")
      .findOne({ email: email }, function (err, user) {
        if (user == null) {
          res.json({
            status: "error",
            message: "Email not found",
            redirect: "/login",
          });
        } else {
          bcrypt.compare(password, user.password, function (err, isVerify) {
            if (isVerify) {
              var accessToken = jwt.sign({ email: email }, accessTokenSecret);
              global.database.collection("users").findOneAndUpdate(
                {
                  email: email,
                },
                {
                  $set: {
                    accessToken: accessToken,
                  },
                },
                function (err, data) {
                  res.json({
                    status: "success",
                    message: "Logged in successfully",
                    accessToken: accessToken,
                    profileImage: user.profileImage,
                  });
                }
              );
            } else {
              res.json({
                status: "error",
                message: "Invalid password",
                redirect: "/login",
              });
            }
          });
        }
      });
  });
});

app.use(favicon(path.join(__dirname, "public", "images/fav.png")));

app.use(
  express.static("public", {
    // Set the correct MIME type for CSS files
    setHeaders: (res, path, stat) => {
      if (path.endsWith(".css")) {
        res.set("Content-Type", "text/css");
      }
    },
  })
);
