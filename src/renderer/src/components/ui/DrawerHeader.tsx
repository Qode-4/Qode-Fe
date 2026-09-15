import type { MouseEventHandler, ReactNode } from 'react';
import type { ProjectsListData } from '../../api/generated/data-contracts';
import type { IconName } from '../icons/iconTypes';
import { IconButton } from './IconButton';
import { ProjectSwitcher } from './ProjectSwitcher';

type Props = {
  className?: string;
  logo?: ReactNode;
  projects?: ProjectsListData['data'];
  selectedProjectId?: string;
  onOpenCreateProject?: () => void;
  projectsError?: boolean;
  projectsFetching?: boolean;
  onRetryProjects?: () => void;
  settingsIconName?: IconName;
  settingsAriaLabel?: string;
  settingsDisabled?: boolean;
  onSettingsClick?: MouseEventHandler<HTMLButtonElement>;
};

export const DrawerHeader = ({
  className,
  logo,
  projects = [],
  selectedProjectId,
  onOpenCreateProject,
  projectsError = false,
  projectsFetching = false,
  onRetryProjects,
  settingsIconName = 'Setting_line_light',
  settingsAriaLabel = '프로젝트 설정',
  settingsDisabled = false,
  onSettingsClick
}: Props): React.JSX.Element => {
  return (
    <header className={['flex w-full flex-col gap-5 px-4 pt-6 pb-2', className ?? ''].join(' ')}>
      <span className="text-2xl font-medium tracking-tight text-text-base">{logo ?? 'Qode'}</span>
      <div className="flex min-w-0 items-center gap-2">
        <ProjectSwitcher
          className="flex-1"
          projects={projects}
          selectedProjectId={selectedProjectId}
          onOpenCreateProject={onOpenCreateProject}
          isError={projectsError}
          isFetching={projectsFetching}
          onRetry={onRetryProjects}
        />
        <IconButton
          className="size-9 shrink-0 rounded-md border border-line bg-surface"
          size="md"
          name={settingsIconName}
          aria-label={settingsAriaLabel}
          disabled={settingsDisabled}
          onClick={onSettingsClick}
        />
      </div>
    </header>
  );
};
