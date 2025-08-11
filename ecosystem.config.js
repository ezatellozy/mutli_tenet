module.exports = {
  apps: [
    {
      name: "backend",

      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      args: "start -p 3001",

      script: ".output/app.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        PUBLIC_URL: "https://backend.najidalqimam.sa",
      },
    },
  ],
};
