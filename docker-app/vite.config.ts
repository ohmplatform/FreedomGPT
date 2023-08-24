import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// import express from "express";
// import apiRouter from "./server.js";

// // Define your Express routes here
// const app = express();
// app.use("/", apiRouter);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
    },
    host: true, // needed for the Docker Container port mapping to work
    strictPort: true,
    port: 9000, // you can replace this port with any port
  },
});
