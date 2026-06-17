ALTER TABLE `reports` ADD `pdfUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `reports` ADD `pdfStatus` enum('idle','generating','ready','error') DEFAULT 'idle';--> statement-breakpoint
ALTER TABLE `reports` ADD `pdfError` varchar(512);
