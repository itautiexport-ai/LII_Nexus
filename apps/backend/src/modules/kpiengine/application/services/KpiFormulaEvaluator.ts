import { ValidationError } from "../../../../core/domain/errors/DomainError";

/**
 * A safe, hand-written arithmetic expression evaluator - this is the whole
 * point of "admin creates KPIs without coding": the admin types a formula
 * like "actual/target*100", and it is evaluated by this tiny interpreter,
 * NEVER by eval() or new Function(). Only digits, decimal points, the two
 * variables `target`/`actual`, the four arithmetic operators, parentheses,
 * and whitespace are ever accepted - anything else is rejected at
 * validation time with a clear error, before it's ever stored or run.
 *
 * Grammar (standard precedence, recursive descent):
 *   expression := term (('+' | '-') term)*
 *   term       := factor (('*' | '/') factor)*
 *   factor     := number | 'target' | 'actual' | '(' expression ')' | '-' factor
 */
export class KpiFormulaEvaluator {
  private static readonly ALLOWED_PATTERN = /^[\d\s.+\-*/()a-zA-Z]+$/;
  private static readonly ALLOWED_IDENTIFIERS = new Set(["target", "actual"]);

  /** Throws a ValidationError if the formula contains anything outside the
   *  strict whitelist, or if it doesn't parse as a valid expression. Called
   *  both when a KPI definition is saved and defensively before every
   *  evaluation. */
  static validate(formula: string): void {
    if (!formula || formula.trim().length === 0) {
      throw new ValidationError("Formula cannot be empty.");
    }
    if (!this.ALLOWED_PATTERN.test(formula)) {
      throw new ValidationError("Formula may only contain numbers, target, actual, + - * / ( ) and whitespace.");
    }
    const identifierMatches = formula.match(/[a-zA-Z]+/g) ?? [];
    for (const word of identifierMatches) {
      if (!this.ALLOWED_IDENTIFIERS.has(word.toLowerCase())) {
        throw new ValidationError(`Unknown term "${word}" in formula. Only "target" and "actual" are allowed.`);
      }
    }
    // Parsing with dummy values also validates the expression is
    // syntactically well-formed (balanced parens, no dangling operators).
    this.evaluate(formula, 1, 1);
  }

  static evaluate(formula: string, target: number, actual: number): number {
    const tokens = this.tokenize(formula);
    let pos = 0;

    function peek() { return tokens[pos]; }
    function consume() { return tokens[pos++]; }

    function parseExpression(): number {
      let value = parseTerm();
      while (peek() === "+" || peek() === "-") {
        const op = consume();
        const rhs = parseTerm();
        value = op === "+" ? value + rhs : value - rhs;
      }
      return value;
    }

    function parseTerm(): number {
      let value = parseFactor();
      while (peek() === "*" || peek() === "/") {
        const op = consume();
        const rhs = parseFactor();
        if (op === "/") {
          if (rhs === 0) throw new ValidationError("Formula evaluation resulted in division by zero.");
          value = value / rhs;
        } else {
          value = value * rhs;
        }
      }
      return value;
    }

    function parseFactor(): number {
      const tok = peek();
      if (tok === undefined) throw new ValidationError("Unexpected end of formula.");
      if (tok === "-") { consume(); return -parseFactor(); }
      if (tok === "(") {
        consume();
        const value = parseExpression();
        if (consume() !== ")") throw new ValidationError("Mismatched parentheses in formula.");
        return value;
      }
      if (tok === "target") { consume(); return target; }
      if (tok === "actual") { consume(); return actual; }
      const num = Number(tok);
      if (Number.isNaN(num)) throw new ValidationError(`Unexpected token "${tok}" in formula.`);
      consume();
      return num;
    }

    const result = parseExpression();
    if (pos !== tokens.length) throw new ValidationError("Unexpected trailing tokens in formula.");
    return result;
  }

  private static tokenize(formula: string): string[] {
    const tokens: string[] = [];
    const re = /\d+\.?\d*|[a-zA-Z]+|[+\-*/()]/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(formula)) !== null) {
      tokens.push(match[0].toLowerCase());
    }
    return tokens;
  }
}
