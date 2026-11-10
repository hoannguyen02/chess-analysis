import { useId, useState } from 'react';
import Select, { createFilter } from 'react-select';
import { inPracticeTeachingOrder } from '@/lib/chess/practice-topic-order';
import styles from '@/styles/PracticeTopicSelect.module.css';

type TopicOption = {
  value: string;
  label: string;
  scope: string;
  disabled?: boolean;
};

const foldD = (text: string) => text.replace(/[đĐ]/g, 'd');
const filterTopic = createFilter<TopicOption>({
  stringify: ({ label }) => foldD(label),
});

export default function PracticeTopicSelect({
  label,
  ariaLabel,
  className = '',
  options,
  value,
  onChange,
  placeholder = 'Tìm hoặc chọn chủ đề',
  disabled,
  required,
  clearable,
}: {
  label: string;
  ariaLabel?: string;
  className?: string;
  options: TopicOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
}) {
  const id = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div
      className={`${styles.field} ${className}`}
      onKeyDownCapture={(event) => {
        // Let the native dialog handle Escape once the picker is closed.
        if (event.key === 'Escape' && !menuOpen) event.stopPropagation();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing)
          event.preventDefault();
      }}
    >
      <label htmlFor={id}>{label}</label>
      <Select<TopicOption>
        inputId={id}
        instanceId={id}
        aria-label={ariaLabel}
        className={styles.select}
        classNames={{
          control: () => styles.control,
          option: () => styles.option,
        }}
        components={{ IndicatorSeparator: null }}
        value={options.find((option) => option.value === value) ?? null}
        options={inPracticeTeachingOrder(options, (option) => option.scope)}
        onChange={(option) => onChange(option?.value ?? '')}
        onMenuOpen={() => setMenuOpen(true)}
        onMenuClose={() => setMenuOpen(false)}
        filterOption={(option, query) => filterTopic(option, foldD(query))}
        placeholder={placeholder}
        noOptionsMessage={() => 'Không tìm thấy chủ đề.'}
        isDisabled={disabled}
        isOptionDisabled={(option) => !!option.disabled}
        isClearable={clearable}
        required={required}
        tabSelectsValue={false}
        menuPlacement="auto"
        maxMenuHeight={260}
        ariaLiveMessages={{
          guidance: ({ context }) =>
            context === 'menu'
              ? 'Dùng phím mũi tên để di chuyển, Enter để chọn, Escape để đóng danh sách.'
              : 'Gõ tên chủ đề để tìm, hoặc nhấn mũi tên xuống để mở danh sách.',
          onChange: ({ label }) =>
            label ? `Đã chọn ${label}.` : 'Đã bỏ chọn.',
          onFocus: ({ label }) => label,
          onFilter: ({ resultsMessage }) => resultsMessage,
        }}
        screenReaderStatus={({ count }) => `${count} chủ đề.`}
      />
    </div>
  );
}
