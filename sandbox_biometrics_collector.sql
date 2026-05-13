SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `sandbox_biometrics_collector`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `sandbox_biometrics_collector`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `user_problem_status`;
DROP TABLE IF EXISTS `validation_codes`;
DROP TABLE IF EXISTS `problem_tags`;
DROP TABLE IF EXISTS `problem_starter_code`;
DROP TABLE IF EXISTS `problem_examples`;
DROP TABLE IF EXISTS `problem_details_en`;
DROP TABLE IF EXISTS `problem_details`;
DROP TABLE IF EXISTS `tags`;
DROP TABLE IF EXISTS `problems`;
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `flagged_submissions`;
DROP TABLE IF EXISTS `biometrics`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(70) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `user_password` varchar(500) NOT NULL,
  `user_consent` tinyint(1) NOT NULL,
  `user_consent_change_date` datetime DEFAULT NULL,
  `user_registration_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_isValid` tinyint(1) DEFAULT NULL,
  `user_isAdmin` int(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `problems` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `problem` varchar(50) NOT NULL,
  `difficulty` enum('Easy','Medium','Hard') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `biometrics` (
  `biometrics_id` int(11) NOT NULL AUTO_INCREMENT,
  `other_events` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`other_events`)),
  `mouse_moves` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`mouse_moves`)),
  `screen_h` int(11) NOT NULL,
  `screen_w` int(11) NOT NULL,
  `biometrics_owner` int(11) NOT NULL,
  `biometrics_challenge` int(11) NOT NULL,
  `collected_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`biometrics_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `flagged_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `problem_id` int(11) DEFAULT NULL,
  `language` varchar(50) NOT NULL,
  `submitted_code` mediumtext NOT NULL,
  `anomaly_score` int(11) NOT NULL DEFAULT 0,
  `reasons` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`reasons`)),
  `typing_metrics` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`typing_metrics`)),
  `status` enum('open','reviewed','approved','rejected') NOT NULL DEFAULT 'open',
  `admin_note` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `reviewed_at` datetime DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_problem_id` (`problem_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `password_resets` (
  `reset_id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `reset_code` varchar(10) NOT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`reset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `problem_details` (
  `id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `input` text DEFAULT NULL,
  `output` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `problem_details_ibfk_1`
    FOREIGN KEY (`id`) REFERENCES `problems` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `problem_details_en` (
  `id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `input` text DEFAULT NULL,
  `output` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `problem_details_en_ibfk_1`
    FOREIGN KEY (`id`) REFERENCES `problems` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `problem_examples` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `problem_id` int(11) DEFAULT NULL,
  `example_input` text DEFAULT NULL,
  `example_output` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `problem_id` (`problem_id`),
  CONSTRAINT `problem_examples_ibfk_1`
    FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `problem_starter_code` (
  `problem_id` int(11) NOT NULL,
  `starter_code_py` text DEFAULT NULL,
  `starter_code_java` text DEFAULT NULL,
  `starter_code_c` text DEFAULT NULL,
  PRIMARY KEY (`problem_id`),
  CONSTRAINT `problem_starter_code_ibfk_1`
    FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `problem_tags` (
  `problem_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL,
  PRIMARY KEY (`problem_id`, `tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `problem_tags_ibfk_1`
    FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `problem_tags_ibfk_2`
    FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `user_problem_status` (
  `user_id` int(11) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `status` enum('Unsolved','Solved') NOT NULL DEFAULT 'Unsolved',
  `code` text NOT NULL,
  `solved_on` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`, `problem_id`),
  KEY `problem_id` (`problem_id`),
  CONSTRAINT `user_problem_status_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE,
  CONSTRAINT `user_problem_status_ibfk_2`
    FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `validation_codes` (
  `validation_id` int(11) NOT NULL AUTO_INCREMENT,
  `validation_code` varchar(16) NOT NULL,
  `validation_isUsed` tinyint(1) NOT NULL DEFAULT 0,
  `validation_forUser` int(1) NOT NULL,
  PRIMARY KEY (`validation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;