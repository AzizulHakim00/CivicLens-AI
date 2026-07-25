CREATE TABLE `hazard_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`severity` text NOT NULL,
	`confidence` integer NOT NULL,
	`location` text NOT NULL,
	`area` text NOT NULL,
	`status` text DEFAULT 'Reported' NOT NULL,
	`latitude` real,
	`longitude` real,
	`coverage` integer DEFAULT 0 NOT NULL,
	`nearby_reports` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL
);
