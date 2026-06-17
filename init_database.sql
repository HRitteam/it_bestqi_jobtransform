-- ============================================================
-- ai_job_transform 数据库初始化脚本
-- 适配阿里云 MySQL 8.0.36 (sql_mode 含 NO_ZERO_DATE)
-- 将所有 DEFAULT (now()) 替换为 DEFAULT CURRENT_TIMESTAMP
-- ============================================================

-- 0000: users 表
CREATE TABLE IF NOT EXISTS `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`tier` enum('free','pro','enterprise') NOT NULL DEFAULT 'free',
	`inviteCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);

-- 0001: invitations 表
CREATE TABLE IF NOT EXISTS `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inviterId` int NOT NULL,
	`inviteeId` int,
	`inviteCode` varchar(64) NOT NULL,
	`status` enum('pending','accepted') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`acceptedAt` timestamp NULL DEFAULT NULL,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_inviteCode_unique` UNIQUE(`inviteCode`)
);

-- 0001: reports 表
CREATE TABLE IF NOT EXISTS `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`jobTitle` varchar(256),
	`company` varchar(256),
	`industry` varchar(128),
	`inputText` text,
	`status` enum('pending','analyzing','completed','error') NOT NULL DEFAULT 'pending',
	`currentStep` int NOT NULL DEFAULT 0,
	`reportData` json,
	`isPublic` int NOT NULL DEFAULT 0,
	`shareToken` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp NULL DEFAULT NULL,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `reports_reportId_unique` UNIQUE(`reportId`)
);

-- 0002: ai_tools 表
CREATE TABLE IF NOT EXISTS `ai_tools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`toolId` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`category` varchar(64) NOT NULL,
	`isDomestic` int NOT NULL DEFAULT 0,
	`pricing` enum('free','freemium','paid') NOT NULL DEFAULT 'freemium',
	`description` text,
	`useCases` json,
	`officialUrl` varchar(512),
	`tags` json,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_tools_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_tools_toolId_unique` UNIQUE(`toolId`)
);

-- 0003: brand_settings 表
CREATE TABLE IF NOT EXISTS `brand_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`logoUrl` varchar(512),
	`primaryColor` varchar(20),
	`footerText` varchar(256),
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_settings_id` PRIMARY KEY(`id`)
);

-- 0003: report_distributions 表
CREATE TABLE IF NOT EXISTS `report_distributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` varchar(64) NOT NULL,
	`recipientName` varchar(128),
	`recipientEmail` varchar(320),
	`linkToken` varchar(64) NOT NULL,
	`viewPerspective` enum('hr','staff','executive') DEFAULT 'staff',
	`openedAt` timestamp NULL DEFAULT NULL,
	`readProgress` int DEFAULT 0,
	`lastReadAt` timestamp NULL DEFAULT NULL,
	`feedback` text,
	`feedbackRating` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `report_distributions_id` PRIMARY KEY(`id`),
	CONSTRAINT `report_distributions_linkToken_unique` UNIQUE(`linkToken`)
);

-- 0003: report_feedback 表
CREATE TABLE IF NOT EXISTS `report_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` varchar(64) NOT NULL,
	`distributionId` int,
	`chapterIndex` int,
	`rating` int,
	`comment` text,
	`isAnonymous` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `report_feedback_id` PRIMARY KEY(`id`)
);

-- 0004: llm_models 表
CREATE TABLE IF NOT EXISTS `llm_models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelCode` varchar(64) NOT NULL,
	`modelName` varchar(128) NOT NULL,
	`provider` varchar(64) NOT NULL,
	`apiUrl` varchar(512) NOT NULL,
	`apiKey` varchar(1024) NOT NULL,
	`modelType` varchar(32) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`priority` int NOT NULL DEFAULT 100,
	`inputPrice` varchar(20) NOT NULL DEFAULT '0',
	`outputPrice` varchar(20) NOT NULL DEFAULT '0',
	`maxContext` int NOT NULL DEFAULT 8192,
	`maxOutput` int NOT NULL DEFAULT 4096,
	`remark` text,
	`isDeleted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `llm_models_id` PRIMARY KEY(`id`),
	CONSTRAINT `llm_models_modelCode_unique` UNIQUE(`modelCode`)
);

-- 0004: llm_call_logs 表
CREATE TABLE IF NOT EXISTS `llm_call_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` varchar(32) NOT NULL,
	`companyId` varchar(64),
	`companyName` varchar(128),
	`userId` int,
	`phone` varchar(20),
	`feature` varchar(64) NOT NULL,
	`source` varchar(32) DEFAULT 'web',
	`modelCode` varchar(64) NOT NULL,
	`modelName` varchar(128),
	`provider` varchar(64),
	`success` int NOT NULL DEFAULT 1,
	`failReason` text,
	`httpStatus` int,
	`isSwitched` int NOT NULL DEFAULT 0,
	`originalModel` varchar(64),
	`switchTrace` json,
	`inputTokens` int NOT NULL DEFAULT 0,
	`outputTokens` int NOT NULL DEFAULT 0,
	`totalTokens` int NOT NULL DEFAULT 0,
	`inputPrice` varchar(20) DEFAULT '0',
	`outputPrice` varchar(20) DEFAULT '0',
	`estimatedCost` varchar(20) NOT NULL DEFAULT '0',
	`requestTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`responseTime` timestamp NULL DEFAULT NULL,
	`durationMs` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `llm_call_logs_id` PRIMARY KEY(`id`),
	CONSTRAINT `llm_call_logs_requestId_unique` UNIQUE(`requestId`)
);

-- 为 llm_call_logs 添加常用查询索引
CREATE INDEX `idx_llm_call_logs_company` ON `llm_call_logs` (`companyId`);
CREATE INDEX `idx_llm_call_logs_feature` ON `llm_call_logs` (`feature`);
CREATE INDEX `idx_llm_call_logs_model` ON `llm_call_logs` (`modelCode`);
CREATE INDEX `idx_llm_call_logs_request_time` ON `llm_call_logs` (`requestTime`);
CREATE INDEX `idx_llm_call_logs_success` ON `llm_call_logs` (`success`);

-- 创建 drizzle migration 记录表（让 drizzle-kit 认为 migration 已执行）
CREATE TABLE IF NOT EXISTS `__drizzle_migrations` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`hash` text NOT NULL,
	`created_at` bigint,
	PRIMARY KEY(`id`)
);
