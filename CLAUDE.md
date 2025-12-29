# 学科辅导：直观讲解定理，引导独立思考

## 项目概述

**赛道**: AI 实时交互教育
**项目名称**: 学科辅导：直观讲解定理，引导独立思考
**项目描述**: 通过AI数字人进行学科定理讲解，结合可视化展示和苏格拉底式提问，引导学生独立思考和理解核心概念。

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 18.x + TypeScript |
| 构建工具 | Vite 5.x |
| 样式方案 | TailwindCSS |
| 状态管理 | Zustand |
| 后端框架 | Node.js + Express + TypeScript |
| 数字人SDK | 魔珐星云具身驱动SDK (0.1.0-alpha.45) |
| AI服务 | 魔搭社区 ModelScope |
| AI模型 | deepseek-ai/DeepSeek-V3 |
| 嵌入模型 | Qwen/Qwen3-Embedding-8B |

## 项目结构

```
subject-tutoring/
├── src/
│   ├── client/                    # React 前端
│   │   ├── components/
│   │   │   ├── Avatar/            # 数字人组件
│   │   │   │   ├── AvatarContainer.tsx # 数字人容器
│   │   │   │   ├── AvatarController.ts # 数字人控制器
│   │   │   │   └── index.ts
│   │   │   ├── Chat/              # 对话组件
│   │   │   │   ├── ChatBox.tsx        # 对话框
│   │   │   │   ├── QuickActionsPopover.tsx # 快捷提问弹出框
│   │   │   │   ├── InputArea.tsx      # 输入区
│   │   │   │   └── index.ts
│   │   │   ├── Subject/           # 学科特色组件
│   │   │   │   ├── TheoremCard.tsx    # 定理卡片
│   │   │   │   ├── TheoremDetail.tsx  # 定理详情
│   │   │   │   └── index.ts
│   │   │   └── UI/                # 通用UI组件
│   │   │       ├── ApiKeyModal.tsx   # API密钥配置
│   │   │       └── index.ts
│   │   ├── store/                 # Zustand 状态管理
│   │   │   ├── useChatStore.ts        # 对话状态
│   │   │   ├── useSubjectStore.ts     # 学科状态
│   │   │   ├── useProgressStore.ts    # 学习进度
│   │   │   └── useAvatarStore.ts      # 数字人状态
│   │   ├── services/              # API 服务
│   │   │   ├── chatService.ts        # 对话服务
│   │   │   ├── knowledgeService.ts    # 知识库服务
│   │   │   └── index.ts
│   │   ├── App.tsx                # 应用入口
│   │   └── main.tsx               # React 挂载
│   ├── server/                    # Express 后端
│   │   ├── routes/                # API 路由
│   │   │   ├── chat.ts               # 对话路由
│   │   │   └── knowledge.ts          # 知识库路由
│   │   ├── services/              # 业务服务
│   │   │   ├── ChatService.ts        # 对话服务
│   │   │   ├── RAGService.ts         # RAG 检索服务
│   │   │   ├── ThinkingService.ts    # 思考引导服务
│   │   │   ├── ModelScopeService.ts  # AI模型服务
│   │   │   └── KnowledgeService.ts   # 知识库管理
│   │   └── app.ts                 # Express 应用
│   └── shared/                    # 前后端共享
│       ├── types/                 # 共享类型
│       │   └── index.ts
│       └── constants/             # 常量
│           └── index.ts
├── data/                         # 数据文件
│   └── knowledge/                # 知识库数据
│       ├── math.json             # 数学定理库
│       ├── physics.json          # 物理原理库
│       ├── chemistry.json        # 化学原理库
│       └── logic.json            # 逻辑推理库
├── public/                       # 静态资源
│   └── uploads/                  # 用户上传图片
├── index.html                    # HTML入口
├── package.json                  # 依赖配置
├── vite.config.ts               # Vite 配置
├── tsconfig.json                # TypeScript 配置
├── tsconfig.node.json           # Node TypeScript 配置
├── .env.example                 # 环境变量模板
└── README.md                    # 项目说明
```

## 核心功能

### 1. 学科定理讲解
- 支持多学科：数学、物理、化学、逻辑等
- 定理/原理的直观讲解
- 苏格拉底式提问引导思考
- 结合知识库提供准确内容

