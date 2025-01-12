export const getDifficultyColor = (difficulty?: string) => {
  switch (difficulty) {
    case 'Easy':
      return 'success';
    case 'Medium':
      return 'warning';
    case 'Hard':
      return 'failure';
    case 'Very Hard':
      return 'purple';
    default:
      return 'gray';
  }
};
