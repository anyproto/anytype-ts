---
name: typescript-code-review
description: Perform comprehensive code reviews for TypeScript projects, analyzing type safety, best practices, performance, security, and code quality with actionable feedback
---

# TypeScript Code Review Skill

Perform thorough, professional code reviews for TypeScript code with focus on type safety, best practices, performance, security, and maintainability.

## Review Process

When reviewing TypeScript code, follow this structured approach:

### 1. Initial Assessment
- Understand the code's purpose and context
- Identify the scope (single file, module, feature, or entire codebase)
- Note the TypeScript version and configuration (check `tsconfig.json`)
- Review any relevant documentation or comments

### 2. Core Review Categories

#### Type Safety
- **Strict mode compliance**: Verify `strict: true` in tsconfig.json and adherence
- **Type annotations**: Check for proper type annotations, avoid implicit `any`
- **Type narrowing**: Ensure proper use of type guards and narrowing
- **Generic types**: Review generic usage for flexibility without sacrificing safety
- **Union and intersection types**: Verify correct usage and handling
- **Type assertions**: Flag unnecessary or dangerous type assertions (the `as` keyword and non-null assertion operator)
- **Null/undefined handling**: Check for proper optional chaining (`?.`) and nullish coalescing (`??`)
- **Return types**: Ensure all functions have explicit return types
- **Discriminated unions**: Verify proper exhaustiveness checking

#### Code Quality & Best Practices
- **Naming conventions**: Check for clear, descriptive names (camelCase for variables/functions, PascalCase for types/classes)
- **Function length**: Flag functions longer than ~50 lines or with high complexity
- **Single responsibility**: Ensure functions and classes have one clear purpose
- **DRY principle**: Identify duplicate code that should be extracted
- **Magic numbers/strings**: Flag hardcoded values that should be constants
- **Error handling**: Review try-catch usage, error types, and error messages
- **Async/await**: Check for proper async handling, avoid mixing callbacks/promises
- **Immutability**: Prefer `const` over `let`, check for array/object mutations
- **Enums vs unions**: Recommend const enums or union types over regular enums when appropriate

#### Modern TypeScript Features
- **Optional chaining**: Suggest using `?.` for nested property access
- **Nullish coalescing**: Recommend `??` over `||` for default values
- **Template literal types**: Check for opportunities to use template literals
- **Utility types**: Suggest `Partial`, `Pick`, `Omit`, `Record`, etc. where appropriate
- **Const assertions**: Recommend `as const` for literal types
- **Type predicates**: Use for custom type guards
- **`satisfies` operator**: Use instead of type assertions when validating types

#### Performance
- **Unnecessary re-renders**: In React/frameworks, check for memo usage, dependency arrays
- **Large bundle imports**: Flag entire library imports when tree-shaking is possible
- **Inefficient algorithms**: Identify O(n²) or worse when better options exist
- **Memory leaks**: Check for cleanup in event listeners, subscriptions, timers
- **Lazy loading**: Suggest dynamic imports for large modules
- **Type calculation cost**: Flag extremely complex type calculations that slow compilation

#### Security
- **Input validation**: Ensure user input is validated and sanitized
- **XSS vulnerabilities**: Check for unsafe HTML rendering or `eval` usage
- **Sensitive data**: Flag hardcoded secrets, tokens, or passwords
- **Dependency vulnerabilities**: Recommend running `npm audit` or checking dependencies
- **Type safety as security**: Ensure types prevent security issues (e.g., SQL injection through tagged templates)

#### Testing & Maintainability
- **Test coverage**: Note missing tests for critical paths
- **Type-only imports**: Use `import type` for type-only imports
- **Circular dependencies**: Flag circular imports
- **Barrel exports**: Check for performance issues with index files
- **Documentation**: Verify JSDoc comments for public APIs
- **Deprecation notices**: Ensure deprecated code is properly marked

### 3. Output Structure

Organize the review with clear sections:

```markdown
## Summary
[High-level overview: overall code quality, main concerns, highlights]

## Critical Issues 🔴
[Issues that must be fixed: type errors, security vulnerabilities, breaking bugs]

## Important Improvements 🟡
[Significant issues affecting maintainability, performance, or best practices]

## Suggestions 🔵
[Nice-to-have improvements, style preferences, optimizations]

## Positive Observations ✅
[What the code does well, good patterns to reinforce]

## Detailed Findings

### [Category 1: e.g., Type Safety]
**File**: `path/to/file.ts:line_number`
- **Issue**: [Description]
- **Current code**:
  ```typescript
  [code snippet]
  ```
- **Recommended**:
  ```typescript
  [improved code]
  ```
- **Reasoning**: [Why this matters]

[Repeat for each finding]
```

