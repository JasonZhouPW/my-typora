# Typra 使用说明

欢迎使用 Typra！这是一款 Typora 风格的 Markdown 编辑器，提供实时预览和流畅的编辑体验。

## 快速开始

### 打开文件
- 点击侧边栏的 **Show Sidebar** 按钮打开文件浏览器
- 在侧边栏中浏览文件夹，点击 `.md` 文件即可打开
- 或使用菜单 `File > Open...` (⌘O) 选择文件

### 新建文件
- 使用菜单 `File > New` (⌘N) 创建新文件

### 保存文件
- 使用菜单 `File > Save` (⌘S) 保存当前文件
- 使用 `File > Save As...` (⌘⇧S) 另存为新文件

## 侧边栏导航

侧边栏显示您主目录下的文件和文件夹：

- 📁 **文件夹** - 点击进入该目录
- 📄 **Markdown 文件** - 点击打开编辑（白色显示）
- 📄 **其他文件** - 不可打开（灰色显示）
- ↩️ **返回上一层** - 进入子目录后，点击返回父目录

## Markdown 语法支持

### 标题
```markdown
# 一级标题
## 二级标题
### 三级标题
```

### 格式化
```markdown
**粗体文本**
*斜体文本*
~~删除线~~
`行内代码`
```

### 列表
```markdown
- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2
```

### 引用
```markdown
> 这是一段引用文本
```

### 代码块
````markdown
```javascript
function hello() {
  console.log('Hello, World!')
}
```
````

### Mermaid 图表

Typra 支持 Mermaid 图表渲染：

````markdown
```mermaid
graph LR
    A[开始] --> B[处理]
    B --> C[结束]
```
````

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| ⌘N | 新建文件 |
| ⌘O | 打开文件 |
| ⌘S | 保存文件 |
| ⌘⇧S | 另存为 |
| ⌘Q | 退出应用 |

## 预览模式

- 点击 **Hide Preview** 隐藏预览面板
- 点击 **Show Preview** 显示预览面板
- 拖动中间的分隔条调整编辑器和预览区的比例

## 关于

Typra 是一款使用 Electron、React 和 TypeScript 构建的跨平台 Markdown 编辑器。
