import OpenAI from "npm:openai";
import { Conversation, Message } from "./Conversation.ts";
import { Sensor } from "./Sensor.ts";
import { Faculty, toDescription } from "./Faculty.ts";
import { Observable, Subject } from "npm:rxjs";
import { debug } from "https://deno.land/x/debug/mod.ts";

const log = debug("agent");

export interface Thought {
  stream: Observable<string>;
  complete: Promise<Message>;
}

export class Agent {
  protected memories: Conversation[] = [];
  protected workingMemory: Conversation;
  protected faculties: Faculty[] = [];

  protected stream: Subject<Message> = new Subject();

  get streamOfThought(): Observable<Message> {
    return this.stream.asObservable();
  }

  constructor(
    protected client: OpenAI,
    protected effectors: { faculties: Faculty[] }[],
    protected model: "gpt-3.5-turbo" | "gpt-4" = "gpt-3.5-turbo",
    protected purpose: string = "You are a helpful assistant",
    protected sensors: Sensor<unknown>[],
  ) {
    log("Creating agent");
    this.faculties = [];
    effectors.forEach((e) => this.faculties.push(...e.faculties));
    log("Faculties", this.faculties);
    this.workingMemory = [
      {
        role: "system",
        content: this.purpose,
      },
    ];
    log("Working memory", this.workingMemory);

    sensors.forEach((s) =>
      s.subscribe((v) => {
        log("Sensor", v);
        this.workingMemory.push({
          role: "system",
          content: JSON.stringify(v, null, 2),
        });
        // this.think();
      })
    );
  }

  think(): Thought {
    log("Thinking", this.workingMemory);
    const functions = [
      ...this.faculties.map((f) => toDescription(f)) as any,
    ];
    log("Functions", this.faculties, functions);
    const stream = new Subject<string>();
    const runner = this.client.beta.chat.completions
      .runFunctions({
        model: this.model,
        messages: this.workingMemory,
        stream: true,
        functions,
      }).on("error", (err) => {
        log(`Error: ${err.message}`);
        stream.error(err);
      }).on("content", (delta) => {
        log("Content", delta);
        stream.next(delta);
      });

    const complete = new Promise<Message>((resolve, reject) => {
      runner.finalContent().then((content) => {
        runner.on("error", (err) => {
          log(`${err}`);
          reject(err);
        });
        log("Final content", content);
        resolve({
          role: "assistant",
          content: content ?? "",
        });
      });
    }).then((m) => {
      log("Complete", m);
      this.workingMemory.push(m);
      return m;
    });

    log("Thought", { stream, complete });
    return { stream: stream.asObservable(), complete };
  }
}
