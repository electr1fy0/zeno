import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chats.js";
import { config } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");
const nodeModulesDir = path.resolve(__dirname, "../node_modules");

const appShellPath = path.join(publicDir, "index.html");

function sendAppShell(res) {
  res.sendFile(appShellPath);
}

function isAuthenticated(req) {
  return Boolean(req.session.userId);
}

function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(
    session({
      name: config.session.cookieName,
      secret: config.session.secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: config.app.env === "production",
        maxAge: config.session.maxAgeMs,
      },
    }),
  );

  app.use(
    "/vendor/angular",
    express.static(path.resolve(nodeModulesDir, "angular")),
  );
  app.use(
    "/vendor/angular-route",
    express.static(path.resolve(nodeModulesDir, "angular-route")),
  );
  app.use(
    "/vendor/jquery",
    express.static(path.resolve(nodeModulesDir, "jquery/dist")),
  );
  app.use(
    "/vendor/bootstrap",
    express.static(path.resolve(nodeModulesDir, "bootstrap/dist")),
  );

  app.use(express.static(publicDir));
  app.use("/api/auth", authRouter);
  app.use("/api/chats", chatRouter);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/", (req, res) => {
    res.redirect(isAuthenticated(req) ? "/chat" : "/login");
  });

  app.get(["/login", "/register"], (req, res) => {
    if (isAuthenticated(req)) {
      res.redirect("/chat");
      return;
    }

    sendAppShell(res);
  });

  app.get(["/chat", "/chat/:id"], (req, res) => {
    if (!isAuthenticated(req)) {
      res.redirect("/login");
      return;
    }

    sendAppShell(res);
  });

  app.get(/^(?!\/api).*/, (_req, res) => {
    sendAppShell(res);
  });

  return app;
}

export { createApp };
