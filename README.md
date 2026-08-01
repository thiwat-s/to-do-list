This is a [Next.js](https://nextjs.org) app connected to MongoDB Atlas.

## Getting Started

Install dependencies, then start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a local env file and add your MongoDB connection string:

```bash
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster-url>/todo_app?retryWrites=true&w=majority"
```

This project reads `DATABASE_URL` on the server only.

## Deploy To Vercel

1. Push this project to GitHub.
2. In Vercel, click `Add New...` -> `Project`.
3. Import the GitHub repository.
4. Add the `DATABASE_URL` environment variable in the Vercel project settings.
5. Deploy.

### MongoDB Atlas Notes

If the app works locally but fails on Vercel, Atlas network access is usually the cause.

- For a quick setup, allow `0.0.0.0/0` temporarily in Atlas `Network Access`.
- Make sure the database user in Atlas is still valid and the password in `DATABASE_URL` matches.
- Use a database name in the connection string, for example `todo_app`.

## MongoDB

The shared Mongoose connection helper lives in `lib/mongoose.ts`.

The homepage checks the Atlas cluster with the active Mongoose connection.

## Mongoose API

This project now includes:

- `lib/mongoose.ts` for the shared Mongoose connection
- `models/Todo.ts` for the Todo model
- `app/api/todos/route.ts` for `GET` and `POST`
- `app/api/todos/[id]/route.ts` for `GET`, `PATCH`, and `DELETE`

Example request:

```bash
POST /api/todos
Content-Type: application/json

{
  "title": "Buy milk",
  "description": "2 bottles",
  "completed": false
}
```
