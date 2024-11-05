/**
 * IMPORTS
 */
import {pino} from 'pino';
import pretty from 'pino-pretty';

/**
 * LOGGER
 */
const stream = pretty({
    colorize: true,
    ignore: 'pid,hostname',
    translateTime: 'SYS:standard',
    levelFirst: true,
    crlf: false,
    minimumLevel: process.env.LEVELDEBUG, // --minimumLevel
});


const logger = pino(stream);

export {logger};
