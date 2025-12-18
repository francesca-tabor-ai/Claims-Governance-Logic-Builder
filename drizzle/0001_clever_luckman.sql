CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`type` enum('adr','governance','standard','other') NOT NULL,
	`fileUrl` text,
	`fileKey` text,
	`vectorized` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`contextQuery` text NOT NULL,
	`cotReasoning` text,
	`generatedCode` text,
	`generatedTests` text,
	`status` enum('pending','reasoning','generating','validating','completed','failed') NOT NULL DEFAULT 'pending',
	`generationTimeMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`period` varchar(50) NOT NULL,
	`totalGenerations` int NOT NULL DEFAULT 0,
	`successfulGenerations` int NOT NULL DEFAULT 0,
	`averageTestCoverage` int NOT NULL DEFAULT 0,
	`determinismRate` int NOT NULL DEFAULT 0,
	`averageGenerationTimeMs` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `validations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`generationId` int NOT NULL,
	`testsPassed` tinyint NOT NULL DEFAULT 0,
	`testCoverage` int NOT NULL DEFAULT 0,
	`adrCompliant` tinyint NOT NULL DEFAULT 0,
	`cpApViolations` int NOT NULL DEFAULT 0,
	`piiMaskingEnforced` tinyint NOT NULL DEFAULT 0,
	`validationDetails` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `validations_id` PRIMARY KEY(`id`)
);
