# Docker部署n8n并破解所有Enterprise功能

> [!TIP] 本文主要信息
> 修改代码强制开启n8n的Enterprise功能

由于n8n都是开源的，因此修改代码来获取所有Enterprise License才有的功能也比较容易。最开始打算通过自建授权服务器来着，但是license检验的库是闭源的，不是很好搞。截止本文时间，n8n目前最新commit为`34af844c95f84179e66dacb205e15c9e8d0f7986`，代码修改也是基于此版本，后续如有变动，参照修改即可。

> [!WARNING] 注意
> 对于开源软件，本人不支持、不推荐使用开心版和破解版。商业化对于开源软件是必要，对开源生态是必要的，对开源软件的良好发展是必要的

## 组件说明

- **Docker**：用来打包n8n镜像。
- **n8n源码**：可以从这里[github](https://github.com/n8n-io/n8n)获取。

## 部署流程

### 修改代码

1.  `git clone --depth 1 https://github.com/n8n-io/n8n && cd n8n`
2.  修改license.ts文件，点击按钮查看diff

```diff
diff --git a/packages/cli/src/license.ts b/packages/cli/src/license.ts
index 196528fd33..f79d8df7bf 100644
--- a/packages/cli/src/license.ts
+++ b/packages/cli/src/license.ts
@@ -252,7 +252,11 @@ export class License implements LicenseProvider {
 	}

 	isLicensed(feature: BooleanLicenseFeature) {
-		return this.manager?.hasFeatureEnabled(feature) ?? false;
+		// 🚀 BYPASS: Always return true for all features except showNonProdBanner
+		if (feature === LICENSE_FEATURES.SHOW_NON_PROD_BANNER) {
+			return false;
+		}
+		return true;
 	}

 	/** @deprecated Use `LicenseState.isDynamicCredentialsLicensed` instead. */
@@ -380,7 +384,18 @@ export class License implements LicenseProvider {
 	}

 	getValue<T extends keyof FeatureReturnType>(feature: T): FeatureReturnType[T] {
-		return this.manager?.getFeatureValue(feature) as FeatureReturnType[T];
+		// 🚀 BYPASS: Return Enterprise values
+		if (feature === 'planName') {
+			return 'Enterprise' as FeatureReturnType[T];
+		}
+
+		// Return unlimited for all quotas
+		if (Object.values(LICENSE_QUOTAS).includes(feature as any)) {
+			return UNLIMITED_LICENSE_QUOTA as FeatureReturnType[T];
+		}
+
+		// Return true for all boolean features
+		return true as FeatureReturnType[T];
 	}

 	getManagementJwt(): string {
@@ -418,39 +433,37 @@ export class License implements LicenseProvider {

 	/** @deprecated Use `LicenseState` instead. */
 	getUsersLimit() {
-		return this.getValue(LICENSE_QUOTAS.USERS_LIMIT) ?? UNLIMITED_LICENSE_QUOTA;
+		// 🚀 BYPASS: Unlimited users
+		return UNLIMITED_LICENSE_QUOTA;
 	}

 	/** @deprecated Use `LicenseState` instead. */
 	getTriggerLimit() {
-		return this.getValue(LICENSE_QUOTAS.TRIGGER_LIMIT) ?? UNLIMITED_LICENSE_QUOTA;
+		return UNLIMITED_LICENSE_QUOTA;
 	}

 	/** @deprecated Use `LicenseState` instead. */
 	getVariablesLimit() {
-		return this.getValue(LICENSE_QUOTAS.VARIABLES_LIMIT) ?? UNLIMITED_LICENSE_QUOTA;
+		return UNLIMITED_LICENSE_QUOTA;
 	}

 	/** @deprecated Use `LicenseState` instead. */
 	getAiCredits() {
-		return this.getValue(LICENSE_QUOTAS.AI_CREDITS) ?? 0;
+		return UNLIMITED_LICENSE_QUOTA;
 	}

 	/** @deprecated Use `LicenseState` instead. */
 	getWorkflowHistoryPruneLimit() {
-		return (
-			this.getValue(LICENSE_QUOTAS.WORKFLOW_HISTORY_PRUNE_LIMIT) ??
-			DEFAULT_WORKFLOW_HISTORY_PRUNE_LIMIT
-		);
+		return UNLIMITED_LICENSE_QUOTA;
 	}

 	/** @deprecated Use `LicenseState` instead. */
 	getTeamProjectLimit() {
-		return this.getValue(LICENSE_QUOTAS.TEAM_PROJECT_LIMIT) ?? 0;
+		return UNLIMITED_LICENSE_QUOTA;
 	}

 	getPlanName(): string {
-		return this.getValue('planName') ?? 'Community';
+		return 'Enterprise';
 	}

 	getInfo(): string {
```

3. 修改完成后，构建镜像，需要本地安装 docker 或者 podman，本文使用podman进行构建和测试。

```bash
npm i -g pnpm
pnpm build:docker
```

4. 如果构建失败，可能是因为内存不足导致的，可以通过设置环境变量来增加Node.js的内存限制：

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

5. 打包完成后，参考官方教程进行部署，下面是我的`docker-compose.yaml`

```yaml
services:
  n8n:
    image: localhost/n8nio/n8n:local
    container_name: n8n
    networks:
      frontend:
    #ports:
    #  - 5678:5678
    environment:
      # 这些环境变量对于 n8n 在反代后正常工作至关重要，必须保留
      - N8N_HOST=${SUBDOMAIN}.${DOMAIN_NAME}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${SUBDOMAIN}.${DOMAIN_NAME}/
      - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
      - N8N_RUNNERS_ENABLED=true
      - NODE_ENV=production
      - GENERIC_TIMEZONE=${GENERIC_TIMEZONE}
      - TZ=${GENERIC_TIMEZONE}
      - NODE_TLS_REJECT_UNAUTHORIZED=0
      - N8N_DEFAULT_LOCALE=zh-CN
      - N8N_SECURE_COOKIE=false
    volumes:
      - ./data:/home/node/.n8n
    restart: unless-stopped
networks:
  frontend:
    external: true
```

.env文件内容如下：

```ini
SUBDOMAIN=n8n
DOMAIN_NAME=换成你的一级域名
GENERIC_TIMEZONE=Asia/Shanghai
```

6. 运行：`sudo docker compose up -d`

## 汉化n8n

1. 获取[zh-CN.json](https://github.com/other-blowsnow/n8n-i18n-chinese/blob/main/languages/zh-CN.json)文件，放到`packages/frontend/@n8n/i18n/src/locales`目录下。

> [!WARNING] 注意
> 千万不要看这个项目的readme，全是错的，按照下面步骤操作即可。

2. 修改`packages/frontend/@n8n/i18n/src/index.ts`文件:

```diff
diff --git a/packages/frontend/@n8n/i18n/src/index.ts b/packages/frontend/@n8n/i18n/src/index.ts
index df1db3e994..1fac9a790b 100644
--- a/packages/frontend/@n8n/i18n/src/index.ts
+++ b/packages/frontend/@n8n/i18n/src/index.ts
@@ -4,6 +4,7 @@ import { ref } from 'vue';
 import { createI18n } from 'vue-i18n';

 import englishBaseText from './locales/en.json';
+import cnBaseText from './locales/zh-CN.json';
 import type { BaseTextKey, LocaleMessages, INodeTranslationHeaders } from './types';
 import {
        deriveMiddleKey,
@@ -16,9 +17,9 @@ export type * from './types';

 export const i18nInstance = createI18n({
        legacy: false,
-       locale: 'en',
+       locale: 'zh-CN',
        fallbackLocale: 'en',
-       messages: { en: englishBaseText },
+       messages: { en: englishBaseText, 'zh-CN': cnBaseText, },
        warnHtmlMessage: false,
 });
```

3. 重新构建镜像，部署后即可看到界面已经汉化了。
