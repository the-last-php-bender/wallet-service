
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    BadRequestException,
} from '@nestjs/common';
import { formatResponse, ResponseFormat } from '../util/response-formatting.utils';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = exception.getStatus();

        const payload: ResponseFormat = {
            statusCode: status,
            message: exception.message || 'An error occurred.'
        };

        if (exception instanceof BadRequestException) {
            const validationErrors:any  = exception.getResponse();
            if (Array.isArray(validationErrors['message'])) {
                payload['message'] = validationErrors['message'][0];
                payload['error'] = validationErrors['message']
            } else {
                payload['message'] = validationErrors['message']
                payload['error'] = [validationErrors['message']]
            }
        }

        response.status(status).json(
            formatResponse(payload),
        );
    }
}
