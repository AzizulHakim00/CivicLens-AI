CREATE TABLE `status_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report_id` text NOT NULL,
	`from_status` text NOT NULL,
	`to_status` text NOT NULL,
	`actor` text DEFAULT 'City operator' NOT NULL,
	`note` text DEFAULT 'Workflow updated' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`report_id`) REFERENCES `hazard_reports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `hazard_reports` ADD `assigned_team` text DEFAULT 'Unassigned' NOT NULL;--> statement-breakpoint
ALTER TABLE `hazard_reports` ADD `source` text DEFAULT 'Citizen' NOT NULL;--> statement-breakpoint
ALTER TABLE `hazard_reports` ADD `sla_minutes` integer DEFAULT 240 NOT NULL;--> statement-breakpoint
ALTER TABLE `hazard_reports` ADD `priority_score` integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `hazard_reports` ADD `updated_at` integer DEFAULT 0 NOT NULL;
