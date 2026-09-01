# RESPAWN

A game review blog. Anyone can read reviews and filter them by genre. Registered writers can publish, edit and delete their own reviews.

- **Live app:** https://tech-blog-app-7z8h.onrender.com
- **Repository:** https://github.com/MartimLou42/tech-blog-app

## Try the live app

The app is hosted on a free Render instance, so the very first page load can take up to a minute while the server wakes up. After that it is quick.

Sign in with either seeded account:

| Email | Password | Writer |
| --- | --- | --- |
| `test1@example.com` | `password123` | martim, wrote 3 of the reviews |
| `test2@example.com` | `password123` | jules, wrote the other 3 |

What to try, to see every feature:

1. **Read** without signing in. All six reviews are public. Click a headline to open its own page.
2. **Filter** with the Genre menu. Choosing "Horror" leaves two reviews.
3. **Register** a new account, or sign in with `test1@example.com` above.
4. **Create** a review with the form that appears after signing in.
5. **Update** and **delete** using the Edit and Delete buttons on the cards.
6. **Ownership:** signed in as martim, the Edit and Delete buttons only appear on martim's three reviews, never on jules's. The server returns 403 if you try anyway, so hiding the buttons is a convenience, not the rule itself.
7. **Log out** with the button in the writing panel.

## Features

- Register, log in and log out using JWT authentication.
- Passwords are hashed with bcrypt.
- Anyone can read reviews, with or without an account.
- Filter reviews by genre.
- Create, edit and delete reviews. The server only lets you touch your own.
- The page updates from API responses without reloading.

## Built with

Node.js, Express, Sequelize, MySQL, JSON Web Tokens, bcrypt, and a plain HTML/CSS/JavaScript front end.

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

A hosted database also needs `DB_SSL=true` and `DB_CA_CERT` set to the certificate text. `.env` is git-ignored.

## Deploy to Render

Render has no free MySQL, so the database is hosted separately.

1. Create a free MySQL service at https://aiven.io. Copy the connection details and download the CA certificate.
2. Point your local `.env` at that database, run `npm run seed` once, then change it back.
3. On https://render.com, create a **Web Service** from this repo.
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: Free
4. Add the environment variables above, plus `DB_SSL=true` and `DB_CA_CERT`. Leave `PORT` alone, Render sets it.
5. Deploy. Render redeploys on every push to `main`.

The free instance sleeps when idle, so the first request after a pause is slow.

## Author

Martim Lou
