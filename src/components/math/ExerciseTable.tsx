import type { MathExercise } from '@/lib/math/lessons';
import s from './MathLesson.module.css';

export default function ExerciseTable({ table, solved = false }: { table: NonNullable<MathExercise['table']>; solved?: boolean }) {
  return <div className={s.exerciseTableScroll}>
    <table className={s.exerciseTable} aria-label={solved ? 'Bảng đáp án' : 'Bảng điền số còn thiếu'}>
      <tbody>{(solved ? table.solution : table.rows).map((row, i) => <tr key={i}>
        {row.map((cell, j) => j === 0 ? <th scope="row" key={j}>{cell}</th> :
          <td key={j}>{solved && table.rows[i][j] === '?' ? <strong>{cell}</strong> : cell}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}
