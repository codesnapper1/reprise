CREATE TABLE `simulation_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`seed` integer NOT NULL,
	`count` integer NOT NULL,
	`strategy` text NOT NULL,
	`summary` text NOT NULL
);
