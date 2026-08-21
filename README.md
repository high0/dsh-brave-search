# dsh-brave-search

`dsh-brave-search` 是一个可安装的 DeepSeek Harness 原生 bundle，注册统一的 `brave_search` 工具，调用 Brave Search API 的 Web、News、Image、Video 和 LLM Context 五类 GET 服务。

## 安装：用户只需一条命令

先在 Brave API 控制台创建一个 key。安装命令会把插件加入官方默认的 `web` profile；这里的 `web` 是 profile 名称，不是插件名称。如果你使用自定义 profile（例如 `demo`），请将命令中的 `web` 替换为该 profile 名称。

### macOS（默认 zsh）

下面这一整行适用于 macOS 默认终端，可以直接复制粘贴。它会隐藏输入 key、持久写入 Harness 会自动读取的 `~/.env`，安装插件并启动 dsh。这个 key 不会出现在命令历史中：

```zsh
umask 077; read -rs "BRAVE_SEARCH_API_KEY?Brave API key: "; printf '\n'; if [ -e "$HOME/.env" ] && [ ! -f "$HOME/.env" ]; then printf '%s\n' "$HOME/.env exists but is not a regular file; rename or remove that directory first." >&2; unset BRAVE_SEARCH_API_KEY; else touch "$HOME/.env" && sed -i '' '/^BRAVE_SEARCH_API_KEY=/d' "$HOME/.env" && printf 'BRAVE_SEARCH_API_KEY=%s\n' "$BRAVE_SEARCH_API_KEY" >> "$HOME/.env" && unset BRAVE_SEARCH_API_KEY && (dsh plugin --profile web remove dsh-brave-search >/dev/null 2>&1 || true) && dsh plugin --profile web add github:high0/dsh-brave-search && npx @deepseek-ai/dsh web; fi
```

### Linux（默认 bash）

Linux 默认通常是 bash，不能使用上面的 zsh `read` 语法；请使用这一整行：

```bash
umask 077; read -r -s -p 'Brave API key: ' BRAVE_SEARCH_API_KEY; printf '\n'; if [ -e "$HOME/.env" ] && [ ! -f "$HOME/.env" ]; then printf '%s\n' "$HOME/.env exists but is not a regular file; rename or remove that directory first." >&2; unset BRAVE_SEARCH_API_KEY; else touch "$HOME/.env" && sed -i '/^BRAVE_SEARCH_API_KEY=/d' "$HOME/.env" && printf 'BRAVE_SEARCH_API_KEY=%s\n' "$BRAVE_SEARCH_API_KEY" >> "$HOME/.env" && unset BRAVE_SEARCH_API_KEY && (dsh plugin --profile web remove dsh-brave-search >/dev/null 2>&1 || true) && dsh plugin --profile web add github:high0/dsh-brave-search && npx @deepseek-ai/dsh web; fi
```

macOS 使用 BSD `sed`，所以是 `sed -i ''`；Linux 使用 GNU `sed`，所以是 `sed -i`。如果 Linux 用户使用 zsh，仍需使用 Linux 版本的 `sed -i`。

### Windows PowerShell

Windows CMD 和 PowerShell 不能直接运行上面的 Unix shell 命令。PowerShell 请复制执行下面这一段；它会隐藏输入 key、写入 Windows 用户目录下的 `.env`，然后安装并启动 `web` profile：

```powershell
$envFile = Join-Path $HOME ".env"

if (Test-Path -LiteralPath $envFile -PathType Container) {
    throw "$envFile exists as a directory; rename or remove it first."
}

$secureKey = Read-Host "Brave API key" -AsSecureString
$keyPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)

try {
    $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPtr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPtr)
}

if (Test-Path -LiteralPath $envFile) {
    $lines = @(Get-Content -LiteralPath $envFile | Where-Object {
        $_ -notmatch '^BRAVE_SEARCH_API_KEY='
    })
}
else {
    $lines = @()
}

[IO.File]::WriteAllLines(
    $envFile,
    [string[]]($lines + "BRAVE_SEARCH_API_KEY=$apiKey"),
    [Text.UTF8Encoding]::new($false)
)

Remove-Variable apiKey -ErrorAction SilentlyContinue

dsh plugin --profile web remove dsh-brave-search *> $null
dsh plugin --profile web add github:high0/dsh-brave-search
npx @deepseek-ai/dsh web
```

