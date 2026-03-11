---
name: design-style-skill
description: >
  Use this skill to select visual style recipes (radius/spacing tokens) for UI design projects.
  Includes: (1) 4 style recipes (Sharp/Soft/Rounded/Pill), (2) Component-level style mappings,
  (3) Typography and spacing guidelines, (4) Style mixing principles.
  TRIGGERS: 风格, style, radius, spacing, 圆角, 间距, UI风格, 视觉风格, design style, component style.
---

# Style Recipes - 视觉风格系统

同一套设计可通过调整圆角（radius）和间距（spacing）呈现4种不同风格。根据场景选择合适的风格配方。

## 风格概览

| 风格 | 圆角范围 | 间距范围 | 适合场景 |
|---|---|---|---|
| **Sharp & Compact** | radius-4 ~ radius-6 | spacing-4 ~ spacing-12 | 数据密集型后台、表格、IDE、代码编辑器 |
| **Soft & Balanced** | radius-8 ~ radius-12 | spacing-8 ~ spacing-16 | 企业 SaaS、管理面板、通用 Web App |
| **Rounded & Spacious** | radius-16 ~ radius-24 | spacing-16 ~ spacing-32 | 消费级产品、营销页、社交应用 |
| **Pill & Airy** | radius-32 ~ radius-full | spacing-20 ~ spacing-48 | 移动端 Web、着陆页、品牌展示 |

---

## Sharp & Compact（锐利紧凑）

**视觉特征**: 方正、信息密度高、专业严肃感。

### Token 配方

| 类别 | Token | 值 |
|---|---|---|
| 圆角-小 | --component-radius-sm | 4px |
| 圆角-中 | --component-radius-md | 4px |
| 圆角-大 | --component-radius-lg | 6px |
| 内间距-小 | --component-padding-sm | 4px |
| 内间距-中 | --component-padding-md | 8px |
| 内间距-大 | --component-padding-lg | 12px |
| 间隔-小 | --component-gap-sm | 4px |
| 间隔-中 | --component-gap-md | 8px |
| 间隔-大 | --component-gap-lg | 16px |
| 页面边距 | --page-margin | 16px |
| 区块间距 | --section-gap | 24px |

---

## Soft & Balanced（柔和均衡）

**视觉特征**: 适中的圆角、舒适的留白、专业又不失亲和。

### Token 配方

| 类别 | Token | 值 |
|---|---|---|
| 圆角-小 | --component-radius-sm | 6px |
| 圆角-中 | --component-radius-md | 8px |
| 圆角-大 | --component-radius-lg | 12px |
| 内间距-小 | --component-padding-sm | 8px |
| 内间距-中 | --component-padding-md | 12px |
| 内间距-大 | --component-padding-lg | 16px |
| 间隔-小 | --component-gap-sm | 6px |
| 间隔-中 | --component-gap-md | 12px |
| 间隔-大 | --component-gap-lg | 24px |
| 页面边距 | --page-margin | 24px |
| 区块间距 | --section-gap | 32px |

---

## Rounded & Spacious（圆润宽松）

**视觉特征**: 大圆角、充裕留白、友好亲切、现代消费级感。

### Token 配方

| 类别 | Token | 值 |
|---|---|---|
| 圆角-小 | --component-radius-sm | 10px |
| 圆角-中 | --component-radius-md | 16px |
| 圆角-大 | --component-radius-lg | 24px |
| 内间距-小 | --component-padding-sm | 12px |
| 内间距-中 | --component-padding-md | 20px |
| 内间距-大 | --component-padding-lg | 32px |
| 间隔-小 | --component-gap-sm | 10px |
| 间隔-中 | --component-gap-md | 16px |
| 间隔-大 | --component-gap-lg | 32px |
| 页面边距 | --page-margin | 32px |
| 区块间距 | --section-gap | 48px |

---

## Pill & Airy（胶囊通透）

**视觉特征**: 全圆角胶囊形、大量留白、轻盈通透、品牌展示感强。

### Token 配方

| 类别 | Token | 值 |
|---|---|---|
| 圆角-小 | --component-radius-sm | 20px |
| 圆角-中 | --component-radius-md | 32px |
| 圆角-大 | --component-radius-lg | 999px (full) |
| 内间距-小 | --component-padding-sm | 12px |
| 内间距-中 | --component-padding-md | 24px |
| 内间距-大 | --component-padding-lg | 40px |
| 间隔-小 | --component-gap-sm | 12px |
| 间隔-中 | --component-gap-md | 24px |
| 间隔-大 | --component-gap-lg | 48px |
| 页面边距 | --page-margin | 40px |
| 区块间距 | --section-gap | 64px |

