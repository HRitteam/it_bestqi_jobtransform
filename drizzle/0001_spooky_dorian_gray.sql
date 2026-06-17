CREATE TABLE `files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`filename` varchar(512) NOT NULL,
	`mimeType` varchar(128),
	`fileKey` varchar(512) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`extractedText` text,
	`fileSize` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inviterId` int NOT NULL,
	`inviteeId` int,
	`inviteCode` varchar(64) NOT NULL,
	`status` enum('pending','accepted') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `reports_reportId_unique` UNIQUE(`reportId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `tier` enum('free','pro','enterprise') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `inviteCount` int DEFAULT 0 NOT NULL;