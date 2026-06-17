-- 添加 PDF 缓存相关字段到 reports 表
-- 部署时执行: mysql -u root -p database_name < scripts/migrate-pdf-cache.sql

ALTER TABLE `reports` ADD COLUMN IF NOT EXISTS `pdfUrl` varchar(1024) DEFAULT NULL;
ALTER TABLE `reports` ADD COLUMN IF NOT EXISTS `pdfStatus` enum('idle','generating','ready','error') DEFAULT 'idle';
ALTER TABLE `reports` ADD COLUMN IF NOT EXISTS `pdfError` varchar(512) DEFAULT NULL;
