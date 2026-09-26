import type { MouseEventHandler, ReactNode } from 'react';
import type { ProjectsListData } from '../../api/generated/data-contracts';
import type { IconName } from '../icons/iconTypes';
import { IconButton } from './IconButton';
import { ProjectSwitcher } from './ProjectSwitcher';
import { cn } from '../../lib/cn';
import qodeMark from '../../public/qode_logo_small.png';

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
    <header className={cn('flex w-full flex-col gap-2 px-3 pt-4 pb-3', className)}>
      <div className="flex items-center gap-1.5 px-1 py-1">
        {logo ?? (
          <>
            <img
              src={qodeMark}
              alt=""
              aria-hidden="true"
              className="inline-block size-5 shrink-0 rounded-full"
            />
            <img src="/QodeLogo.svg" alt="Qode" className="inline-block h-4 w-auto shrink-0" />
          </>
        )}
      </div>
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
          variant="outline"
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