---

# 组件级风格映射表

| 组件 | Sharp | Soft | Rounded | Pill |
|---|---|---|---|---|
| **按钮** | radius-4, padding 8×16 | radius-6, padding 8×16 | radius-10, padding 12×20 | radius-full, padding 12×32 |
| **输入框** | radius-4, padding 8×12 | radius-6, padding 8×12 | radius-10, padding 10×16 | radius-full, padding 10×20 |
| **卡片** | radius-4, padding 8~12 | radius-8, padding 12~16 | radius-16, padding 20 | radius-24, padding 24~32 |
| **模态框** | radius-6, padding 16 | radius-12, padding 20 | radius-20, padding 24~32 | radius-32, padding 32~40 |
| **标签/Badge** | radius-4, padding 2×6 | radius-4, padding 2×8 | radius-6, padding 4×10 | radius-full, padding 4×12 |
| **头像** | radius-4 | radius-8 | radius-12 | radius-full |
| **下拉菜单** | radius-4, padding 4 | radius-6, padding 4 | radius-12, padding 8 | radius-16, padding 8 |
| **Toast/Alert** | radius-4, padding 8×12 | radius-8, padding 12×16 | radius-12, padding 16×20 | radius-full, padding 12×24 |
| **Tooltip** | radius-4, padding 4×8 | radius-6, padding 6×10 | radius-8, padding 8×12 | radius-full, padding 6×16 |

---

# 混搭原则

同一页面可组合不同风格级别，但需遵循以下规则：

## 1. 外层容器 ≥ 内层圆角

```
正确：外 > 内
  .card     { border-radius: 16px; }
  .card img { border-radius: 12px; }

错误：内 > 外 → 视觉溢出感
  .card     { border-radius: 8px;  }
  .card img { border-radius: 16px; }
```

## 2. 信息密度决定间距

| 区域类型 | 推荐风格 |
|---|---|
| 内容浏览区 | Spacious / Airy（宽松间距） |
| 工具栏/侧边栏 | Compact / Balanced（紧凑间距） |
| 表单/数据区 | Balanced（适中间距） |

## 3. 交互元素与容器保持同一风格

```
如果卡片是 Rounded：
  .card { border-radius: 16px; }
  .card .btn { border-radius: 10px; }

如果卡片是 Sharp：
  .card { border-radius: 4px; }
  .card .btn { border-radius: 4px; }
```

## 4. 圆角与尺寸的比例关系

| 元素尺寸 | Sharp | Soft | Rounded | Pill |
|---|---|---|---|---|
| 小（< 32px） | 4px | 4px | 8px | full |
| 中（32~64px） | 4px | 6~8px | 12~16px | full |
| 大（64~200px） | 4~6px | 8~12px | 16~24px | 32px |
| 超大（> 200px） | 6px | 12px | 24px | 32px |

---

# Typography 排版规范

| 用途 | 字号 | 行高 | 字重 |
|---|---|---|---|
| Caption（说明文字） | 12px | 16px | regular (400) |
| Body small（小正文） | 14px | 20px | regular (400) |
| Body（正文） | 16px | 22px | regular (400) |
| Subtitle（副标题） | 20px | 26px | medium (500) |
| Title（标题） | 24px | 28px | medium (500) |
| Heading（大标题） | 32px | 36px | medium (500) |
| Display（展示） | 40px | 40px | medium (500) |

---

# Spacing 间距规范

| 用途 | 推荐值 |
|---|---|
| 紧密分组（图标与文字） | 4px ~ 8px |
| 标准内间距 | 12px ~ 16px |
| 区块分隔 | 24px ~ 32px |
| 页面边距 | 40px ~ 64px |

---

# 快速选择指南

根据项目类型快速选择风格：

| 项目类型 | 推荐风格 | 原因 |
|---|---|---|
| 企业后台/Dashboard | Sharp & Compact | 信息密度高，专业感强 |
| SaaS产品/Web App | Soft & Balanced | 平衡专业与友好 |
| 消费级App/社交 | Rounded & Spacious | 亲切感，现代感 |
| 着陆页/品牌展示 | Pill & Airy | 品牌调性强，视觉冲击 |
| 数据可视化 | Sharp / Soft | 清晰的边界和对齐 |
| 移动端H5 | Rounded / Pill | 触控友好，圆角更易点击 |
