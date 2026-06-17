CREATE TABLE `brand_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`logoUrl` varchar(512),
	`primaryColor` varchar(20),
	`footerText` varchar(256),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_distributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` varchar(64) NOT NULL,
	`recipientName` varchar(128),
	`recipientEmail` varchar(320),
	`linkToken` varchar(64) NOT NULL,
	`viewPerspective` enum('hr','staff','executive') DEFAULT 'staff',
	`openedAt` timestamp,
	`readProgress` int DEFAULT 0,
	`lastReadAt` timestamp,
	`feedback` text,
	`feedbackRating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_distributions_id` PRIMARY KEY(`id`),
	CONSTRAINT `report_distributions_linkToken_unique` UNIQUE(`linkToken`)
);
--> statement-breakpoint
CREATE TABLE `report_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` varchar(64) NOT NULL,
	`distributionId` int,
	`chapterIndex` int,
	`rating` int,
	`comment` text,
	`isAnonymous` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_feedback_id` PRIMARY KEY(`id`)
);
