type Props = {
  text: string;
  className?: string;
  onClick?: () => void;
};

export const SuggestionCard = ({ text, onClick }: Props): React.JSX.Element => {
  return (
    <button
      type="button"
      className={[
        'w-full rounded-[12px] border border-line bg-surface px-3 py-3 text-center',
        'text-ui-14 font-medium leading-[1.6] text-fg-subtle shadow-none'
      ].join(' ')}
      onClick={onClick}
    >
      {text}
    </button>
  );
};