### 4. Code Review Guidelines

**Tone and Style**:
- Be constructive and specific, not vague or critical
- Explain the "why" behind recommendations
- Provide code examples for suggested changes
- Acknowledge good practices when present
- Use severity indicators (🔴 critical, 🟡 important, 🔵 suggestion)

**Prioritization**:
1. Critical: Security issues, type errors, runtime bugs
2. Important: Performance problems, maintainability issues, anti-patterns
3. Suggestions: Style improvements, modern syntax, optimizations

**Context Awareness**:
- Consider the project's maturity (prototype vs production)
- Respect existing patterns if consistent across codebase
- Note tradeoffs (e.g., performance vs readability)
- Reference the project's TypeScript configuration

### 5. Reference Files

For detailed guidance on specific topics, consult the reference files:

- `references/type-safety-checklist.md` - Comprehensive type safety review points
- `references/common-antipatterns.md` - TypeScript anti-patterns to avoid
- `references/security-checklist.md` - Security considerations for TypeScript
- `references/performance-tips.md` - Performance optimization strategies

Search references using Grep when encountering specific issues. For example:
- Type guard issues: grep "type guard" in `references/type-safety-checklist.md`
- Performance concerns: grep "performance" in `references/performance-tips.md`

### 6. TypeScript Configuration Review

When reviewing `tsconfig.json`, check for:

**Recommended strict settings**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 7. Framework-Specific Considerations

**React + TypeScript**:
- Component prop types with interfaces
- Proper typing for hooks (`useState`, `useEffect`, `useCallback`, etc.)
- Event handler types (e.g., `React.MouseEvent<HTMLButtonElement>`)
- Ref types (`useRef<HTMLDivElement>(null)`)
- Children typing (`React.ReactNode` vs `React.ReactElement`)

**Node.js + TypeScript**:
- Proper types for Express/Fastify handlers
- Async error handling in middleware
- Environment variable typing
- Database query result typing

**Testing**:
- Type-safe mocks and stubs
- Proper typing for test utilities (Jest, Vitest, etc.)
- Type assertions in tests

### 8. Automated Checks to Recommend

Suggest running these tools if not already in use:
- **TypeScript compiler**: `tsc --noEmit` for type checking
- **ESLint**: With `@typescript-eslint/parser` and recommended rules
- **Prettier**: For consistent formatting
- **ts-prune**: Find unused exports
- **depcheck**: Find unused dependencies
- **madge**: Detect circular dependencies

### 9. Review Workflow

1. **Scan for critical issues first**: Type errors, security issues, obvious bugs
2. **Review architecture**: File structure, module boundaries, separation of concerns
3. **Deep dive into logic**: Algorithm correctness, edge cases, error handling
4. **Check types thoroughly**: Accuracy, safety, appropriate use of TypeScript features
5. **Performance review**: Identify bottlenecks, unnecessary work, optimization opportunities
6. **Style and consistency**: Naming, formatting, pattern adherence
7. **Testing and docs**: Coverage, clarity, maintainability

### 10. Example Interaction

**User**: "Review this TypeScript file for issues"

**Response Flow**:
1. Read the file(s) provided
2. Check for any `tsconfig.json` in the project
3. Perform systematic review across all categories
4. Structure findings with severity levels
5. Provide specific, actionable recommendations with code examples
6. Highlight positive practices
7. Suggest next steps (run specific tools, add tests, refactor specific areas)

## Best Practices

- **Be thorough but practical**: Focus on issues that matter
- **Provide context**: Explain why something is an issue and what problems it could cause
- **Show, don't just tell**: Include code examples for recommendations
- **Consider the audience**: Adjust detail level based on the team's TypeScript experience
- **Stay current**: Reference modern TypeScript features (4.9+, 5.0+)
- **Balance**: Don't let perfect be the enemy of good—acknowledge tradeoffs

## When to Use This Skill

Activate this skill when the user:
- Explicitly asks for a code review of TypeScript code
- Requests feedback on TypeScript implementation
- Asks to check code for issues, bugs, or improvements
- Wants to ensure TypeScript best practices are followed
- Needs help improving code quality or type safety
- Requests a security or performance audit of TypeScript code
