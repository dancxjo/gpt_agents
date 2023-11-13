import { Faculty } from "./Faculty.ts";
import { z } from "npm:zod";


export function AgentCallable(description: string, schema: z.ZodSchema<any>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // Initialize the faculties array if it does not exist on the prototype
    if (!target.constructor.prototype.faculties) {
      target.constructor.prototype.faculties = [];
    }

    const originalFunction = descriptor.value;
    descriptor.value = function (args: any) {
      // Validate the arguments
      const validatedArgs = schema.parse(args);

      // Call the original function with the validated arguments
      return originalFunction.apply(target, validatedArgs);
    }
    
    // Create the faculty object
    const faculty = {
      name: propertyKey,
      description,
      function: descriptor.value,
      schema: schema,
    };

    // Add the faculty object to the prototype's faculties array
    target.constructor.prototype.faculties.push(faculty);
  };
}
