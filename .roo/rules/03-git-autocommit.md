# Git Auto Commit Rule

## Description
This rule ensures that after performing changes, the modified files are automatically committed back to Git using the conventional commit format. This maintains a clear and consistent commit history that explains what changes were made and why.

## Rule
After performing changes:
1. All modified files MUST be automatically committed
2. Commit messages MUST follow the conventional commit format
3. Commit messages MUST include:
   - Type: The type of change (feat, fix, docs, style, refactor, test, chore)
   - Scope: The affected component or area (optional)
   - Description: A clear explanation of what changed
   - Body: Detailed explanation of why the changes were made
4. The commit message MUST reference the original prompts or reasons for changes

## Implementation
- Track all files modified by changes
- Generate a conventional commit message based on the changes
- Include the original prompts or context in the commit body
- Automatically execute the git commit command
- Handle any potential merge conflicts or errors

## Benefits
- Maintains clear and consistent commit history
- Provides traceability between changes and their context
- Follows industry-standard commit conventions
- Automates the commit process for better workflow efficiency

## Examples

✅ Correct Commit Message:
```
feat(ide): implement automatic code formatting

- Added automatic formatting for Python files
- Implemented consistent indentation rules
- Added support for line length limits

Changes were generated based on the following prompts:
1. "Format the code according to PEP 8 standards"
2. "Ensure consistent indentation across all files"
```

✅ Correct Commit Command:
```bash
git commit -m "feat(ide): implement automatic code formatting" \
  -m "- Added automatic formatting for Python files" \
  -m "- Implemented consistent indentation rules" \
  -m "- Added support for line length limits" \
  -m "Changes were generated based on the following prompts:" \
  -m "1. Format the code according to PEP 8 standards" \
  -m "2. Ensure consistent indentation across all files"
```

❌ Incorrect Commit Message Formats:
```bash
# Don't use \n characters within -m arguments
git commit -m "feat(ide): implement automatic formatting\n- Added formatting\n- Added rules"

# Don't combine multiple lines in a single -m
git commit -m "Updated some files

- Made changes to formatting
- Fixed some issues"
```

## Conventional Commit Types
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes (formatting, etc.)
- refactor: Code refactoring
- test: Adding or modifying tests
- chore: Maintenance tasks

## Commit Message Structure
1. Type (required): Indicates the kind of change
2. Scope (optional): Specifies the part of the codebase affected
3. Description (required): Short, imperative mood summary
4. Body (optional): Detailed explanation of changes
5. Footer (optional): References to issues, breaking changes

## Best Practices
- Use imperative, present tense
- Capitalize first letter
- No period at the end of the description
- Explain "why" in the body, not "how"
- Reference related issues or PRs
- Keep messages concise but informative