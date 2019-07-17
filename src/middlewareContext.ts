import { Context } from '@azure/functions'

export interface MiddlewareContext extends Context {

    doneWasCalled: boolean;
    next: (err?: any) => void;

}