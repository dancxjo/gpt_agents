import { z, ZodType } from "npm:zod";
import { zodToJsonSchema } from "npm:zod-to-json-schema";

function toOpenApiParameter(zodSchema: ZodType<unknown>): ObjectParameter {
  const jsonSchema = zodToJsonSchema(zodSchema, {
    name: "model",
    target: "openApi3",
  });

  return (jsonSchema?.definitions?.model ??
    { type: "object", properties: {} }) as ObjectParameter;
}

// Helper type to infer the shape of the arguments from a zod schema
type InferSchemaType<T extends z.ZodType<unknown, z.ZodTypeDef>> = z.infer<T>;

// The Faculty interface that defines a faculty function with automatic argument parsing
export interface Faculty<
  Args extends z.ZodType<unknown, z.ZodTypeDef> = z.ZodType<
    unknown,
    z.ZodTypeDef
  >,
  Ret = unknown,
> {
  name: string;
  description: string;
  function: (args: InferSchemaType<Args>) => Ret | Promise<Ret>;
  schema: Args; // Zod schema
}

interface Parameter {
  type: "string" | "number" | "boolean" | "object" | "array" | "null";
  format?: string;
  description?: string;
  additionalProperties?: boolean;
}

interface ObjectParameter extends Parameter {
  type: "object";
  properties: { [key: string]: Parameter };
  required: string[];
}

interface ArrayParameter extends Parameter {
  type: "array";
  items: Parameter;
}

type ChatFunctionType = {
  name: string;
  function: Function;
  description: string;
  parse: Function;
  parameters: ObjectParameter;
};

// Converts a Faculty to a format compatible with openai.beta.chat.completions.runFunctions()
export function toDescription(faculty: Faculty): ChatFunctionType {
  return {
    name: faculty.name,
    function: faculty.function,
    parse: (s: string) => faculty.schema.parse(JSON.parse(s)),
    description: faculty.description,
    parameters: toOpenApiParameter(faculty.schema),
  };
}