Windows 用户如果使用 WSL 或 Git Bash，应在对应的 Unix 环境中使用 Linux 版本；此时写入的是 WSL/Git Bash 的用户目录，而不是 Windows 原生用户目录。

上面的命令要求 `~/.env`（Windows 下为用户目录中的 `.env`）是普通文件而不是目录，并会替换已有的 `BRAVE_SEARCH_API_KEY` 行。如果只想临时使用，也可以执行 `export BRAVE_SEARCH_API_KEY="你的 Brave API key"`（PowerShell 使用 `$env:BRAVE_SEARCH_API_KEY="你的 Brave API key"`）；这种方式只对当前终端有效，关闭终端后不会保留。命令中的 `BRAVE_SEARCH_API_KEY` 和 `$HOME/.env` 不要写成带反斜杠的 `BRAVE\_SEARCH\_API\_KEY` 或 `\~/.env`，否则 shell 可能无法正确识别变量或路径。

然后直接从 GitHub 安装已构建的 bundle（不需要 clone、`npm install`、编译或手动编辑 profile 文件）。如果你按官方命令运行 `npx @deepseek-ai/dsh web`，目标 profile 是 `web`：

```sh
dsh plugin --profile web add github:high0/dsh-brave-search
```

安装完成后启动 profile：

```sh
npx @deepseek-ai/dsh web
```

如果 profile 已经在运行，必须重启一次让新的后端 bundle 生效。上面的 `add` 命令会自动初始化 profile、安装依赖、登记 `dsh-brave-search` 配置层并加载 `brave_search` 工具。安装完成后不依赖本地源码目录，可以删除 clone 出来的仓库目录。

也可以把 `web` profile 的安装和启动写成一条命令（前提是已经通过 `~/.env` 或当前终端设置了 `BRAVE_SEARCH_API_KEY`）：

```sh
dsh plugin --profile web add github:high0/dsh-brave-search && npx @deepseek-ai/dsh web
```

这里的 `web` 是 DeepSeek Harness 官方默认 profile 名称；`demo` 只是自定义 profile 的示例名称，不是插件要求的固定名称。插件是后端工具 bundle，不提供浏览器端 `client.js`，因此不会出现在页面启动资源清单中；重启对应 profile 后，工具 `brave_search` 才会注册到 Harness。

环境变量 `BRAVE_SEARCH_API_KEY` 始终优先于 profile 配置中的 `apiKey`。密钥不会被写入 URL、工具结果或错误消息。

### 固定版本（生产环境推荐）

如果希望后续仓库更新不会改变已安装代码，可以锁定一个完整 commit SHA（不要使用可能无法被 Git 远端解析的短 SHA）：

```sh
dsh plugin --profile web add github:high0/dsh-brave-search#ac7ac583cc47df09aa0a972b5068bc04c01c2295
```

更新插件时再次执行 `add` 并指定新的 commit；卸载使用：

```sh
dsh plugin --profile web remove dsh-brave-search
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

- `dsh: failed to load .env: EISDIR`：这不是插件错误。Harness 会自动读取用户目录下的 `~/.env` 文件；如果该路径被其他程序用作目录（例如 Python 虚拟环境），就会出现此错误。请先退出正在使用该目录的程序，再将目录改名为其他名称，例如 `mv ~/.env ~/.python-env`，然后重新执行 `npx @deepseek-ai/dsh web`。如果你确实需要环境文件，应创建普通文件 `~/.env`，每行使用 `KEY=value` 格式。
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
