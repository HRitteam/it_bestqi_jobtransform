module.exports = {
  apps: [{
    name: "jobait",
    script: "dist/index.js",
    cwd: "/opt/it-ai-jobtransform",
    env: {
      NODE_ENV: "production",
      TZ: "Asia/Shanghai",
      PORT: 3353
    },
  }],
};
