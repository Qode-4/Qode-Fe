import { Button } from '../components/ui/Button';
import { SuggestionCard } from '../components/ui/SuggestionCard';

const defaultPrompts = [
  '이번주 새로운 업데이트 내용을 요약해줘.',
  '이 기능에 대해 기획자가 고려해야할 부분을 정리해줘.',
  '이 기능 구현 로직이 궁금해.',
  '우리 서비스의 큰 기능들을 리스트업해줘.'
];

type Props = {
  onOpenCreateProject: () => void;
};

export const ProjectsPage = ({ onOpenCreateProject }: Props): React.JSX.Element => {
  return (
    <section className="flex h-full min-h-[640px] flex-col items-center justify-center bg-surface px-4 text-center max-sm:min-h-0 max-sm:px-3 max-sm:py-8">
      <div className="w-full max-w-[406px]">
        <h1 className="text-display font-medium leading-[1.4] text-fg-default">
          프로젝트를 추가하고
          <br />
          코드에 질문하세요.
        </h1>

        <p className="mt-8 mb-2 text-left text-caption text-fg-muted">
          프로젝트를 연결하면 이런 걸 물어볼 수 있어요
        </p>
        <ul className="space-y-1">
          {defaultPrompts.map((prompt) => (
            <SuggestionCard key={prompt} text={prompt} />
          ))}
        </ul>

        <Button type="button" className="mt-6 w-full" onClick={onOpenCreateProject}>
          새 프로젝트 만들기
        </Button>
      </div>
    </section>
  );
};
