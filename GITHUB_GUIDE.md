# GitHub 上传指南

本文档详细介绍如何将 GoSpeed 视频提取器扩展上传到 GitHub。

## 前提条件

1. 拥有 GitHub 账号（如果没有，请先在 https://github.com 注册）
2. 已安装 Git（检查方法：在终端输入 `git --version`）

## 方法一：通过 GitHub 网页上传（最简单）

### 步骤 1：创建新仓库

1. 登录 GitHub
2. 点击右上角的 `+` 号，选择 `New repository`
3. 填写仓库信息：
   - **Repository name**: `gopeed-video-extractor`
   - **Description**: `GoSpeed 通用视频提取器扩展 - 自动抓取任意网站视频`
   - **Public** 或 **Private**: 选择 Public（公开）
   - 勾选 `Add a README file`
4. 点击 `Create repository`

### 步骤 2：上传文件

1. 进入刚创建的仓库
2. 点击 `Add file` → `Upload files`
3. 将以下文件拖拽到上传区域：
   - `manifest.json`
   - `index.js`
   - `README.md`
   - `.gitignore`
4. 在 `Commit changes` 区域填写提交信息
5. 点击 `Commit changes`

## 方法二：通过 Git 命令行上传

### 步骤 1：配置 Git（首次使用需要）

```bash
# 设置用户名和邮箱
git config --global user.name "你的用户名"
git config --global user.email "你的邮箱@example.com"
```

### 步骤 2：在 GitHub 创建仓库

1. 登录 GitHub
2. 点击右上角 `+` → `New repository`
3. 仓库名称：`gopeed-video-extractor`
4. **不要**勾选任何初始化选项
5. 点击 `Create repository`

### 步骤 3：初始化本地仓库并推送

```bash
# 进入项目目录
cd /path/to/gopeed-video-extractor

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交更改
git commit -m "初始提交：GoSpeed 视频提取器扩展"

# 添加远程仓库（替换为你的用户名）
git remote add origin https://github.com/你的用户名/gopeed-video-extractor.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

## 方法三：使用 GitHub Desktop（图形界面）

### 步骤 1：安装 GitHub Desktop

下载地址：https://desktop.github.com/

### 步骤 2：登录 GitHub 账号

打开 GitHub Desktop，登录你的 GitHub 账号

### 步骤 3：创建新仓库

1. 点击 `File` → `New Repository`
2. 填写信息：
   - Name: `gopeed-video-extractor`
   - 选择本地保存路径
3. 点击 `Create Repository`

### 步骤 4：添加文件并发布

1. 将项目文件复制到仓库目录
2. 在 GitHub Desktop 中查看更改
3. 填写提交信息，点击 `Commit to main`
4. 点击 `Publish repository` 发布到 GitHub

## 更新扩展

当你修改了扩展代码后，需要更新 GitHub 上的内容：

```bash
# 查看修改的文件
git status

# 添加修改的文件
git add .

# 提交修改
git commit -m "更新描述"

# 推送到 GitHub
git push
```

## 在 GoSpeed 中安装扩展

上传完成后，可以按以下步骤在 GoSpeed 中安装：

1. 打开 GoSpeed 应用
2. 进入「扩展」或「插件」页面
3. 点击「安装扩展」
4. 输入你的仓库地址：
   ```
   https://github.com/你的用户名/gopeed-video-extractor.git
   ```
5. 点击「安装」

## 常见问题

### Q: 推送时提示权限错误？

A: 需要配置 SSH 密钥或使用 Personal Access Token：

**使用 Personal Access Token：**
1. GitHub → Settings → Developer settings → Personal access tokens
2. 生成新 token，勾选 `repo` 权限
3. 推送时使用 token 作为密码

**配置 SSH 密钥：**
```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "你的邮箱@example.com"

# 查看公钥
cat ~/.ssh/id_ed25519.pub

# 将公钥添加到 GitHub: Settings → SSH and GPG keys → New SSH key
```

### Q: 如何更新已发布的扩展？

A: 修改代码后，提交并推送新版本：
```bash
git add .
git commit -m "v1.0.1: 修复xxx问题"
git push
```

同时更新 `manifest.json` 中的版本号。

### Q: 如何让其他人发现我的扩展？

A: 可以：
1. 在 README 中添加详细说明和使用示例
2. 添加合适的 topics（标签）
3. 在 GoSpeed 社区分享你的扩展

## 项目文件清单

确保你的仓库包含以下文件：

```
gopeed-video-extractor/
├── manifest.json    # 必需：扩展配置
├── index.js         # 必需：扩展主逻辑
├── README.md        # 推荐：使用说明
└── .gitignore       # 推荐：Git忽略配置
```

## 下一步

上传成功后，你可以：

1. 在 GoSpeed 中测试安装
2. 分享扩展给其他用户
3. 持续改进和更新扩展功能
4. 收集用户反馈并修复问题

祝你使用愉快！