### 2. AI数字人交互
- 3D数字人实时对话
- 流式响应，即时反馈
- 语音播报（一次性说完，无停顿）
- 数字人状态同步

### 3. 快捷提问
- 浮动弹出框展示常用问题
- 按学科分类组织
- 一键发送，快速开始对话

### 4. 对话体验
- 支持文本对话
- 支持图片题目解析
- 自动滚动优化
- 滚动到底部按钮

## 知识库数据结构

```json
{
  "id": "math_pythagorean_001",
  "category": "math",
  "subject": "数学",
  "topic": "平面几何",
  "theorem": "勾股定理",
  "difficulty": "初级",

  "description": "直角三角形两直角边的平方和等于斜边的平方",
  "formula": "a² + b² = c²",
  "formula_latex": "a^2 + b^2 = c^2",

  "proof_steps": [
    {
      "step": 1,
      "title": "构造辅助图形",
      "content": "以直角三角形三边为边长，分别构造三个正方形"
    }
  ],

  "examples": [
    {
      "problem": "已知直角三角形两直角边分别为3和4，求斜边长度",
      "solution": "根据勾股定理：c = √(3² + 4²) = √25 = 5"
    }
  ],

  "common_mistakes": [
    {
      "mistake": "忘记判断是否为直角三角形",
      "correction": "勾股定理只适用于直角三角形"
    }
  ],

  "socratic_questions": [
    "如果只知道三角形两边长度，能确定第三边吗？",
    "为什么勾股定理只适用于直角三角形？"
  ],

  "keywords": ["勾股定理", "直角三角形", "毕达哥拉斯", "几何"]
}
```

## API 设计

### POST /api/chat/stream
流式对话接口（SSE）

```typescript
interface ChatRequest {
  message: string;
  images?: string[];
  sessionId: string;
  conversationHistory?: ChatMessage[];
  apiKeys?: {
    modelScopeApiKey?: string;
    xmovAppId?: string;
    xmovAppSecret?: string;
  };
}
```

## 环境变量

```bash
# 前端环境变量
VITE_API_BASE_URL=/api

# 后端环境变量
MODELSCOPE_API_KEY=<魔搭API密钥>
MODELSCOPE_MODEL=deepseek-ai/DeepSeek-V3
EMBEDDING_MODEL=Qwen/Qwen3-Embedding-8B
XMOV_APP_ID=<魔珐星云应用ID>
XMOV_APP_SECRET=<魔珐星云应用密钥>
PORT=5177
```

## 开发计划

### Phase 1: 基础架构 ✅
- [x] 项目结构初始化
- [x] 前后端基础框架搭建
- [x] Vite 配置和开发环境
- [x] 数字人 SDK 集成
- [x] 基础 UI 组件

### Phase 2: 对话系统 ✅
- [x] 对话 API 实现
- [x] SSE 流式响应
- [x] 消息状态管理
- [x] 数字人语音同步

### Phase 3: 知识库 ✅
- [x] 知识库数据结构设计
- [x] RAG 检索服务
- [x] 语义搜索实现

### Phase 4: 体验优化 ✅
- [x] 快捷提问浮动框
- [x] 自动滚动优化
- [x] 数字人一次性说话
- [x] 网页标签图标

## 参考项目

本项目参考了同目录下的两个已完成项目：
- `emotion-companion`: 情绪陪伴助手
- `health-assistant`: 健康咨询助手

主要借鉴：
- 前后端架构模式
- 数字人控制器封装
- RAG 知识库实现
- 状态管理方案

## 开发指南

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 注意事项

1. 确保所有环境变量正确配置
2. 数字人 SDK 需要有效的魔珐星云账号
3. AI 调用需要魔搭社区的 API Key
4. 开发时注意跨域配置
5. 生产环境需配置 HTTPS

## 界面说明

### 顶部导航
- **设置** ⚙️：配置 API 密钥
- **清空对话**：清除对话历史

### 对话记录区域
- **快捷提问** ⚡：浮动弹出框，选择常用问题
- **滚动到底部**：向上滚动时显示的浮动按钮

### 数字人状态
- offline：离线
- listen：倾听
- think：思考
- speak：说话
- idle：待机
- interactive_idle：互动待机

## License

MIT
