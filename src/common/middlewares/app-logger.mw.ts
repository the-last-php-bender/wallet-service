import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
const morgan = require('morgan'); 

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
    private logger = new Logger('HTTP');

    use(request: Request, response: Response, next: NextFunction): void {
        morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
            stream: {
                write: (message: string) => this.logger.log(message.trim())
            }
        })(request, response, next);
    }
}
