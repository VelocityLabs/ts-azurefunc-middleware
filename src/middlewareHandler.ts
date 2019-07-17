/// Heavily based on https://github.com/emanuelcasco/azure-middleware

import { MiddlewareContext } from './middlewareContext';
import { Context } from '@azure/functions';

export class MiddlewareHandler {

    private stack: any[] = [];

    use(fn: (context: Context) => void) {
        this.stack.push({ fn });
        return this;
    }

    catch(fn: (error: Error) => void) {
        this.stack.push({ fn, error: true });
        return this;
    }

    listen() {
        const self = this;
        return (context: Context, inputs: any, ...args: any) => self._handle(context, inputs, ...args);
    }

    _handle(plainContext: Context, input: any, ...args: any) {
        const context = plainContext as MiddlewareContext

        const originalDoneImplementation = context.done;
        const stack = this.stack;
        let index = 0;

        context.done = (...params) => {
            if (context.doneWasCalled) return;
            context.doneWasCalled = true;
            originalDoneImplementation(...params);
        };

        context.next = err => {
            try {
                if (context.doneWasCalled) { return; }

                const layer = stack[index++];
                // No more layers to evaluate
                // Call DONE
                if (!layer) { return context.done(err); }
                // Both next called with err AND layers is error handler
                // Call error handler
                if (err && layer.error) { return layer.fn(err, context, input, ...args); }
                // Next called with err OR layers is error handler, but not both
                // Next layer
                if (err || layer.error) { return context.next(err); }
                // Layer is optional and predicate resolves to false
                // Next layer
                if (layer.optional && !layer.predicate(context, input)) { return context.next(); }

                // Call function handler
                return layer.fn(context, input, ...args);
            } catch (e) {
                return context.next(e);
            }
        };
        context.next();
    }

}
