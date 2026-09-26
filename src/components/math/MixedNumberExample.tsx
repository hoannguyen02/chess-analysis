import { MathText } from './MathText';
import NumberLine from './NumberLine';

export default function MixedNumberExample() {
  return (
    <div>
      <h3>Ví dụ: đổi hỗn số thành phân số</h3>
      <p>
        <MathText>{'Hỗn số 1 1/2 gồm 1 phần nguyên và 1/2.'}</MathText>
      </p>
      <ol>
        <li>
          <MathText>{'Đổi phần nguyên: 1 = 2/2.'}</MathText>
        </li>
        <li>
          <MathText>{'Cộng phần phân số: 1 1/2 = 2/2 + 1/2 = 3/2.'}</MathText>
        </li>
      </ol>
      <p>
        <MathText>
          {
            'Cách viết gọn: 1 1/2 = (1 × 2 + 1)/2 = 3/2. Nhân phần nguyên với mẫu, cộng tử rồi giữ nguyên mẫu.'
          }
        </MathText>
      </p>
      <NumberLine values={[0, 2, 2, 1.5]} />
      <p>
        <MathText>
          {
            'Từ 0, đi sang phải 3 khoảng, mỗi khoảng 1/2 đơn vị. Điểm A nằm chính giữa 1 và 2: đó là vị trí của cả 1 1/2 và 3/2.'
          }
        </MathText>
      </p>
      <p>
        <MathText>
          {
            'Với số âm, dấu trừ áp dụng cho cả hỗn số: -(1 1/2) = -(1 + 1/2) = -3/2. Điểm này nằm chính giữa -2 và -1.'
          }
        </MathText>
      </p>
    </div>
  );
}
