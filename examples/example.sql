/*
Navicat MySQL Data Transfer

Source Server         : Local Server
Source Server Version : 50626
Source Host           : localhost:3306
Source Database       : taglub

Target Server Type    : MYSQL
Target Server Version : 50626
File Encoding         : 65001

Date: 2015-08-08 22:59:01
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `content` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`comment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of comments
-- ----------------------------
INSERT INTO `comments` VALUES ('1', 'dsadsadsa', '18');
INSERT INTO `comments` VALUES ('2', 'wqewqewqeq', '18');
INSERT INTO `comments` VALUES ('3', 'cxxzczxczcz', '22');
INSERT INTO `comments` VALUES ('4', 'e comment belongs to 23 usersa', '23');

-- ----------------------------
-- Table structure for comment_likes
-- ----------------------------
DROP TABLE IF EXISTS `comment_likes`;
CREATE TABLE `comment_likes` (
  `comment_like_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `comment_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`comment_like_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of comment_likes
-- ----------------------------
INSERT INTO `comment_likes` VALUES ('1', '18', '1');
INSERT INTO `comment_likes` VALUES ('3', '18', '2');
INSERT INTO `comment_likes` VALUES ('4', '12', '1');
INSERT INTO `comment_likes` VALUES ('5', '16', '3');
INSERT INTO `comment_likes` VALUES ('6', '18', '4');
INSERT INTO `comment_likes` VALUES ('7', '16', '4');
INSERT INTO `comment_likes` VALUES ('8', '16', '3');
INSERT INTO `comment_likes` VALUES ('9', '18', '3');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `mail` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `years_old` int(11) DEFAULT '0',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES ('16', 'dsadadsa 16', 'dsasdadsadsa 16', 'ewqew', '2015-08-08 22:58:42', '22');
INSERT INTO `users` VALUES ('18', 'an updated mail for user id 18 2nd time', 'an updated username for user_id 18 3rd time', 'a pass', '2015-08-08 22:58:49', '55');
INSERT INTO `users` VALUES ('19', 'updated19@omakis.com', 'an 19 username', 'a pass', '2015-08-08 22:38:19', '22');
INSERT INTO `users` VALUES ('20', 'mail20_updated@omakis.com', 'an updated20 username', 'a pass', '2015-08-08 22:58:48', '15');
INSERT INTO `users` VALUES ('22', 'mail22@omakis.com', 'a username', 'a passing', '2015-08-08 22:38:13', '22');
INSERT INTO `users` VALUES ('23', 'mailwtf@dsadsa.com', 'a username', 'pass', '2015-08-08 22:38:16', '22');
INSERT INTO `users` VALUES ('28', 'an updated username for user_id 28  or 283rd time', 'an updated x username 2nd time', 'ewqewq', '2015-08-08 22:58:44', '15');
INSERT INTO `users` VALUES ('30', 'an updated username for user_id 30  or 30 2nd time', 'an updated x username 1nd time', 'ewqeq', '2015-08-08 22:58:42', '21');

-- ----------------------------
-- Table structure for user_infos
-- ----------------------------
DROP TABLE IF EXISTS `user_infos`;
CREATE TABLE `user_infos` (
  `user_info_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `hometown` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_info_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of user_infos
-- ----------------------------
INSERT INTO `user_infos` VALUES ('1', '18', 'xanthi');
INSERT INTO `user_infos` VALUES ('3', '22', 'tou 22 user hometown');
INSERT INTO `user_infos` VALUES ('4', '23', 'tou 23 user hometown');
