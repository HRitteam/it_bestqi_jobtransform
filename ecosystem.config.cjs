module.exports = {
  apps: [{
    name: "jobait_bestqi",
    script: "dist/index.js",
    cwd: "/opt/it_bestqi_jobtransform",
    env: {
      NODE_ENV: "production",
      TZ: "Asia/Shanghai",
      PORT: 3014
    },
  }],
};
