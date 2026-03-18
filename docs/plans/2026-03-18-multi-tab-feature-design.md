# 多标签页功能设计文档

## 概述

为 Typra 添加了多标签页（multi-tab）功能，支持同时打开多个 Markdown 文件并在标签间切换。

## 需求

1. **标签交互**：类似浏览器的水平标签栏，支持点击切换、关闭、拖拽排序
2. **Undo/Redo**：每个标签页独立维护撤销/重做历史
3. **未保存处理**：切换标签时自动保存当前标签到 undo 栈

## 架构设计

### 数据结构

```typescript
interface Tab {
  id: string           // 唯一标识
  filePath: string | null
  content: string
  isModified: boolean
  undoStack: string[]
  redoStack: string[]
  lastSaved: number | null
}

interface DocumentState {
  tabs: Tab[]
  activeTabId: string | null
  // actions...
}
```

### 核心组件

1. **`TabBar` 组件** (`src/components/TabBar.tsx`)
   - 渲染标签列表
   - 支持点击切换
   - 支持关闭按钮
   - 支持拖拽排序（HTML5 DnD API）
   - 支持新建标签按钮

2. **改造 `documentStore`** (`src/store/documentStore.ts`)
   - 从单文档状态改为多文档数组
   - 添加标签管理 actions：
     - `addTab` - 添加新标签
     - `closeTab` - 关闭标签
     - `switchTab` - 切换标签
     - `reorderTabs` - 重排标签顺序
     - `getActiveTab` - 获取当前激活的标签
     - `setActiveTabContent` - 更新当前标签内容
     - `saveActiveTabToStack` - 保存当前标签到 undo 栈

3. **改造 `App.tsx`**
   - 在 header 下方添加 TabBar 组件
   - 初始化时创建一个默认标签
   - 标签切换时自动保存当前标签

4. **改造 `EditorContainer`**
   - 从 `activeTabId` 读取当前编辑内容
   - 只渲染当前激活的 tab

5. **改造 `FileExplorer`**
   - 点击文件时检查是否已打开
   - 如已存在则在对应标签间切换
   - 否则创建新标签

## 文件变更

### 新增文件

- `src/components/TabBar.tsx` - 标签栏组件
- `src/styles/tab-bar.css` - 标签栏样式

### 修改文件

- `src/store/documentStore.ts` - 支持多标签页状态管理
- `src/App.tsx` - 集成 TabBar 组件
- `src/components/EditorContainer.tsx` - 使用 activeTab 读取数据
- `src/components/FileExplorer.tsx` - 支持在新标签中打开文件

## 实现细节

### 标签拖拽排序

使用 HTML5 Drag and Drop API：
- `onDragStart` - 记录拖拽的标签 ID
- `onDragOver` - 允许放置
- `onDrop` - 计算新顺序并调用 `reorderTabs`

### 标签关闭逻辑

关闭标签时：
1. 如果关闭的是当前激活标签，自动切换到相邻标签
2. 如果没有其他标签，`activeTabId` 设为 `null`

### 自动保存

切换标签时调用 `saveActiveTabToStack()`，将当前内容保存到 undo 栈。

## 测试验证

- [x] TypeScript 编译通过
- [x] Vite 开发服务器启动成功
- [ ] Electron 应用运行测试（需手动）
- [ ] 多标签切换功能（需手动）
- [ ] 拖拽排序功能（需手动）

## 后续优化

1. 标签页关闭时检查未保存内容，给出提示
2. 添加标签页右键菜单（关闭其他、关闭右侧等）
3. 添加键盘快捷键切换标签（Ctrl+Tab）
4. 持久化标签页状态，应用重启后恢复
