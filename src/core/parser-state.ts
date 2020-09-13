type StateProps = {
  source?: string;
  location?: number;
  line?: number;
};

export class State {
  source: string;
  location: number;
  line: number;

  static from(source: string): State {
    return new State({ source });
  }

  constructor({ source, location, line }: StateProps = {}) {
    this.source = source || "";
    this.location = location || 0;
    this.line = line || 0;
  }

  peek(): string {
    return this.source[this.location];
  }

  nextChar(): State {
    this.location += 1;
    return this;
  }

  nextLine(): State {
    this.line += 1;
    return this;
  }

  clone(): State {
    return new State({ ...this });
  }
}
