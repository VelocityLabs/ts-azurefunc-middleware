import { Context } from '@azure/functions';

export interface MiddlewareContext extends Context {
    doneWasCalled: boolean;
    next: (err?: any) => void;
}

export declare class MiddlewareHandler {
    private stack;
    use(fn: (context: Context) => void): this;
    catch(fn: (error: Error) => void): this;
    listen(): (context: Context, inputs: any, ...args: any) => void;
    _handle(plainContext: Context, input: any, ...args: any): void;
}
