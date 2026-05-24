import { toast } from 'react-toastify';
import STATUS_CODES from './statusCodes';


export function handleResponseStatus(status: number, message?: string): void {
    switch (status) {
        case STATUS_CODES.UNAUTHORIZED:
            toast.error('Unauthorized. Please log in again.');
            break;

        case STATUS_CODES.FORBIDDEN:
            toast.error('Access denied.');
            break;

        case STATUS_CODES.NOT_FOUND:
            toast.error('Requested resource not found.');
            break;

        case STATUS_CODES.CONFLICT:
            toast.warning('A conflict occurred.');
            break;

        case STATUS_CODES.UNPROCESSABLE_ENTITY:
            toast.warning('Request could not be processed.');
            break;

        case STATUS_CODES.INTERNAL_SERVER_ERROR:
        case STATUS_CODES.BAD_GATEWAY:
        case STATUS_CODES.SERVICE_UNAVAILABLE:
        case STATUS_CODES.GATEWAY_TIMEOUT:
            toast.error('Server error. Please try again later.');
            break;

        default:
            toast.error(message || 'Something went wrong.');
    }
}

export function handleSuccessResponse(message: string): void {
    if (message) {
        toast.success(message);
    }
}
