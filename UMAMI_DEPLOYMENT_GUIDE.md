# Umami 统计系统部署指南 (基于 Docker + 阿里云 MySQL)

本指南将指导您在 Ubuntu 服务器上从零开始安装 Docker，并使用 Docker Compose 部署 Umami 统计系统，最后将其接入到您的 `ai-job-transform` 项目中。

## 第一部分：安装 Docker 与 Docker Compose

如果您的服务器尚未安装 Docker，请按照以下步骤执行：

### 1. 卸载旧版本（可选）
```bash
sudo apt-get remove docker docker-engine docker.io containerd runc
```

### 2. 安装依赖并添加 Docker 官方 GPG 密钥
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

### 3. 设置 Docker 稳定版仓库
```bash
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 4. 安装 Docker Engine 和 Docker Compose
```bash
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 5. 验证安装
```bash
sudo docker --version
sudo docker compose version
```

---

## 第二部分：准备阿里云 MySQL 数据库

Umami 需要一个独立的数据库来存储统计数据。

1. 登录阿里云 RDS 控制台。
2. 在您的实例（`rm-bp1h02bqtq3dqir4q7o.mysql.rds.aliyuncs.com`）中，创建一个新的数据库，命名为 `umami`。
3. 确保您之前使用的账号（`dms_user_4d2ca7b`）对该数据库拥有读写权限。

---

## 第三部分：部署 Umami

### 1. 创建部署目录
在服务器上创建一个专门用于存放 Umami 配置的目录：
```bash
mkdir -p /home/ubuntu/umami
cd /home/ubuntu/umami
```

### 2. 创建 docker-compose.yml 文件
使用文本编辑器（如 `nano docker-compose.yml`）创建文件，并填入以下内容：

```yaml
version: '3'
services:
  umami:
    image: ghcr.io/umami-software/umami:mysql-latest
    container_name: umami
    ports:
      - "3001:3000"
    environment:
      # 数据库连接字符串格式：mysql://用户名:密码@主机地址:端口/数据库名
      DATABASE_URL: mysql://dms_user_4d2ca7b:HRflagMySql1@rm-bp1h02bqtq3dqir4q7o.mysql.rds.aliyuncs.com:3306/umami
      DATABASE_TYPE: mysql
      # 随机生成一个长字符串作为加密密钥
      APP_SECRET: your_random_secret_key_here_please_change_it
    restart: always
```

> **注意**：请将 `APP_SECRET` 替换为您自己生成的随机字符串（可以使用 `openssl rand -hex 32` 命令生成）。

### 3. 启动服务
在 `docker-compose.yml` 所在目录下执行：
```bash
sudo docker compose up -d
```

### 4. 验证运行状态
```bash
sudo docker compose logs -f
```
如果看到类似 `Server listening on port 3000` 的日志，说明启动成功。

---

## 第四部分：配置 Nginx 反向代理 (可选但推荐)

为了让 Umami 可以通过域名（如 `umami.hrflag.com`）访问并启用 HTTPS，建议配置 Nginx。

在 `/etc/nginx/sites-available/` 下创建 `umami.conf`：

```nginx
server {
    listen 80;
    server_name umami.hrflag.com; # 替换为您的实际域名

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置并重启 Nginx：
```bash
sudo ln -s /etc/nginx/sites-available/umami.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 第五部分：初始化 Umami 并获取 Website ID

1. 在浏览器中访问您的 Umami 地址（如 `http://服务器IP:3001` 或配置好的域名）。
2. 使用默认账号密码登录：
   - 用户名：`admin`
   - 密码：`umami`
3. **登录后第一件事：修改管理员密码！**（点击右上角头像 -> Profile -> Change password）。
4. 添加网站：
   - 点击左侧菜单的 **Websites**
   - 点击 **Add website**
   - 填写 Name（如 `AI Job Transform`）和 Domain（如 `jobait.hrflag.com`）
   - 点击 Save
5. 获取 Website ID：
   - 在网站列表中，点击刚刚添加的网站右侧的 **Edit** 按钮
   - 切换到 **Tracking code** 标签页
   - 在代码中找到 `data-website-id="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`，复制这串 ID。

---

## 第六部分：接入到您的项目中

回到您的 `ai-job-transform` 项目目录：

1. 编辑或创建 `.env.production` 文件：
```bash
cd /home/ubuntu/ai-job-transform
nano .env.production
```

2. 添加以下两行配置：
```env
VITE_ANALYTICS_ENDPOINT=https://您的umami域名
VITE_ANALYTICS_WEBSITE_ID=您刚刚复制的Website_ID
```

3. 重新构建前端项目：
```bash
pnpm run build
```

4. 重启项目服务（如果使用 PM2）：
```bash
pm2 restart ai-job-transform
```

完成以上步骤后，您的网站访问数据就会实时同步到 Umami 后台了，同时之前的 `%VITE_ANALYTICS_ENDPOINT%` 报错也会彻底解决。
