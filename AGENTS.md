# Project audience and interface copy

This project's viewers include chess coaches/trainers, arbiters, children, and
parents. Treat this as a standing requirement for all pages and future changes.

- Use clear, concise, welcoming language that works across these audiences.
- Do not assume the reader is a teacher, student, parent, or arbiter unless the
  page or section explicitly serves that role.
- In shared learning content, describe the chess idea or decision directly.
  Avoid classroom instructions such as telling teachers what to ask students.
- Keep technical implementation details and research-method notes out of the
  main learning flow; retain them in project documentation where appropriate.
- Explain unfamiliar chess terms when needed without talking down to children
  or assuming every parent has chess expertise.

# Shared chess practice

- Reuse the existing draw/skewer practice components (`ChessPractice`,
  `DrawTrainer`, `PracticeBoard`) for new chess learning features. Extend them
  with focused props or content adapters when behavior differs; avoid parallel
  trainer implementations.
- Open reference games in the shared `DrawGameViewer` dialog, as draw practice
  does, rather than adding an inline game replay below the lesson.

# Compact, clear UI controls

- Keep related actions on one row where practical, particularly on cards and
  teaching screens. Shorten labels and use familiar icons instead of stacking
  long buttons or adding avoidable scrolling.
- Icon-only buttons need a descriptive accessible label and a tooltip/title;
  keep touch targets at least 44 × 44 px and visible keyboard focus.
- Check available card width and responsive layouts when adding controls.
  Preserve clear text for primary actions or unfamiliar concepts.
