import { SuggestionCard } from '../components/ui/SuggestionCard';

const defaultPrompts = [
  '이번주 새로운 업데이트 내용을 요약해줘.',
  '이 기능에 대해 기획자가 고려해야할 부분을 정리해줘.',
  '이 기능 구현 로직이 궁금해.',
  '우리 서비스의 큰 기능들을 리스트업해줘.'
];

type Props = {
  projectCount: number;
  onOpenCreateProject: () => void;
};

export const ProjectsPage = ({ projectCount, onOpenCreateProject }: Props): React.JSX.Element => {
  return (
    <section className="flex h-full min-h-[640px] flex-col items-center justify-center rounded-[12px] bg-white text-center border border-zinc-200">
      <div className="w-full max-w-[406px]">
        <h1 className="text-ui-44 font-medium leading-[1.4] text-zinc-900">
          프로젝트를 추가하고
          <br />
          코드에 질문하세요.
        </h1>

        <div className="mt-8 space-y-1">
          {defaultPrompts.map((prompt) => (
            <SuggestionCard key={prompt} text={prompt} />
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenCreateProject}
          className="mt-5 text-ui-10 font-medium text-zinc-500 underline-offset-2 hover:underline"
        >
          새 프로젝트 만들기 ({projectCount})
        </button>
      </div>
    </section>
  );
};
