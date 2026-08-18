# dsh-brave-search

`dsh-brave-search` 是一个可安装的 DeepSeek Harness 原生 bundle，注册统一的 `brave_search` 工具，调用 Brave Search API 的 Web、News、Image、Video 和 LLM Context 五类 GET 服务。

## 安装：用户只需一条命令

先在 Brave API 控制台创建一个 key，并在当前终端设置环境变量。这个 key 是调用 Brave 服务的必要凭据：

```sh
export BRAVE_SEARCH_API_KEY="你的 Brave API key"
```

然后直接从 GitHub 安装已构建的 bundle（不需要 clone、`npm install`、编译或手动编辑 profile 文件）：

```sh
dsh plugin --profile demo add github:high0/dsh-brave-search
```

安装完成后启动 profile：

```sh
dsh --profile demo
```

如果 profile 已经在运行，只需重启一次让新 bundle 生效。上面的 `add` 命令会自动初始化 profile、安装依赖、登记 `dsh-brave-search` 配置层并加载 `brave_search` 工具。安装完成后不依赖本地源码目录，可以删除 clone 出来的仓库目录。

也可以把安装和启动写成一条命令（前提是已设置 `BRAVE_SEARCH_API_KEY`）：

```sh
dsh plugin --profile demo add github:high0/dsh-brave-search && dsh --profile demo
```

环境变量 `BRAVE_SEARCH_API_KEY` 始终优先于 profile 配置中的 `apiKey`。密钥不会被写入 URL、工具结果或错误消息。

### 固定版本（生产环境推荐）

如果希望后续仓库更新不会改变已安装代码，可以锁定一个 commit：

```sh
dsh plugin --profile demo add github:high0/dsh-brave-search#1b56302
```

更新插件时再次执行 `add` 并指定新的 commit；卸载使用：

```sh
dsh plugin --profile demo remove dsh-brave-search
```

## 工具调用

```json
{
  "service": "web",
  "query": "DeepSeek Harness plugin development",
  "params": {
    "country": "US",
    "search_lang": "en",
    "count": 10,
    "freshness": "pw"
  }
}
```

工具返回 Brave 原始 JSON。`service` 可选 `web`、`news`、`image`、`video` 或 `llm_context`。`query` 不能为空，最多 400 个字符、50 个单词。调用参数会覆盖相同服务的配置默认值。

支持的参数：

- Web / News / Video：`country`、`search_lang`、`ui_lang`、`count`、`offset`、`freshness`、`safesearch`、`spellcheck`、`extra_snippets`、`goggles`
- Image：`country`、`search_lang`、`count`、`safesearch`、`spellcheck`
- LLM Context：`country`、`search_lang`、`count`、`freshness`、`maximum_number_of_urls`、`maximum_number_of_tokens`、`maximum_number_of_snippets`、`maximum_number_of_tokens_per_url`、`maximum_number_of_snippets_per_url`、`context_threshold_mode`、`safesearch`、`enable_local`、`enable_rich_callback`

常用枚举和范围会在调用前校验：`safesearch` 为 `off`、`moderate`、`strict`；`freshness` 支持 `pd`、`pw`、`pm`、`py` 或官方日期区间格式；计数和限制参数必须是整数并位于 Brave 官方支持范围内。未知参数会直接拒绝。

## 故障排查

- `MISSING_API_KEY`：设置 `BRAVE_SEARCH_API_KEY`，或在插件配置中提供 `apiKey`。
- `INVALID_PARAMS` / `INVALID_QUERY`：检查服务对应的参数名、枚举和数值边界。
- `TIMEOUT` / `CANCELLED`：检查网络、`timeoutMs` 和调用方取消信号。
- `HTTP_ERROR`：Brave 返回了非 2xx；错误中会保留状态码和安全摘要。请查看 Brave 控制台中的配额、计费和限流状态。

`llm_context` 适合把检索内容直接作为模型上下文；普通 `web` 搜索适合需要完整搜索结果字段的场景。本 bundle 只使用官方 GET API，不下载图片、不抓取页面，也不实现 Brave Answers、Places 或 LLM Context POST 变体。

## 开发与测试

```sh
npm install
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

真实 API 测试默认跳过；同时设置 `BRAVE_SEARCH_API_KEY` 和 `BRAVE_SEARCH_SMOKE=1` 后运行 `npm run test:smoke`。不要把 key 写入仓库或 CI 日志。
