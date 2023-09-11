const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
const app = express();
app.use(express.json());

let dataBase = null;
let dbPath = path.join(__dirname, "userData.db");
const initializeDatabaseAndServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at https://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDatabaseAndServer();

const validatePassword = (password) => {
  return password.length > 4;
};
//register api
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
  SELECT *
  FROM user
  WHERE username = '${username}';`;
  const dbUser = await dataBase.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
      user(username,name,password,gender,location)
      values(
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}');`;
    if (validatePassword(password)) {
      await dataBase.run(createUserQuery);
      response.status = 200;
      response.send("User created successfully");
    } else {
      response.status = 400;
      response.send("Password is too short");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});
//login api
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
  SELECT * FROM user WHERE username = '${username}';`;
  dbUser = await dataBase.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});
//change password api
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const selectUserQuery = `
  SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await dataBase.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      if (validatePassword(newPassword)) {
        const updatePassword = `
            UPDATE 
            user
            SET password = '${hashedPassword}'
            WHERE
            username = '${username}';`;
        const dbUser = await dataBase.run(updatePassword);
        response.status = 200;
        response.send("Password updated");
      } else {
        response.status = 400;
        response.send("Password is too short");
      }
    } else {
      response.status = 400;
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
