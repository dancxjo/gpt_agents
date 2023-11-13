import { assertEquals } from "https://deno.land/std@0.205.0/assert/mod.ts";
import { Faculty, toDescription } from "./Faculty.ts";
import { z } from "npm:zod";

Deno.test("toDescription", () => {
  const faculty: Faculty = {
    name: "createURL",
    description: "Creates a URL object",
    function: (args: { url: string }) => new URL(args.url),
    schema: z.object({
      url: z.string().url(),
    }),
  } as Faculty;

  const description = toDescription(faculty);
  assertEquals(description.description, "Creates a URL object");
  assertEquals(description.name, "createURL");
  assertEquals(description.parameters, {
    type: "object",
    properties: { url: { type: "string", format: "uri" } },
    required: ["url"],
    additionalProperties: false,
  });

  const result = description.function({ url: "https://deno.land/foo.js" });

  assertEquals(result.href, "https://deno.land/foo.js");
});
