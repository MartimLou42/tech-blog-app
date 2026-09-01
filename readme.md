# RESPAWN

A game review blog. Anyone can read reviews and filter them by genre. Registered writers can publish, edit and delete their own reviews.

- **Live app:** https://tech-blog-app-7z8h.onrender.com
- **Repository:** https://github.com/MartimLou42/tech-blog-app

## Try the live app

The app is hosted on a free Render instance, so the very first page load can take up to a minute while the server wakes up. After that it is quick.

Sign in with either seeded account:

| Email               | Password      |
| ------------------- | ------------- |
| `test1@example.com` | `password123` |
| `test2@example.com` | `password123` |

What to try, to see every feature:

1. **Read** without signing in. All six reviews are public.
2. **Filter** with the Genre menu.
3. **Register** a new account, or sign in with `test1@example.com` above.
4. **Create** a review with the form that appears after signing in.
5. **Update** and **delete** using the Edit and Delete buttons on the cards.
6. **Ownership:** signed in as martim, the Edit and Delete buttons only appear on martim's three reviews, never on jules'. The server returns 403 if you try anyway.
7. **Log out** , surprisingly useful, I've always took it for granted.

## Built with

Node.js, Express, Sequelize, MySQL, and a simple HTML/CSS/JavaScript front end.

## Folder structure

```text
config/     database connection
db/         SQL to create the database
models/     User, Post and Category, plus their associations
routes/     the /api endpoints
seeds/      sample data
utils/      JWT signing and route protection
public/     the front end
server.js   starts the app
```

## Run it locally

You need Node.js and MySQL installed.

1. Clone the repo and install the packages.

   ```bash
   git clone https://github.com/MartimLou42/tech-blog-app.git
   cd tech-blog-app
   npm install
   ```

2. Copy `.env.example` to `.env`, then fill in your MySQL password and pick any long random string for `JWT_SECRET`.

3. Create the database.

   ```bash
   mysql -u root -p
   ```

   ```sql
   source db/schema.sql;
   quit;
   ```

4. Add the sample data and start the app.

   ```bash
   npm run seed
   npm start
   ```

5. Open http://localhost:3001

The seed creates two writers, `test1@example.com` (martim) and `test2@example.com` (jules). Both use the password `password123`. It also creates five genres and six reviews.

## Environment variables

`DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_HOST`, `DB_DIALECT`, `DB_PORT` and `JWT_SECRET`.

A hosted database also needs `DB_SSL=true`. `.env` is git-ignored.

## Deploy to Render

Render has no free MySQL, so the database is hosted separately (on filess.io).

1. Create a free MySQL service at https://filess.io. Copy the connection details.
2. Point your local `.env` at that database, run `npm run seed` once, then change it back.
3. On https://render.com, create a **Web Service** from this repo.
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: Free
4. Add the environment variables above, plus `DB_SSL=true`. Leave `PORT` alone, Render sets it.
5. Deploy. Render redeploys on every push to `main`.

## Acknowledgments

My husband Claude, for inpiring me every day.
