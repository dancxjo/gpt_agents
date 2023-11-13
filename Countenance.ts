import { z } from "npm:zod";
import { AgentCallable } from "./Effector.ts";
import { debug } from "https://deno.land/x/debug/mod.ts";
import { Observable, Subject } from "npm:rxjs";
import { Faculty } from "./Faculty.ts";

const log = debug("countenance");

export class Countenance {
  protected currentStatus = "😐";
  protected subject = new Subject<string>();
  faculties: Faculty[] = [];

  constructor() {
    this.faculties.push({
      name: "express",
      description: "Expresses the current state of operations as an emoji",
      function: this.express.bind(this),
      schema: z.object({ emoji: z.string() }),
    });
  }

  get expression$(): Observable<string> {
    return this.subject.asObservable();
  }

  express({ emoji }: { emoji: string }) {
    log("Expressing", emoji);
    this.currentStatus = emoji;
    this.subject.next(emoji);
    return `I am now ${emoji}`;
  }
}
