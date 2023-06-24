const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API  1

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;

  const requestQuery = request.query;

  const hasStatusAndPriority = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };

  const hasStatus = (requestQuery) => {
    return (
      requestQuery.priority === undefined && requestQuery.status !== undefined
    );
  };

  const hasPriority = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status === undefined
    );
  };

  let getTodosQuery = "";
  let dbResponse = "";

  switch (true) {
    case hasStatusAndPriority(request.query):
      getTodosQuery = `
        SELECT *
        FROM todo
        WHERE 
        todo LIKE '%${search_q}%'
        AND
         priority LIKE '%${priority}%'
        AND
        status LIKE '%${status}%' 
       
       ;`;
      break;
    case hasStatus(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND
            status LIKE '%${status}%'
        ;`;
      break;
    case hasPriority(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND
             priority LIKE '%${priority}%'
        ;`;
      break;
    default:
      getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%';`;
  }

  dbResponse = await db.all(getTodosQuery);
  response.send(dbResponse);
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTaskQuery = `
    SELECT *
    FROM todo
    WHERE id = '${todoId}'
    ;`;
  const data = await db.get(getTaskQuery);
  response.send(data);
});

// API 3

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  console.log(todoDetails);
  const addTodoQuery = `
  INSERT 
    INTO 
    todo (id, todo, priority, status)
    
    VALUES (
        '${id}',
        '${todo}',
        '${priority}',
        '${status}'
    )
    ;`;

  const values = await db.run(addTodoQuery);
  console.log(values);
  response.send("Todo Successfully Added");
});

// API 4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";

  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      return (updateColumn = "Status");
      break;
    case requestBody.priority !== undefined:
      return (updateColumn = "Priority");
      break;
    case requestBody.todo !== undefined:
      return (updateColumn = "Todo");
      break;
  }

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  console.log(request.body);

  updateTodoQuery = `
  UPDATE todo SET 
  todo = '${todo}',
  priority = '${priority}',
  status = '${status}' WHERE id = ${todoId};
  `;
  await db.run(updateTodoQuery);

  response.send(`${updateColumn} Updated`);
});

// API 5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE  FROM todo WHERE id = ${todoId}`;

  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
