CREATE TABLE `ai_tools` (
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_tools_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_tools_toolId_unique` UNIQUE(`toolId`)
);
