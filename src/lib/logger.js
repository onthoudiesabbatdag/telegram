// logger.js

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import winston from 'winston';
import 'winston-daily-rotate-file';

const logDir = 'src/logs';
if (!fs.existsSync(logDir)) {
  console.log("Creating logs directory...");
  fs.mkdirSync(logDir, { recursive: true });
}

const env = process.env.NODE_ENV;
console.log("Winston environment:", env); // 🔍 debug log

const transportLog = new winston.transports.DailyRotateFile({
  filename: `${logDir}/access-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '5m',
  maxFiles: '14d',
  level: 'info',
});

const transportErr = new winston.transports.DailyRotateFile({
  filename: `${logDir}/error-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '5m',
  maxFiles: '30d',
  level: 'error',
});

const transports = [transportLog, transportErr];

if (env === 'staging') {
  transports.push(new winston.transports.Console());
}

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      info => `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`
    )
  ),
  transports,
});

export default logger;
