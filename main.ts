import OpenAI from "npm:openai";
import { Agent } from "./Agent.ts";
import { Sensor } from "./Sensor.ts";
import { of } from "npm:rxjs";
import { map } from "npm:rxjs/operators";
import { Countenance } from "./Countenance.ts";

// Create an observable that emits the current time once
const clock$ = of(null).pipe(
  map(() => `The clock says: ${(new Date()).toISOString()}`),
) as Sensor<string>;

const client = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const face = new Countenance();
const robot = new Agent(
  client,
  [face],
  "gpt-4",
  `You are an experimental robot control system. ` +
    `Please exercise the sensors and faculties at your disposal.` +
    `This is an internal dialog. ` +
    `The user will not see this conversation ` +
    `(though it is monitored for debugging). ` +
    `Currently you have a clock sensor and a face effector.`,
  [clock$, face.expression$],
);

async function thinkAgainRobot() {
  const thought = robot.think();
  thought.stream.subscribe((v) => console.log(v));

  const m = await thought.complete
  console.log(m);
  await thinkAgainRobot();
}

await thinkAgainRobot();
