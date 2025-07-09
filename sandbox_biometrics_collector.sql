CREATE TABLE `password_resets` (
  `reset_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `reset_code` varchar(10) NOT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
)

CREATE TABLE `problems` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `problem` varchar(50) NOT NULL,
  `difficulty` enum('Easy','Medium','Hard') NOT NULL
) 

CREATE TABLE `problem_details` (
  `id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `input` text DEFAULT NULL,
  `output` text DEFAULT NULL
)

CREATE TABLE `problem_details_en` (
  `id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `input` text DEFAULT NULL,
  `output` text DEFAULT NULL
)

CREATE TABLE `problem_examples` (
  `id` int(11) NOT NULL,
  `problem_id` int(11) DEFAULT NULL,
  `example_input` text DEFAULT NULL,
  `example_output` text DEFAULT NULL
)

CREATE TABLE `problem_starter_code` (
  `problem_id` int(11) NOT NULL,
  `starter_code_py` text DEFAULT NULL,
  `starter_code_java` text DEFAULT NULL,
  `starter_code_c` text DEFAULT NULL
) 

CREATE TABLE `problem_tags` (
  `problem_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) 

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `user_name` varchar(70) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `user_password` varchar(500) NOT NULL,
  `user_consent` tinyint(1) NOT NULL,
  `user_consent_change_date` datetime DEFAULT NULL,
  `user_registration_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_isValid` tinyint(1) DEFAULT NULL,
  `user_isAdmin` int(1) NOT NULL DEFAULT 0
)

CREATE TABLE `user_problem_status` (
  `user_id` int(11) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `status` enum('Unsolved','Solved') NOT NULL DEFAULT 'Unsolved',
  `code` text NOT NULL,
  `solved_on` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
)

CREATE TABLE `validation_codes` (
  `validation_id` int(11) NOT NULL,
  `validation_code` varchar(16) NOT NULL,
  `validation_isUsed` tinyint(1) NOT NULL DEFAULT 0,
  `validation_forUser` int(1) NOT NULL
)

ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`reset_id`);

ALTER TABLE `problems`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `problem_details`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `problem_details_en`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `problem_examples`
  ADD PRIMARY KEY (`id`),
  ADD KEY `problem_id` (`problem_id`);

ALTER TABLE `problem_starter_code`
  ADD PRIMARY KEY (`problem_id`);

ALTER TABLE `problem_tags`
  ADD PRIMARY KEY (`problem_id`,`tag_id`),
  ADD KEY `tag_id` (`tag_id`);

ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

ALTER TABLE `user_problem_status`
  ADD PRIMARY KEY (`user_id`,`problem_id`),
  ADD KEY `problem_id` (`problem_id`);

ALTER TABLE `validation_codes`
  ADD PRIMARY KEY (`validation_id`);

ALTER TABLE `problem_details`
  ADD CONSTRAINT `problem_details_ibfk_1` FOREIGN KEY (`id`) REFERENCES `problems` (`id`) ON DELETE CASCADE;

ALTER TABLE `problem_details_en`
  ADD CONSTRAINT `problem_details_en_ibfk_1` FOREIGN KEY (`id`) REFERENCES `problems` (`id`) ON DELETE CASCADE;

ALTER TABLE `problem_examples`
  ADD CONSTRAINT `problem_examples_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`);

ALTER TABLE `problem_starter_code`
  ADD CONSTRAINT `problem_starter_code_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE;

ALTER TABLE `problem_tags`
  ADD CONSTRAINT `problem_tags_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `problem_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_problem_status`
  ADD CONSTRAINT `user_problem_status_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_problem_status_ibfk_2` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE;
COMMIT;
