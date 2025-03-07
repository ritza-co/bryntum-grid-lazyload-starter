import bodyParser from "body-parser";
import express from "express";
import sessions from "express-session";
import { readFileSync } from "fs";
import path from "path";

global.__dirname = path.resolve();

const port = process.env.PORT || 1337;
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "/node_modules/@bryntum/grid")));
const fakeDelay = 250;

app.use(bodyParser.json());

app.use(
  sessions({
    secret: "bryntum",
    saveUninitialized: true,
    resave: false,
    cookie: {
      maxAge: 7200000, // 2 hours
      sameSite: "strict", // Can be 'strict', 'lax', or 'none'
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
    },
  })
);

// Saving each user session data in a shared variable.
// Much more performant than saving directly in the session.
const sessionData = {},
  // Used to filter the in-memory "database" by different "operators"
  filterEvaluators = {
    "*": (a, b) => filterEvaluators["="](a, b) || a?.toString().includes(b),
    "=": (a, b) => a === b,
    ">": (a, b) => a > b,
    "<": (a, b) => a < b,
  };

// Use to get data, either saved in the current session or from the data file
const getData = (req) => {
  // Demo data is saved with the session
  if (!sessionData[req.sessionID]) {
    sessionData[req.sessionID] = {};
    checkSessions(req);
  }

  if (!sessionData[req.sessionID].data) {
    sessionData[req.sessionID].data = JSON.parse(
      readFileSync("./data/data.json")
    );
  }
  return sessionData[req.sessionID].data;
};

// Used to clear the "memory" of old sessions
const checkSessions = (req) => {
  for (const [sessionID, session] of Object.entries(sessionData)) {
    // Extend life of current session
    if (sessionID === req.sessionID) {
      session.expires = new Date().getTime() + 1000 * 60 * 60 * 2;
    }
    // Non-current session has expired, clear the saved data
    else if (session.expires < new Date().getTime()) {
      sessionData[sessionID] = undefined;
    }
  }
};

// Use to sort the in-memory "database" on different fields.
// The default sorting is ascending sortIndex
function sortData(req, data, field = "sortIndex", ascending = true) {
  data.sort((a, b) =>
    a[field] > b[field] ? (ascending ? 1 : -1) : ascending ? -1 : 1
  );
  sessionData[req.sessionID].dataIsSorted = arguments.length > 1;
}

app.listen(port, () => {
  console.log("Server is running on port " + port + "...");
});

async function serverConfig() {
  app.get("/read", async (req, res) => {
    const { query } = req,
      { sort, filter } = query, // Params provided by the client
      startIndex = parseInt(query.startIndex),
      count = parseInt(query.count);
    let data = getData(req);

    // We got a sort param (JSON encoded array of objects)
    if (sort) {
      const decoded = JSON.parse(sort);

      // Each object has 2 properties, field (string) and ascending (boolean)
      for (const { ascending, field } of decoded) {
        sortData(req, data, field, ascending);
      }
    }
    // If no sorters, sort with default values
    else if (req.session.dataIsSorted) {
      sortData(req, data);
    }

    // We got a filter param (JSON encoded array of objects)
    if (filter) {
      const decoded = JSON.parse(filter);
      // Each filter object has 4 properties:
      // * field (string)
      // operator (=,*,>,< supported in this backend)
      // value
      // caseSensitive (boolean)
      for (const { field, operator, value, caseSensitive } of decoded) {
        const evaluator = filterEvaluators[operator]; // The evaluation function matching current operator

        let filterValue = value;
        if (!caseSensitive && typeof value === "string") {
          filterValue = value.toLowerCase();
        }

        data = data.filter((r) => {
          let fieldValue = r[field];
          if (!caseSensitive && typeof fieldValue === "string") {
            fieldValue = fieldValue.toLowerCase();
          }

          return evaluator(fieldValue, filterValue, caseSensitive);
        });
      }
    }

    await new Promise((resolve) => setTimeout(resolve, fakeDelay));

    // Return the expected JSON response
    res.json({
      success: true,
      total: data.length,
      data: data.slice(startIndex, startIndex + count),
    });
  });

  app.post("/create", async (req, res) => {
    const data = getData(req),
      records = req.body.data; // We get the added records as an array of objects
    let maxId = data.reduce((acc, r) => (r.id > acc ? r.id : acc), 0);

    // Create unique id's for all added records
    records.forEach((r) => (r.id = maxId += 1));

    // Add the records to the session "database"
    data.push(...records);
    sortData(req, data);

    await new Promise((resolve) => setTimeout(resolve, fakeDelay));

    // Return the expected JSON response
    res.json({
      success: true,
      data: records,
    });
  });

  app.post("/delete", async (req, res) => {
    const { ids } = req.body, // We get the id's to delete as an array
      data = getData(req);

    // Remove records from the session "database"
    for (const id of ids) {
      data.splice(
        data.findIndex((r) => r.id === id),
        1
      );
    }

    await new Promise((resolve) => setTimeout(resolve, fakeDelay));

    // Return the expected JSON response
    res.json({
      success: true,
    });
  });

  app.post("/update", async (req, res) => {
    const records = req.body.data, // We get the modified records as an array of objects
      updatedRecords = [],
      data = getData(req);

    while (records.length) {
      const record = data.find((r) => r.id === records[0].id);

      Object.assign(record, records.shift());

      // Keep track of the modified records, they need to be a part of the response sent to the client
      updatedRecords.push(record);
    }

    await new Promise((resolve) => setTimeout(resolve, fakeDelay));

    // Return the expected JSON response
    res.json({
      success: true,
      data: updatedRecords,
    });
  });
}

serverConfig();
